# 个人博客 + 个人展示主页

Next.js 16（App Router）· TypeScript 严格模式 · Tailwind CSS 4 · MDX

> **四份文档的分工**（内容不重复，改哪份都不用同步其他几份）：
> - **本文件** —— 操作手册：怎么写文章、换背景、换音乐、各功能怎么工作
> - **`更新与发布.md`** —— 改完东西怎么让线上生效：发布流程、部署配置、故障排查
> - **`配置系统说明.md`** —— 速查表：我想改 XX，去哪个文件
> - **`AI_CONTEXT.md`** —— 给 AI 助手看的项目交接文档：架构决策、技术债、待办

## 快速开始

```bash
npm run dev
```

打开 http://localhost:3000

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地开发 |
| `npm run build` | 生产构建（文章在此阶段静态生成） |
| `npm start` | 启动生产服务 |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript 检查 |
| `npm run cf:build` | Cloudflare 部署用的构建（CI 跑的就是这条） |
| `npm run cf:preview` | 本地用 workerd 预览线上产物，见 `更新与发布.md` |

## 写一篇新文章

在 `content/blog/` 下新建 `.mdx` 文件，文件名就是访问路径（`my-post.mdx` → `/blog/my-post`）：

```mdx
---
title: '文章标题'
date: '2026-08-06'
summary: '一句话摘要，会显示在列表卡片和搜索结果里。'
category: '随笔'
tags: ['标签A', '标签B']
cover: '/images/covers/xxx.jpg'   # 可选，不填会显示渐变占位
draft: false                       # 可选，true 时只在开发环境可见
---

正文从这里开始，支持全部 Markdown 语法。
```

frontmatter 由 `src/lib/schema.ts`（Zod）校验，字段写错会在构建时直接报错并指出问题所在。

正文里可以使用提示块组件：

```mdx
<Note type="tip">这里是一段提示。type 可选 info / tip / warn。</Note>
```

代码块支持文件名标注：

````mdx
```tsx title="src/app/page.tsx"
export default function Page() {}
```
````

### 文章目录

目录是**自动生成**的，不用手写：构建时从正文里扫出所有 `#` / `##` / `###` 标题，文章页右侧就会出现目录面板（标题少于 2 个时不显示）。滚动时会自动高亮当前章节。

- **位置**：宽屏（≥1280px）下贴着正文卡片右边缘常驻展开，不需要点。窄屏两侧没有富余空间，会退回成和播放器一样的圆按钮，点开才显示。
- **折叠**：有子标题的章节前面带箭头，点一下可以收起/展开这一支。如果当前正在读的小节被折叠藏起来了，高亮会自动回退到那个折叠的上级章节，这样始终知道自己在哪一大节（但不会自动帮你展开，免得跟手动折叠的意图打架）。

几个注意点：

- 只收录到三级标题，`####` 及以下不进目录（细节太碎，列出来反而吵）
- 有的文章用 `#` 当章节标题、有的从 `##` 开始，目录会自动按这篇文章里最浅的那一级对齐，不会整体缩进跑偏
- 目录锚点用的 `github-slugger`，和正文标题 id 的生成规则（`rehype-slug`）是同一个库，所以中文标题、带引号或行内代码的标题都能正确跳转

实现在 `src/lib/toc.ts`（抽取）+ `src/components/blog/ArticleToc.tsx`（面板）。

数学公式支持 KaTeX 语法：

```mdx
行内公式 $E = mc^2$，或者独占一行的块级公式：

$$
L_o(p, \omega_o) = \int_{\Omega} f_r(p, \omega_i, \omega_o) L_i(p, \omega_i) \max(0, \mathbf{n} \cdot \omega_i) d\omega_i
$$
```

### 从其他笔记软件导入 Markdown

如果文章是从语雀、飞书文档、Notion 这类工具导出的 `.md`，直接拖进 `content/blog/` 大概率不能用，常见坑：

