# AI 开发上下文文档 — ReikaAkane 个人网站

> 本文档面向 AI 助手，用于在新对话中快速接手本项目。
> **生成时间**：2026-08-06，基于代码库实际状态扫描生成（非聊天记忆）。
> **项目路径**：`C:\Users\Hikami\Desktop\personalWeb`
> **校验状态**：`npm run typecheck` ✅ 通过、`npm run lint` ✅ 通过、`npm run build` ✅ 通过
>
> **文档分工**：本文件给 AI 看；`README.md` 是操作手册（怎么写文章/换背景/换音乐）；
> `MioSrc/配置系统说明.md` 是速查表（改 XX 去哪个文件）。三者内容不重复。

---

## 1. 项目概述

### 这个网站是什么

一个**个人博客 + 个人展示主页**，站主是 ReikaAkane（日系偶像宅 / 计算机方向 / 图形学）。视觉风格参考《偶像大师》系列的舞台氛围：柔和背景、毛玻璃卡片、星光光晕、精致微动效。

不是 CMS，不是团队产品，就是一个人的个人空间。**规模意识很重要**：站主明确要求过"不要过度工程化"。

### 当前开发目标

把它做成一个"漂亮、稳定、易维护"的个人站。功能已基本齐备，当前处于**打磨与内容填充阶段**。

### 已完成内容

| 模块 | 状态 |
|---|---|
| 首页（头像 + 名字 + 日文标语 + 最新文章） | ✅ |
| 博客列表（分类/标签实时筛选） | ✅ |
| 文章详情（MDX + KaTeX 数学公式 + Shiki 代码高亮 + 目录 + 上下篇 + 相关文章） | ✅ |
| 关于页（头像 + 自我介绍 + 社交链接卡片） | ✅ |
| 音乐播放器（左下角浮动，跨页面不中断，自动播放，专辑封面同步旋转） | ✅ |
| 主题配色（首页左侧色相滑块，实时改全站强调色） | ✅ |
| 全文搜索（顶部放大镜，模糊匹配，多命中，点击跳转到具体句子） | ✅ |
| 随机背景图 | ✅ |
| SEO（metadata / sitemap / robots / JSON-LD） | ✅ |
| 文案全量可配置（`src/config/copy.ts`） | ✅ |

### 未完成内容

- **未初始化 git**（`git status` 报 "not a git repository"）。站主明确说过"先不用 git 到 GitHub"，
  但**本地仓库仍然值得有** —— 现在改坏任何文件都无法回滚，这也是不要随意删文件的原因。
- **未部署**。域名通过环境变量 `NEXT_PUBLIC_SITE_URL` 配置（见 `.env.example`），
  没设时退回 `http://localhost:3000`。
- **社交链接只有 B 站是真的**。X / GitHub / Email 三条已在 `site.ts` 里注释掉并留了模板，
  拿到真实地址取消注释即可。
- 只有 4 篇文章，其中 3 篇（hello-world / rsc-notes / stage-lights）是 AI 写的示例内容，
  只有 PBR 那篇是站主的真实笔记。**没有 git，删文件不可恢复，要删请先确认。**

---

## 2. 技术栈

| 类别 | 选型 | 版本 |
|---|---|---|
| 框架 | Next.js **App Router** | ^16.3.0 |
| UI 运行时 | React | ^19.2.0 |
| 语言 | TypeScript（**strict + noUnusedLocals + noUnusedParameters**） | ^5.9.3 |
| 样式 | **Tailwind CSS v4（CSS-first，无 tailwind.config）** | ^4.3.3 |
| UI 组件库 | **无第三方组件库**，全部自建（见"组件设计原则"） | — |
| 图标 | lucide-react（品牌图标除外，见下） | ^1.28.0 |
| 内容存储 | **MDX 文件**（`content/blog/*.mdx`）+ 本地 JSON（`src/data/`） | — |
| MDX 渲染 | next-mdx-remote（`/rsc` 入口） | ^6.0.0 |
| 数学公式 | remark-math + rehype-katex + katex | 6 / 7 / 0.18 |
| 代码高亮 | rehype-pretty-code + shiki（构建期，零运行时） | 0.14 / 4.4 |
| 锚点 id | rehype-slug + github-slugger | 6 / 2 |
| frontmatter 校验 | **zod** | ^4.4.3 |
| 搜索 | **Fuse.js** | ^7.5.0 |
| 类名工具 | clsx + tailwind-merge（封装成 `cn()`） | — |
| 部署 | **标准 Next.js 运行时**（刻意不用 `output: 'export'`） | — |

