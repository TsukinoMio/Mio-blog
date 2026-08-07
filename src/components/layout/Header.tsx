'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { SearchBox } from '@/components/layout/SearchBox';
import { ThemePicker } from '@/components/theme/ThemePicker';
import { copy } from '@/config/copy';
import { siteConfig } from '@/config/site';
import { cn } from '@/lib/utils';

/** 顶部导航。整站唯一需要客户端状态的布局组件（滚动感知 + 移动端抽屉） */
export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-500 ease-idol',
        scrolled
          ? 'border-b border-white/60 bg-white/65 shadow-soft backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <span
            aria-hidden
            className="h-2.5 w-2.5 rounded-full bg-accent-gradient shadow-glow-accent transition-transform duration-500 ease-idol group-hover:scale-125"
          />
          <span className="text-lg font-bold tracking-wide text-gradient">{siteConfig.name}</span>
        </Link>

        <div className="flex items-center gap-1">
          {/* 桌面端导航 */}
          <ul className="hidden items-center gap-1 sm:flex">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'relative rounded-pill px-4 py-2 text-sm font-medium transition-all duration-300 ease-idol',
                    isActive(item.href)
                      ? 'text-sakura-700'
                      : 'text-ink-600 hover:text-sakura-600',
                  )}
                >
                  {item.label}
                  <span
                    aria-hidden
                    className={cn(
                      'absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-accent-gradient-r transition-transform duration-400 ease-idol',
                      isActive(item.href) ? 'scale-x-100' : 'scale-x-0',
                    )}
                  />
                </Link>
              </li>
            ))}
          </ul>

          {/* 搜索：紧挨在导航（最后一项是"关于"）右边 */}
          <SearchBox />

          {/* 主题配色：搜索右边的画板按钮 */}
          <ThemePicker />

          {/* 移动端开关 */}
          <button
            type="button"
            aria-label={menuOpen ? copy.header.closeMenu : copy.header.openMenu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/60 text-ink-700 backdrop-blur-md transition-colors hover:text-sakura-600 sm:hidden"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* 移动端抽屉 */}
      <div
        className={cn(
          'overflow-hidden border-white/60 bg-white/80 backdrop-blur-xl transition-[max-height,opacity] duration-500 ease-idol sm:hidden',
          menuOpen ? 'max-h-72 border-b opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <ul className="flex flex-col gap-1 px-5 py-4">
          {siteConfig.nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'block rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
                  isActive(item.href)
                    ? 'bg-sakura-100/80 text-sakura-700'
                    : 'text-ink-600 hover:bg-white/70',
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
