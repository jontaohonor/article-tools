/* ============================================================
   Atelier · 文章工坊
   ============================================================ */

// ========== 工具方法 ==========
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('show'), 2200);
}

function formatDate(ts) {
  const d = new Date(ts);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ========== 主题切换 ==========
const savedTheme = localStorage.getItem('atelier-theme') || 'magazine';
document.body.dataset.theme = savedTheme;
$$('.theme-dot').forEach(dot => {
  if (dot.dataset.theme === savedTheme) dot.classList.add('active');
  dot.addEventListener('click', () => {
    const theme = dot.dataset.theme;
    document.body.dataset.theme = theme;
    localStorage.setItem('atelier-theme', theme);
    $$('.theme-dot').forEach(d => d.classList.toggle('active', d === dot));
  });
});

// ========== 工具切换 ==========
$$('.nav-item').forEach(item => {
  item.addEventListener('click', () => {
    const tool = item.dataset.tool;
    $$('.nav-item').forEach(n => n.classList.toggle('active', n === item));
    $$('.tool-panel').forEach(p => p.classList.toggle('active', p.dataset.panel === tool));
    if (tool === 'drafts') renderDrafts();
    if (tool === 'qrcode') renderQR();
  });
});

// ============================================================
// 工具 1: MD → 微信排版
// ============================================================

// 配置 marked
marked.setOptions({
  breaks: true,
  gfm: true,
});

const mdInput = $('#md-input');
const mdPreview = $('#md-preview');
const styleSelect = $('#style-select');

// 实时渲染 + 统计
function renderMarkdown() {
  const raw = mdInput.value;
  mdPreview.innerHTML = marked.parse(raw);
  mdPreview.dataset.style = styleSelect.value;
  updateStats(raw);
}

function updateStats(text) {
  // 去除 markdown 标记符号后计算字数
  const cleaned = text
    .replace(/```[\s\S]*?```/g, '')       // 代码块
    .replace(/`[^`]+`/g, '')               // 行内代码
    .replace(/!\[.*?\]\(.*?\)/g, '')       // 图片
    .replace(/\[.*?\]\(.*?\)/g, '$1')      // 链接
    .replace(/[#>*_\-\[\]()]/g, '')        // Markdown 符号
    .replace(/\s+/g, '');                  // 空白
  const words = cleaned.length;
  const reading = Math.max(1, Math.ceil(words / 300));
  $('#stat-words').textContent = `${words} 字`;
  $('#stat-reading').textContent = `${reading} 分钟`;
}

mdInput.addEventListener('input', () => {
  renderMarkdown();
  // 自动保存到本地
  localStorage.setItem('atelier-current-draft', mdInput.value);
});

styleSelect.addEventListener('change', renderMarkdown);

// 恢复上次内容
const lastDraft = localStorage.getItem('atelier-current-draft');
if (lastDraft) {
  mdInput.value = lastDraft;
}

// 初始示例内容（首次打开）
if (!mdInput.value.trim()) {
  mdInput.value = `# 写作是一种持续的练习

在这个信息爆炸的时代，**能够表达清晰的思考**，比以往任何时候都更有价值。

## 为什么要写？

写作不是为了发表。写作首先是为了 *想清楚* 一件事。

> 如果你不能简单清楚地表达，那是因为你还没有理解它。

这句话来自费曼。深以为然。

## 一些技巧

- 开头要有钩子
- 中间分三段
- 结尾留余味

\`\`\`js
// 就像写代码
function write() {
  return think() + rewrite();
}
\`\`\`

---

写下这段话的时候，窗外正在下雨。`;
}

renderMarkdown();

// ========== 从 Markdown 自动提取标题/副标题 ==========
function extractTitleFromMD(md) {
  // 优先找第一个 # H1
  const h1Match = md.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  // 退而求其次：第一行非空文字
  const firstLine = md.split('\n').find(l => l.trim());
  return firstLine ? firstLine.replace(/^#+\s*/, '').trim() : '';
}

function extractSubtitleFromMD(md, mainTitle) {
  // 优先找第一个 ## H2
  const h2Match = md.match(/^##\s+(.+)$/m);
  if (h2Match) return h2Match[1].trim();
  // 退而求其次：跳过已被用作主标题的部分，找下一段非空正文
  const lines = md.split('\n');
  let skippedTitle = false;
  for (const line of lines) {
    const stripped = line.trim();
    if (!stripped) continue;
    // 跳过第一行（无论是 H1 还是裸文本，它已经被当主标题了）
    if (!skippedTitle) {
      skippedTitle = true;
      continue;
    }
    // 跳过其他 Markdown 元素
    if (/^(#+\s|>|\-|\*|\d+\.|\`\`\`|!\[|\|)/.test(stripped)) continue;
    // 拿纯文本段落，截取一段
    return stripped.slice(0, 80);
  }
  return '';
}

// 自动填充封面字段（只在用户没手动改过时）
function autoFillCoverFields(md) {
  const title = extractTitleFromMD(md);
  const subtitle = extractSubtitleFromMD(md, title);
  const titleEl = $('#cover-title');
  const subtitleEl = $('#cover-subtitle');

  if (title && !titleEl.dataset.userEdited) {
    titleEl.value = title;
    $('#cover-preview-title').textContent = title;
  }
  if (subtitle && !subtitleEl.dataset.userEdited) {
    subtitleEl.value = subtitle;
    $('#cover-preview-subtitle').textContent = subtitle;
  }
}

// 页面首次加载时，根据当前编辑器内容填一次封面
autoFillCoverFields(mdInput.value);

// ========== 导入 .md 文件 ==========
$('#md-file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  mdInput.value = text;
  renderMarkdown();
  autoFillCoverFields(text);
  localStorage.setItem('atelier-current-draft', text);
  toast(`已导入 ${file.name}`);
  e.target.value = '';
});

// ========== 拖拽导入 .md ==========
mdInput.addEventListener('dragover', (e) => {
  e.preventDefault();
  mdInput.style.borderColor = 'var(--accent)';
});
mdInput.addEventListener('dragleave', () => {
  mdInput.style.borderColor = '';
});
mdInput.addEventListener('drop', async (e) => {
  e.preventDefault();
  mdInput.style.borderColor = '';
  const file = e.dataTransfer.files[0];
  if (!file) return;
  if (!/\.(md|markdown|txt)$/i.test(file.name)) {
    toast('只支持 .md / .txt 文件');
    return;
  }
  const text = await file.text();
  mdInput.value = text;
  renderMarkdown();
  autoFillCoverFields(text);
  localStorage.setItem('atelier-current-draft', text);
  toast(`已导入 ${file.name}`);
});

// ========== 粘贴大段 Markdown 到编辑器时也自动提取 ==========
mdInput.addEventListener('paste', (e) => {
  const pasted = (e.clipboardData || window.clipboardData).getData('text');
  // 只在粘贴内容较长、且看起来像完整文章时触发（避免每次粘贴几个字都跳动）
  if (pasted && pasted.length > 100 && /^#\s+/m.test(pasted)) {
    // 延迟一帧，等 textarea 的值更新
    setTimeout(() => autoFillCoverFields(mdInput.value), 0);
  }
});

// ============================================================
// 核心：复制富文本到微信公众号
// 关键：必须把所有 CSS 样式 inline 化，微信才会保留格式
// ============================================================

// 样式映射：每个变体对应一组 inline 样式
const STYLE_PRESETS = {
  classic: {
    body: "font-family: -apple-system, 'PingFang SC', 'Helvetica Neue', sans-serif; font-size: 16px; line-height: 1.75; color: #333; letter-spacing: 0.5px;",
    h1: "font-size: 22px; font-weight: 700; margin: 24px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #1a1a1a; color: #1a1a1a;",
    h2: "font-size: 19px; font-weight: 700; margin: 22px 0 14px; padding-left: 10px; border-left: 4px solid #c8553d; color: #1a1a1a;",
    h3: "font-size: 17px; font-weight: 700; margin: 20px 0 12px; color: #c8553d;",
    p: "margin: 14px 0; line-height: 1.85; letter-spacing: 0.5px; color: #333;",
    strong: "color: #c8553d; font-weight: 700;",
    em: "font-style: italic; color: #666;",
    a: "color: #1e6091; text-decoration: none; border-bottom: 1px solid #1e6091;",
    blockquote: "border-left: 3px solid #c8553d; padding: 8px 16px; margin: 16px 0; background: #faf7f0; color: #555; font-style: italic;",
    ul: "padding-left: 24px; margin: 14px 0;",
    ol: "padding-left: 24px; margin: 14px 0;",
    li: "margin: 6px 0; line-height: 1.85;",
    code: "background: #f0ebe0; color: #c8553d; padding: 2px 6px; border-radius: 2px; font-family: 'SF Mono', Consolas, monospace; font-size: 14px;",
    pre: "background: #1a1a1a; color: #f0e8d8; padding: 16px; margin: 16px 0; overflow-x: auto; border-radius: 2px; font-family: 'SF Mono', Consolas, monospace; font-size: 13px; line-height: 1.6;",
    hr: "border: none; text-align: center; margin: 24px 0; color: #c8553d; letter-spacing: 8px;",
    img: "max-width: 100%; display: block; margin: 16px auto;",
  },
  modern: {
    body: "font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; font-size: 16px; line-height: 1.8; color: #2a2a2a; letter-spacing: 0.3px;",
    h1: "font-size: 24px; font-weight: 700; margin: 28px 0 18px; color: #1a1a1a; letter-spacing: -0.5px;",
    h2: "font-size: 20px; font-weight: 600; margin: 24px 0 14px; color: #1a1a1a;",
    h3: "font-size: 17px; font-weight: 600; margin: 20px 0 12px; color: #555;",
    p: "margin: 14px 0; line-height: 1.85; color: #2a2a2a;",
    strong: "color: #1a1a1a; font-weight: 700;",
    em: "font-style: italic; color: #555;",
    a: "color: #0066cc; text-decoration: none;",
    blockquote: "border-left: 4px solid #1a1a1a; padding: 12px 20px; margin: 16px 0; background: #f7f7f7; color: #555;",
    ul: "padding-left: 24px; margin: 14px 0;",
    ol: "padding-left: 24px; margin: 14px 0;",
    li: "margin: 6px 0;",
    code: "background: #f0f0f0; color: #d63384; padding: 2px 6px; border-radius: 3px; font-family: 'SF Mono', monospace; font-size: 14px;",
    pre: "background: #0d1117; color: #c9d1d9; padding: 16px; margin: 16px 0; overflow-x: auto; border-radius: 6px; font-family: 'SF Mono', monospace; font-size: 13px;",
    hr: "border: none; height: 1px; background: #e0e0e0; margin: 28px 0;",
    img: "max-width: 100%; display: block; margin: 16px auto; border-radius: 4px;",
  },
  serif: {
    body: "font-family: 'Noto Serif SC', 'Source Han Serif', 'Songti SC', serif; font-size: 17px; line-height: 1.9; color: #2a2a2a; letter-spacing: 0.5px;",
    h1: "font-size: 26px; font-weight: 700; margin: 28px 0 18px; text-align: center; color: #1a1a1a; font-family: 'Noto Serif SC', serif;",
    h2: "font-size: 21px; font-weight: 700; margin: 24px 0 14px; color: #8b4513; font-family: 'Noto Serif SC', serif;",
    h3: "font-size: 18px; font-weight: 700; margin: 20px 0 12px; color: #8b4513; font-family: 'Noto Serif SC', serif;",
    p: "margin: 16px 0; line-height: 1.95; text-indent: 2em; color: #2a2a2a;",
    strong: "color: #8b4513; font-weight: 700;",
    em: "font-style: italic;",
    a: "color: #8b4513; text-decoration: none; border-bottom: 1px dotted #8b4513;",
    blockquote: "border-left: 2px solid #8b4513; padding: 10px 20px; margin: 20px 0; color: #666; font-style: italic; text-indent: 0;",
    ul: "padding-left: 24px; margin: 14px 0;",
    ol: "padding-left: 24px; margin: 14px 0;",
    li: "margin: 8px 0;",
    code: "background: #f5efdf; color: #8b4513; padding: 2px 6px; font-family: 'SF Mono', monospace; font-size: 14px;",
    pre: "background: #2a2520; color: #f0e8d8; padding: 16px; margin: 16px 0; overflow-x: auto; font-family: 'SF Mono', monospace; font-size: 13px;",
    hr: "border: none; text-align: center; margin: 28px 0; color: #8b4513;",
    img: "max-width: 100%; display: block; margin: 16px auto;",
  },
  tech: {
    body: "font-family: 'SF Mono', 'JetBrains Mono', 'PingFang SC', monospace; font-size: 15px; line-height: 1.8; color: #2a2a2a;",
    h1: "font-size: 22px; font-weight: 700; margin: 24px 0 16px; color: #00897b; border-bottom: 2px dashed #00897b; padding-bottom: 8px;",
    h2: "font-size: 19px; font-weight: 700; margin: 22px 0 14px; color: #00897b;",
    h3: "font-size: 16px; font-weight: 700; margin: 18px 0 10px; color: #00695c;",
    p: "margin: 14px 0; line-height: 1.85;",
    strong: "color: #00897b; font-weight: 700;",
    em: "font-style: italic; color: #555;",
    a: "color: #0277bd; text-decoration: none; border-bottom: 1px solid #0277bd;",
    blockquote: "border-left: 3px solid #00897b; padding: 8px 16px; margin: 16px 0; background: #e0f2f1; color: #00695c;",
    ul: "padding-left: 24px; margin: 14px 0;",
    ol: "padding-left: 24px; margin: 14px 0;",
    li: "margin: 6px 0;",
    code: "background: #263238; color: #80cbc4; padding: 2px 6px; border-radius: 2px; font-family: 'SF Mono', monospace; font-size: 14px;",
    pre: "background: #263238; color: #eeffff; padding: 16px; margin: 16px 0; overflow-x: auto; border-radius: 2px; font-family: 'SF Mono', monospace; font-size: 13px; line-height: 1.6;",
    hr: "border: none; border-top: 1px dashed #00897b; margin: 24px 0;",
    img: "max-width: 100%; display: block; margin: 16px auto; border: 1px solid #e0e0e0;",
  },
};

// 将 style preset 应用到 HTML，生成 inline 样式的富文本
function buildInlineHTML() {
  const raw = marked.parse(mdInput.value);
  const styles = STYLE_PRESETS[styleSelect.value] || STYLE_PRESETS.classic;

  // 创建临时容器
  const tmp = document.createElement('div');
  tmp.innerHTML = raw;

  // 给每个元素加上 inline style
  const applyStyle = (selector, style) => {
    tmp.querySelectorAll(selector).forEach(el => {
      el.setAttribute('style', style);
    });
  };

  applyStyle('h1', styles.h1);
  applyStyle('h2', styles.h2);
  applyStyle('h3', styles.h3);
  applyStyle('h4', styles.h3);
  applyStyle('p', styles.p);
  applyStyle('strong', styles.strong);
  applyStyle('em', styles.em);
  applyStyle('a', styles.a);
  applyStyle('blockquote', styles.blockquote);
  applyStyle('ul', styles.ul);
  applyStyle('ol', styles.ol);
  applyStyle('li', styles.li);
  applyStyle('code', styles.code);
  applyStyle('pre', styles.pre);
  applyStyle('img', styles.img);

  // hr 特殊处理：用文字代替
  tmp.querySelectorAll('hr').forEach(el => {
    const replacement = document.createElement('p');
    replacement.setAttribute('style', 'text-align: center; margin: 28px 0; color: #c8553d; letter-spacing: 8px;');
    replacement.textContent = '§ § §';
    el.replaceWith(replacement);
  });

  // pre > code: 不重复样式
  tmp.querySelectorAll('pre code').forEach(el => {
    el.setAttribute('style', 'background: none; color: inherit; padding: 0; font-family: inherit;');
  });

  // 外层包裹一个 section，带上 body 样式
  const wrapper = document.createElement('section');
  wrapper.setAttribute('style', styles.body);
  wrapper.innerHTML = tmp.innerHTML;

  return wrapper.outerHTML;
}

// 复制富文本到剪贴板
$('#btn-copy-rich').addEventListener('click', async () => {
  const html = buildInlineHTML();
  const plain = mdInput.value;

  try {
    // 使用 ClipboardItem API 同时写入 HTML 和 plain text
    if (navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([item]);
      toast('已复制！直接粘贴到公众号编辑器');
    } else {
      // 降级方案：创建隐藏元素 + execCommand
      fallbackCopy(html);
    }
  } catch (err) {
    console.warn('Clipboard API failed, falling back:', err);
    fallbackCopy(html);
  }
});

function fallbackCopy(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  tmp.style.position = 'fixed';
  tmp.style.left = '-9999px';
  tmp.contentEditable = 'true';
  document.body.appendChild(tmp);

  const range = document.createRange();
  range.selectNodeContents(tmp);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);

  try {
    document.execCommand('copy');
    toast('已复制！直接粘贴到公众号编辑器');
  } catch (e) {
    toast('复制失败，请手动选择');
  }
  document.body.removeChild(tmp);
  sel.removeAllRanges();
}

// ============================================================
// 工具 2: 封面生成
// ============================================================

const coverTitle = $('#cover-title');
const coverSubtitle = $('#cover-subtitle');
const coverAuthor = $('#cover-author');
const coverCanvas = $('#cover-canvas');

function updateCoverDate() {
  const d = new Date();
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  $('#cover-date').textContent = `${months[d.getMonth()]}.${String(d.getDate()).padStart(2,'0')}`;
}
updateCoverDate();

coverTitle.addEventListener('input', () => {
  coverTitle.dataset.userEdited = '1';
  $('#cover-preview-title').textContent = coverTitle.value || '一篇值得阅读的文章';
});
coverSubtitle.addEventListener('input', () => {
  coverSubtitle.dataset.userEdited = '1';
  $('#cover-preview-subtitle').textContent = coverSubtitle.value || '';
});
coverAuthor.addEventListener('input', () => {
  coverAuthor.dataset.userEdited = '1';
  $('#cover-preview-author').textContent = coverAuthor.value || '';
});

// 模板切换
$$('.template-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.template-btn').forEach(b => b.classList.toggle('active', b === btn));
    coverCanvas.className = `cover-canvas template-${btn.dataset.template}`;
  });
});