**dev 依赖里的 `music-metadata`** 只被 `scripts/extract-audio-covers.mjs` 使用（从 mp3 的 ID3 标签里提取专辑封面），不参与构建。

---

## 3. 项目结构

```
personalWeb/
├── AI_CONTEXT.md            ← 本文档（给 AI）
├── README.md                ← 操作手册（写文章/换背景/换音乐/各功能原理）
├── .env.example             ← 环境变量模板（域名、音频 CDN，都非必填）
├── MioSrc/                  ← 站主的素材暂存区，不参与构建
│   ├── 配置系统说明.md       ← 速查表：改 XX 去哪个文件（不含操作步骤，那些在 README）
│   ├── md/基于物理的渲染.md  ← 原始语雀导出稿（已整合进 content/blog/）
│   ├── headimg/、*.jpg/png  ← 原始图片素材
├── content/blog/*.mdx       ← 【高频修改】文章，与 src 同级，方便单独备份
├── public/
│   ├── audio/*.mp3          ← 音乐文件（文件名含空格，JSON 里要 URL 编码）
│   ├── images/avatar.jpg
│   ├── images/backgrounds/  ← 随机背景图候选
│   ├── images/covers/       ← 专辑封面（脚本从 mp3 提取）
│   └── images/blog/<slug>/  ← 文章配图，按 slug 分目录
├── scripts/extract-audio-covers.mjs  ← 一次性工具：提取 mp3 内嵌封面
└── src/
    ├── app/
    │   ├── layout.tsx        ← 根布局：Background + 两个 Provider + Header/Footer + 两个浮动面板
    │   ├── page.tsx          ← 首页
    │   ├── globals.css       ← 【重要】设计 token + accent 变量 + MDX 排版 + 动画
    │   ├── about/page.tsx
    │   ├── blog/page.tsx     ← 列表页
    │   ├── blog/[slug]/page.tsx  ← 详情页（SSG）
    │   ├── search-index.json/route.ts ← 构建期生成静态搜索索引
    │   ├── sitemap.ts / robots.ts / not-found.tsx / icon.svg
    ├── components/
    │   ├── ui/          Container · GlassCard · Badge（视觉基元）
    │   ├── layout/      Header · Footer · SearchBox
    │   ├── decor/       Background · RandomBackgroundImage · OverlayGradient · Starfield
    │   ├── home/        Hero · Tagline · LatestPosts
    │   ├── blog/        PostCard · PostFilter · PostHeader · MDXContent · ArticleToc · SearchHighlighter
    │   ├── music/       FloatingPlayer · TrackList
    │   ├── theme/       ThemePicker
    │   └── about/       SocialLinks · SocialIcons
    ├── config/          【高频修改】site.ts · theme.ts · copy.ts
    ├── data/            【高频修改】music.json · profile.json
    ├── lib/             posts.ts · search.ts · toc.ts · music.ts · profile.ts · schema.ts · utils.ts · mdx-components.tsx
    ├── hooks/           useDiscSpin.ts · useMediaQuery.ts
    └── providers/       PlayerProvider.tsx · ThemeProvider.tsx
```

### 关键文件作用

| 文件 | 作用 | 备注 |
|---|---|---|
| `src/lib/posts.ts` | **全站唯一读取文件系统的地方** | 所有页面只调用它，绝不直接 `fs` |
| `src/config/site.ts` | 站点身份：名字、标语、导航、社交链接、播放器行为 | 高频改 |
| `src/config/copy.ts` | **全站界面文案**（按页面/功能分 9 组） | 改文案只改这里 |
| `src/config/theme.ts` | 背景图候选、氛围特效开关 | |
| `src/app/globals.css` | 设计 token（`@theme`）+ `--accent-*` 运行时变量 + `.mdx-body` 排版 | 改视觉基调看这里 |
| `src/lib/search.ts` | 搜索纯逻辑（无 fs / 无 Fuse 依赖），服务端客户端共用 | |
| `src/lib/toc.ts` | 从 MDX 抽标题生成目录，id 用 github-slugger 与 rehype-slug 对齐 | |

