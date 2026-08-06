'use client';

import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Loader2, Search, X } from 'lucide-react';
import Fuse, { type IFuseOptions } from 'fuse.js';
import { copy } from '@/config/copy';
import { buildHit, type SearchDoc, type SearchHit } from '@/lib/search';
import { cn } from '@/lib/utils';

/* --------------------------------------------------------------------------
   索引加载：整个页面生命周期内只 fetch 一次，多次开关搜索框不重复请求
   -------------------------------------------------------------------------- */
let indexPromise: Promise<SearchDoc[]> | null = null;

function loadSearchIndex(): Promise<SearchDoc[]> {
  indexPromise ??= fetch('/search-index.json').then((response) => {
    if (!response.ok) throw new Error(`搜索索引请求失败：${response.status}`);
    return response.json() as Promise<SearchDoc[]>;
  });
  return indexPromise;
}

/* --------------------------------------------------------------------------
   Fuse 配置
   -------------------------------------------------------------------------- */
const FUSE_OPTIONS: IFuseOptions<SearchDoc> = {
  // 中文没有空格分词，基于分词器的搜索库会把整句当成一个词，
  // Fuse 直接在原字符串上做匹配，中英文都能用
  keys: [
    { name: 'title', weight: 3 },
    { name: 'summary', weight: 2 },
    { name: 'tags', weight: 2 },
    { name: 'category', weight: 1.5 },
    { name: 'content', weight: 1 },
  ],
  // 默认只在字符串开头附近找，正文那么长必须关掉
  ignoreLocation: true,
  // 0 = 必须完全一致，1 = 什么都能匹配上。0.35 大致是"允许错一两个字"
  threshold: 0.35,
  minMatchCharLength: 2,
  includeMatches: true,
  includeScore: true,
};

const MAX_RESULTS = 12;

/**
 * 少于这个字数不搜。
 * 要和上面的 minMatchCharLength 对齐 —— 单个字符匹配不出任何结果，
 * 与其显示"没有找到"让人以为坏了，不如明确提示再多输一个字。
 */
const MIN_QUERY_LENGTH = 2;

