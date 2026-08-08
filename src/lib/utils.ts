import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** 合并 className，后写的 Tailwind 类会正确覆盖先写的 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: '2-digit',
  day: '2-digit',
});

/** 2026-08-06 -> 2026年8月6日 */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

/** 2026-08-06 -> 08/06 */
export function formatShortDate(iso: string): string {
  return shortDateFormatter.format(new Date(iso)).replace(/\//g, '/');
}

/**
 * 估算中文阅读时长（分钟）。
 * 不用 reading-time 这类库，因为它们按空格分词，中文会算成 1 个词。
 * 经验值：中文 400 字/分钟，英文 200 词/分钟。
 */
export function estimateReadingTime(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, '') // 去掉代码块
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, '') // 去掉图片与链接
    .replace(/[#>*`_~\-|]/g, '');

  const cjkChars = text.match(/[一-龥぀-ヿ가-힯]/g)?.length ?? 0;
  const latinWords =
    text
      .replace(/[一-龥぀-ヿ가-힯]/g, ' ')
      .match(/[A-Za-z0-9]+/g)?.length ?? 0;

  return Math.max(1, Math.round(cjkChars / 400 + latinWords / 200));
}

/**
 * 把可能是站内相对路径的资源地址补成绝对 URL，供 SEO 元数据使用。
 *
 * 封面图现在有两种来源：本地的 `/images/blog/...`，和图床的
 * `https://img.reikaakane.com/...`。JSON-LD 要求 image 是绝对地址，
 * 直接 `${siteConfig.url}${cover}` 拼接的话，图床那种会拼成
 * `https://reikaakane.comhttps://img...` —— 已经踩过一次。
 */
export function toAbsoluteUrl(pathOrUrl: string, origin: string): string {
  return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${origin}${pathOrUrl}`;
}

/** 把中文标签转成可用于 URL 的 slug（保留中文，仅处理空格与特殊字符） */
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w一-龥-]/g, '');
}