### 经常修改的文件

1. `content/blog/*.mdx` — 加文章
2. `src/config/site.ts` — 改身份信息
3. `src/config/copy.ts` — 改界面文字
4. `src/data/music.json` / `profile.json` — 改歌单 / 自我介绍
5. `src/config/theme.ts` — 换背景

---

## 4. 设计规范

### 整体风格

日系偶像舞台氛围：**柔和、通透、有光**。半透明毛玻璃卡片浮在虚化背景图上，配合星光和缓慢漂浮的光晕。动效克制、缓慢、有"呼吸感"。

### 色彩

**两套色彩系统，务必分清：**

**A. 固定色板**（`globals.css` 的 `@theme`，Tailwind 类可直接用）
- `sakura-50~700` 樱粉（主强调）
- `lavender-50~700` 薰衣草紫（副）
- `aqua-50~700` 浅天蓝（点缀）
- `ink-400~900` 暖调紫灰（文字，比纯黑柔和）
- `cream` `#fffaf8`（兜底底色）

**B. 运行时强调色 `--accent-*`**（可被用户实时改变）
```
--accent-1/2/3        渐变色标（文字渐变、柔光晕）
--accent-strong-1/2   按钮/图标背景（更饱和一档）
--accent-foreground   叠在 accent-strong 上的文字色
--accent-solid        小控件（滑块、悬停描边）
--accent-shadow       辉光阴影
--accent-border       GlassCard 悬停描边
```
默认全白。`ThemeProvider` 用 HSL 现算并写成 `<html>` 内联样式覆盖。

对应工具类：`bg-accent-gradient` / `bg-accent-gradient-r` / `bg-accent-gradient-vertical` / `bg-accent-gradient-soft` / `bg-accent-1|2|3` / `text-accent-foreground` / `shadow-glow-accent` / `border-accent` / `text-gradient`

> ⚠️ **新写 UI 时，凡是"强调色"性质的渐变/辉光，必须用 `--accent-*` 工具类，不要写死 `from-sakura-500 to-lavender-500`**，否则主题滑块管不到它。

### 字体

不加载任何网络字体（CJK 字体动辄 5MB，会毁掉 LCP）。
```
--font-sans: ui-sans-serif, system-ui, -apple-system, 'Segoe UI',
             'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
```

### 间距与圆角

- 容器：`Container` 三档 — `narrow`=`max-w-3xl`（文章正文）、`default`=`max-w-5xl`、`wide`=`max-w-6xl`；内边距统一 `px-5 sm:px-8`
- 卡片圆角：`--radius-card: 1.5rem` → `rounded-card`；胶囊 `rounded-pill`
- 卡片内边距：`GlassCard` 的 `padding` — `sm`=p-4 / `md`=p-6 / `lg`=p-7 sm:p-9
- 区块纵向：页面级 `py-14 sm:py-20`，区块间 `mt-12`

### 动效

- 缓动统一 `--ease-idol: cubic-bezier(0.22, 1, 0.36, 1)` → `ease-idol`
- 入场 `animate-rise`（淡入 + 上移 18px），列表用内联 `animationDelay` 做 stagger
- 其他：`animate-float`（光晕）/ `animate-twinkle`（星光）/ `animate-drift` / `animate-shimmer`（渐变文字流动）/ `animate-eq`（播放中音量条）
- **全站遵守 `prefers-reduced-motion`**（globals.css 末尾统一降级）
- **禁止 Canvas / WebGL / 粒子引擎**，氛围特效一律纯 CSS（站主明确要求）

### 组件设计原则

1. **`GlassCard` 是全站唯一卡片基元**，所有卡片都由它派生。API：`as` / `glow`（pink|lavender|aqua|none，注：前三者现在渲染效果相同，都跟随 accent）/ `interactive` / `padding`
2. **Server Component 优先**。目前只有 14 个 `'use client'` 文件，都是真的需要交互/浏览器 API 的
3. **`'use client'` 要下沉到叶子节点**，别在页面顶层加
4. **跨 Server/Client 边界只传可序列化数据**（`date` 用 ISO 字符串不用 `Date` 对象）
5. **界面文案不写死在组件里**，一律走 `copy.ts`

