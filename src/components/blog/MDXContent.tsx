import { MDXRemote } from 'next-mdx-remote/rsc';
import rehypeKatex from 'rehype-katex';
import rehypePrettyCode, { type Options as PrettyCodeOptions } from 'rehype-pretty-code';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { mdxComponents } from '@/lib/mdx-components';
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
 *   rehypePrettyCode  代码块构建期高亮（Shiki），浏览器零运行时开销
 */

const prettyCodeOptions: PrettyCodeOptions = {
  theme: 'material-theme-palenight',
  // 背景交给 globals.css 控制，保持与站点配色一致
  keepBackground: false,
};

export function MDXContent({ source }: { source: string }) {
  return (
    <div className="mdx-body">
      <MDXRemote
        source={source}
        components={mdxComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm, remarkMath],
            rehypePlugins: [rehypeSlug, rehypeKatex, [rehypePrettyCode, prettyCodeOptions]],
          },
        }}
      />
    </div>
  );
}