1. **没有 frontmatter** —— 补上 `title` / `date` / `summary` / `category` / `tags`（见上面的模板），否则 Zod 校验会在构建期报错。
2. **正文被 `<font style="color:...">` 包裹** —— 很多导出工具会把每段文字包一层内联颜色样式。这些颜色是导出工具编辑器里的配色，跟本站主题无关，应该整段删掉标签、只留纯文本，让 `.mdx-body` 的排版样式统一接管。可以用编辑器的正则替换：把 `<font[^>]*>` 和 `</font>` 都替换成空字符串，再检查一遍有没有把加粗 `**text**` 拆散。
3. **数学公式只用单个 `$`** —— 有些工具导出的独立公式（自己占一整行的那种）也只用单个 `$...$`（行内语法），渲染出来字会很小、没有居中。判断标准很简单：**嵌在一句话中间的公式**保持 `$...$`（行内）；**自己单独一段的公式**改成 `$$...$$`（块级），前后各留一个空行。
4. **图片是外链** —— 图存在笔记软件自己的 CDN 上（语雀是 `cdn.nlark.com`），长期来看这些链接可能失效或需要登录。建议下载下来放进 `public/images/blog/<文章slug>/`，再把正文里的图片链接改成本地路径 `/images/blog/<文章slug>/xxx.png`。批量下载可以写个几行的 Node 脚本用 `fetch` 挨个存文件，或者手动另存为。
5. **代码块语言必须在白名单里** —— 为了把 Worker 产物压进 Cloudflare 免费版的 3 MiB 上限，Shiki 只注册了**实际用到的语言**，目前是 `glsl` / `tsx` / `bash` 三种（见 `src/lib/shiki.ts`）。用了清单外的语言**不会报错，但那段代码不会有配色**。加新语言只要在那个文件里 import 一行、往 `LANGS` 数组里加一项，步骤见 `更新与发布.md` 第 3 节。想显示文件名就加 `title="路径"`。

这份工作流的完整实例可以参考 `content/blog/physically-based-rendering.mdx` ——它是从语雀导出的一篇图形学笔记原样整合过来的，保留了改造前后的取舍可以对照。

## 搜索

顶部导航「关于」右边的放大镜，点开就是搜索框。搜索范围覆盖**全部文章的标题、摘要、标签、分类和正文全文**，支持模糊匹配（打错一两个字母也能搜到）。

结果按文章分组：标题右边标着这篇里一共命中几处，下面列出命中的句子，并按**正文小节**分组显示小节标题，一眼能看出这处命中在文章的哪一部分。

一篇文章默认只先显示 1 条，其余收在「**在这篇文章里还有 N 处结果**」后面，点一下就地展开，可以翻遍所有命中（单篇上限 50 条，见 `src/lib/search.ts` 的 `MAX_SNIPPETS_PER_DOC`；超出部分会注明还有几处）。整个面板只有一个滚动条，不做嵌套滚动——嵌套滚动在触屏上很难操作。

点任意一条会跳进文章，并且**直接滚到那一句**——页面上所有出现该关键词的地方都会标黄，点中的那处颜色更深。

**加了新文章不用做任何事**：索引由 `src/app/search-index.json/route.ts` 在构建期从 `lib/posts.ts`（全站唯一的数据访问层）生成，`npm run build` 时会输出成一个静态的 `/search-index.json`。往 `content/blog/` 里丢新文章、重新构建，就自动进索引了。

几个实现上的取舍：

- **为什么用 Fuse.js 而不是 MiniSearch / Lunr**：后者基于分词器，按空格切词——中文句子没有空格，会被当成一整个词，搜索直接失效。Fuse 是在原字符串上做匹配的，中英文都能用。
- **索引什么时候下载**：第一次点开搜索框时才 `fetch`，之后整个页面生命周期内复用，不会重复请求。首屏不受影响。
- **正文会先洗成纯文本**（`markdownToPlainText`），去掉代码块、公式、图片链接和 Markdown 语法，这样结果里显示的句子读起来是人话。
- **跳转怎么定位到那一句**：链接上带 `?q=关键词&i=第几处`，文章页的 `SearchHighlighter` 把正文里所有出现的地方套上 `<mark>`，再滚到第 i 处。关键在于两边要数得一样多——所以**索引和页面扫描都跳过代码块和公式**（索引侧在 `markdownToPlainText` 剔除，页面侧跳过 `pre` 和 `.katex`），否则"第 4 处"在两边指的就不是同一个位置了。另外全部标黄而不只标一处，万一序号真对不齐，读者也能一眼看到文章里所有相关位置。
- **至少要输 2 个字**：单个字符匹配不出有意义的结果，这时会提示"再多输入一个字试试"，而不是显示"没有找到"让人以为坏了。
- 文章多起来之后索引会变大（目前 1 篇约 4.9KB）。如果哪天涨到几百篇导致下载变慢，再考虑换成服务端搜索 API——因为 `next.config.ts` 保留了标准 Next.js 运行时，加 `/api/search` 路由不需要改部署方式。

## 换背景图

**把图片丢进 `public/images/backgrounds/` 就完事了，不用改任何配置。**

和换音乐一样由 `scripts/sync-media.mjs` 自动扫描，产出 `src/data/backgrounds.json`（**生成的文件，别手改**）。支持 jpg / jpeg / png / webp / avif / gif。

每次进入页面会从候选里随机挑一张。目录里**只放一张**就等于固定背景；**清空目录**则只保留渐变、不加载图片。

观感参数仍在 `src/config/theme.ts`：

```ts
background: {
  imageOpacity: 0.55,   // 图片太抢眼就调低
  imageBlur: 0,
  fixed: true,          // 滚动时背景不动
  overlay: '...',       // 覆盖在图片上的遮罩，保证文字可读；首页不叠加这层
}
```