### 页面布局规则

- Header 吸顶（`sticky top-0 z-50`），滚动超过 12px 才出现毛玻璃底
- **三个浮动面板，z-40，互不重叠**：
  - 左下 `bottom-4 left-4`：音乐播放器（全站）
  - 左中 `top-1/2 left-4`：主题配色（**仅首页**）
  - 右中：文章目录（**仅文章页**）。≥1280px 时贴正文右缘 `left-[calc(50%+23.25rem)]` 常驻展开；<1280px 退回 `right-4` 圆钮点开式
- 三个面板交互一致：**点开 / 点面板外收起**

---

## 5. 当前实现状态（逐页面）

### 首页 `/` — ✅ 完成

**结构**：`Hero` → `Tagline` → `LatestPosts`
- `Hero`：左头像（`profile.json` 的 avatar）+ 右名字（`siteConfig.name`，渐变字）。头像背后有柔光晕 `animate-float`
- `Tagline`：正中央大字 `siteConfig.homeSlogan`（当前 `これからも アイドル!!!!!!`）
- `LatestPosts`：最新 3 篇 `PostCard` 网格

**特殊**：首页**不叠加**背景遮罩（`OverlayGradient` 判断 `pathname === '/'` 返回 null），所以背景图最清晰。

**下一步方向**：无明确待办。

---

### 博客列表 `/blog` — ✅ 完成

**结构**：标题区 + `PostFilter`（客户端组件）
- `PostFilter` 接收全部 `PostMeta`，在客户端做分类 + 标签筛选（个人博客量级下比按分类生成静态页更简单）
- 卡片切换筛选时 key 带筛选条件，重新触发入场动画

**已知取舍**：没有分页、没有独立的 `/blog/category/[x]` 路由（刻意简化）。

---

### 文章详情 `/blog/[slug]` — ✅ 完成（功能最密集的页面）

**结构**：
```
PostHeader（返回链接 + 分类 + 标题 + 摘要 + 日期/时长 + 标签 + 封面）
<Suspense><SearchHighlighter /></Suspense>   ← 必须包 Suspense，见架构决策
<ArticleToc headings={post.headings} />
Container(narrow) > GlassCard > MDXContent
上下篇导航（newer / older）
相关文章（同分类或共享标签）
```

**MDX 管线**（`MDXContent.tsx`）：
`remarkGfm` → `remarkMath` → `rehypeSlug` → `rehypeKatex` → `rehypePrettyCode`

**自定义 MDX 组件**（`lib/mdx-components.tsx`）：`<Note type="info|tip|warn">`、`a`（内外链区分）、`img`（走 next/image）

**目录（ArticleToc）**：
- 构建期从 MDX 抽 `#`/`##`/`###`（`lib/toc.ts`），id 用 github-slugger 与 rehype-slug 对齐
- 按文章内最浅层级自动对齐缩进（有的文章用 `#` 当章节标题）
- 有子标题的章节可折叠；当前小节被折叠时高亮回退到折叠的上级
- 滚动跟踪：参考线 viewport 顶部下方 120px；**页面滚到底时特判**高亮最后一节（否则末节永远轮不到高亮）

**搜索跳转（SearchHighlighter）**：读 `?q=&i=`，把正文里所有该词标黄、滚到第 i 处。

**已知问题**：无功能性 bug。

---

### 关于页 `/about` — ✅ 完成

**结构**：介绍卡（头像 + 名字 + role + `profile.json` 的 intro 段落）+ 社交链接卡片网格

**社交链接**：目前只有 B 站是真实的，X / GitHub / Email 在 `site.ts` 里注释着等真实地址。
网格用 `repeat(auto-fill, minmax(9rem,1fr))`，链接加减都不会错版（**别改回 `auto-fit`**，
它会折叠空轨道，只剩一个链接时卡片会被拉满整行）。

**历史**：曾有"技能条 / 兴趣标签 / 经历时间线"三个区块，站主要求删除，对应组件 `SkillGrid.tsx` `Timeline.tsx` 已删，`profile.json` 也已精简。**不要重新加回来**。

---

### 音乐播放器（全站浮动） — ✅ 完成

**不是页面**，是常驻左下角的浮动条。曾有 `/music` 独立页面，站主要求删除，**不要重建**。

