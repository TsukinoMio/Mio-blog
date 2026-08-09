# ReikaAkane 的个人博客 + 展示主页

Next.js 16（App Router）· TypeScript 严格模式 · Tailwind CSS 4 · Markdown/MDX
· 部署在 Cloudflare Workers

线上：<https://reikaakane.com>

---

## 文档索引

四份文档，按**你要做什么**来找，内容不重复：

| 我要… | 看这份 |
|---|---|
| **写文章、用 Obsidian、传图、换背景、换音乐** | [`写作指南.md`](写作指南.md) |
| **改站名/文案/配色、发布上线、出问题排查** | [`配置与部署.md`](配置与部署.md) |
| **让 AI 助手接手这个项目** | [`AI_CONTEXT.md`](AI_CONTEXT.md) |
| 了解项目结构 | 本文件下面 |

---

## 快速开始

```bash
npm run dev
```

打开 <http://localhost:3000>

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地开发（会先自动扫描媒体目录） |
| `npm run build` | 生产构建，文章在这一步静态生成。**推送前务必跑一次** |
| `npm run typecheck` | TypeScript 检查 |
| `npm run lint` | ESLint |
| `npm run sync:media` | 手动重扫 `public/audio/` 与 `public/images/backgrounds/` |
| `npm run cf:build` | Cloudflare 部署用的构建（CI 跑的就是这条） |
| `npm run cf:preview` | 本地 workerd 预览线上产物（需开启 Windows 开发者模式） |

---

## 三件最常做的事

```bash
# 发文章：在 content/blog/ 下建 .md，填好 frontmatter，push
# 换背景：图片丢进 public/images/backgrounds/
# 换音乐：mp3 丢进 public/audio/
```

后两件**不用改任何配置文件** —— 曲名、封面、时长从 mp3 的 ID3 标签自动读取。
详见 [`写作指南.md`](写作指南.md)。

---

## 目录结构

```
content/blog/          文章（.md），与 src 同级，方便单独备份或迁移
public/images/         背景图、头像、本地文章配图
public/audio/          音乐文件
配置系统的四个文件      src/config/site.ts · theme.ts · copy.ts · src/data/profile.json

src/app/               路由与页面，只负责取数据和拼装组件
src/components/
  ├── ui/              GlassCard / Badge / Container —— 视觉基元
  ├── layout/          Header / Footer / SearchBox
  ├── decor/           Background / Starfield —— 纯装饰层，可整体关闭
  ├── home/            Hero / Tagline / LatestPosts
  ├── blog/            文章卡片、筛选、正文渲染、目录、搜索高亮
  ├── music/           浮动播放条（FloatingPlayer）、歌单（TrackList）
  ├── theme/           ThemePicker —— 顶栏的主题色滑块
  └── about/           社交链接卡片与品牌图标
src/lib/               数据访问与工具函数
src/hooks/             useDiscSpin（唱片旋转同步）· useMediaQuery
src/config/            site.ts（身份）· theme.ts（视觉）· copy.ts（界面文案）
src/data/              profile.json（手改）· music.json / backgrounds.json（自动生成）
src/providers/         PlayerProvider（播放状态）· ThemeProvider（主题强调色）
scripts/sync-media.mjs 构建前自动扫描媒体目录

wrangler.jsonc         【别删】Cloudflare Worker 配置
open-next.config.ts    【别删】OpenNext 适配配置
```

不进版本控制的两个目录（在 `.gitignore` 里）：

- `MioSrc/` —— 素材暂存区，不参与构建
- `.obsidian/` —— Obsidian 库配置，**含图床凭据，本仓库是公开仓库，别加回来**

---

## 一条重要的架构纪律

`src/lib/posts.ts` 是**全站唯一读取文件系统的地方**。页面组件只调用它导出的函数，
从不直接接触 `fs` 或 Markdown 文件。

因此将来迁移到数据库时，只需把这一个文件的实现换成 SQL 查询、返回相同的
`PostMeta` / `Post` 结构，`src/app/` 下的页面一行都不用改。为此保持三条纪律：

1. 所有导出函数都是 `async` —— 换成网络或数据库请求时签名不变
2. `date` 用 ISO 字符串而不是 `Date` 对象 —— 可安全跨 Server/Client 边界传递
3. `slug` 是主键，`draft` 字段现在就存在

完整的架构决策记录（ADR-1 ~ ADR-13）在 [`AI_CONTEXT.md`](AI_CONTEXT.md)。
