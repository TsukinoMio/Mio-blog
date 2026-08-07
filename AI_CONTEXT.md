# AI 开发上下文文档 — ReikaAkane 个人网站

> 本文档面向 AI 助手，用于在新对话中快速接手本项目。
> **生成方式**：2026-08-07 基于代码库**实际扫描**生成（非聊天记忆）。
> **项目路径**：`C:\Users\Hikami\Desktop\personalWeb`
> **仓库**：`https://github.com/TsukinoMio/Mio-blog`，只用 `main` 一个分支
> **线上**：`https://blog.reikaakane.com`（Cloudflare Workers，push 到 main 自动部署）
> **当前 HEAD**：`fab8b9d`
> **校验状态**：`npm run typecheck` ✅ / `npm run lint` ✅ / `npm run build` ✅（12 个路由全部预渲染）
>
> **文档分工**（四份，内容不重复）：
> - **本文件** —— 给 AI 看：架构决策、技术债、待办
> - **`README.md`** —— 操作手册：怎么写文章 / 换背景 / 换音乐 / 各功能原理
> - **`更新与发布.md`** —— 发布流程、部署配置、故障排查
> - **`MioSrc/配置系统说明.md`** —— 速查表：改 XX 去哪个文件

---

## 1. 项目概述

### 这个网站是什么

一个**个人博客 + 个人展示主页**。站主 ReikaAkane：计算机方向、图形学，日系偶像宅（偶像大师 / LoveLive / BanG Dream 等），玩过编曲和吉他贝斯键盘，做过 MAD/PV。

视觉风格参考《偶像大师》系列的舞台氛围：柔和背景、毛玻璃卡片、星光光晕、精致微动效。

**不是 CMS，不是团队产品，就是一个人的个人空间。规模意识很重要** —— 站主明确要求过"不要过度工程化"。

### 当前开发目标

已上线且功能齐备，当前处于**打磨 + 内容填充**阶段。近期重心是「降低站主的维护成本」（换歌/换背景已做到丢文件即可）和「移动端体验」。

### 已完成内容

| 模块 | 状态 |
|---|---|
| 首页（头像 + 站名 + 日文大字标语 + 最新 3 篇） | ✅ |
| 博客列表（分类/标签客户端实时筛选） | ✅ |
| 文章详情（MDX + KaTeX + Shiki 高亮 + 目录 + 上下篇 + 相关文章） | ✅ |
| 关于页（头像 + 自我介绍 + 社交链接卡片） | ✅ |
| 音乐播放器（左下角浮动，跨页面不中断，自动播放，唱片同步旋转） | ✅ |
| 主题配色（**顶栏搜索框右边的画板按钮**，全站可用） | ✅ |
| 全文搜索（顶栏放大镜，模糊匹配，**按正文小节分组** + 折叠展开） | ✅ |
| 随机背景图 | ✅ |
| SEO（metadata / sitemap / robots / JSON-LD） | ✅ |
| 文案全量可配置（`src/config/copy.ts`，10 个分组） | ✅ |
| git + GitHub（单 `main` 分支） | ✅ |
| Cloudflare Workers 部署（push 即自动构建上线） | ✅ |
| 自定义域名 `blog.reikaakane.com` | ✅ |
| **媒体自动同步**（丢 mp3/图片进目录即可，无需改配置） | ✅ |
| 静态资源缓存头（`public/_headers`） | ✅ |

### 未完成内容

- **社交链接只有 B 站是真的**。X / GitHub / Email 在 `src/config/site.ts` 的 `social` 数组里注释着，拿到真实地址取消注释即可。**绝不要编占位地址**。
- **只有 4 篇文章**，其中 3 篇（`hello-world` / `rsc-notes` / `stage-lights`）是 AI 写的示例内容，只有 `physically-based-rendering` 是站主的真实笔记。
- **`www` 子域未绑定**，只有 `blog.reikaakane.com` 能打开。
- **图床尚未接入**。站主正在自建图床，计划以后所有**文章配图**从图床加载（背景图经分析后决定留本地，见 ADR-10）。
- `MioSrc/BugReport/` 下有一份历史构建失败日志，已入库。

### 部署速查（详见 `更新与发布.md`）

| 项 | 值 |
|---|---|
| Cloudflare 项目名 | `mio-blog`（必须与 `wrangler.jsonc` 的 `name` 一致） |
| **构建命令** | **`npm run cf:build`** —— 改成 `npm run build` 必然失败 |
| 部署命令 | `npx wrangler deploy` |
| 非生产分支部署命令 | `npx wrangler versions upload` |
| 构建变量 | `NEXT_PUBLIC_SITE_URL` = `https://blog.reikaakane.com` |
| Worker 绑定 | 只有 `ASSETS` 和 `IMAGES` |

---

## 2. 技术栈

| 类别 | 选型 | 版本 |
|---|---|---|
| 框架 | Next.js **App Router** | ^16.3.0 |
| UI 运行时 | React | ^19.2.0 |
| 语言 | TypeScript（**strict + noUnusedLocals + noUnusedParameters**） | ^5.9.3 |
| 样式 | **Tailwind CSS v4（CSS-first，无 tailwind.config 文件）** | ^4.3.3 |
| UI 组件库 | **无第三方组件库**，全部自建 | — |
| 图标 | lucide-react（B 站/GitHub 品牌图标是手写 SVG） | ^1.28.0 |
| 内容存储 | **MDX 文件**（`content/blog/*.mdx`）+ 本地 JSON（`src/data/`） | — |
| MDX 渲染 | next-mdx-remote（`/rsc` 入口） | ^6.0.0 |
| 数学公式 | remark-math + rehype-katex + katex | 6 / 7 / 0.18 |
| 代码高亮 | **@shikijs/rehype/core + 自建精简 highlighter** | 4.4 |
| 锚点 id | rehype-slug + github-slugger | 6 / 2 |
| frontmatter 校验 | **zod** | ^4.4.3 |
| 搜索 | **Fuse.js** | ^7.5.0 |
| 类名工具 | clsx + tailwind-merge（封装成 `cn()`） | — |
| 部署 | **Cloudflare Workers**，经 `@opennextjs/cloudflare` 适配 | 1.20 |
| 部署 CLI | wrangler | 4.119 |
| 运行时 | **标准 Next.js 运行时**（刻意不用 `output: 'export'`） | — |

### 依赖上的几个坑

