import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /**
   * 刻意不使用 output: 'export'。
   * 博客页面依然是构建期静态生成（SSG），但保留标准 Next.js 运行时，
   * 未来新增 Route Handler（/api/*）、ISR、数据库读写时无需改动部署方式。
   */
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default nextConfig;
