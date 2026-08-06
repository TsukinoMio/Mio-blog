'use client';

import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { PostCard } from '@/components/blog/PostCard';
import { Badge } from '@/components/ui/Badge';
import { copy } from '@/config/copy';
import type { PostMeta, TaxonomyItem } from '@/lib/posts';

interface PostFilterProps {
  posts: PostMeta[];
  categories: TaxonomyItem[];
  tags: TaxonomyItem[];
}

/**
 * 分类 / 标签筛选 + 文章网格。
 *
 * 个人博客的文章量级下，把全部文章元信息一次性交给客户端做筛选，
 * 比为每个分类各生成一个静态页更简单，切换也是零延迟。
 * 将来文章多到需要分页或全文搜索时，这里换成请求 /api/posts 即可，
 * 页面其余部分不受影响。
 */
export function PostFilter({ posts, categories, tags }: PostFilterProps) {
  const [category, setCategory] = useState<string | null>(null);
  const [tag, setTag] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      posts.filter(
        (post) =>
          (category === null || post.category === category) &&
          (tag === null || post.tags.includes(tag)),
      ),
    [posts, category, tag],
  );

  const hasFilter = category !== null || tag !== null;

  return (
    <div>
      {/* 分类 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium text-ink-400">
          {copy.blog.filterCategoryLabel}
        </span>
        <button type="button" onClick={() => setCategory(null)}>
          <Badge tone="lavender" active={category === null}>
            {copy.blog.filterAllCategories} {posts.length}
          </Badge>
        </button>
        {categories.map((item) => (
          <button key={item.name} type="button" onClick={() => setCategory(item.name)}>
            <Badge tone="lavender" active={category === item.name}>
              {item.name} {item.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* 标签 */}
      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-medium text-ink-400">{copy.blog.filterTagLabel}</span>
          {tags.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setTag(tag === item.name ? null : item.name)}
            >
              <Badge tone="pink" active={tag === item.name}>
                #{item.name}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {/* 当前筛选状态 */}
      <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/60 pt-4">
        <p className="text-sm text-ink-500">
          {copy.blog.filterResultPrefix}{' '}
          <span className="font-semibold text-sakura-600">{filtered.length}</span>{' '}
          {copy.blog.filterResultSuffix}
        </p>
        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              setCategory(null);
              setTag(null);
            }}
            className="inline-flex items-center gap-1 text-xs text-ink-400 transition-colors hover:text-sakura-600"
          >
            <X size={13} />
            {copy.blog.filterClear}
          </button>
        )}
      </div>

      {/* 网格 */}
      {filtered.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((post, index) => (
            // key 带上筛选条件，切换时重新触发一次入场动画
            <PostCard key={`${category}-${tag}-${post.slug}`} post={post} index={index} />
          ))}
        </div>
      ) : (
        <p className="mt-16 text-center text-sm text-ink-400">{copy.blog.filterNoResults}</p>
      )}
    </div>
  );
}