- **`@shikijs/langs` / `@shikijs/themes` 是显式 `dependencies`**。别以为它们是 shiki 的传递依赖就删掉 —— `src/lib/shiki.ts` 直接 import 它们的子路径。
- **`music-metadata` 虽在 devDependencies，但参与构建**。`scripts/sync-media.mjs` 挂在 `prebuild` 上，CI 也会跑。不能当成"可选工具依赖"删掉。
- **`@types/hast` 是显式 devDependency**，`src/lib/shiki.ts` 的 transformer 需要。

### npm scripts

```
sync:media   node scripts/sync-media.mjs      手动扫描媒体目录、重新生成两份 JSON
predev       npm run sync:media               dev 前自动跑
dev          next dev
prebuild     npm run sync:media               build 前自动跑
build        next build
start        next start
lint         eslint .
typecheck    tsc --noEmit
cf:build     opennextjs-cloudflare build      【CI 的构建命令就是这条】
cf:preview   opennextjs-cloudflare preview    站主 Windows 机器上跑不了，见 P2
cf:deploy    opennextjs-cloudflare deploy     手动部署，一般用不到
```

---

## 3. 项目结构

```
personalWeb/
├── AI_CONTEXT.md            ← 本文档（给 AI）
├── README.md                ← 操作手册
├── 更新与发布.md             ← 发布流程、部署配置、故障排查
├── wrangler.jsonc           ← 【别删】Cloudflare Worker 配置，见 ADR-6
├── open-next.config.ts      ← 【别删】OpenNext 适配配置，见 ADR-8
├── next.config.ts           ← 只配了 images.formats（avif/webp）
├── .env.example             ← 环境变量模板（域名、音频 CDN，都非必填）
├── .claude/launch.json      ← preview_start 用的 dev server 配置（名字 personalWeb，端口 3000）
├── MioSrc/                  ← 站主的素材暂存区，不参与构建
│   ├── 配置系统说明.md
│   ├── md/基于物理的渲染.md   ← 原始语雀导出稿（已整合进 content/blog/）
│   └── BugReport/           ← 历史构建失败日志
├── content/blog/*.mdx       ← 【高频修改】4 篇文章，与 src 同级方便单独备份
├── public/
│   ├── _headers             ← Workers Assets 缓存头（/_next/static 一年 immutable，/images/* 与 /audio/* 30 天）
│   ├── audio/*.mp3          ← 【丢文件即可】3 首，14.66 MB，128 kbps，**带内嵌封面**
│   ├── images/avatar.jpg
│   ├── images/my-icon.png   ← favicon（32×32），路径写在 siteConfig.icon
│   ├── images/icon.svg      ← 项目自带的默认图标（当前未使用）
│   ├── images/backgrounds/  ← 【丢文件即可】2 张，5.53 MB（含一张 4.86 MB 的 PNG，见 P2）
│   ├── images/covers/       ← 3 张，由 sync-media 从 mp3 自动抽出，**不要手放**
│   └── images/blog/<slug>/  ← 文章配图，14 张 2.56 MB，按 slug 分目录
├── scripts/sync-media.mjs   ← 【构建前自动跑】见 ADR-9
└── src/
    ├── app/
    │   ├── layout.tsx        ← 根布局：Background + ThemeProvider + PlayerProvider + Header/Footer + FloatingPlayer
    │   ├── page.tsx          ← 首页
    │   ├── globals.css       ← 【重要】559 行：@theme 设计 token + --accent-* + @utility + .mdx-body 排版 + 动画
    │   ├── about/page.tsx
    │   ├── blog/page.tsx
    │   ├── blog/[slug]/page.tsx      ← SSG，含 dynamicParams = false
    │   ├── search-index.json/route.ts ← force-static，构建期生成搜索索引
    │   ├── sitemap.ts / robots.ts / not-found.tsx
    │   └──（favicon 不在这里 —— 走 siteConfig.icon，图放 public/images/。
    │       放回 src/app/icon.* 会被 Next 文件约定接管，让配置失效）
    ├── components/
    │   ├── ui/       Container · GlassCard · Badge（视觉基元）
    │   ├── layout/   Header（内含 SearchBox 与 ThemePicker）· Footer · SearchBox
    │   ├── decor/    Background · RandomBackgroundImage · OverlayGradient · Starfield
    │   ├── home/     Hero · Tagline · LatestPosts
    │   ├── blog/     PostCard · PostFilter · PostHeader · MDXContent · ArticleToc · SearchHighlighter
    │   ├── music/    FloatingPlayer · TrackList
    │   ├── theme/    ThemePicker（挂在 Header 里，**不在 layout.tsx**）
    │   └── about/    SocialLinks · SocialIcons
    ├── config/       site.ts · theme.ts · copy.ts
    ├── data/         profile.json（手改）· music.json / backgrounds.json（**自动生成，别手改**）
    ├── lib/          posts.ts · search.ts · toc.ts · music.ts · backgrounds.ts · profile.ts
    │                 · schema.ts · utils.ts · shiki.ts · mdx-components.tsx
    ├── hooks/        useDiscSpin.ts · useMediaQuery.ts
    └── providers/    PlayerProvider.tsx · ThemeProvider.tsx
```

### 关键文件作用

| 文件 | 作用 | 备注 |
|---|---|---|
| `src/lib/posts.ts` | **全站唯一读取文件系统的地方** | 页面只调它，绝不直接 `fs`。已实测 `src/app/` 下 `fs`/`gray-matter` 出现次数 = 0 |
| `src/config/site.ts` | 站点身份：名字、tagline、favicon、作者、role、首页标语、描述、域名、导航、播放器行为、社交链接 | 高频改 |
| `src/config/copy.ts` | **全站界面文案**，10 个分组：`common` `header` `search` `home` `blog` `about` `music` `toc` `theme` `notFound` | 改文案只改这里 |
| `src/config/theme.ts` | 背景**观感参数**（透明度/模糊/是否固定/遮罩）+ 氛围特效开关 + 星星数量 | 背景图列表已不在这里 |
| `src/app/globals.css` | 设计 token（`@theme`）+ `--accent-*` 运行时变量 + `@utility` 自定义工具类 + `.mdx-body` 排版 | 改视觉基调看这里 |
| `src/lib/search.ts` | 搜索纯逻辑（无 fs / 无 Fuse 依赖），服务端客户端共用 | 含小节划分，见 ADR-11 |
| `src/lib/toc.ts` | 从 MDX 抽标题生成目录，id 用 github-slugger 与 rehype-slug 对齐 | 见 ADR-5 |
| `src/lib/shiki.ts` | **代码语言白名单**（当前 `glsl`/`tsx`/`bash`）+ 复刻输出结构的 transformer | 见 ADR-7 |
| `src/lib/backgrounds.ts` | 背景图数据层，读生成的 `backgrounds.json` | 组件不直接 import JSON |
| `scripts/sync-media.mjs` | 扫 `public/audio/` 与 `public/images/backgrounds/`，生成两份 JSON 并抽封面 | 见 ADR-9 |
| `wrangler.jsonc` | Worker 名字、入口、`ASSETS`/`IMAGES` 绑定 | 见 ADR-6 |
| `open-next.config.ts` | `incrementalCache` —— **预渲染页面靠它才能被读到** | 见 ADR-8 |
| `public/_headers` | Workers Assets 缓存头 | 见 P1 |

