'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * 订阅一个 CSS 媒体查询。
 *
 * 用 useSyncExternalStore 而不是 useState + useEffect：
 * 后者要在 effect 里 setState 才能拿到首次结果，而这个 API 天生就是
 * "从外部数据源读当前值"的语义，服务端渲染时统一返回 false，不会有水合不一致。
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
