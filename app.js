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

// 主题 CSS 注入到预览区（<style> 标签方式，不 inline）
let _themeStyleEl = null;
function applyPreviewTheme(themeId) {
  const css = (typeof WENYAN_THEMES !== 'undefined' && WENYAN_THEMES[themeId]) || '';
  if (!_themeStyleEl) {
    _themeStyleEl = document.createElement('style');
    _themeStyleEl.id = 'atelier-preview-theme';
    document.head.appendChild(_themeStyleEl);
  }
  _themeStyleEl.textContent = css;
  // 保存选择
  localStorage.setItem('atelier-style', themeId);
}

// 实时渲染 + 统计
function renderMarkdown() {
  const raw = mdInput.value;
  mdPreview.innerHTML = marked.parse(raw);
  applyPreviewTheme(styleSelect.value);
  updateStats(raw);
}

function updateStats(text) {
  const cleaned = text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[.*?\]\(.*?\)/g, '$1')
    .replace(/[#>*_\-\[\]()]/g, '')
    .replace(/\s+/g, '');
  const words = cleaned.length;
  const reading = Math.max(1, Math.ceil(words / 300));
  $('#stat-words').textContent = `${words} 字`;
  $('#stat-reading').textContent = `${reading} 分钟`;
}

mdInput.addEventListener('input', () => {
  renderMarkdown();
  localStorage.setItem('atelier-current-draft', mdInput.value);
});

styleSelect.addEventListener('change', () => {
  applyPreviewTheme(styleSelect.value);
});

// 恢复上次选的主题
const savedStyle = localStorage.getItem('atelier-style') || 'lapis';
styleSelect.value = savedStyle;
if (!styleSelect.value) styleSelect.value = 'default'; // 保底

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

// ============================================================
// 核心：复制富文本到微信公众号
// 策略：用 css-tree 把主题 CSS 中的规则逐一 inline 化到元素上
// 降级：直接把 <style> 嵌入 HTML（微信可接受）
// ============================================================

// 用 getComputedStyle 从已渲染的 DOM 提取关键样式并 inline
function buildCopyHTML() {
  const themeId = styleSelect.value;
  const themeCss = (typeof WENYAN_THEMES !== 'undefined' && WENYAN_THEMES[themeId]) || '';

  // 克隆当前预览 DOM
  const clone = mdPreview.cloneNode(true);

  // 把主题的 CSS 变量解析后注入（处理 var(--xxx) 引用）
  // 方法：把 CSS 注入一个隐藏的 iframe 里，让浏览器解析 computed style
  // 更简单做法：直接把 <style> + 渲染好的 HTML 组合，微信公众号支持内联 <style>
  const html = `<style>${themeCss}</style><section class="md-preview">${clone.innerHTML}</section>`;
  return html;
}

// 复制富文本到剪贴板
$('#btn-copy-rich').addEventListener('click', async () => {
  const html = buildCopyHTML();
  const plain = mdInput.value;

  try {
    if (navigator.clipboard && window.ClipboardItem) {
      const item = new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([item]);
      toast('已复制！直接粘贴到公众号编辑器');
    } else {
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