### 经常修改的文件

1. `content/blog/*.mdx` —— 加文章
2. `src/config/site.ts` —— 改身份信息
3. `src/config/copy.ts` —— 改界面文字
4. `src/data/profile.json` —— 改自我介绍

**换歌 / 换背景不改任何文件** —— 把 mp3 丢进 `public/audio/`、图片丢进 `public/images/backgrounds/` 即可。`src/data/music.json` 与 `src/data/backgrounds.json` 是**生成物，手改会在下次构建被覆盖**。

---

## 4. 设计规范

### 整体风格

日系偶像舞台氛围：**柔和、通透、有光**。半透明毛玻璃卡片浮在虚化背景图上，配合星光和缓慢漂浮的光晕。动效克制、缓慢、有"呼吸感"。

### 色彩 —— 两套系统，务必分清

**A. 固定色板**（`globals.css` 的 `@theme`，Tailwind 类可直接用）

- `sakura-50~700` 樱粉（主强调）
- `lavender-50~700` 薰衣草紫（副）
- `aqua-50~700` 浅天蓝（点缀）
- `ink-400~900` 暖调紫灰（文字，比纯黑柔和）
- `cream` `#fffaf8`（兜底底色）

**B. 运行时强调色 `--accent-*`**（用户可实时改变）

```
--accent-1/2/3        渐变色标（文字渐变、柔光晕）
--accent-strong-1/2   按钮/图标背景（更饱和一档）
--accent-foreground   叠在 accent-strong 上的文字色
--accent-solid        小控件（滑块、悬停描边）
--accent-shadow       辉光阴影
--accent-border       GlassCard 悬停描边
```

默认全白。`ThemeProvider` 用 HSL 现算并写成 `<html>` 内联样式覆盖，选择存 `localStorage` 的 `theme-hue`。

对应工具类：`bg-accent-gradient` / `bg-accent-gradient-r` / `bg-accent-gradient-vertical` / `bg-accent-gradient-soft` / `bg-accent-1|2|3` / `text-accent-foreground` / `shadow-glow-accent` / `border-accent` / `text-gradient`

> ⚠️ **新写 UI 时，凡是"强调色"性质的渐变/辉光，必须用 `--accent-*` 工具类，不要写死 `from-sakura-500 to-lavender-500`**，否则主题滑块管不到它。
> （纯文字颜色用 `text-sakura-600` 这类是可以的，站内链接就是这么写的。）

### 其他自定义工具类

| 工具类 | 作用 |
|---|---|
| `h-stable-viewport` | `height: 100lvh`。固定背景层专用，见 ADR-12 |
| `text-gradient` | 渐变文字 + 兜底阴影 |
| `line-clamp-2` / `line-clamp-3` | 多行截断 |

### 字体

不加载任何网络字体（CJK 字体动辄 5MB，会毁掉 LCP）。

```
--font-sans: ui-sans-serif, system-ui, -apple-system, 'Segoe UI',
             'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
```

> **踩过的坑**：不同设备的系统字体宽度差异很大。Windows 上刚好放得下的文字，Android 上可能被切掉。涉及固定字号 + 不可换行文本时要留余量，见 ADR-13。

### 间距与圆角

- 容器 `Container` 三档：`narrow`=`max-w-3xl`（文章正文）、`default`=`max-w-5xl`、`wide`=`max-w-6xl`；内边距统一 `px-5 sm:px-8`
- 卡片圆角 `--radius-card: 1.5rem` → `rounded-card`；胶囊 `rounded-pill`
- `GlassCard` 的 `padding`：`sm`=p-4 / `md`=p-6 / `lg`=p-7 sm:p-9
- 区块纵向：页面级 `py-14 sm:py-20`，区块间 `mt-12`

### 动效

- 缓动统一 `--ease-idol: cubic-bezier(0.22, 1, 0.36, 1)` → `ease-idol`
- 入场 `animate-rise`（淡入 + 上移 18px），列表用内联 `animationDelay` 做 stagger
- 其他：`animate-float`（光晕）/ `animate-twinkle`（星光）/ `animate-drift` / `animate-shimmer`（渐变文字流动）/ `animate-eq`（播放中音量条）
- **全站遵守 `prefers-reduced-motion`**（globals.css 末尾统一降级）
- **禁止 Canvas / WebGL / 粒子引擎**，氛围特效一律纯 CSS（站主明确要求）

### 组件设计原则

1. **`GlassCard` 是全站唯一卡片基元**，所有卡片都由它派生。API：`as` / `glow`（pink|lavender|aqua|none，注：前三者现在渲染效果相同，都跟随 accent）/ `interactive` / `padding`
2. **Server Component 优先**。目前 14 个 `'use client'` 文件，都是真的需要交互/浏览器 API
3. **`'use client'` 下沉到叶子节点**，别在页面顶层加
4. **跨 Server/Client 边界只传可序列化数据**（`date` 用 ISO 字符串不用 `Date` 对象）
5. **界面文案不写死在组件里**，一律走 `copy.ts`

### 页面布局规则

- Header 吸顶（`sticky top-0 z-50`），滚动超过 12px 才出现毛玻璃底
- Header 右侧依次是：导航（`sm` 以上显示）→ 搜索按钮 → **主题配色画板按钮** → 汉堡菜单（`sm` 以下显示）
- **两个浮动面板，z-40**：
  - 左下 `bottom-4 left-4`：音乐播放器（全站）
  - 右中：文章目录（**仅文章页**）。≥1280px 贴正文右缘 `left-[calc(50%+23.25rem)]` 常驻展开；<1280px 退回 `right-4` 圆钮点开式
