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

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} · ${siteConfig.tagline}`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  authors: [{ name: siteConfig.author }],
  creator: siteConfig.author,
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} · ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} · ${siteConfig.tagline}`,
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