**结构**（展开态自上而下）：
1. 封面（旋转唱片）+ 曲名/艺术家 + 展开歌单箭头
2. 进度条 + 时间
3. 控制行：占位块 · 上一首 · **播放** · 下一首 · 循环模式（占位块与循环按钮等宽，让播放键**精确居中**，实测偏差 0px）
4. 音量行（静音按钮 + 滑块）

歌单展开后浮在播放条上方。

**三个精细实现**：
- **自动播放**：`siteConfig.player.autoplay`。浏览器拦截时静默等待，用户首次点击/按键/触摸时接上。播放器 DOM 打了 `data-player-ui` 标记，落在播放器内的首次点击会让路给按钮自己处理（否则会"播了又被暂停"）
- **唱片旋转同步**：`useDiscSpin` 用 **Web Animations API 的 `animation.currentTime`**（不是 CSS `animation-delay`）。暂停冻结角度、恢复接着转；收起态小圆钮和展开态封面共用 `PlayerProvider.getRotationSeconds()` 的累计秒数，切换时角度完全一致
- **hover 缩放与旋转分层**：旋转放在内层 `<span>`，按钮保留 `hover:scale`（同层会因 transform 冲突而失效）

---

### 搜索（顶部导航） — ✅ 完成

**入口**：Header 里「关于」右边的放大镜，点击展开输入框（绝对定位向左伸展，覆盖导航而非挤走）。

**索引**：`/search-index.json` 路由，`export const dynamic = 'force-static'`，构建期从 `lib/posts.ts` 生成。**新增文章重新构建自动收录，零配置**。首次点开搜索才 fetch，整页生命周期内复用。

**匹配**：Fuse.js，字段权重 title(3) > summary(2) = tags(2) > category(1.5) > content(1)，`ignoreLocation: true`、`threshold: 0.35`、`minMatchCharLength: 2`。

**结果**：按文章分组，标题右边标「N 处」，下面列出每一处命中的句子（一篇最多 6 条，`MAX_SNIPPETS_PER_DOC`）。点击跳到 `?q=&i=`，文章页滚到那一句。

**关键对齐机制**：为了让"第 i 处"在索引和 DOM 里指同一处，**两边都跳过代码块和公式** —— 索引侧在 `markdownToPlainText` 剔除，页面侧跳过 `pre` 和 `.katex`。行内公式也是整段剔除（不是只去 `$`），因为 KaTeX 渲染后的 DOM 文字对不上。**改动任一侧时必须同步改另一侧**。

---

### 主题配色（首页浮动） — ✅ 完成

首页左侧色相滑块（0=纯白，1~100 映射 0~360°）。`ThemeProvider` 用 HSL 现算出整套 `--accent-*` 写进 `<html>` 内联样式。选择存 `localStorage` 的 `theme-hue`。

---

## 6. 架构决策记录（ADR）— **非常重要**

### ADR-1：数据层只有一个文件，不做 Repository 抽象
`src/lib/posts.ts` 是全站唯一接触 `fs` 的地方。**曾设计过 `PostRepository` 接口 + 工厂 + 多实现，站主判定过度工程化，已废弃。**

未来换数据库时只需重写这一个文件。为此保持三条纪律（**不要破坏**）：
1. 所有导出函数都是 `async`（换成网络请求时签名不变）
2. `date` 用 ISO 字符串不用 `Date` 对象（可跨 Server/Client 传递）
3. `slug` 是主键，`draft` 字段现在就存在

**`src/app/` 下不允许出现 `fs` / `path` / `gray-matter`。**

### ADR-2：不用 `output: 'export'`
页面依然 SSG，但保留标准 Next.js 运行时，为将来加 `/api/*` 留路。`search-index.json` 就是靠 Route Handler + `force-static` 实现的。

### ADR-3：搜索用 Fuse.js，**不要换成 MiniSearch / Lunr / FlexSearch**
后者基于分词器按空格切词，**中文没有空格，整句会被当成一个 token，搜索直接失效**。Fuse 在原字符串上做匹配，中英文都能用。

### ADR-4：唱片旋转用 WAAPI，**不要退回 CSS animation-delay**
`animation-delay` 是相对元素**自身动画起点**的偏移，不是绝对相位。挂载久的元素会多算 `(now - 挂载时刻)`，导致收起/展开两处角度差出 140°（实测踩过）。必须用 `animation.currentTime`。

