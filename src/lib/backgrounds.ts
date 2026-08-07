import backgroundData from '@/data/backgrounds.json';

/* ==========================================================================
   背景图数据层
   --------------------------------------------------------------------------
   与 posts.ts / music.ts 同样的思路：组件只调这里的函数，不直接 import JSON。

   backgrounds.json 是 scripts/sync-media.mjs 在构建前扫描
   public/images/backgrounds/ 自动生成的 —— 换背景只需往那个目录丢图片，
   不用改任何配置文件。
   ========================================================================== */

/** 候选背景图的 URL 路径列表，已按文件名排序 */
export function getBackgroundImages(): string[] {
  return backgroundData.images;
}