- **Header 里的两个下拉面板（搜索结果、主题配色）在窄屏都用 `max-sm:fixed inset-x-4 top-[4.5rem]` 相对视口铺开** —— 按 `right-0` 定位会被汉堡菜单顶出屏幕
- 面板交互一致：**点开 / 点面板外收起**（搜索和主题面板还支持 Esc）

---

## 5. 当前实现状态（逐页面）

### 首页 `/` — ✅ 完成

**结构**：`Hero` → `Tagline` → `LatestPosts`

- `Hero`：左头像（`profile.json` 的 avatar）+ 右站名（`siteConfig.name`，渐变字）。头像背后有柔光晕 `animate-float`
  - **窄屏做过防溢出处理**：头像 `h-24`（96px）、间距 `gap-4`、字号 `clamp(1.75rem,8vw,2.25rem)` + `overflow-wrap:anywhere`。`sm` 以上恢复 160px 头像 + `text-6xl`
- `Tagline`：正中央大字 `siteConfig.homeSlogan`（当前 `これからも アイドル!!!!!!`）
- `LatestPosts`：最新 3 篇 `PostCard` 网格

**特殊**：首页**不叠加**背景遮罩（`OverlayGradient` 判断 `pathname === '/'` 返回 null），所以背景图最清晰。

**下一步方向**：无明确待办。

---

### 博客列表 `/blog` — ✅ 完成

**结构**：标题区 + `PostFilter`（客户端组件）

`PostFilter` 接收全部 `PostMeta`，在客户端做分类 + 标签筛选。卡片切换筛选时 key 带筛选条件，重新触发入场动画。

**已知取舍**：没有分页、没有 `/blog/category/[x]` 路由（刻意简化，4 篇文章不值得）。

---

### 文章详情 `/blog/[slug]` — ✅ 完成（功能最密集）

**结构**：

```
PostHeader（返回链接 + 分类 + 标题 + 摘要 + 日期/时长 + 标签 + 封面）
<Suspense><SearchHighlighter /></Suspense>   ← 必须包 Suspense（用了 useSearchParams）
<ArticleToc headings={post.headings} />
Container(narrow) > GlassCard > MDXContent
上下篇导航（newer / older）
相关文章（同分类或共享标签）
```

**MDX 管线**（`MDXContent.tsx`）：
`remarkGfm` → `remarkMath` → `rehypeSlug` → `rehypeKatex` → `rehypeShikiFromHighlighter`

**自定义 MDX 组件**（`lib/mdx-components.tsx`）：`<Note type="info|tip|warn">`、`a`（内外链区分）、`img`（走 next/image）

**页面顶部有 `export const dynamicParams = false`** —— 运行时没有文件系统，未预渲染的 slug 走到 `getPost()` 会让 `fs` 抛错拿到 500。别删。

**目录（ArticleToc）**：
- 构建期从 MDX 抽 `#`/`##`/`###`，id 用 github-slugger 与 rehype-slug 对齐
- 按文章内最浅层级自动对齐缩进
- 有子标题的章节可折叠；当前小节被折叠时高亮回退到折叠的上级
- 滚动跟踪参考线在 viewport 顶部下方 120px；**页面滚到底时特判**高亮最后一节

**搜索跳转（SearchHighlighter）**：读 `?q=&i=`，把正文里所有该词标黄、滚到第 i 处。图片懒加载完成后会再校正一次滚动位置。

**已知问题**：无功能性 bug。

---

### 关于页 `/about` — ✅ 完成

**结构**：介绍卡（头像 + 名字 + role + `profile.json` 的 intro 段落）+ 社交链接卡片网格

网格用 `repeat(auto-fill, minmax(9rem,1fr))`。**别改回 `auto-fit`** —— 它会折叠空轨道，只剩一个链接时卡片会被拉满整行。

**历史**：曾有"技能条 / 兴趣标签 / 经历时间线"三个区块，站主要求删除，对应组件已删。**不要重新加回来**。

---

### 音乐播放器（全站浮动） — ✅ 完成

**不是页面**，是常驻左下角的浮动条。曾有 `/music` 独立页面，站主要求删除，**不要重建**。

**结构**（展开态自上而下）：封面（旋转唱片）+ 曲名/艺术家 + 展开箭头 → 进度条 + 时间 → 控制行（占位块 · 上一首 · 播放 · 下一首 · 循环模式）→ 音量行。歌单展开后浮在播放条上方。

**四个精细实现**：

1. **自动播放**：`siteConfig.player.autoplay`。浏览器拦截时静默等待，用户首次点击/按键/触摸时接上。播放器 DOM 打了 `data-player-ui` 标记，落在播放器内的首次点击会让路给按钮自己处理
2. **解锁失败要能重试**（近期修复）：手势解锁**只有真的播起来才注销监听**，失败则保留、等下一次交互再试；另有 `canplay` 补播作为第二道保险。`pauseAudio` 会清掉播放意图，所以用户主动暂停不会被补播覆盖。**旧实现是无条件注销 + 吞掉错误，慢网络下失败一次就永久失效**
3. **唱片旋转同步**：`useDiscSpin` 用 **Web Animations API 的 `animation.currentTime`**（不是 CSS `animation-delay`），见 ADR-4
4. **hover 缩放与旋转分层**：旋转放在内层 `<span>`，按钮保留 `hover:scale`（同层会因 transform 冲突而失效）

**歌单来源**：`src/data/music.json`，由 `sync-media` 从 mp3 的 ID3 自动生成，见 ADR-9。

---

### 搜索（顶栏） — ✅ 完成

**入口**：Header 里「关于」右边的放大镜，点击展开输入框（绝对定位向左伸展，覆盖导航而非挤走）。

**索引**：`/search-index.json` 路由，`export const dynamic = 'force-static'`，构建期从 `lib/posts.ts` 生成。**新增文章重新构建自动收录，零配置**。首次点开搜索才 fetch，整页生命周期内复用。

**匹配**：Fuse.js，字段权重 title(3) > summary(2) = tags(2) > category(1.5) > content(1)，`ignoreLocation: true`、`threshold: 0.35`、`minMatchCharLength: 2`。