同理，**同步逻辑必须用回调 ref**，不能用普通 ref + `useEffect([isPlaying])` —— 切换收起/展开时 `isPlaying` 往往没变，effect 不重跑，新节点永远同步不上（实测踩过）。

### ADR-5：目录 id 必须用 github-slugger
`lib/toc.ts` 和 rehype-slug 用同一个库、同样的调用顺序，重名标题的 `-1`/`-2` 后缀才能对上。**不要自己实现 slug 化。**

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

---

## 7. 站主的偏好和要求

### 对代码的要求
- **TypeScript 严格模式**，`typecheck` 和 `lint` 必须零错误零警告
- **注释清晰**，用中文，解释"为什么这么做"而不是"这行代码做了什么"
- **组件化、文件职责清晰**，不把所有代码堆在页面文件里
- **不过度工程化**：不为假想的未来付现在的成本。宁可以后重写一个文件，也不要现在建一堆抽象层
- **保留未来扩展能力**，但只靠纪律（见 ADR-1 三条），不靠预留接口

### UI 偏好
- 日系偶像氛围，柔和精致
- 强调色偏白（曾要求"把所有渐变字/粉蓝渐变都改成白色"）
- 动效要有但要克制
- 移动端必须适配

### 不希望出现的问题
- 硬编码文案散落在组件里（要走 `copy.ts`）
- 写死的粉紫渐变（要走 `--accent-*`）
- 中文处理踩坑（分词、阅读时长、slug）
- 移动端横向溢出
- 布局位移（图片懒加载导致跳转位置不准这类）

### 做决定时应遵循的原则
1. **规模匹配**：这是个人博客，不是 CMS。方案复杂度要配得上规模
2. **验证再报告**：改完要真的在浏览器里测，用数据说话，不要"看代码觉得应该没问题"
3. **诚实**：没验证的就说没验证；发现自己之前判断错了要直说
4. **主动补足**：站主提需求时往往只考虑桌面端，要主动处理移动端；只说功能，要主动想边界情况

---

## 8. 当前 Bug / 待办事项

### P0（阻塞性）
无。代码库当前 typecheck / lint / build 全部通过。

### P1（需要站主提供信息才能完成）

1. **社交链接只剩 B 站** — X / GitHub / Email 已在 `src/config/site.ts` 的 `social` 数组里
   注释掉（原本是 `your_handle` 这类占位地址，会变成死链、甚至可能指到陌生人账号上）。
   **拿到真实地址后取消注释、替换即可，一行搞定。**
2. **上线时要设 `NEXT_PUBLIC_SITE_URL`** — 否则 sitemap 和分享卡片里的链接会是 `http://localhost:3000`。
   部署平台（Vercel 等）加个环境变量即可，不用改代码。见 `.env.example`。
3. **项目未初始化 git** — 站主要求暂不处理，但要意识到**当前任何文件删除都不可恢复**。

### P2（可选打磨）

4. **3 篇示例文章是 AI 写的占位内容**（hello-world / rsc-notes / stage-lights），
   站主可自行替换或删除。**注意没有 git，删了找不回来。**
5. **搜索索引体积**随文章增长线性上升（当前 4 篇约 25KB）。涨到几百篇时可以考虑
   改成服务端搜索 API —— 因为保留了标准 Next.js 运行时，加 `/api/search` 不用改部署方式。
6. **三处 `eslint-disable react-hooks/set-state-in-effect`**
   （`RandomBackgroundImage` / `PlayerProvider` / `ThemeProvider`）。
   都是「客户端专属状态恢复」的合理场景（`localStorage` 读取、`Math.random()` 选图），
   服务端算不了、必须挂载后才能拿到值，注释里都写明了原因。
   代价只是一次额外渲染，**属于合理取舍，不建议为了消掉告警而增加代码复杂度**。

### 已修复（2026-08-06 本轮）

