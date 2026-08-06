import { defineCloudflareConfig } from '@opennextjs/cloudflare';

/**
 * OpenNext 的 Cloudflare 适配配置。
 *
 * 刻意保持空配置（不挂增量缓存 / tag 缓存）：本站所有页面都是构建期静态生成，
 * 没有 ISR、没有 on-demand revalidate，缓存层挂上去也是空跑。
 * 上一次部署日志里的 "Incremental cache does not need populating" /
 * "Tag cache does not need populating" 已经实证了这一点。
 *
 * 将来真加了 ISR 或 revalidateTag，再按官方文档挂 KV / R2 缓存即可：
 * https://opennext.js.org/cloudflare/caching
 */
export default defineCloudflareConfig();
