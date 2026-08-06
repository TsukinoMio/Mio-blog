/* ==========================================================================
   博客搜索
   --------------------------------------------------------------------------
   这个文件只放纯逻辑（不碰文件系统、也不依赖具体的搜索库），
   服务端生成索引和客户端渲染结果都用它，避免两边对不上。

   整条链路：
   1. 构建期：/search-index.json 这个路由从 lib/posts.ts 拿全部文章，
      调用 markdownToPlainText 洗成纯文本，输出成一个静态 JSON。
      因为数据来自 posts.ts，以后新增文章重新构建就自动包含，不用手动维护。
   2. 运行期：用户第一次点搜索图标时才去 fetch 这个 JSON，交给 Fuse.js 做模糊匹配。
   3. 命中之后用 buildHit 把结果整理成"文章标题 + 命中所在的那句话"。
   ========================================================================== */

/** 索引里每篇文章的形状 */
export interface SearchDoc {
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  /** 正文纯文本，已去掉 Markdown 语法、代码块和公式 */
  content: string;
}

/** 一处命中：文章里具体某一句 */
export interface SearchSnippet {
  /** 命中所在的那句话 */
  snippet: string;
  /** snippet 里要高亮的区间 [起, 止)，没有可高亮的就是 null */
  highlight: [number, number] | null;
  /** 命中在哪个字段上，用来在结果里标一下来源 */
  field: SearchField;
  /**
   * 这是正文里的第几处命中（从 0 开始）。
   * 点结果跳转时带上它，文章页就能滚到对应的那一句去。
   * 命中在标题/摘要这些字段上时为 null。
   */
  contentIndex: number | null;
}

/** 一篇文章的搜索结果，可能包含多处命中 */
export interface SearchHit {
  slug: string;
  title: string;
  /** 实际展示的命中（数量有上限，见 MAX_SNIPPETS_PER_DOC） */
  snippets: SearchSnippet[];
  /** 这篇文章里一共命中了多少处（可能比 snippets 多） */
  totalMatches: number;
}

export type SearchField = 'title' | 'summary' | 'content' | 'tags' | 'category';

/** 搜索库回传的原始命中信息。这里不直接用 Fuse 的类型，省得逻辑被库绑死 */
export interface RawMatch {
  key?: string;
  value?: string;
  indices: readonly (readonly [number, number])[];
}

/** 中文和英文的句子结束符 */
const SENTENCE_BOUNDARY = /[。！？；!?;\n]/;

/** 摘要最长多少字，超了就在命中位置附近截一段 */
const MAX_SNIPPET_LENGTH = 120;

/**
 * 把 Markdown / MDX 正文洗成纯文本。
 * 目的是让搜索结果里的句子读起来像人话，而不是一堆语法符号。
 */
