import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * 刻意不使用 output: 'export'。
   * 博客页面依然是构建期静态生成（SSG），但保留标准 Next.js 运行时，
   * 未来新增 Route Handler（/api/*）、ISR、数据库读写时无需改动部署方式。
   */
  images: {
    formats: ['image/avif', 'image/webp'],
    /**
     * 允许 next/image 优化的外部图片来源。
     *
     * 站主自建的图床（Obsidian 的 cf-imageBed 插件直接往这里传截图）。
     * 不加这条的话，页面能渲染出来，但每个 <img> 指向的
     * /_next/image?url=https://img.reikaakane.com/... 会返回 400，
     * 表现为图全裂 —— 而且 `next build` 不会报任何错，很难发现。
     *
     * 刻意限定到 pathname，不写成整个域名通配：
     * 万一图床以后挂了别的服务，也不会顺带变成任人调用的图片代理。
     *
     * 注意 ADR-10 依然成立：只有**文章配图**走图床，背景图留本地。
     */
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.reikaakane.com',
        pathname: '/file/**',
      },
    ],
  },
};

export default nextConfig;
