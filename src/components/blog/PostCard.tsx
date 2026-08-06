import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { GlassCard } from '@/components/ui/GlassCard';
import { copy } from '@/config/copy';
import type { PostMeta } from '@/lib/posts';
import { cn, formatDate } from '@/lib/utils';

interface PostCardProps {
  post: PostMeta;
  /** 入场动画的延迟序号，用于列表逐个浮现 */
  index?: number;
  className?: string;
}

/**
 * 文章卡片。整卡可点击（用铺满的透明链接实现），
 * 因此卡内的标签只做展示、不再是链接，避免 <a> 嵌套导致的无效 HTML。
 */
export function PostCard({ post, index = 0, className }: PostCardProps) {
  return (
    <GlassCard
      as="article"
      padding="none"
      interactive
      glow={index % 3 === 1 ? 'lavender' : index % 3 === 2 ? 'aqua' : 'pink'}
      className={cn('animate-rise group flex h-full flex-col', className)}
      style={{ animationDelay: `${Math.min(index, 8) * 70}ms` }}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="absolute inset-0 z-10"
        aria-label={`阅读文章：${post.title}`}
      />

      {/* 封面 */}
      <div className="relative aspect-16/9 w-full overflow-hidden">
        {post.cover ? (
          <Image
            src={post.cover}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px"
            className="object-cover transition-transform duration-700 ease-idol group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-accent-gradient-soft transition-transform duration-700 ease-idol group-hover:scale-105" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <Badge tone="lavender" className="shadow-soft">
            {post.category}
          </Badge>
        </div>
        {post.draft && (
          <div className="absolute top-3 right-3">
            <Badge tone="neutral">{copy.blog.draftBadge}</Badge>
          </div>
        )}
      </div>

      {/* 内容 */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-base leading-snug font-bold text-ink-900 transition-colors duration-300 group-hover:text-sakura-600 sm:text-lg">
          {post.title}
        </h3>

        <p className="mt-2.5 line-clamp-2 flex-1 text-sm leading-relaxed text-ink-500">
          {post.summary}
        </p>

        {post.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-pill bg-sakura-50/90 px-2.5 py-0.5 text-[11px] text-sakura-600"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 flex items-center gap-4 border-t border-white/70 pt-3 text-xs text-ink-400">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays size={13} />
            {formatDate(post.date)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock size={13} />
            {copy.blog.readingTime(post.readingTime)}
          </span>
        </div>
      </div>
    </GlassCard>
  );
}