export function markdownToPlainText(source: string): string {
  return (
    source
      // 围栏代码块整段丢掉：代码里的关键字命中了也没法当"句子"展示
      .replace(/^ {0,3}(```|~~~)[\s\S]*?^ {0,3}\1[^\n]*$/gm, '')
      // 块级公式同理
      .replace(/\$\$[\s\S]*?\$\$/g, '')
      // JSX 组件标签（比如 <Note type="tip">）只去标签、留里面的文字
      .replace(/<[^>]+>/g, '')
      // 图片整个丢掉，链接只留显示文字
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // 行内公式整段去掉（不是只去 $ 符号）：
      // 页面上它会被 KaTeX 渲染成一堆标签，文字对不上；
      // 两边都跳过，正文里"第几处命中"的序号才能对得上，跳转才准
      .replace(/\$[^$\n]*\$/g, ' ')
      // 行内代码、加粗、斜体、删除线的标记符号
      .replace(/`([^`]*)`/g, '$1')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/~~(.*?)~~/g, '$1')
      // 行首的标题井号、引用尖括号、列表符号
      .replace(/^\s{0,3}#{1,6}\s+/gm, '')
      .replace(/^\s{0,3}>\s?/gm, '')
      .replace(/^\s{0,3}[-*+]\s+/gm, '')
      .replace(/^\s{0,3}\d+\.\s+/gm, '')
      // 表格分隔线和分割线
      .replace(/^\s*\|?[\s:|-]{3,}\|?\s*$/gm, '')
      .replace(/^\s*([-*_])\s*(\1\s*){2,}$/gm, '')
      // 连续空白压成一个空格，句子里就不会出现大段空行
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{2,}/g, '\n')
      .trim()
  );
}

/** 从若干命中区间里挑最长的那个，作为高亮和取句子的依据 */
function pickLongestRange(
  indices: readonly (readonly [number, number])[],
): [number, number] | null {
  let best: [number, number] | null = null;

  for (const [start, end] of indices) {
    if (!best || end - start > best[1] - best[0]) best = [start, end];
  }

  return best;
}

/**
 * 取出包含命中位置的那一句话。
 * 句子太长时以命中处为中心截一段，两头加省略号。
 */
export function extractSentence(
  text: string,
  matchStart: number,
  matchEnd: number,
): { snippet: string; highlight: [number, number] | null } {
  // 往前找到句子开头
  let start = 0;
  for (let i = matchStart - 1; i >= 0; i -= 1) {
    if (SENTENCE_BOUNDARY.test(text[i]!)) {
      start = i + 1;
      break;
    }
  }

  // 往后找到句子结尾（含结束符本身，读起来更完整）
  let end = text.length;
  for (let i = matchEnd + 1; i < text.length; i += 1) {
    if (SENTENCE_BOUNDARY.test(text[i]!)) {
      end = i + 1;
      break;
    }
  }

  let sentence = text.slice(start, end);
  let offset = start;

  // 句子过长：以命中处为中心开个窗口
  if (sentence.length > MAX_SNIPPET_LENGTH) {
    const matchLength = matchEnd - matchStart + 1;
    const padding = Math.max(0, Math.floor((MAX_SNIPPET_LENGTH - matchLength) / 2));
    const windowStart = Math.max(start, matchStart - padding);
    const windowEnd = Math.min(end, windowStart + MAX_SNIPPET_LENGTH);

    sentence = `${windowStart > start ? '…' : ''}${text.slice(windowStart, windowEnd)}${
      windowEnd < end ? '…' : ''
    }`;
    // 前面补了省略号的话，高亮位置要跟着往后挪一位
    offset = windowStart - (windowStart > start ? 1 : 0);
  }

  const trimmed = sentence.trimStart();
  offset += sentence.length - trimmed.length;

  const highlightStart = matchStart - offset;
  const highlightEnd = matchEnd + 1 - offset;
  const highlight: [number, number] | null =
    highlightStart >= 0 && highlightEnd <= trimmed.length && highlightEnd > highlightStart
      ? [highlightStart, highlightEnd]
      : null;

  return { snippet: trimmed.trimEnd(), highlight };
}

/** 字段的展示优先级：正文里的句子信息量最大，标题次之 */
const FIELD_PRIORITY: SearchField[] = ['content', 'summary', 'title', 'tags', 'category'];

/** 一篇文章最多列出多少处命中，再多就只在角标上报个总数，免得结果面板被一篇文章刷屏 */
export const MAX_SNIPPETS_PER_DOC = 6;

/** 找出关键词在文本里出现的所有位置（不区分大小写） */
export function findOccurrences(haystack: string, needle: string): number[] {
  if (!needle) return [];

  const text = haystack.toLowerCase();
  const keyword = needle.toLowerCase();
  const positions: number[] = [];

  let from = text.indexOf(keyword);
  while (from !== -1) {
    positions.push(from);
    from = text.indexOf(keyword, from + keyword.length);
  }

  return positions;
}

/**
 * 把一篇文章的命中整理成可以直接渲染的结果。
 *
 * 优先按"关键词在文中原样出现的每一处"来拆：一篇文章里出现几次就列几条，
 * 每条都记下它是正文里的第几处，点进去才能滚到对应的那一句。
 *
 * 如果一处原文都没出现（说明是打错字之后的模糊命中），
 * 就退回用搜索库给的位置，出一条代表性的结果。
 */
export function buildHit(
  doc: SearchDoc,
  matches: readonly RawMatch[],
  query: string,
): SearchHit {
  const keyword = query.trim();

  // 标题、摘要里的命中各出一条（这两个字段短，出一条就够了）
  const fieldSnippets: SearchSnippet[] = [];
  for (const field of ['title', 'summary'] as const) {
    const [first] = findOccurrences(doc[field], keyword);
    if (first === undefined) continue;

    const { snippet, highlight } = extractSentence(
      doc[field],
      first,
      first + keyword.length - 1,
    );
    fieldSnippets.push({ snippet, highlight, field, contentIndex: null });
  }

  // 正文里出现几次就出几条
  const contentPositions = findOccurrences(doc.content, keyword);
  const contentSnippets: SearchSnippet[] = contentPositions.map((position, index) => {
    const { snippet, highlight } = extractSentence(
      doc.content,
      position,
      position + keyword.length - 1,
    );
    return { snippet, highlight, field: 'content' as const, contentIndex: index };
  });

  const totalMatches = fieldSnippets.length + contentSnippets.length;

  if (totalMatches > 0) {
    return {
      slug: doc.slug,
      title: doc.title,
      snippets: [...fieldSnippets, ...contentSnippets].slice(0, MAX_SNIPPETS_PER_DOC),
      totalMatches,
    };
  }

  // ---- 走到这里说明关键词没原样出现过，是模糊命中 ----
  const usable = matches.filter((match) => match.indices.length > 0);
  const chosen =
    FIELD_PRIORITY.map((field) =>
      usable.find((match) => (match.key ?? '').split('.')[0] === field),
    ).find(Boolean) ?? usable[0];

  const field = ((chosen?.key ?? '').split('.')[0] || 'content') as SearchField;
  const range = chosen ? pickLongestRange(chosen.indices) : null;

  if (!chosen || !range) {
    return {
      slug: doc.slug,
      title: doc.title,
      snippets: [{ snippet: doc.summary, highlight: null, field, contentIndex: null }],
      totalMatches: 1,
    };
  }

  const { snippet, highlight } = extractSentence(chosen.value ?? doc.summary, range[0], range[1]);
  return {
    slug: doc.slug,
    title: doc.title,
    snippets: [
      {
        // 命中的是标签/分类这种短字段时，取出来的"句子"没什么可读性，退回摘要
        snippet: snippet || doc.summary,
        highlight: snippet ? highlight : null,
        field,
        contentIndex: null,
      },
    ],
    totalMatches: 1,
  };
}