同一个文件里还能关掉氛围特效：

```ts
effects: { starfield: false, glowOrbs: false }
```

星光与光晕都是纯 CSS 实现，没有使用 Canvas / WebGL，且会跟随主题强调色（见下面"主题配色"一节）。

## 改文案与站点信息

界面上出现的每一句话都能在两个配置文件里找到，不需要去改组件代码：

- `src/config/site.ts` —— 站点"身份"：站名、一句话定位、首页大字标语（`homeSlogan`）、导航项、社交链接、线上域名（用于 sitemap 与 OG）、浏览器标签页图标（`icon`）
- `src/config/copy.ts` —— 界面"外壳"文案：按钮文字、区块标题、空状态提示、无障碍朗读文本，按页面/组件分组，改哪一句直接在对应分组里改就行

### 换浏览器标签页图标（favicon）

图片放进 **`public/images/`**，把 `site.ts` 的 `icon` 改成对应路径即可，svg / png / ico 都支持：

```ts
icon: '/images/my-icon.png',
```

**放 `public/images/` 而不是 `public/` 根目录**：`public/_headers` 给 `/images/*` 配了 30 天缓存，放根目录那条通配盖不到，图标每次导航都要回源校验一次。

**别把图标放回 `src/app/icon.*`** —— 那是 Next.js 的文件约定，只要那个文件存在就会自动接管并覆盖 `site.ts` 的配置。项目自带的默认图标在 `public/images/icon.svg`。

图标建议做成**正方形**（512×512 或 180×180）：浏览器会把它塞进方形槽位，非正方形的图会被拉伸变形。

另外标签页标题里名字后面的 `·` 来自 `tagline`：`tagline` 留空就只显示站名，不会留下孤零零的分隔点。

`site.ts` 里的 `url` **不用改代码** —— 它读的是环境变量 `NEXT_PUBLIC_SITE_URL`，在 Cloudflare 的构建变量里配置即可（当前值 `https://reikaakane.com`）。没配时退回 `http://localhost:3000`，故意用一个一眼能看出"还没配"的值。详见 `更新与发布.md` 第 4 节。

> 换域名时**光改 Cloudflare 的自定义域名不够**，这个构建变量也要一起改并重新构建，否则 `sitemap.xml`、`robots.txt` 和分享卡片还会指着旧域名。踩过一次，见 `更新与发布.md` 第 4 节。

## 主题配色

顶栏搜索框右边有个**画板按钮**（`ThemePicker` 组件），点开是一条可拖动的色相滑块：拉到最左是纯白，往右拖会连续过渡出颜色，选择存在浏览器 localStorage 里。每个页面都能调。

全站原本写死的粉紫蓝渐变（按钮、头像光环、卡片辉光）现在都是靠 `src/app/globals.css` 里的一套 `--accent-*` CSS 变量驱动，`ThemeProvider`（`src/providers/ThemeProvider.tsx`）在拖动滑块时用 HSL 现算颜色、直接写成 `<html>` 的内联样式覆盖默认值。想改默认主题色或者滑块的取值范围，改这两个文件。

## 换音乐

**把 mp3 丢进 `public/audio/` 就完事了，不用改任何配置。**

曲名、艺术家、专辑、时长、封面全部从 mp3 自带的 ID3 标签里读。封面会被自动抽成单独的图片文件存到 `public/images/covers/`，页面上显示的就是它。

这件事由 `scripts/sync-media.mjs` 完成，它挂在 `predev` / `prebuild` 上，跑 `npm run dev` 或 `npm run build` 时自动执行，产出 `src/data/music.json`。想手动跑一次：

```bash
npm run sync:media
```

几个注意点：

- **`src/data/music.json` 是生成的，别手改** —— 下次构建会被覆盖。
- **mp3 最好带内嵌封面**。没有的话不会报错，播放器会显示渐变占位块，脚本也会在输出里提示有几首缺封面。
- 曲目顺序按**文件名**排序。想指定顺序就给文件名加前缀，比如 `01 - xxx.mp3`。
- 曲目 id 由 ID3 标题生成。两首歌标题相同时会自动加 `-2` 后缀，不会撞车。

想把整批音频搬到 CDN，设一个环境变量即可，所有相对路径会自动加前缀：

```bash
NEXT_PUBLIC_AUDIO_BASE_URL=https://cdn.example.com
```

音乐没有独立页面 —— 它是常驻左下角的浮动播放条（`FloatingPlayer`），封面、进度、音量、上一首/播放/下一首/循环模式都在条上，点封面或箭头能展开歌曲列表。

