import Image from 'next/image';
import Link from 'next/link';
import type { MDXComponents } from 'mdx/types';

/**
 * MDX 元素到站点组件的映射。
 * 排版样式统一放在 globals.css 的 .mdx-body 里，这里只处理需要"换成 React 组件"的元素。
 */

/** 文章内的提示块：<Note>内容</Note> 或 <Note type="tip">…</Note> */
function Note({
  children,
  type = 'info',
}: {
  children: React.ReactNode;
  type?: 'info' | 'tip' | 'warn';
}) {
  const styles = {
    info: 'border-aqua-300 bg-aqua-50/80 text-aqua-700',
    tip: 'border-sakura-300 bg-sakura-50/80 text-sakura-700',
    warn: 'border-lavender-300 bg-lavender-50/80 text-lavender-700',
  } as const;

  return (
    <div className={`rounded-2xl border-l-4 px-5 py-4 text-[0.95rem] leading-relaxed ${styles[type]}`}>
      {children}
    </div>
  );
}

export const mdxComponents: MDXComponents = {
  a: ({ href = '', children, ...props }) => {
    const isExternal = /^https?:\/\//.test(href);
    if (isExternal) {
      return (
        <a href={href} target="_blank" rel="noreferrer" {...props}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} {...props}>
        {children}
      </Link>
    );
  },

  img: ({ src, alt = '' }) => {
    if (typeof src !== 'string') return null;
    return (
      <Image
        src={src}
        alt={alt}
        width={1600}
        height={900}
        sizes="(max-width: 768px) 100vw, 768px"
        className="h-auto w-full rounded-2xl"
      />
    );
  },

  Note,
};
