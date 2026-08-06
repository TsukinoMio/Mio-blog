'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRight, List, X } from 'lucide-react';
import { copy } from '@/config/copy';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Heading } from '@/lib/toc';
import { cn } from '@/lib/utils';

/**
 * 文章目录 —— 只在文章页出现。
 *
 * 宽屏（≥1280px）：贴着正文右侧常驻展开，不需要点开，也不会被点空白收起。
 *   正文是 max-w-3xl（48rem）居中、左右各 2rem 内边距，
 *   所以卡片右边缘落在 50% + 22rem，面板就从这里往右让开一点摆。
 * 窄屏：正文两侧没有富余空间放常驻面板，退回成和播放器一样的圆按钮，点开才显示。
 *
 * 目录数据是构建期从 MDX 源码里抽出来的（lib/toc.ts），
 * 这里负责渲染成可折叠的树 + 跟踪当前读到哪一节。
 */
export function ArticleToc({ headings }: { headings: Heading[] }) {
  const isWideScreen = useMediaQuery('(min-width: 1280px)');
  const [panelOpen, setPanelOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  /** 被手动折叠起来的章节 id */
  const [collapsedIds, setCollapsedIds] = useState<ReadonlySet<string>>(() => new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  /** 宽屏常驻展开；窄屏才看点没点开 */
  const expanded = isWideScreen || panelOpen;

  /**
   * 把扁平的标题列表补上层级信息：
   * - ancestors：所有上级章节的 id，用来判断"是不是被某个折叠的上级藏起来了"
   * - hasChildren：下一条比自己深，就说明它有子标题，需要显示折叠箭头
   */
  const items = useMemo(() => {
    const stack: string[] = [];

    return headings.map((heading, index) => {
      // 只保留比自己浅的那些上级
      stack.length = heading.depth;
      const ancestors = [...stack];
      stack[heading.depth] = heading.id;

      return {
        ...heading,
        ancestors,
        hasChildren: (headings[index + 1]?.depth ?? -1) > heading.depth,
      };
    });
  }, [headings]);

  /* 点面板外收起（只有窄屏的浮层需要这个行为） */
  useEffect(() => {
    if (isWideScreen || !panelOpen) return;

    function handlePointerDown(event: PointerEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setPanelOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [isWideScreen, panelOpen]);

  /* 跟踪当前读到哪一节：取"最后一个已经滚过视口上沿参考线的标题" */
  useEffect(() => {
    if (headings.length === 0) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      // 参考线放在视口顶部往下 120px 处，大约是 Header 下方一点，
      // 这样标题刚滚到屏幕上方时就会被判定为"当前章节"
      const line = 120;
      const viewportHeight = window.innerHeight;
      const doc = document.documentElement;

      let current: string | null = null;
      /** 最后一个已经进入视口的标题，给下面的"读到底了"分支用 */
      let lastVisible: string | null = null;

      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (!element) continue;
        const top = element.getBoundingClientRect().top;
        if (top < viewportHeight) lastVisible = heading.id;
        if (top <= line) current = heading.id;
      }

      // 文章末尾的章节后面往往还跟着上下篇、相关文章、页脚，
      // 页面滚到底它也够不到参考线，会永远高亮不了。
      // 所以滚到底时直接认定"当前在最后一个能看到的章节"。
      const scrollable = doc.scrollHeight - viewportHeight > 40;
      const atBottom = scrollable && window.scrollY + viewportHeight >= doc.scrollHeight - 4;
      if (atBottom && lastVisible) current = lastVisible;

      // 还没滚到第一个标题时，默认高亮第一条，避免目录里什么都没选中
      setActiveId(current ?? headings[0]?.id ?? null);
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [headings]);

  /**
   * 当前章节被折叠起来看不见时，改为高亮"最浅的那个折叠上级"，
   * 这样读者至少知道自己在哪一大节里，而不是整个目录都没高亮。
   * 注意不要反过来自动展开 —— 那会跟用户手动折叠的意图打架。
   */
  const highlightId = useMemo(() => {
    const active = items.find((item) => item.id === activeId);
    if (!active) return activeId;
    return active.ancestors.find((id) => collapsedIds.has(id)) ?? activeId;
  }, [items, activeId, collapsedIds]);

  const toggleSection = (id: string) => {
    setCollapsedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // 只有一个标题时没有目录的必要
  if (headings.length < 2) return null;

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        aria-label={copy.toc.expand}
        className={cn(
          'animate-rise fixed top-1/2 right-4 z-40 flex h-14 w-14 -translate-y-1/2 items-center justify-center rounded-full',
          'border-2 border-white/80 bg-accent-gradient text-accent-foreground shadow-glow-accent',
          'transition-transform duration-300 ease-idol hover:scale-105 active:scale-95',
        )}
      >
        <List size={22} />
      </button>
    );
  }

  return (
    <div
      ref={panelRef}
      className={cn(
        'fixed top-1/2 z-40 -translate-y-1/2',
        // 宽屏：紧贴正文卡片右边缘（50% + 22rem）再让开 1.25rem
        // 窄屏浮层：还是靠视口右边
        isWideScreen
          ? 'left-[calc(50%+23.25rem)] w-56'
          : 'right-4 w-64 max-w-[calc(100vw-2rem)]',
      )}
    >
      <div className="animate-rise overflow-hidden rounded-card border border-white/70 bg-white/85 shadow-lift backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 pt-4">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-ink-800">
            <List size={15} />
            {copy.toc.panelTitle}
          </span>
          {/* 宽屏是常驻面板，没有"收起"这回事，关闭按钮只给窄屏浮层用 */}
          {!isWideScreen && (
            <button
              type="button"
              onClick={() => setPanelOpen(false)}
              aria-label={copy.toc.collapse}
              className="flex h-6 w-6 items-center justify-center rounded-full text-ink-400 transition-colors hover:text-sakura-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <nav className="max-h-[60vh] overflow-y-auto p-2">
          <ul>
            {items.map((item) => {
              // 任意一个上级被折叠，这条就不显示
              if (item.ancestors.some((id) => collapsedIds.has(id))) return null;

              const isCollapsed = collapsedIds.has(item.id);
              const isActive = item.id === highlightId;

              return (
                <li key={item.id}>
                  <div
                    className={cn(
                      'flex items-start rounded-xl border-l-2 transition-colors duration-300 ease-idol',
                      isActive
                        ? 'border-l-[var(--accent-solid)] bg-white/80'
                        : 'border-l-transparent hover:bg-white/60',
                    )}
                    style={{ paddingLeft: `${0.25 + item.depth * 0.7}rem` }}
                  >
                    {item.hasChildren ? (
                      <button
                        type="button"
                        onClick={() => toggleSection(item.id)}
                        aria-expanded={!isCollapsed}
                        aria-label={
                          isCollapsed
                            ? copy.toc.expandSection(item.text)
                            : copy.toc.collapseSection(item.text)
                        }
                        className="flex h-6 w-4 shrink-0 items-center justify-center text-ink-400 transition-colors hover:text-sakura-600"
                      >
                        <ChevronRight
                          size={12}
                          className={cn(
                            'transition-transform duration-300 ease-idol',
                            !isCollapsed && 'rotate-90',
                          )}
                        />
                      </button>
                    ) : (
                      // 没有子标题的条目留出同宽空位，文字才能和上面对齐
                      <span aria-hidden className="w-4 shrink-0" />
                    )}

                    <a
                      href={`#${item.id}`}
                      // 窄屏是遮住内容的浮层，跳转后顺手收起；宽屏常驻面板不用管
                      onClick={() => setPanelOpen(false)}
                      className={cn(
                        'min-w-0 flex-1 py-1 pr-2 text-xs leading-relaxed',
                        isActive ? 'font-semibold text-sakura-600' : 'text-ink-500 hover:text-ink-800',
                      )}
                    >
                      {item.text}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
