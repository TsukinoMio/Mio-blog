/**
 * 视觉主题配置 —— 氛围特效与背景观感的开关处。
 *
 * 【换背景不用改这个文件】
 * 把图片丢进 public/images/backgrounds/ 就行，构建前 scripts/sync-media.mjs
 * 会自动扫描该目录、生成 src/data/backgrounds.json。
 * 每次打开网站从中随机挑一张（客户端随机，所以每次刷新都可能不一样）；
 * 只放一张就等于固定背景；目录留空则只保留渐变、不加载图片。
 */

export const themeConfig = {
  background: {
    /** 背景图不透明度（0~1）。图片太抢眼时调低 */
    imageOpacity: 0.55,
    /** 背景图模糊半径（px），0 表示不模糊 */
    imageBlur: 0,
    /**
     * 背景是否固定（滚动时不动）。
     * true = position: fixed，false = position: absolute（跟着页面一起滚）。
     *
     * 注：这里没有"移动端自动降级"的逻辑（旧注释写过，与代码不符，已更正）。
     * 手机上曾出现滑动时背景抽动，起因不是 fixed 本身，而是背景层用 inset-0
     * 取动态视口高度，详见 components/decor/Background.tsx 的注释。
     */
    fixed: true,
    /** 覆盖在图片之上的遮罩，保证文字始终可读。纯白/中性色，不带任何色相 */
    overlay:
      'linear-gradient(160deg, rgba(255,255,255,0.92) 0%, rgba(250,250,252,0.88) 45%, rgba(255,255,255,0.92) 100%)',
  },

  /** 氛围特效开关（全部为纯 CSS 实现，不使用 Canvas / WebGL） */
  effects: {
    /** 星光点点 */
    starfield: true,
    /** 漂浮的柔光球 */
    glowOrbs: true,
  },

  /** 星星数量。移动端会自动减半 */
  starCount: 60,
} as const;

export type ThemeConfig = typeof themeConfig;
