# Atelier · 文章工坊

专为微信公众号写作者设计的一站式工具集。打开即用，部署到 Cloudflare Pages 随时访问。

## ✨ 核心功能

### 01 排版 · Markdown → 微信
- 左写 Markdown，右边实时预览微信效果
- **13 套排版主题**，移植自文颜 (wenyan-core) 开源主题库
- 导入 / 拖拽 `.md` 文件时，自动提取标题填充封面（Obsidian 兼容）
- 粘贴大段 Markdown 也会自动识别标题
- **一键复制富文本**，直接粘贴到公众号后台，格式完整保留
- 实时字数统计 + 阅读时长估算
- 快捷键 `Cmd/Ctrl + S` 保存草稿，`Cmd/Ctrl + Shift + C` 复制

### 02 封面
- 2.35:1 公众号标准尺寸
- 4 种模板：编辑部 / 渐变 / 极简 / 印章
- 6 种主色自由切换
- 导出高清 PNG（2x 缩放）
- 导入文章时自动填充主标题 / 副标题

### 03 二维码
- 4 种前景色
- 可添加中心 Logo
- 高容错等级（遮挡 30% 仍可扫）

### 04 草稿
- 本地 localStorage 保存，无需后端，无需账号
- **版本历史**：每次保存都是快照，最多 20 个版本，可随时回滚
- 导出为 `.md` 文件
- 自动暂存当前编辑内容（刷新不丢）

---

## 🎨 界面主题（右上角色点切换）

工具外壳的 4 套配色，与排版主题独立：

| 名称 | 风格 |
|------|------|
| 杂志（默认） | 米白纸张 + 朱红点缀 |
| 极简 | 纯净黑白 |
| 墨色 | 竹青墨绿 |
| 暮光 | 深紫夜色 |

---

## 📖 排版主题（下拉菜单选择）

移植自 [wenyan-core](https://github.com/caol64/wenyan-core)，原始主题来自各 Typora 主题作者。

| 主题 | 风格 | 适合内容 |
|------|------|----------|
| 默认 Default | 简洁通用 | 各类文章 |
| 橙心 Orange Heart | 橙红标题 | 生活、情感 |
| 蓝青 Lapis | 蓝紫配色 | 技术、科普 |
| 彩虹 Rainbow | 多彩渐变 | 活泼内容 |
| 派 Pie | 柔和暖色 | 轻阅读 |
| 玉米 Maize | 黄色系 | 美食、生活 |
| 紫 Purple | 深紫雅致 | 文学、文化 |
| 物理猫 · 薄荷 | 清新绿 | 科技、学术 |
| 物理猫 · 樱花 | 粉红暖色 | 生活、美妆 |
| 物理猫 · 辐射 | 深色酷感 | 科技、暗系 |
| 物理猫 · 辐射亮 | 亮色版辐射 | 科技、正式 |
| 卡通紫 | 活泼可爱 | 趣味内容 |
| 极客黑 | 深色技术风 | 程序员向 |

---

## 🚀 部署到 Cloudflare Pages

### 方式一：拖拽部署（最简单）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **Create** → **Pages** → **Upload assets**
3. 把整个 `article-tools` 文件夹拖进去
4. 起个项目名，点击部署
5. 约 1 分钟后即可通过 `https://你的项目名.pages.dev` 访问

### 方式二：Git 部署（推荐，便于持续更新）

1. 把这个文件夹推到 GitHub
2. Cloudflare Dashboard → **Pages** → **Connect to Git**
3. 选择仓库，**Build command** 留空，**Build output directory** 填 `/`
4. 部署完成，每次 push 自动更新

---

## 📁 文件结构

```
article-tools/
├── index.html      # 主页面（单页应用）
├── styles.css      # 工具外壳样式（4 套界面主题变量）
├── app.js          # 全部交互逻辑
├── themes.js       # 13 套排版主题 CSS（移植自 wenyan-core）
└── README.md
```

无构建步骤，无 node_modules，无后端依赖。

---

## 💡 与原项目对比

原项目：[eternityspring/article-tools](https://github.com/eternityspring/article-tools)

| | 原项目 | Atelier |
|---|---|---|
| 文件组织 | 4 个独立 HTML | 1 个 SPA，顶部导航切换 |
| 排版主题 | 单一样式 | 13 套（移植自文颜开源主题） |
| 界面主题 | 无 | 4 套可切换 |
| 草稿管理 | 无 | 本地保存 + 版本历史回滚 |
| 字数统计 | 无 | 实时字数 + 阅读时长 |
| 封面标题 | 手动填写 | 导入文章自动提取 |
| MD 导入 | 无 | 拖拽 / 按钮 / 粘贴均可触发 |

---

## 📄 致谢

排版主题移植自 [caol64/wenyan-core](https://github.com/caol64/wenyan-core)（Apache 2.0），原始主题来自：

- [Orange Heart](https://github.com/evgo2017/typora-theme-orange-heart)
- [Rainbow](https://github.com/thezbm/typora-theme-rainbow)
- [Lapis](https://github.com/YiNNx/typora-theme-lapis)
- [Pie](https://github.com/kevinzhao2233/typora-theme-pie)
- [Maize](https://github.com/BEATREE/typora-maize-theme)
- [Purple](https://github.com/hliu202/typora-purple-theme)
- [物理猫](https://github.com/sumruler/typora-theme-phycat)

## 📝 License

MIT
