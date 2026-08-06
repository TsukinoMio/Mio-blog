import fs from 'node:fs/promises';
import path from 'node:path';
import { cache } from 'react';
import matter from 'gray-matter';
import { frontmatterSchema } from './schema';
import { extractHeadings, type Heading } from './toc';
import { estimateReadingTime } from './utils';

/* ==========================================================================
   数据访问层
   --------------------------------------------------------------------------
   全站唯一读取文件系统的地方。页面组件只 import 这个文件导出的函数，
   永远不直接碰 fs / gray-matter。

   未来迁移到数据库（Supabase / PostgreSQL）时：
   只需把下面几个函数的实现换成 SQL 查询，返回相同的 PostMeta / Post 结构，
   app/ 目录下的所有页面一行都不用改。

   为此保持三条纪律：
   1. 所有导出函数都是 async（换成网络/数据库请求时签名不变）
   2. date 用 ISO 字符串而非 Date 对象（可安全跨 Server/Client 传递）
   3. slug 是主键，draft 字段现在就存在
   ========================================================================== */

/** 列表用的轻量结构：不含正文 */
export interface PostMeta {
  slug: string;
  title: string;
  /** ISO 8601 字符串 */
  date: string;
  summary: string;
  category: string;
  tags: string[];
  cover?: string;
  draft: boolean;
  /** 预计阅读时长（分钟） */
  readingTime: number;
}

/** 详情用：元信息 + MDX 正文源码 + 目录 */
export interface Post extends PostMeta {
  content: string;
  /** 文章目录，构建期从正文里抽出来（见 lib/toc.ts） */
  headings: Heading[];
}

export interface TaxonomyItem {
  name: string;
  count: number;
}

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

/** 开发环境显示草稿，方便预览；生产构建自动过滤 */
const SHOW_DRAFTS = process.env.NODE_ENV === 'development';

/** 解析单个 MDX 文件 */
async function parsePostFile(filename: string): Promise<Post> {
  const raw = await fs.readFile(path.join(BLOG_DIR, filename), 'utf8');
  const { data, content } = matter(raw);

  const result = frontmatterSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.') || '(根)'}: ${issue.message}`)
      .join('\n');
    throw new Error(`文章 content/blog/${filename} 的 frontmatter 有误：\n${issues}`);
  }

  const fm = result.data;
  const date = new Date(fm.date);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`文章 content/blog/${filename} 的 date 无法解析：${String(fm.date)}`);
  }

  return {
    slug: fm.slug ?? filename.replace(/\.mdx?$/, ''),
    title: fm.title,
    date: date.toISOString(),
    summary: fm.summary,
    category: fm.category,
    tags: fm.tags,
    cover: fm.cover,
    draft: fm.draft,
    readingTime: estimateReadingTime(content),
    content,
    headings: extractHeadings(content),
  };
}

/**
 * 读取全部文章（含正文），按发布时间倒序。
 * 用 React cache() 包裹，同一次渲染中重复调用只会真正读盘一次。
 */
const loadPosts = cache(async (): Promise<Post[]> => {
  let filenames: string[];
  try {
    filenames = await fs.readdir(BLOG_DIR);
  } catch {
    // content/blog 还不存在时返回空列表，而不是让整个站崩掉
    return [];
  }

  const posts = await Promise.all(
    filenames.filter((name) => /\.mdx?$/.test(name)).map(parsePostFile),
  );

  return posts
    .filter((post) => SHOW_DRAFTS || !post.draft)
    .sort((a, b) => b.date.localeCompare(a.date));
});

/**
 * 去掉正文和目录，得到列表用的轻量结构。
 * 列表页是把全部文章元信息一次性交给客户端组件筛选的，
 * 这两个字段留在里面会白白撑大传给浏览器的数据。
 */
function toMeta({ content: _content, headings: _headings, ...meta }: Post): PostMeta {
  return meta;
}

/* --------------------------------------------------------------------------
   对外 API
   -------------------------------------------------------------------------- */

/** 全部文章的元信息，按时间倒序 */
export async function getAllPosts(): Promise<PostMeta[]> {
  return (await loadPosts()).map(toMeta);
}

/** 最新 N 篇（首页用） */
export async function getLatestPosts(limit = 3): Promise<PostMeta[]> {
  return (await getAllPosts()).slice(0, limit);
}

/** 按 slug 取单篇文章（含正文），不存在返回 null */
export async function getPost(slug: string): Promise<Post | null> {
  const posts = await loadPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

/** 全部 slug，供 generateStaticParams 使用 */
export async function getAllSlugs(): Promise<string[]> {
  return (await loadPosts()).map((post) => post.slug);
}

/** 全部分类及其文章数，按数量倒序 */
export async function getAllCategories(): Promise<TaxonomyItem[]> {
  const posts = await loadPosts();
  return countBy(posts.map((post) => post.category));
}

/** 全部标签及其文章数，按数量倒序 */
export async function getAllTags(): Promise<TaxonomyItem[]> {
  const posts = await loadPosts();
  return countBy(posts.flatMap((post) => post.tags));
}

/**
 * 取相邻文章。
 * 用 newer / older 而非 prev / next，避免"上一篇"到底是更新还是更旧的歧义。
 */
export async function getAdjacentPosts(
  slug: string,
): Promise<{ newer: PostMeta | null; older: PostMeta | null }> {
  const posts = await getAllPosts();
  const index = posts.findIndex((post) => post.slug === slug);
  if (index === -1) return { newer: null, older: null };

  return {
    newer: posts[index - 1] ?? null,
    older: posts[index + 1] ?? null,
  };
}

/** 同分类或共享标签最多的文章 */
export async function getRelatedPosts(slug: string, limit = 3): Promise<PostMeta[]> {
  const posts = await getAllPosts();
  const current = posts.find((post) => post.slug === slug);
  if (!current) return [];

  return posts
    .filter((post) => post.slug !== slug)
    .map((post) => ({
      post,
      score:
        (post.category === current.category ? 2 : 0) +
        post.tags.filter((tag) => current.tags.includes(tag)).length,
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.post);
}

/* -------------------------------------------------------------------------- */

function countBy(values: string[]): TaxonomyItem[] {
  const counter = new Map<string, number>();
  for (const value of values) {
    counter.set(value, (counter.get(value) ?? 0) + 1);
  }
  return [...counter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
}
