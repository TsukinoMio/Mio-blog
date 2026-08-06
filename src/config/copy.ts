/**
 * 全站界面文案 —— 按钮、区块标题、空状态、无障碍提示这类"UI chrome"文字
 * 都集中在这里。想改文案（比如把"最新文章"换成"Blog"）直接改这个文件，
 * 不需要去组件代码里找。
 *
 * 不在这里的文字（因为它们本质是"内容"或"身份"，不是 UI 外壳）：
 * - 站点名 / 一句话定位 / 首页大字标语 → config/site.ts
 * - 主题颜色、背景图 → config/theme.ts
 * - 文章正文 → content/blog/*.mdx
 * - 专辑信息、个人简介、社交链接文案 → data/*.json、config/site.ts
 * - 分类、标签的具体名字 → 来自你写的文章 frontmatter，不是写死的
 *
 * 按函数取值的字段（比如 `filterResultCount`）是因为文案里嵌了数字，
 * 用法和普通字符串字段一样，调用时传参即可：`copy.blog.filterResultCount(3)`。
 */

export const copy = {
  /** 跨页面复用的小片段 */
  common: {
    /** 头像的 alt 文本，name 是作者名（siteConfig.author） */
    avatarAlt: (name: string) => `${name} 的头像`,
    /** 关于页 SEO 描述，name 是作者名 */
    aboutDescription: (name: string) => `${name} 的个人介绍。`,
  },

  /** 顶部导航栏（src/components/layout/Header.tsx） */
  header: {
    /** 移动端汉堡菜单按钮的无障碍提示，菜单关闭时显示 */
    openMenu: '打开菜单',
    /** 菜单展开时显示 */
    closeMenu: '关闭菜单',
  },

  /** 博客搜索（src/components/layout/SearchBox.tsx） */
  search: {
    /** 放大镜按钮的无障碍提示 */
    open: '搜索文章',
    /** 展开后关闭搜索的提示 */
    close: '关闭搜索',
    /** 输入框里的占位提示 */
    placeholder: '搜索文章…',
    /** 正在加载搜索索引 */
    loading: '正在准备搜索…',
    /** 索引加载失败 */
    error: '搜索索引加载失败，刷新页面再试试',
    /** 还没输入任何关键词时的提示 */
    hint: '输入关键词，会同时搜标题、摘要和正文',
    /** 只输了一个字时的提示（太短了搜不出有意义的结果） */
    tooShort: '再多输入一个字试试',
    /** 没有匹配结果，query 是用户输入的关键词 */
    empty: (query: string) => `没有找到和「${query}」相关的文章`,
    /** 结果条数，count 是命中的文章数 */
    resultCount: (count: number) => `${count} 篇相关文章`,
    /** 单篇文章里命中了多少处，显示在标题右边 */
    matchCount: (count: number) => `${count} 处`,
    /** 命中太多没全列出来时的提示，count 是没列出来的处数 */
    moreMatches: (count: number) => `还有 ${count} 处未列出`,
    /** 结果条目上标注命中位置的小标签 */
    fieldLabel: {
      title: '标题',
      summary: '摘要',
      content: '正文',
      tags: '标签',
      category: '分类',
    },
  },

  /** 首页（src/components/home/*、src/app/page.tsx） */
  home: {
    /** 最新文章区块标题 */
    latestPostsTitle: '最新动态',
    /** 最新文章区块副标题 */
    latestPostsSubtitle: '摸了',
    /** "查看全部"链接文字 */
    viewAllPosts: 'ALL',
  },

  /** 博客列表页与文章详情页（src/app/blog/**、src/components/blog/*） */
  blog: {
    /** 列表页大标题 */
    pageTitle: '博客',
    /** 列表页标题下的一句话说明 */
    pageDescription: '个人笔记',
    /** 一篇文章都没有时显示的提示 */
    emptyState: '还没有文章。在 content/blog/ 里新建一个 .mdx 文件就能发布第一篇 ✨',
    /** 分类筛选栏的行首标签 */
    filterCategoryLabel: '分类',
    /** 标签筛选栏的行首标签 */
    filterTagLabel: '标签',
    /** "不筛选、显示全部"那个按钮的文字 */
    filterAllCategories: '全部',
    /** 清除已选筛选条件的按钮 */
    filterClear: '清除筛选',
    /**
     * 当前筛选结果条数，拆成前后两半是因为中间的数字要单独套样式高亮，
     * 渲染出来是"{filterResultPrefix} 3 {filterResultSuffix}"
     */
    filterResultPrefix: '共',
    filterResultSuffix: '篇文章',
    /** 筛选后一篇文章都没有时显示的提示 */
    filterNoResults: '这个筛选下还没有文章，换个条件看看吧 ✨',
    /** 文章卡片右上角的草稿角标（只在开发环境会看到，因为生产构建会跳过草稿） */
    draftBadge: '草稿',
    /** 文章卡片上的阅读时长，minutes 是分钟数 */
    readingTime: (minutes: number) => `${minutes} 分钟`,
    /** 文章详情页头部的阅读时长（带"约"字，语气更随意） */
    readingTimeApprox: (minutes: number) => `约 ${minutes} 分钟`,
    /** 文章详情页顶部"返回列表"链接 */
    backToList: '返回文章列表',
    /** 上下篇导航：更早的一篇 */
    olderPost: '更早的一篇',
    /** 上下篇导航：更新的一篇 */
    newerPost: '更新的一篇',
    /** 相关文章区块标题 */
    relatedPosts: '你可能也想读',
    /** 访问了不存在的文章 slug 时，浏览器标签页标题 */
    postNotFound: '文章不存在',
  },

  /** 关于页（src/app/about/page.tsx、src/components/about/*） */
  about: {
    /** 浏览器标签页标题（页面本身没有单独的"关于"大标题，头像旁边直接显示的是站点名） */
    metaTitle: '关于',
    /** 社交链接区块标题 */
    socialTitle: '喜欢您来',
    /** 社交链接区块副标题 */
    socialSubtitle: '其他能找到我的地方',
  },

  /** 浮动音乐播放器（src/components/music/*） */
  music: {
    /** 还没选中任何一首歌时，播放条上显示的占位标题 */
    noTrackTitle: '选一首歌吧',
    /** 还没选中任何一首歌时，播放条上显示的副标题，count 是歌单里的总曲目数 */
    tracksAvailable: (count: number) => `${count} 首歌在这里`,
    /** 收起态圆按钮的无障碍提示 */
    expandPlayer: '展开播放器',
    /** 展开态里点封面收起的无障碍提示 */
    collapsePlayer: '收起播放器',
    /** 展开歌曲列表 */
    expandList: '展开歌曲列表',
    /** 收起歌曲列表 */
    collapseList: '收起歌曲列表',
    /** 播放 / 暂停按钮 */
    play: '播放',
    pause: '暂停',
    /** 单曲播放中，歌单里那一行的无障碍提示，title 是歌名 */
    playTrackLabel: (title: string) => `播放 ${title}`,
    pauseTrackLabel: (title: string) => `暂停 ${title}`,
    /** 上一首 / 下一首 */
    prevTrack: '上一首',
    nextTrack: '下一首',
    /** 静音 / 取消静音 */
    mute: '静音',
    unmute: '取消静音',
    /** 三种循环模式的提示文字（按钮上的 title/aria-label） */
    repeatOne: '单曲循环',
    repeatAll: '列表循环',
    repeatOff: '不循环',
    /** 音量滑块的无障碍标签 */
    volumeLabel: '音量',
    /** 播放进度滑块的无障碍标签 */
    progressLabel: '播放进度',
  },

  /** 文章目录面板（src/components/blog/ArticleToc.tsx，只在文章页出现） */
  toc: {
    /** 面板标题 */
    panelTitle: '目录',
    /** 窄屏收起态圆按钮的无障碍提示 */
    expand: '展开文章目录',
    /** 窄屏展开态关闭按钮的无障碍提示 */
    collapse: '收起文章目录',
    /** 展开某个章节下的子标题，title 是该章节名 */
    expandSection: (title: string) => `展开「${title}」的子标题`,
    /** 收起某个章节下的子标题 */
    collapseSection: (title: string) => `收起「${title}」的子标题`,
  },

  /** 主题配色面板（src/components/theme/ThemePicker.tsx，只在首页出现） */
  theme: {
    /** 面板标题 */
    panelTitle: '主题配色',
    /** 收起态圆按钮的无障碍提示 */
    expand: '展开主题配色',
    /** 展开态关闭按钮的无障碍提示 */
    collapse: '收起主题配色',
    /** 色相滑块的无障碍标签 */
    sliderLabel: '拖动调节主题颜色',
    /** 滑块拉到最左（0）时，色相说明文字显示这个 */
    whiteLabel: '纯白',
    /** 滑块不在最左时，显示当前色相角度，deg 是 0~360 的整数 */
    hueLabel: (deg: number) => `色相 ${deg}°`,
  },

  /** 404 页（src/app/not-found.tsx） */
  notFound: {
    code: '404',
    title: '这里什么都没有',
    description: '啊嘞嘞，出错了。',
    cta: '回首页看看',
  },
} as const;

export type Copy = typeof copy;
