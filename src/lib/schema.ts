import { z } from 'zod';

/**
 * 文章 frontmatter 的运行时校验规则。
 *
 * 这份 schema 是内容格式的唯一真相来源：
 * - 现在：校验 content/blog/*.mdx 的头部字段，写错立刻在构建期报错
 * - 未来：接入数据库时，posts 表结构可以直接照它来建，无需重新设计
 */
export const frontmatterSchema = z.object({
  /** 文章标题 */
  title: z.string().min(1, 'title 不能为空'),
  /** 发布日期，YYYY-MM-DD 或任何 Date 能解析的格式 */
  date: z.union([z.string(), z.date()]),
  /** 摘要，显示在列表卡片与 SEO description */
  summary: z.string().min(1, 'summary 不能为空'),
  /** 分类：一篇文章只属于一个分类 */
  category: z.string().min(1, 'category 不能为空'),
  /** 标签：多对多，用于交叉发现 */
  tags: z.array(z.string()).default([]),
  /** 封面图路径，可选 */
  cover: z.string().optional(),
  /** 草稿：生产构建会跳过，开发环境仍可预览 */
  draft: z.boolean().default(false),
  /** 自定义 slug，默认取文件名 */
  slug: z.string().optional(),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;