**结果展示**（近期重做，参考 Material for MkDocs）：
- 按文章分组，标题右边标「N 处」
- 命中按**正文小节**分组，显示粗体小节标题（只在与上一条不同时显示）
- 折叠时每篇只显示 `PREVIEW_SNIPPETS_PER_DOC = 1` 条，其余收在「在这篇文章里还有 N 处结果」后面，**点一下就地展开**
- 单篇硬上限 `MAX_SNIPPETS_PER_DOC = 50`（实测「的」在 PBR 那篇有 132 处，不封顶会甩出几百个 DOM 节点）
- **只有一个滚动条**，刻意不做嵌套滚动

**关键对齐机制**：见 ADR-11。

---

### 主题配色（顶栏画板按钮） — ✅ 完成

Header 里搜索框右边的画板按钮，点开是下拉面板，里面是色相滑块（0=纯白，1~100 映射 0~360°）。`ThemeProvider` 用 HSL 现算出整套 `--accent-*` 写进 `<html>` 内联样式。选择存 `localStorage` 的 `theme-hue`。

**曾经是首页左侧的浮动圆钮**（只在首页出现，且与左下角播放器抢空间），已收进 Header，现在全站可用。**不要挪回去**。

---

## 6. 架构决策记录（ADR）— **非常重要**

### ADR-1：数据层只有一个文件，不做 Repository 抽象

`src/lib/posts.ts` 是全站唯一接触 `fs` 的地方。**曾设计过 `PostRepository` 接口 + 工厂 + 多实现，站主判定过度工程化，已废弃。**

未来换数据库时只需重写这一个文件。为此保持三条纪律（**不要破坏**）：

1. 所有导出函数都是 `async`（换成网络请求时签名不变）
2. `date` 用 ISO 字符串不用 `Date` 对象（可跨 Server/Client 传递）
3. `slug` 是主键，`draft` 字段现在就存在

**`src/app/` 下不允许出现 `fs` / `path` / `gray-matter`。**（已实测：当前出现次数 0）

### ADR-2：不用 `output: 'export'`

页面依然 SSG，但保留标准 Next.js 运行时，为将来加 `/api/*` 留路。`search-index.json` 就是靠 Route Handler + `force-static` 实现的。

> 撞上 Worker 3 MiB 限制时曾把 `output: 'export'` 作为备选提出，站主选择了精简 Shiki 而不是推翻这条 ADR。

### ADR-3：搜索用 Fuse.js，**不要换成 MiniSearch / Lunr / FlexSearch**

后者基于分词器按空格切词，**中文没有空格，整句会被当成一个 token，搜索直接失效**。Fuse 在原字符串上做匹配，中英文都能用。

### ADR-4：唱片旋转用 WAAPI，**不要退回 CSS animation-delay**

`animation-delay` 是相对元素**自身动画起点**的偏移，不是绝对相位。挂载久的元素会多算 `(now - 挂载时刻)`，导致收起/展开两处角度差出 140°（实测踩过）。必须用 `animation.currentTime`。

同理，**同步逻辑必须用回调 ref**，不能用普通 ref + `useEffect([isPlaying])` —— 切换收起/展开时 `isPlaying` 往往没变，effect 不重跑，新节点永远同步不上（实测踩过）。

### ADR-5：目录 id 必须用 github-slugger

`lib/toc.ts` 和 rehype-slug 用同一个库、同样的调用顺序，重名标题的 `-1`/`-2` 后缀才能对上。**不要自己实现 slug 化。**

---

> 以下 ADR-6 ~ ADR-13 来自 2026-08-06/07 的上线与优化过程，**每一条都对应一次实际事故或实测**。
> 改动对应文件之前务必读完。

### ADR-6：`wrangler.jsonc` 必须提交进仓库，`name` 必须是 `mio-blog`

缺了它时 `npx wrangler deploy` 会走框架自动探测，在非交互环境下静默调用 `@opennextjs/cloudflare migrate` 现场生成配置。而模板里的 `<WORKER_NAME>` 占位符取自 `package.json` 的 `name`（见 `cli/utils/create-wrangler-config.js` 第 41、80-83 行），也就是 **`personal-web`** —— 与 Cloudflare 上真实的 Worker `mio-blog` 对不上：

```
Service binding 'WORKER_SELF_REFERENCE' references Worker 'personal-web'
which was not found. [code: 10143]
```

**注意 `package.json` 的 `name` 仍然是 `personal-web`**，两者本来就不同名，别去"统一"它们。

配置里**刻意不声明 `WORKER_SELF_REFERENCE`**：它只被 ISR 重验证队列使用，本站用不上；且首次部署时 Worker 自身尚不存在，声明反而会再次触发 10143。

### ADR-7：Shiki 只注册用到的语言，**不要换回 rehype-pretty-code**

Cloudflare Workers 免费版脚本上限 **3 MiB（gzip 后）**。`rehype-pretty-code` 顶部是静态的 `import { getSingletonHighlighter } from 'shiki'`，shiki 主入口会把 200 多种语言语法和全部主题挂进模块图，esbuild 实测这条链单独就是 **10.15 MB / gzip 1.74 MB**，直接超限（`code: 10027`）。

**踩过的弯路**：只覆盖 `getHighlighter` 选项**没有任何效果** —— 那只替换运行时实例，静态 import 该拖进来的照样拖进来（实测 trace 体积纹丝不动）。必须换掉插件本身，改用 `@shikijs/rehype/core` 的 `rehypeShikiFromHighlighter`。

换完实测：trace 从 15.70 MB → 5.90 MB，其中 shiki 从 10.22 MB / 343 个文件 → 0.18 MB / 13 个。

`src/lib/shiki.ts` 里 `LANGS` 是白名单，**写文章用了新语言就要往里加**（配了 `fallbackLanguage: 'plaintext'`，不加不会失败，但那段代码没有配色，也没有告警）。同文件的 transformer 复刻了 rehype-pretty-code 的输出结构（`figure[data-rehype-pretty-code-figure]` + `figcaption[data-rehype-pretty-code-title]`），**`globals.css` 的选择器依赖这个结构**。

### ADR-8：`open-next.config.ts` 必须配 `incrementalCache`

**OpenNext 的 incremental cache 不只服务 ISR —— 构建期预渲染出来的 SSG 页面也是存在这里、并从这里取的。** 不配时是空实现，每次请求都是 cache miss，Worker 会当场重新执行路由代码，而 Cloudflare Workers **没有文件系统**：