// 主色切换
$$('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    $$('.color-dot').forEach(d => d.classList.toggle('active', d === dot));
    coverCanvas.style.setProperty('--main', dot.dataset.color);
  });
});

// 导出封面为 PNG
$('#btn-export-cover').addEventListener('click', async () => {
  toast('正在生成图片…');
  try {
    // 临时放大渲染提升清晰度
    const canvas = await html2canvas(coverCanvas, {
      scale: 2,
      backgroundColor: null,
      logging: false,
    });
    const link = document.createElement('a');
    link.download = `cover-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast('封面已导出');
  } catch (e) {
    console.error(e);
    toast('导出失败，请重试');
  }
});

// ============================================================
// 工具 3: 二维码
// ============================================================

const qrCanvas = $('#qr-canvas');
const qrContent = $('#qr-content');
let qrFgColor = '#1a1a1a';
let qrLogoData = null;

async function renderQR() {
  const text = qrContent.value.trim() || ' ';
  try {
    await QRCode.toCanvas(qrCanvas, text, {
      width: 560,
      margin: 2,
      errorCorrectionLevel: 'H',
      color: {
        dark: qrFgColor,
        light: '#ffffff',
      },
    });
    // 如果有 logo，绘制在中心
    if (qrLogoData) {
      const ctx = qrCanvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        const size = qrCanvas.width * 0.22;
        const x = (qrCanvas.width - size) / 2;
        const y = (qrCanvas.height - size) / 2;
        // 白色底
        ctx.fillStyle = '#fff';
        ctx.fillRect(x - 6, y - 6, size + 12, size + 12);
        ctx.drawImage(img, x, y, size, size);
      };
      img.src = qrLogoData;
    }
  } catch (e) {
    console.error(e);
  }
}

qrContent.addEventListener('input', renderQR);

$$('.qr-color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    $$('.qr-color-dot').forEach(d => d.classList.toggle('active', d === dot));
    qrFgColor = dot.dataset.color;
    renderQR();
  });
});

$('#qr-logo-input').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    qrLogoData = ev.target.result;
    renderQR();
    toast('Logo 已添加');
  };
  reader.readAsDataURL(file);
});

$('#btn-download-qr').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = `qrcode-${Date.now()}.png`;
  link.href = qrCanvas.toDataURL('image/png');
  link.click();
  toast('二维码已下载');
});

// 初始渲染
setTimeout(renderQR, 100);

// ============================================================
// 工具 4: 草稿管理（带版本历史）
// ============================================================

const DRAFTS_KEY = 'atelier-drafts';

function getDrafts() {
  try {
    return JSON.parse(localStorage.getItem(DRAFTS_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveDrafts(drafts) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

function getTitleFromMD(md) {
  const firstH1 = md.match(/^#\s+(.+)$/m);
  if (firstH1) return firstH1[1].trim();
  const firstLine = md.split('\n').find(l => l.trim());
  return (firstLine || '未命名草稿').replace(/^#+\s*/, '').slice(0, 50);
}

function getExcerpt(md) {
  return md
    .replace(/^#.*$/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#>*_`\-\[\]()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

$('#btn-save-draft').addEventListener('click', () => {
  const content = mdInput.value.trim();
  if (!content) {
    toast('草稿为空');
    return;
  }
  const drafts = getDrafts();
  const title = getTitleFromMD(content);
  const now = Date.now();

  // 如果当前编辑器有关联的草稿 ID（上次打开的），更新它，并追加版本历史
  const currentId = mdInput.dataset.draftId;
  if (currentId) {
    const existing = drafts.find(d => d.id === currentId);
    if (existing) {
      // 只有内容变了才存新版本
      const latest = existing.versions[existing.versions.length - 1];
      if (latest && latest.content === content) {
        toast('内容未变化');
        return;
      }
      existing.title = title;
      existing.updatedAt = now;
      existing.versions.push({ ts: now, content });
      // 限制最多保留 20 个版本
      if (existing.versions.length > 20) {
        existing.versions = existing.versions.slice(-20);
      }
      saveDrafts(drafts);
      toast(`已更新草稿（v${existing.versions.length}）`);
      return;
    }
  }

  // 新建草稿
  const id = `d_${now}_${Math.random().toString(36).slice(2, 8)}`;
  drafts.unshift({
    id,
    title,
    createdAt: now,
    updatedAt: now,
    versions: [{ ts: now, content }],
  });
  saveDrafts(drafts);
  mdInput.dataset.draftId = id;
  toast('草稿已保存');
});

function renderDrafts() {
  const list = $('#drafts-list');
  const drafts = getDrafts().sort((a, b) => b.updatedAt - a.updatedAt);

  if (drafts.length === 0) {
    list.innerHTML = '<div class="draft-empty">尚无草稿。写点什么，然后按「存为草稿」吧。</div>';
    return;
  }

  list.innerHTML = drafts.map(d => {
    const latest = d.versions[d.versions.length - 1];
    const excerpt = getExcerpt(latest.content);
    const versionCount = d.versions.length;
    return `
      <div class="draft-item" data-id="${d.id}">
        <div class="draft-main">
          <div class="draft-title">${escapeHtml(d.title)}</div>
          <div class="draft-excerpt">${escapeHtml(excerpt) || '<em>空内容</em>'}</div>
          <div class="draft-meta">
            <span>${formatDate(d.updatedAt)}</span>
            <span>·</span>
            <span>${latest.content.length} 字符</span>
            <span>·</span>
            <span>v${versionCount}${versionCount > 1 ? ' (含历史)' : ''}</span>
          </div>
        </div>
        <div class="draft-actions">
          <button class="btn btn-ghost" data-action="open" data-id="${d.id}">打开</button>
          ${versionCount > 1 ? `<button class="btn btn-ghost" data-action="history" data-id="${d.id}">历史</button>` : ''}
          <button class="btn btn-ghost" data-action="export" data-id="${d.id}">导出</button>
          <button class="btn btn-ghost" data-action="delete" data-id="${d.id}">删除</button>
        </div>
      </div>
    `;
  }).join('');

  // 绑定事件
  list.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', (e) => handleDraftAction(btn.dataset.action, btn.dataset.id));
  });
}

function handleDraftAction(action, id) {
  const drafts = getDrafts();
  const draft = drafts.find(d => d.id === id);
  if (!draft) return;

  if (action === 'open') {
    const latest = draft.versions[draft.versions.length - 1];
    mdInput.value = latest.content;
    mdInput.dataset.draftId = id;
    renderMarkdown();
    // 打开不同草稿时，清除"用户已改过"标记，重新按新文章提取
    delete $('#cover-title').dataset.userEdited;
    delete $('#cover-subtitle').dataset.userEdited;
    autoFillCoverFields(latest.content);
    localStorage.setItem('atelier-current-draft', latest.content);
    // 切换到编辑器
    $('.nav-item[data-tool="editor"]').click();
    toast(`已打开「${draft.title}」`);
  } else if (action === 'delete') {
    if (!confirm(`确认删除「${draft.title}」？（包含所有 ${draft.versions.length} 个版本）`)) return;
    const newDrafts = drafts.filter(d => d.id !== id);
    saveDrafts(newDrafts);
    renderDrafts();
    toast('已删除');
  } else if (action === 'export') {
    const latest = draft.versions[draft.versions.length - 1];
    const blob = new Blob([latest.content], { type: 'text/markdown;charset=utf-8' });
    const link = document.createElement('a');
    link.download = `${draft.title.replace(/[\\/:*?"<>|]/g, '_')}.md`;
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
  } else if (action === 'history') {
    showHistory(draft);
  }
}

function showHistory(draft) {
  const html = draft.versions
    .slice()
    .reverse()
    .map((v, i) => {
      const vNum = draft.versions.length - i;
      return `v${vNum} · ${formatDate(v.ts)} · ${v.content.length} 字符`;
    })
    .join('\n');

  const pick = prompt(
    `「${draft.title}」的版本历史：\n\n${html}\n\n输入版本号（1-${draft.versions.length}）恢复该版本，留空取消：`,
    ''
  );
  if (!pick) return;
  const n = parseInt(pick, 10);
  if (isNaN(n) || n < 1 || n > draft.versions.length) {
    toast('版本号无效');
    return;
  }
  const target = draft.versions[n - 1];
  mdInput.value = target.content;
  mdInput.dataset.draftId = draft.id;
  renderMarkdown();
  localStorage.setItem('atelier-current-draft', target.content);
  $('.nav-item[data-tool="editor"]').click();
  toast(`已恢复到 v${n}`);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============================================================
// 键盘快捷键
// ============================================================
document.addEventListener('keydown', (e) => {
  // Cmd/Ctrl + S: 保存草稿
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    $('#btn-save-draft').click();
  }
  // Cmd/Ctrl + Shift + C: 复制到公众号
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'C') {
    e.preventDefault();
    if ($('.tool-panel[data-panel="editor"]').classList.contains('active')) {
      $('#btn-copy-rich').click();
    }
  }
});