封面唱片的旋转有两个细节：暂停时会**冻结在当前角度**而不是弹回水平，恢复播放从原地继续；收起态的小圆钮和展开态的封面虽然是两个不同的 DOM 节点，但共用同一份累计旋转时长，切换时角度完全对得上。实现在 `src/hooks/useDiscSpin.ts`，注释里写了为什么用 Web Animations API 而不是 CSS `animation-delay`。

播放器的结构：`<audio>` 只有一个，挂在根布局的 `PlayerProvider` 里。App Router 导航时根布局不卸载，所以**切换页面音乐不会中断**，浮动条也因此能一直跟着，不管在哪个页面都能操作。

### 自动播放

进页面自动开一首，在 `src/config/site.ts` 的 `player` 段配置：

```ts
player: {
  autoplay: true,              // 关掉就改成 false
  autoplayTrack: 'random',     // 'random' 每次随机；写数字 0 表示固定第一首
  defaultVolume: 0.5,          // 初始音量 0~1
}
```

**必须知道的浏览器限制**：Chrome / Safari / Firefox 都默认**禁止带声音的自动播放**，除非用户之前跟这个网站交互过（Chrome 会按访问频率给站点打分，常来的站会放行）。这不是代码能绕过去的，任何声称能强行自动播放的方案要么是静音播放、要么早就失效了。

所以这里的实现是**两段式**的：进页面先尝试播放，如果被浏览器拦下来就静默等着，在用户第一次点击 / 按键 / 触摸屏幕时立刻接上，全程不弹任何提示。实际效果是：你自己经常访问的话基本每次都能直接响；别人第一次访问，则会在他点页面上任何地方的瞬间响起来。

一个容易踩的坑已经处理掉了：如果用户的第一次点击正好就是播放器上的播放按钮，"解锁逻辑"和"按钮自己的处理"会各播一次，结果反而变成暂停。所以播放器的 DOM 上打了 `data-player-ui` 标记，解锁逻辑遇到落在播放器内部的点击会主动让路。

## 改关于页

`src/data/profile.json` —— 头像路径与自我介绍段落。头像换成自己的照片：放进 `public/images/`，改 JSON 里的 `avatar` 字段。

社交链接卡片（B 站 / X / GitHub / Email）读的是 `src/config/site.ts` 的 `social` 数组，改链接或者加/删平台都在那改。目前支持的平台图标在 `src/components/about/SocialIcons.tsx`（GitHub、B 站是手写 SVG，X 和 Email 用的是 lucide 图标），想加新平台就在那加一个图标、在 `site.ts` 的 `SocialPlatform` 类型里加个新值。

## 目录说明

```
content/blog/          文章（Markdown/MDX），与 src 同级，方便单独备份或迁移
public/images/         背景图、头像与文章封面
public/audio/          音乐文件

src/app/               路由与页面，只负责取数据和拼装组件
src/components/        组件
  ├── ui/              GlassCard / Badge / Container —— 视觉基元
  ├── layout/          Header / Footer / SearchBox
  ├── decor/           Background / Starfield —— 纯装饰层，可整体关闭
  ├── home/            Hero / Tagline / LatestPosts
  ├── blog/            文章卡片、筛选、正文渲染、目录、搜索高亮
  ├── music/           浮动播放条（FloatingPlayer）、歌单（TrackList）
  ├── theme/           ThemePicker —— 首页的主题色滑块
  └── about/           社交链接卡片与品牌图标
src/lib/               数据访问与工具函数
src/hooks/             useDiscSpin（唱片旋转同步）· useMediaQuery
src/config/            site.ts（身份）· theme.ts（视觉）· copy.ts（界面文案）
src/data/              music.json / profile.json
src/providers/         PlayerProvider（播放状态）· ThemeProvider（主题强调色）
```

## 数据层与未来扩展

`src/lib/posts.ts` 是**全站唯一读取文件系统的地方**。页面组件只调用它导出的函数，从不直接接触 `fs` 或 MDX 文件。

因此未来迁移到数据库（Supabase / PostgreSQL）时，只需要把这一个文件的实现换成 SQL 查询、返回相同的 `PostMeta` / `Post` 结构，`src/app/` 下的页面一行都不用改。

为了让这件事成立，代码里保持了三条纪律：

1. 所有导出函数都是 `async` —— 换成网络或数据库请求时签名不变
2. `date` 用 ISO 字符串而不是 `Date` 对象 —— 可安全跨 Server/Client 边界传递，也能直接进 JSON
3. `slug` 是主键，`draft` 字段现在就存在 —— 未来对应数据库的 `slug` 列与 `status` 列

同理，`src/components/blog/MDXContent.tsx` 接收的是"一段 MDX 源码字符串"而不是文件路径，所以正文改从数据库取回时它也不用改。

`next.config.ts` 刻意没有使用 `output: 'export'`：页面依然是构建期静态生成，但保留了标准 Next.js 运行时，将来新增 `/api/*` 路由或 ISR 时不需要更换部署方式。
