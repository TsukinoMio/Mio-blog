'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Palette, X } from 'lucide-react';
import { copy } from '@/config/copy';
import { cn } from '@/lib/utils';
import { useTheme } from '@/providers/ThemeProvider';

/** 滑块轨道的彩虹预览色，纯装饰，和实际算出的主题色无关 */
const TRACK_GRADIENT =
  'linear-gradient(to right, #ffffff 0%, #ffffff 4%, #ff5c5c 12%, #ffb04d 24%, #f4e04d 36%, #7bdc7b 48%, #4dd0e1 60%, #6c8cff 72%, #b06cff 84%, #ff6cc9 96%, #ff5c5c 100%)';

/**
 * 主题配色面板 —— 只在首页出现，位置在最左边。
 * 和左下角的 FloatingPlayer 用同一套交互：默认收起成一个圆按钮，
 * 点开变成完整面板，点面板外任意空白处会收起。
 * 面板里是一条可拖动的色相滑块，最左端是纯白，向右拖会连续过渡出颜色。
 */
export function ThemePicker() {
  const pathname = usePathname();
  const [panelOpen, setPanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { hue, setHue } = useTheme();

  useEffect(() => {
    if (!panelOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setPanelOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [panelOpen]);

  if (pathname !== '/') return null;

  if (!panelOpen) {
    return (
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        aria-label={copy.theme.expand}
        className={cn(
          'animate-rise fixed top-1/2 left-4 z-40 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full',
          'border-2 border-white/80 bg-accent-gradient text-accent-foreground shadow-glow-accent',
          'transition-transform duration-300 ease-idol hover:scale-105 active:scale-95',
        )}
      >
        <Palette size={22} />
      </button>
    );
  }

  return (
    <div ref={panelRef} className="fixed top-1/2 left-4 z-40 w-64 -translate-y-1/2">
      <div className="animate-rise overflow-hidden rounded-card border border-white/70 bg-white/85 p-4 shadow-lift backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-800">
            <Palette size={15} />
            {copy.theme.panelTitle}
          </span>
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
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
          style={{ backgroundImage: 'linear-gradient(135deg, var(--accent-strong-1), var(--accent-strong-2))' }}
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
    </div>
  );
}
