import type { Metadata, Viewport } from 'next';
import { Background } from '@/components/decor/Background';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { FloatingPlayer } from '@/components/music/FloatingPlayer';
import { ThemePicker } from '@/components/theme/ThemePicker';
import { siteConfig } from '@/config/site';
import { getPlaylist } from '@/lib/music';
import { PlayerProvider } from '@/providers/PlayerProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';
import './globals.css';

/**
 * 首页标题与分享卡片标题。
 *
 * 只有在 tagline 非空时才拼分隔符 —— 否则 tagline 留空会渲染成
 * "ReikaAkane · "，标签页上就挂着一个孤零零的点。
 */
const siteTitle = siteConfig.tagline
  ? `${siteConfig.name} · ${siteConfig.tagline}`
  : siteConfig.name;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteTitle,
    // 子页面用的是「页面名 · 站点名」，这个分隔符两边都有内容，照常保留
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  // favicon 走配置，换图标只改 site.ts，不用动代码。
  // 前提是 src/app/ 下没有 icon.* 文件 —— 那个文件约定的优先级更高，会盖掉这里
  icons: { icon: siteConfig.icon },
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.author,
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: siteTitle,
    description: siteConfig.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#ffe8f2',
  colorScheme: 'light',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // 歌单在服务端读取后传给 Provider。
  // <audio> 挂在这一层，App Router 导航时根布局不卸载，所以跨页面播放不会中断。
  const playlist = await getPlaylist();

  return (
    <html lang="zh-CN">
      <body className="relative flex min-h-dvh flex-col">
        <Background />
        <ThemeProvider>
          <PlayerProvider tracks={playlist.tracks}>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <FloatingPlayer />
            <ThemePicker />
          </PlayerProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