```
/blog/<slug>        → 404
/search-index.json  → []
/sitemap.xml        → 只剩 3 条静态路由
/ 与 /blog          → 页面在，文章列表空白
```

**这条曾被误判**：当时以为"全站 SSG、没有 ISR，所以不需要缓存"，还把部署日志里的 `Incremental cache does not need populating` 当成佐证 —— 那句话的实际含义是"没有配置缓存所以无需填充"。

用的是 `static-assets-incremental-cache`（从 Workers Assets 读预渲染产物，不需要 KV / R2，不产生费用）。

**快速判断是不是又犯了这个病**：打开 `/sitemap.xml`，如果 `<lastmod>` 等于你**当前访问的时刻**而不是构建时刻，就说明在实时渲染。

### ADR-9：媒体资源用构建前脚本扫描，**不要改回手写配置**

站主的要求是"丢文件进目录就行，不想改 config"：

```
public/audio/*.mp3          -> src/data/music.json + public/images/covers/*
public/images/backgrounds/* -> src/data/backgrounds.json
```

由 `scripts/sync-media.mjs` 完成，挂在 `predev` / `prebuild` 上自动执行。歌曲的曲名 / 艺术家 / 专辑 / 时长 / 封面**全部来自 mp3 的 ID3 标签**。

**为什么是构建前的独立脚本，而不是在 `src/lib/` 里读文件系统**（像 `posts.ts` 那样）：抽出来的封面必须**写进 `public/`**，而这要赶在 `next build` 收集静态资源**之前**完成。放进构建过程里做，写入时机与资源收集时机的先后没有保证。挂 `prebuild` 由 npm 保证顺序。

**四条不要破坏的纪律：**

1. 两份 JSON 是**生成物**，手改会在下次构建被覆盖 —— 要改行为就改脚本
2. 曲目 `id` 由 ID3 标题生成，**同时用作 React 列表 key 和封面文件名，必须唯一**。脚本里有撞车加 `-2` 后缀的逻辑，别删（实测踩过：复制一首同名歌进去，两条记录 id 相同，列表 key 重复且封面互相覆盖）
3. **mp3 要保留内嵌封面**。曾为省体积用 ffmpeg 的 `-vn` 剥掉过，结果自动识别拿不到图。重转时要用 `-map 0 -c:v copy` 把封面流带上，代价是每首多 0.2~0.6 MB，这是这套工作流的必要成本
4. `music-metadata` 虽在 devDependencies 但**参与构建**，不能当可选依赖删

### ADR-10：背景图留本地静态，**不要挪去图床**（文章配图可以）

站主在自建图床。经分析：**文章配图适合图床，背景图不适合。**

实测数据（背景走 `next/image`，`fill` + `sizes="100vw"`）：

| | 体积 |
|---|---|
| 原始 `lovelive.png` | 4977.9 KB |
| next/image w=640 | 133.3 KB |
| next/image w=1080（手机） | **322.3 KB** |
| next/image w=1920（桌面） | 851.3 KB |

三条理由：

1. **会丢掉这套自动优化**。外链图片要配 `remotePatterns`，Cloudflare Images 得先跨域回源抓原图再优化，多一跳
2. **背景是首屏 LCP 元素**。跨域意味着多一次 DNS + TCP + TLS 握手
3. **背景只有 2~3 张，总量小**。图床解决的是"图片多到撑爆仓库"，这在文章配图上才成立

### ADR-11：搜索的小节划分不能改动 `content`

搜索结果跳转靠 `?i=`（正文里的第几处命中）定位，文章页的 `SearchHighlighter` 按同样口径数 DOM 里的命中。**一旦 `content` 变了，两边序号立刻错位。**

所以 `content` 一个字节都没动，只在 `SearchDoc` 上增加 `sections`（小节标题 + 起始下标）。

做法（`buildSearchContent`）：在原文标题行**末尾**打一个 NUL 记号，让它跟正文一起过一遍 `markdownToPlainText`，再从结果里找记号位置 —— 偏移量天然是 `content` 里的真实下标。

**记号必须打在行尾**：先前打在井号之后，挡住了 `markdownToPlainText` 里 `^\s{0,3}\d+\.\s+` 这条行首锚定的规则，`### 1. 默认写 Server Component` 残留成了 `1. 默认写…`，`content` 与改动前不一致。是逐字节比对时发现的。

**另外**：索引侧和页面侧**都跳过代码块和公式**（索引侧在 `markdownToPlainText` 剔除，页面侧跳过 `pre` 和 `.katex`）。行内公式是整段剔除（不是只去 `$`），因为 KaTeX 渲染后的 DOM 文字对不上。**改动任一侧时必须同步改另一侧。**

### ADR-12：固定背景层用 `h-stable-viewport`，**不要改回 `inset-0`**

`position: fixed` + `inset-0` 的高度取自**动态视口**。手机滚动时地址栏收起/展开，视口高度实时变化，这一层就跟着一帧帧改高度；背景图是 `object-cover`，高度一变就重新缩放裁切，表现为**上下滑动时背景抽动**。

实测（390px 宽，模拟地址栏出现，视口高 780 → 712）：背景层高和背景图高都从 780 变成 712。

改用 `h-stable-viewport`（`height: 100lvh`）。`lvh` 锚定的是大视口（浏览器工具栏收起时的高度），按规范**不随滚动变化**。

**没写 `100vh` 兜底**：Tailwind v4 的浏览器基线本就是 Safari 16.4+ / Chrome 111+，而 `lvh` 在 Safari 15.4 / Chrome 108 起就支持。试过写两条声明做渐进增强，Lightning CSS 会按浏览器目标判定 `vh` 那条冗余并直接删掉，产物里只剩 `lvh`。

> **此修复未在真机验证**（无头浏览器没有可收起的工具栏，`lvh` 等同窗口高度，改窗口大小时新旧写法表现一致）。站主需在手机上确认。

### ADR-13：不可换行的文本要用流体字号

站点名 `ReikaAkane` 是不含空格的单词，**浏览器没有可换行的位置**。原来用固定 `text-4xl`(36px)，360px 视口下容器只给 184px 而文字宽 203px，右边缘正好压在屏幕边界 —— 开发机字体刚好差一点没顶出去，**Android 字体更宽就被切掉了**。

