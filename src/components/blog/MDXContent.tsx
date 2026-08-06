import rehypeShikiFromHighlighter from '@shikijs/rehype/core';
import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { mdxComponents } from '@/lib/mdx-components';
import { codeTitleTransformer, getSlimHighlighter, parseCodeMeta, SHIKI_THEME } from '@/lib/shiki';
import 'katex/dist/katex.min.css';

/**
 * MDX 正文渲染（Server Component，编译发生在构建期，浏览器零成本）。
 *
 * 这里接收的是"一段 MDX 源码字符串"，而不是某个文件。
 * 因此未来正文改从数据库或 API 取回时，这个组件完全不用改。
 *
 * 插件链：
 *   remarkGfm    表格、删除线、任务列表等 GFM 扩展语法
 *   remarkMath   识别 $行内公式$ 和 $$块级公式$$
 *   rehypeSlug   给标题生成 id，供目录锚点跳转
 *   rehypeKatex  把 remarkMath 标记出的公式渲染成排好版的数学符号
 *   rehypeShiki  代码块构建期高亮，浏览器零运行时开销。
 *                用的是 lib/shiki.ts 里的精简实例（只含本站用到的语法和主题），
 *                原因见那个文件的注释 —— 完整包会撑爆 Workers 的体积上限。
 */

export function MDXContent({ source }: { source: string }) {
  return (
    <div className="mdx-body">
      <MDXRemote
        source={source}
        components={mdxComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm, remarkMath],
            rehypePlugins: [
              rehypeSlug,
              rehypeKatex,
              [
                rehypeShikiFromHighlighter,
                getSlimHighlighter(),
                {
                  theme: SHIKI_THEME,
                  // 白名单外的语言退化成纯文本，而不是让整个构建失败
                  fallbackLanguage: 'plaintext',
                  parseMetaString: parseCodeMeta,
                  transformers: [codeTitleTransformer],
                },
              ],
            ],
          },
        }}
      />
    </div>
  );
}
