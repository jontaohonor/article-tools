# Atelier · 文章工坊

专为微信公众号写作者设计的一站式工具集。一个文件夹，打开即用，部署到 Cloudflare Pages 随时访问。

## ✨ 核心功能

### 01 排版 · Markdown → 微信
- 左写 Markdown，右边实时预览微信效果
- **一键复制富文本**，粘贴到公众号后台格式 100% 保留（所有样式都 inline 化）
- 4 种排版样式：经典宋体 / 现代黑体 / 文艺衬线 / 科技等宽
- 自动字数统计、阅读时长估算
- 拖拽 `.md` 文件直接导入（Obsidian 兼容）

### 02 封面
- 2.35:1 公众号标准尺寸
- 4 种模板：编辑部 / 渐变 / 极简 / 印章
- 6 种主色，自由切换
- 导出高清 PNG（2x 缩放）

### 03 二维码
- 4 种前景色
- 可添加中心 Logo
- 高容错等级（遮挡 30% 仍可扫）

### 04 草稿
- 本地 localStorage 保存，无需后端
- **版本历史**：每次保存都是一个快照，最多保留 20 个版本
- 导出为 `.md` 文件
- 自动暂存当前编辑内容（刷新不丢）

## 🎨 多主题

顶部右上角 4 个色点切换：
- **杂志**（默认）— 米白纸张 + 朱红点缀
- **极简** — 纯净黑白
- **墨色** — 竹青墨绿
- **暮光** — 深紫夜色

## ⌨️ 快捷键

- `Cmd/Ctrl + S` — 保存草稿
- `Cmd/Ctrl + Shift + C` — 复制到公众号

## 🚀 部署到 Cloudflare Pages

### 方式一：拖拽部署（最简单）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **Create** → **Pages** → **Upload assets**
3. 把整个 `article-tools` 文件夹拖进去
4. 起个项目名，点击部署
5. 1 分钟后就能用 `https://你的项目名.pages.dev` 访问

### 方式二：Git 部署（推荐，可持续更新）

1. 把这个文件夹推到 GitHub
2. Cloudflare Dashboard → **Pages** → **Connect to Git**
3. 选择仓库，**Build command** 留空，**Build output** 填 `/`
4. 部署完成

## 📁 文件结构

```
article-tools/
├── index.html      # 主页面（SPA）
├── styles.css      # 样式（含 4 套主题变量）
├── app.js          # 全部逻辑
└── README.md
```

没有构建步骤。没有 node_modules。只有 3 个文件。

## 💡 对比原项目的改进

| | 原项目 | Atelier |
|---|---|---|
| 文件数 | 4 个独立 HTML | 1 个 SPA |
| 主题 | 单一样式 | 4 套可切换 |
| 草稿管理 | 无 | 本地保存 + 版本历史 |
| 字数统计 | 无 | 实时统计 + 阅读时长 |
| MD 导入 | 手动粘贴 | 拖拽或按钮上传 |
| 操作步骤 | 在 4 个页面间切换 | 顶部导航一键切换 |

## 📝 License

MIT

---

Made with care for serious writers.