改用 `clamp(1.75rem, 8vw, 2.25rem)` + 缩小头像和间距 + `overflow-wrap:anywhere` 兜底。抗字体差异实测（用 `letter-spacing` 模拟）：字体宽 15% 时仍有 20px 余量。

**教训**：涉及固定字号 + 不可换行文本时要留余量，别用开发机的字体度量下结论。

### 已删除 / 明确不要重新引入的功能

| 功能 | 为什么删 |
|---|---|
| **国际化 next-intl / `/[locale]` 路由** | 站主判定过度工程化，第一版只要中文 |
| **`/music` 独立页面** | 改成常驻浮动播放条，导航栏也移除了「音乐」项 |
| **关于页的技能条 / 兴趣标签 / 经历时间线** | 站主要求删除 |
| **首页的「博客」「关于」入口卡片** | 站主要求删除，换成日文大字标语 |
| **评论系统 / Analytics / RSS / 后台管理 / 搜索索引预留接口** | 站主明确要求"不要提前创建大量接口" |
| **Repository Pattern** | 见 ADR-1 |
| **Canvas / WebGL / 粒子引擎** | 站主明确要求纯 CSS 动效 |
| **`reading-time` 依赖** | 按空格分词，中文会算成 1 个词。已换成 `lib/utils.ts` 自己实现的 `estimateReadingTime`（中文 400 字/分、英文 200 词/分） |
| **`rehype-pretty-code`** | 见 ADR-7，会把 Worker 撑爆 3 MiB 上限。已卸载 |
| **`output: 'export'`** | 见 ADR-2 |
| **`scripts/extract-audio-covers.mjs`** | 功能已并入 `scripts/sync-media.mjs` |
| **主题配色的首页左侧浮动圆钮** | 已收进 Header，全站可用 |
| **搜索结果的嵌套滚动条** | 站主最初设想过，但参考视频里没有，且触屏上难操作。改成折叠展开 |

---

## 7. 站主的偏好和要求

### 对代码的要求

- **TypeScript 严格模式**，`typecheck` 和 `lint` 必须零错误零警告
- **注释清晰，用中文**，解释"为什么这么做"而不是"这行代码做了什么"。踩过的坑要写进注释
- **组件化、文件职责清晰**，不把所有代码堆在页面文件里
- **不过度工程化**：不为假想的未来付现在的成本。宁可以后重写一个文件，也不要现在建一堆抽象层
- **保留未来扩展能力**，但只靠纪律（见 ADR-1 三条），不靠预留接口

### UI 偏好

- 日系偶像氛围，柔和精致
- 强调色偏白（曾要求"把所有渐变字/粉蓝渐变都改成白色"）
- 动效要有但要克制
- **移动端必须适配**

### 工作方式要求（很重要）

- **改完代码要跑 `npm run typecheck` 和 `npm run lint`，必须零错误**
- **涉及界面的改动要在浏览器里实际验证**（项目有 `.claude/launch.json`，用 `preview_start` 起 dev server），**用具体数据说明验证结果，不要只看代码下结论**
- **发现需求有边界情况没考虑到（尤其是移动端适配），主动提出并处理**
- **如实报告**：没验证的就说没验证；发现自己之前判断错了要直说
- **删站主的内容（文章、图片、配置）之前先问**
- **推送到 main 会自动触发线上部署，推之前先问**
- **涉及站主的真实信息（社交账号链接、域名、邮箱）时不要编造占位值，直接问**

### 站主的环境限制

- Windows 11，PowerShell
- **未开启开发者模式**，`npm run cf:preview` 跑不了（OpenNext 打包要创建符号链接，报 `EPERM`）。**这意味着 AI 无法在本地验证 OpenNext 最终产物和 gzip 体积**，只能靠 CI 或线上实测
- ffmpeg 装在 `D:\Tools\ffmpeg\bin\ffmpeg.exe`（gyan.dev essentials 构建，含 `libmp3lame` 和 `ffprobe`）
- **`gh` CLI 未安装**，无法从命令行开 PR

### 做决定时应遵循的原则

1. **规模匹配**：这是个人博客，不是 CMS。方案复杂度要配得上规模
2. **验证再报告**：改完要真的在浏览器里测，用数据说话
3. **诚实**：没验证的就说没验证；发现自己之前判断错了要直说
4. **主动补足**：站主提需求时往往只考虑桌面端，要主动处理移动端；只说功能，要主动想边界情况

---

## 8. 当前 Bug / 待办事项

### P0（阻塞性）

无。代码库 typecheck / lint / build 全部通过，线上全站可访问。

### P1（需要站主提供信息 / 需要真机确认）

1. **背景抽动修复未在真机验证**（ADR-12）。无头浏览器复现不了手机地址栏收放。**请站主在手机上滑动确认**。若仍抽动，下一步排查方向是光晕（`animate-float`，三个 24~30rem 的 `blur-3xl` 色球）和星光（60 个点做透明度动画）这两层 —— 可临时在 `src/config/theme.ts` 把 `effects.starfield` / `glowOrbs` 单独关掉定位。
2. **社交链接只剩 B 站**。X / GitHub / Email 已在 `src/config/site.ts` 注释掉。拿到真实地址取消注释即可。**绝不要编占位值**。
3. **`www` 子域未绑定**。只有 `blog.reikaakane.com` 能开。

### P2（可选打磨）