| 原问题 | 怎么修的 |
|---|---|
| 社交链接是 `your_handle` 占位死链 | 注释掉假链接只留真实的 B 站，留好模板；顺带去掉了 B 站 URL 上的 `?spm_id_from=` 追踪参数 |
| 撤掉假链接后关于页只剩 1 张卡、被拉满整行 | `SocialLinks` 网格从写死的 `grid-cols-4` 改成 `repeat(auto-fill, minmax(9rem, 1fr))`。**特意用 `auto-fill` 不用 `auto-fit`** —— 后者会折叠空轨道导致单卡片被拉满 |
| `siteConfig.url` 硬编码 `https://example.com` | 改读 `process.env.NEXT_PUBLIC_SITE_URL`，退回 `http://localhost:3000`（故意用一眼能看出"没配"的值），新增 `.env.example` |
| `siteConfig.description` 是裸字符串 `'ReikaAkane'` | 换成完整的一句话描述 |
| `globals.css` 注释说 ThemePicker 切换 `<html data-accent>` | 实现早已改成色相滑块写内联样式，`data-accent` 不存在。已改正 |
| `PlayerProvider` 注释提到已删除的 `MiniPlayer` 组件 | 改成 `FloatingPlayer`（扫描时新发现的，原文档漏记） |
| `README.md` 目录树写着已删除的「技能条、时间线」 | 更新成实际的组件构成，补上遗漏的 `theme/`、`hooks/`（扫描时新发现的，原文档漏记） |
| 三份文档大量重复（换背景/自动播放/主题色/目录/搜索各写了两遍） | 重新划分职责：README = 操作手册，`MioSrc/配置系统说明.md` = 纯速查表（只留两张对照表 + 主题色原理），AI_CONTEXT = 给 AI。README 顶部加了导航说明 |

---

## 9. 新对话启动指令

复制以下内容到新对话：

```
我在开发一个个人博客网站，项目路径 C:\Users\Hikami\Desktop\personalWeb。

请先读取项目根目录的 AI_CONTEXT.md，那是完整的项目交接文档，包含技术栈、
架构决策记录（ADR）、我的偏好要求和当前待办。读完后再动手。

几条硬性约束（详见文档第 6、7 节）：
1. 这是个人博客规模的项目，不要过度工程化。已经明确废弃过 Repository Pattern、
   next-intl 国际化、独立音乐页面等方案，不要重新引入。
2. src/app/ 下不允许出现 fs / gray-matter，所有文章数据只能通过 src/lib/posts.ts 拿。
3. 界面文案一律走 src/config/copy.ts，不要硬编码在组件里。
4. 强调色渐变/辉光要用 --accent-* 工具类（bg-accent-gradient / shadow-glow-accent 等），
   不要写死 from-sakura-500 这类，否则主题色滑块管不到。
5. 氛围动效只能用纯 CSS，禁止 Canvas / WebGL / 粒子引擎。
6. 搜索必须用 Fuse.js，不要换成基于分词器的库（中文没空格会失效）。

工作方式要求：
- 改完代码要跑 npm run typecheck 和 npm run lint，必须零错误。
- 涉及界面的改动要在浏览器里实际验证（项目有 .claude/launch.json，
  用 preview_start 起 dev server），用具体数据说明验证结果，不要只看代码下结论。
- 发现我给的需求有边界情况没考虑到（尤其是移动端适配），主动提出并处理。
- 如果验证中发现问题，如实告诉我，包括你之前判断错的地方。
- 项目还没有 git，删文件不可恢复。要删我的内容（文章、图片、配置）之前先问我。
- 涉及我的真实信息（社交账号链接、域名、邮箱）时不要编造占位值，直接问我要。

今天我想做的是：<在这里写你的需求>
```

---

## 附录：常用命令

```bash
npm run dev        # 本地开发 http://localhost:3000
npm run build      # 生产构建（文章、搜索索引都在这一步生成）
npm run typecheck  # TypeScript 检查
npm run lint       # ESLint
node scripts/extract-audio-covers.mjs   # 从 public/audio/ 的 mp3 提取内嵌专辑封面
```

## 附录：新增一篇文章的完整流程

1. 在 `content/blog/` 建 `my-post.mdx`（文件名即 URL）
2. 写 frontmatter：`title` / `date` / `summary` / `category` / `tags` 必填，`cover` / `draft` / `slug` 可选（由 `src/lib/schema.ts` 的 zod 校验，写错构建期直接报错）
3. 配图放 `public/images/blog/<slug>/`
4. 完事。列表、目录、搜索索引、sitemap、相关文章全部自动更新，无需任何配置
