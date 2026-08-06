import GithubSlugger from 'github-slugger';

/* ==========================================================================
   文章目录（Table of Contents）
   --------------------------------------------------------------------------
   从 MDX 源码里抽出标题列表，供文章页右侧的目录面板使用。

   关键点：这里生成的 id 必须和正文里标题实际带的 id 完全一致，否则点目录跳不过去。
   正文的 id 来自 rehype-slug 插件（见 components/blog/MDXContent.tsx），
   而 rehype-slug 内部用的就是 github-slugger —— 所以这里直接用同一个库、
   按同样的顺序调用，重名标题的 -1 / -2 后缀规则也能对上。
   ========================================================================== */

export interface Heading {
  /** 锚点 id，对应正文标题上的 id 属性 */
  id: string;
  /** 显示用的纯文本标题 */
  text: string;
  /** 原始层级：1 = #，2 = ##，3 = ### */
  level: number;
  /**
   * 缩进层级，0 表示最外层。
   * 有的文章用 # 当大标题、有的从 ## 开始，直接按 level 缩进会出现整体偏移，
   * 所以取这篇文章里最小的 level 当基准，保证目录永远从最左边开始。
   */
  depth: number;
}

/** 目录只收录到三级标题，再深的（#### 及以下）通常是细节，列出来反而吵 */
const MAX_LEVEL = 3;

/** 把标题行里的 Markdown 语法去掉，只留下渲染后用户能看到的文字 */
function toPlainText(markdown: string): string {
  return (
    markdown
      // 图片 ![alt](src) 整个丢掉，链接 [text](url) 只留 text
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      // 行内代码、加粗、斜体、删除线的标记符号
      .replace(/`([^`]*)`/g, '$1')
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      .replace(/~~(.*?)~~/g, '$1')
      // 行内公式 $...$ 只保留里面的内容：rehype-slug 在 KaTeX 渲染之前跑，
      // 它看到的也是这段原始文本，所以这样处理出来的 id 才对得上
      .replace(/\$/g, '')
      // 残留的 HTML 标签（从别处导出的 Markdown 常见）
      .replace(/<[^>]+>/g, '')
      .trim()
  );
}

/**
 * 从 MDX 源码里抽取标题。
 * 只认 ATX 语法（# 开头），因为本站的文章都是这种写法。
 */
export function extractHeadings(source: string): Heading[] {
  // 先把围栏代码块整段抹掉，否则代码里的 # 注释会被误判成标题
  const withoutCode = source.replace(/^ {0,3}(```|~~~)[\s\S]*?^ {0,3}\1[^\n]*$/gm, '');

  const slugger = new GithubSlugger();
  const headings: Heading[] = [];

  for (const line of withoutCode.split('\n')) {
    const match = /^(#{1,6})\s+(.*)$/.exec(line);
    if (!match) continue;

    const level = match[1]!.length;
    // 注意：超出 MAX_LEVEL 的标题也要走一遍 slugger，
    // 因为 rehype-slug 会给它们分配 id，跳过会让后面同名标题的编号错位
    const text = toPlainText(match[2]!.replace(/\s+#+\s*$/, ''));
    if (!text) continue;

    const id = slugger.slug(text);
    if (level > MAX_LEVEL) continue;

    headings.push({ id, text, level, depth: 0 });
  }

  if (headings.length === 0) return [];

  const minLevel = Math.min(...headings.map((heading) => heading.level));
  return headings.map((heading) => ({ ...heading, depth: heading.level - minLevel }));
}
