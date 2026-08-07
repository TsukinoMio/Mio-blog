'use client';

import { useEffect, useRef, useState } from 'react';
import { Palette, X } from 'lucide-react';
import { copy } from '@/config/copy';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/ThemeProvider';

/** 滑块轨道的彩虹预览色，纯装饰，和实际算出的主题色无关 */
const TRACK_GRADIENT =
  'linear-gradient(to right, #ffffff 0%, #ffffff 4%, #ff5c5c 12%, #ffb04d 24%, #f4e04d 36%, #7bdc7b 48%, #4dd0e1 60%, #6c8cff 72%, #b06cff 84%, #ff6cc9 96%, #ff5c5c 100%)';

/**
 * 主题配色 —— 顶栏里搜索框右边的画板按钮，点开是一个下拉面板。
 *
 * 原先是首页左侧的浮动圆钮（只在首页出现），现在收进 Header，好处是
 * 每个页面都能调，也不再和左下角的播放器抢屏幕左侧的空间。
 * 交互与 SearchBox 一致：点按钮展开、点面板外或按 Esc 收起。
 */
export function ThemePicker() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { hue, setHue } = useTheme();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative flex items-center">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? copy.theme.collapse : copy.theme.expand}
        aria-expanded={open}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full text-ink-600',
          'transition-all duration-300 ease-idol hover:bg-white/70 hover:text-sakura-600',
          open && 'bg-white/70 text-sakura-600',
        )}
      >
        <Palette size={17} />
      </button>

      {open && (
        <div
          className={cn(
            'animate-rise z-50 rounded-card',
            // 窄屏：按钮右边还有汉堡菜单占位，按 right-0 定位会顶出屏幕，
            // 所以相对视口铺开，挂在 Header 下方（与 SearchBox 的结果面板同一套做法）
            'max-sm:fixed max-sm:inset-x-4 max-sm:top-[4.5rem]',
            // 宽屏：正常吊在按钮下面
            'sm:absolute sm:top-full sm:right-0 sm:mt-2 sm:w-64',
            'border border-white/70 bg-white/90 p-4 shadow-lift backdrop-blur-xl',
          )}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-800">
              <Palette size={15} />
              {copy.theme.panelTitle}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={copy.theme.collapse}
              className="flex h-6 w-6 items-center justify-center rounded-full text-ink-400 transition-colors hover:text-sakura-600"
            >
              <X size={14} />
            </button>
          </div>

          {/* 预览色块 */}
          <div
            aria-hidden
            className="mt-4 h-10 rounded-2xl border border-white/70 shadow-inner"
            style={{
              backgroundImage:
                'linear-gradient(135deg, var(--accent-strong-1), var(--accent-strong-2))',
            }}
          />

          {/* 色相滑块 */}
          <div className="mt-4">
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={hue}
              onChange={(event) => setHue(Number(event.target.value))}
              aria-label={copy.theme.sliderLabel}
              style={{ backgroundImage: TRACK_GRADIENT }}
              className={cn(
                'h-3 w-full cursor-pointer appearance-none rounded-pill outline-none',
                'border border-white/60 shadow-inner',
                '[&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5',
                '[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full',
                '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-ink-800',
                '[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:shadow-lift',
                '[&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full',
                '[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-ink-800 [&::-moz-range-thumb]:bg-white',
              )}
            />
            <p className="mt-2 text-center text-[11px] text-ink-400">
              {hue === 0 ? copy.theme.whiteLabel : copy.theme.hueLabel(Math.round((hue / 100) * 360))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
