'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'theme-hue';

/** 0 表示纯白（默认）；1~100 线性映射到 0~360° 色相 */
export type Hue = number;

interface ThemeContextValue {
  hue: Hue;
  setHue: (hue: Hue) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme 必须在 <ThemeProvider> 内部使用');
  return context;
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

/**
 * 把 0~100 的滑块值换算成一整套 --accent-* CSS 变量并写进 <html> 的内联样式。
 * 内联样式的优先级天然高于 globals.css 里的 :root 默认值，所以不需要
 * data-accent 属性或者一堆预设的 CSS 规则 —— 拖动滑块时颜色是连续算出来的。
 */
function applyHue(hue: Hue) {
  const root = document.documentElement.style;

  if (hue <= 0) {
    root.setProperty('--accent-1', '#ffffff');
    root.setProperty('--accent-2', '#ffffff');
    root.setProperty('--accent-3', '#ffffff');
    root.setProperty('--accent-strong-1', '#ffffff');
    root.setProperty('--accent-strong-2', '#f2f0f6');
    root.setProperty('--accent-foreground', '#4a3856');
    root.setProperty('--accent-solid', '#c7c3d6');
    root.setProperty('--accent-shadow', 'rgba(20, 16, 30, 0.22)');
    root.setProperty('--accent-border', 'rgba(20, 16, 30, 0.14)');
    return;
  }

  const h1 = (hue / 100) * 360;
  const h2 = (h1 + 42) % 360;
  const h3 = (h1 - 42 + 360) % 360;

  root.setProperty('--accent-1', hslToHex(h1, 88, 74));
  root.setProperty('--accent-2', hslToHex(h2, 82, 72));
  root.setProperty('--accent-3', hslToHex(h3, 82, 78));
  root.setProperty('--accent-strong-1', hslToHex(h1, 88, 60));
  root.setProperty('--accent-strong-2', hslToHex(h2, 78, 55));
  root.setProperty('--accent-foreground', '#ffffff');
  root.setProperty('--accent-solid', hslToHex(h1, 82, 58));
  root.setProperty('--accent-shadow', `hsla(${h1.toFixed(1)}, 82%, 58%, 0.42)`);
  root.setProperty('--accent-border', hslToHex(h1, 80, 86));
}

/**
 * 全站主题强调色。默认纯白，通过左侧的可拖动滑块连续调节色相（0~360°）。
 *
 * 选择结果存进 localStorage；挂载后才读取并应用，避免服务端渲染的白色默认值
 * 和客户端已保存的选择不一致导致 hydration 报错。
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [hue, setHueState] = useState<Hue>(0);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed = saved === null ? NaN : Number(saved);
    if (Number.isFinite(parsed)) {
      // localStorage 只能在挂载后读取，这是标准的"客户端专属状态恢复"写法
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 见上
      setHueState(Math.max(0, Math.min(100, parsed)));
    }
  }, []);

  useEffect(() => {
    applyHue(hue);
    window.localStorage.setItem(STORAGE_KEY, String(hue));
  }, [hue]);

  const setHue = useCallback((value: Hue) => {
    setHueState(Math.max(0, Math.min(100, value)));
  }, []);

  return <ThemeContext.Provider value={{ hue, setHue }}>{children}</ThemeContext.Provider>;
}
