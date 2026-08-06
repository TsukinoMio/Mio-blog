'use client';

import { usePathname } from 'next/navigation';

/**
 * 渐变遮罩：保证长文字页面（博客、关于）在任何背景图下都可读。
 * 首页文字不多、卡片自带毛玻璃底，所以首页不叠加这层，背景图能更清楚地露出来。
 *
 * 只有这一小块需要知道"当前在哪个页面"，所以单独拆成客户端组件 ——
 * Background 的其余部分（光晕、星光）继续保持服务端渲染，不产生多余的客户端 JS。
 */
export function OverlayGradient({ overlay }: { overlay: string }) {
  const pathname = usePathname();
  if (pathname === '/') return null;

  return <div className="absolute inset-0" style={{ background: overlay }} />;
}