export function SearchBox() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 输入时先让输入框流畅响应，匹配计算稍后跟上
  const deferredQuery = useDeferredValue(query);

  const fuse = useMemo(() => (docs ? new Fuse(docs, FUSE_OPTIONS) : null), [docs]);

  const hits = useMemo<SearchHit[]>(() => {
    const keyword = deferredQuery.trim();
    if (!fuse || keyword.length < MIN_QUERY_LENGTH) return [];

    return fuse
      .search(keyword, { limit: MAX_RESULTS })
      .map((result) => buildHit(result.item, result.matches ?? [], keyword));
  }, [fuse, deferredQuery]);

  /** 点放大镜：展开输入框，并在这时候才去拉索引 */
  const handleOpen = async () => {
    setOpen(true);
    if (status === 'ready' || status === 'loading') return;

    setStatus('loading');
    try {
      setDocs(await loadSearchIndex());
      setStatus('ready');
    } catch {
      // 失败时把缓存清掉，下次点开可以重试
      indexPromise = null;
      setStatus('error');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setQuery('');
  };

  /* 展开后自动聚焦输入框 */
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  /* 点面板外、或按 Esc 关闭 —— 和站内其他浮层一致 */
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose();
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const keyword = query.trim();

  return (
    <div ref={containerRef} className="relative flex items-center">
      {/* 放大镜按钮：展开时藏起来，位置让给输入框 */}
      <button
        type="button"
        onClick={handleOpen}
        aria-label={copy.search.open}
        aria-expanded={open}
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full text-ink-600',
          'transition-all duration-300 ease-idol hover:bg-white/70 hover:text-sakura-600',
          open && 'pointer-events-none opacity-0',
        )}
      >
        <Search size={17} />
      </button>

      {/* 展开的输入框：绝对定位向左伸展，盖住导航而不是把它挤走 */}
      <div
        className={cn(
          'absolute top-1/2 right-0 flex -translate-y-1/2 items-center overflow-hidden',
          'rounded-pill border bg-white/90 shadow-soft backdrop-blur-xl',
          'transition-all duration-400 ease-idol',
          open
            ? 'w-[16rem] border-white/80 opacity-100 sm:w-[20rem]'
            : 'pointer-events-none w-9 border-transparent opacity-0',
        )}
      >
        <Search size={15} className="ml-3 shrink-0 text-ink-400" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={copy.search.placeholder}
          aria-label={copy.search.open}
          className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-ink-800 outline-none placeholder:text-ink-400"
        />
        <button
          type="button"
          onClick={handleClose}
          aria-label={copy.search.close}
          className="mr-1.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-400 transition-colors hover:text-sakura-600"
        >
          <X size={15} />
        </button>
      </div>

      {/* 结果面板 */}
      {open && (
        <div
          className={cn(
            'animate-rise z-50 overflow-hidden rounded-card',
            // 窄屏：搜索按钮右边还有汉堡菜单占着位，按 right-0 定位会把面板顶到屏幕外，
            // 所以直接相对视口铺开，挂在 Header 下方
            'max-sm:fixed max-sm:inset-x-4 max-sm:top-[4.5rem]',
            // 宽屏：正常吊在输入框下面
            'sm:absolute sm:top-full sm:right-0 sm:mt-2 sm:w-[24rem] sm:max-w-[calc(100vw-2rem)]',
            'border border-white/70 bg-white/90 shadow-lift backdrop-blur-xl',
          )}
        >
          {status === 'loading' && (
            <p className="flex items-center gap-2 px-4 py-5 text-sm text-ink-500">
              <Loader2 size={15} className="animate-spin" />
              {copy.search.loading}
            </p>
          )}

          {status === 'error' && (
            <p className="px-4 py-5 text-sm text-ink-500">{copy.search.error}</p>
          )}

          {status === 'ready' && keyword.length === 0 && (
            <p className="px-4 py-5 text-sm text-ink-400">{copy.search.hint}</p>
          )}

          {status === 'ready' && keyword.length > 0 && keyword.length < MIN_QUERY_LENGTH && (
            <p className="px-4 py-5 text-sm text-ink-400">{copy.search.tooShort}</p>
          )}

          {status === 'ready' && keyword.length >= MIN_QUERY_LENGTH && hits.length === 0 && (
            <p className="px-4 py-5 text-sm text-ink-500">{copy.search.empty(keyword)}</p>
          )}

          {status === 'ready' && hits.length > 0 && (
            <>
              <p className="border-b border-white/70 px-4 py-2.5 text-xs text-ink-400">
                {copy.search.resultCount(hits.length)}
              </p>
              {/* 结果多的时候这一块自己滚动，不会把面板撑出屏幕 */}
              <ul className="max-h-[60vh] overflow-y-auto p-2">
                {hits.map((hit) => (
                  <li key={hit.slug} className="mb-1 last:mb-0">
                    {/* 文章标题一篇只出现一次，下面挂着这篇里命中的每一句 */}
                    <p className="flex items-center gap-2 px-3 pt-2 pb-1">
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ink-800">
                        {hit.title}
                      </span>
                      <span className="shrink-0 rounded-pill bg-white/80 px-2 py-0.5 text-[10px] text-ink-400">
                        {copy.search.matchCount(hit.totalMatches)}
                      </span>
                    </p>

                    <ul>
                      {hit.snippets.map((snippet, index) => (
                        <li key={`${snippet.field}-${snippet.contentIndex ?? 'x'}-${index}`}>
                          <Link
                            href={buildResultHref(hit.slug, keyword, snippet.contentIndex)}
                            onClick={handleClose}
                            className={cn(
                              'flex gap-2 rounded-2xl px-3 py-1.5',
                              'transition-colors duration-300 ease-idol hover:bg-white/80',
                            )}
                          >
                            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-400/60" />
                            <span className="min-w-0 flex-1 text-xs leading-relaxed text-ink-500">
                              <HighlightedSnippet
                                snippet={snippet.snippet}
                                highlight={snippet.highlight}
                              />
                            </span>
                            <span className="mt-0.5 shrink-0 text-[10px] text-ink-400">
                              {copy.search.fieldLabel[snippet.field]}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>

                    {hit.totalMatches > hit.snippets.length && (
                      <p className="px-3 pt-0.5 pb-1 text-[10px] text-ink-400">
                        {copy.search.moreMatches(hit.totalMatches - hit.snippets.length)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 拼出跳转链接：带上关键词和"这是正文里的第几处"，
 * 文章页据此把关键词标出来并滚到对应那一句（见 blog/SearchHighlighter.tsx）
 */
function buildResultHref(slug: string, keyword: string, contentIndex: number | null): string {
  const params = new URLSearchParams({ q: keyword });
  if (contentIndex !== null) params.set('i', String(contentIndex));
  return `/blog/${slug}?${params.toString()}`;
}

/** 把命中的那几个字标出来 */
function HighlightedSnippet({
  snippet,
  highlight,
}: {
  snippet: string;
  highlight: [number, number] | null;
}) {
  if (!highlight) return <>{snippet}</>;

  const [start, end] = highlight;
  return (
    <>
      {snippet.slice(0, start)}
      <mark className="rounded bg-sakura-100 px-0.5 font-semibold text-sakura-700">
        {snippet.slice(start, end)}
      </mark>
      {snippet.slice(end)}
    </>
  );
}