4. **`lovelive.png` 是 4.86 MB 的 PNG**。照片类内容用 PNG 很浪费，转 WebP 能降到 1 MB 以内，`next/image` 的每一档也会跟着更小。ffmpeg 已就绪，随时可做。
5. **3 篇示例文章是 AI 写的占位内容**（hello-world / rsc-notes / stage-lights），站主可自行替换或删除。**删之前要问**。
6. **音频首次加载仍需 14.66 MB**。已从 320 kbps 降到 128 kbps（35.12 → 13.64 MB），后因自动识别需要封面又带回 1.02 MB。Workers Assets **不支持 Range 请求**（实测发 `Range` 返回 200 全量而非 206），浏览器无法分段取。要再快只剩两条路：搬去支持 Range 的 CDN（`.env.example` 里的 `NEXT_PUBLIC_AUDIO_BASE_URL` 已为此预留），或把 `siteConfig.player.autoplayTrack` 从 `'random'` 改成固定第一首（常客只需缓存一首）。
7. **点击目标偏小**（站主已表示不用修）：搜索关闭按钮 28×28、页脚社交链接 27×18、首页「ALL →」45×20，均低于 44×44 建议值。
8. **`public/images/icon.svg` 当前未被引用**（`siteConfig.icon` 指向 `my-icon.png`），作为默认图标示例保留。
9. **三处 `eslint-disable react-hooks/set-state-in-effect`**（`RandomBackgroundImage` / `PlayerProvider` / `ThemeProvider`）。都是「客户端专属状态恢复」的合理场景，注释里写明了原因。**属于合理取舍，不建议为消警告增加复杂度**。
10. **搜索索引体积**随文章增长线性上升（当前 4 篇约 18 KB）。涨到几百篇时可考虑改成 `/api/search`（因保留了标准 Next.js 运行时，不用改部署方式）。
11. **仓库体积**：git 永久保留了音频的历史 blob（320 kbps 那版 35 MB + 128 kbps 那版）。以后换歌尽量一次选定码率再提交，别反复替换同名大文件。

### 图床接入（站主正在自建，尚未开始）

计划让**文章配图**从图床加载。建议参考 `lib/music.ts` 的 `resolveAudioSrc` 思路做一个 `resolveImageSrc`，用环境变量控制前缀，这样 MDX 里的相对路径不用改。**背景图不要一起挪**，理由见 ADR-10。

---

## 9. 新对话启动指令

复制以下内容到新对话：

```
我在开发一个个人博客网站，项目路径 C:\Users\Hikami\Desktop\personalWeb。

请先读取项目根目录的 AI_CONTEXT.md，那是完整的项目交接文档，包含技术栈、
架构决策记录（ADR-1 ~ ADR-13）、我的偏好要求和当前待办。读完后再动手。

项目已上线：https://blog.reikaakane.com
仓库：https://github.com/TsukinoMio/Mio-blog（只有 main 一个分支）

几条硬性约束（详见文档第 6、7 节）：
1. 这是个人博客规模的项目，不要过度工程化。已明确废弃过 Repository Pattern、
   next-intl 国际化、独立音乐页面、rehype-pretty-code 等方案，不要重新引入。
2. src/app/ 下不允许出现 fs / gray-matter，所有文章数据只能通过 src/lib/posts.ts 拿。
3. 界面文案一律走 src/config/copy.ts，不要硬编码在组件里。
4. 强调色渐变/辉光要用 --accent-* 工具类（bg-accent-gradient / shadow-glow-accent 等），
   不要写死 from-sakura-500 这类，否则主题色滑块管不到。
5. 氛围动效只能用纯 CSS，禁止 Canvas / WebGL / 粒子引擎。
6. 搜索必须用 Fuse.js，不要换成基于分词器的库（中文没空格会失效）。
7. 站点部署在 Cloudflare Workers 上，有 3 MiB（gzip 后）脚本体积上限。
   不要装体积大的运行时依赖。
8. wrangler.jsonc 和 open-next.config.ts 是部署命脉，别删别改名（ADR-6、ADR-8）。
   Cloudflare 的构建命令必须是 npm run cf:build，不是 npm run build。
9. Workers 运行时没有文件系统，任何依赖 fs 的代码只能在构建期跑。
10. 换歌/换背景是"丢文件进目录"，src/data/music.json 和 backgrounds.json 是
    自动生成的，不要手改（ADR-9）。

工作方式要求：
- 改完代码要跑 npm run typecheck 和 npm run lint，必须零错误。
- 涉及界面的改动要在浏览器里实际验证（项目有 .claude/launch.json，
  用 preview_start 起 dev server），用具体数据说明验证结果，不要只看代码下结论。
- 我的机器是 Windows 且未开开发者模式，npm run cf:preview 跑不了（符号链接 EPERM）。
  OpenNext 最终产物和 gzip 体积你在本地验证不了，别假装验证过了，
  说清楚哪些没验到。
- 发现我给的需求有边界情况没考虑到（尤其是移动端适配），主动提出并处理。
- 如果验证中发现问题，如实告诉我，包括你之前判断错的地方。
- 要删我的内容（文章、图片、配置）之前先问我。
- 推送到 main 会自动触发线上部署，推之前先问我。
- 涉及我的真实信息（社交账号链接、域名、邮箱）时不要编造占位值，直接问我要。

今天我想做的是：<在这里写你的需求>
```

---

## 附录：常用命令

```bash
npm run dev        # 本地开发 http://localhost:3000（会先自动跑 sync:media）
npm run build      # 生产构建（会先自动跑 sync:media）
npm run typecheck  # TypeScript 检查
npm run lint       # ESLint
npm run sync:media # 手动扫描 audio/ 与 backgrounds/ 重新生成两份 JSON
npm run cf:build   # Cloudflare 部署用的构建（CI 跑的就是这条）
npm run cf:preview # 本地 workerd 预览 —— 站主机器上跑不了，见 P2
```

线上自检（部署后确认）：

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://blog.reikaakane.com/blog/physically-based-rendering
```

应返回 `200`。再核对 `/sitemap.xml`（条目数 = 3 + 文章数，且 `lastmod` 应为构建时刻而非访问时刻）和 `/search-index.json`（不应为 `[]`）。

## 附录：新增一篇文章的完整流程

> 加歌 / 换背景不在这里 —— 直接把 mp3 丢进 `public/audio/`、把图片丢进
> `public/images/backgrounds/` 即可，无需任何配置（ADR-9）。

1. 在 `content/blog/` 建 `my-post.mdx`（文件名即 URL）
2. 写 frontmatter：`title` / `date` / `summary` / `category` / `tags` 必填，`cover` / `draft` / `slug` 可选（由 `src/lib/schema.ts` 的 zod 校验，写错构建期直接报错）
3. 配图放 `public/images/blog/<slug>/`
4. **如果正文里的代码块用了 `glsl` / `tsx` / `bash` 以外的语言，必须去 `src/lib/shiki.ts` 的 `LANGS` 数组里加上**（ADR-7）。不加不会报错，但那段代码没有配色，也没有告警
5. 跑 `npm run build` 自查（frontmatter 校验、MDX 语法、公式语法都只在构建期报错）
6. `git push origin main` 后 Cloudflare 自动构建上线，约 3 分钟
7. 列表、目录、搜索索引、sitemap、相关文章全部自动更新
