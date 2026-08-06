import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import incrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache';

/**
 * OpenNext 的 Cloudflare 适配配置。
 *
 * 【为什么必须配 incrementalCache —— 踩过的坑】
 * OpenNext 的 incremental cache 不只服务 ISR，**构建期预渲染出来的 SSG 页面也是
 * 存在这里、并从这里取的**。不配的话默认是空实现，每次请求都是 cache miss，
 * Worker 会当场重新执行路由代码 —— 而 Cloudflare Workers 没有文件系统，
 * src/lib/posts.ts 的 fs 一篇文章都读不到，结果就是：
 *     /blog/<slug>        → 404
 *     /search-index.json  → []
 *     /sitemap.xml        → 只剩 3 条静态路由
 *     /blog 与首页         → 列表空白
 * 当时误把部署日志里的 "Incremental cache does not need populating" 当成
 * "本站不需要缓存"，其实它的意思是"没有配置缓存所以无需填充"。
 *
 * 【为什么选 static-assets 这个实现】
 * 官方注释原文：should only be used for applications that do NOT want
 * revalidation and ONLY want to serve prerendered data —— 正是本站的情况。
 * 它直接从 Workers Assets 读预渲染产物，不需要额外开 KV / R2，不产生费用。
 * 将来真要上 ISR / on-demand revalidate，再换成 kv 或 r2 的实现：
 * https://opennext.js.org/cloudflare/caching
 */
export default defineCloudflareConfig({
  incrementalCache,
});
