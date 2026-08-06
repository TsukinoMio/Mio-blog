/**
 * 站点基础信息 —— 改这一个文件就能换掉全站的名字、简介与导航。
 */

export interface NavItem {
  label: string;
  href: string;
}

/** 支持的社交平台，决定关于页用哪个图标（见 components/about/SocialIcons.tsx） */
export type SocialPlatform = 'bilibili' | 'x' | 'github' | 'email';

export interface SocialLink {
  platform: SocialPlatform;
  label: string;
  href: string;
}

export const siteConfig = {
  /** 站点名（显示在 Header 与浏览器标题） */
  name: 'ReikaAkane',
  /**
   * 副标题 / 站点定位。
   * 留空就只显示站点名 —— 浏览器标题和页脚都会跳过分隔符，不会留下孤零零的点。
   */
  tagline: '',
  /**
   * 浏览器标签页左边的小图标（favicon）。
   *
   * 换图标：把新图片放进 public/（比如 public/images/my-icon.png），
   * 再把这里改成对应路径即可，svg / png / ico 都行，不用改代码。
   *
   * 注意：**不要**把图标放回 src/app/icon.svg —— 那是 Next.js 的文件约定，
   * 一旦那个文件存在就会自动接管、覆盖这里的配置，等于这个字段失效。
   */
  icon: '/icon.svg',
  /** 作者名（用于 SEO 与版权信息） */
  author: 'ReikaAkane',
  /** 一句话自我定位，显示在关于页头像旁边 */
  role: 'オタク / アイマス P / Computer Graphics',
  /** 首页正中央的大字标语（src/components/home/Tagline.tsx） */
  homeSlogan: 'これからも アイドル!!!!!!',
  /** 站点描述（SEO，会进搜索结果和分享卡片，写一句完整的话效果最好） */
  description: 'ReikaAkane',
  /**
   * 线上地址，用于 sitemap 和分享卡片的图片链接。
   *
   * 部署时设环境变量 NEXT_PUBLIC_SITE_URL=https://你的域名 即可，不用改代码。
   * 没设的时候退回 localhost —— 故意用一个一眼就知道"还没配"的值，
   * 免得错把占位域名当成真的发出去。
   */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',

  /** 主导航。音乐不在这里 —— 它是常驻左下角的浮动播放条，随处可用 */
  nav: [
    { label: '首页', href: '/' },
    { label: '博客', href: '/blog' },
    { label: '关于', href: '/about' },
  ] satisfies NavItem[],

  /**
   * 音乐播放器行为。歌单本身在 src/data/music.json。
   *
   * 关于自动播放的现实情况：Chrome / Safari / Firefox 都默认禁止"带声音的自动播放"，
   * 除非用户之前跟这个网站交互过（Chrome 会按访问频率给站点打分，常来的站会放行）。
   * 所以这里的实现是：进页面先尝试自动播放，被浏览器拦下来就静默等待，
   * 在用户第一次点击 / 按键 / 触摸屏幕时立刻接上，不弹任何提示。
   */
  player: {
    /** 是否在进入页面时自动开始播放 */
    autoplay: true,
    /** 自动播放选哪首：'random' 每次随机，或者写数字 0 表示第一首、1 第二首…… */
    autoplayTrack: 'random' as 'random' | number,
    /** 初始音量 0~1。自动播放时音量太大会吓到人，建议比手动播放低一些 */
    defaultVolume: 0.5,
  },

  /**
   * 社交链接，显示在关于页底部。留空数组即可整体隐藏。
   *
   * 这里只放**真实可用**的链接 —— 占位地址（your_handle 之类）会变成死链，
   * 甚至可能恰好指到别人的账号上，所以宁可先不放。
   * 想加回来把对应那行取消注释、换成自己的地址即可，
   * platform 只能是 'bilibili' | 'x' | 'github' | 'email'（见上面的类型定义，
   * 想加新平台需要同时改 SocialPlatform 类型和 components/about/SocialLinks.tsx 的图标表）。
   */
  social: [
    {
      platform: 'bilibili',
      label: 'B 站',
      href: 'https://space.bilibili.com/555982840',
    },
    // { platform: 'x', label: 'X', href: 'https://x.com/你的用户名' },
    // { platform: 'github', label: 'GitHub', href: 'https://github.com/你的用户名' },
    // { platform: 'email', label: 'Email', href: 'mailto:你的邮箱@example.com' },
  ] satisfies SocialLink[],
} as const;

export type SiteConfig = typeof siteConfig;
