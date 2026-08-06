import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import { copy } from '@/config/copy';
import type { PostMeta } from '@/lib/posts';
import { formatDate } from '@/lib/utils';

/** 文章页头部：返回链接 + 标题 + 元信息 + 封面 */
export function PostHeader({ post }: { post: PostMeta }) {
  return (
    <header className="pt-10 pb-8 sm:pt-14">
      <Container size="narrow">
        <Link
          href="/blog"
          className="group inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-sakura-600"
        >
          <ArrowLeft
            size={15}
            className="transition-transform duration-400 ease-idol group-hover:-translate-x-1"
          />
          {copy.blog.backToList}
        </Link>

        <div className="animate-rise mt-6">
          <Badge tone="lavender">{post.category}</Badge>

          <h1 className="mt-4 text-3xl leading-tight font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            {post.title}
          </h1>

          <p className="mt-4 text-base leading-relaxed text-ink-500">{post.summary}</p>

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-400">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays size={14} />
              {formatDate(post.date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} />
              {copy.blog.readingTimeApprox(post.readingTime)}
            </span>
          </div>

          {post.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} tone="pink">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {post.cover && (
          <div
            className="animate-rise relative mt-8 aspect-16/9 w-full overflow-hidden rounded-card border border-white/70 shadow-lift"
            style={{ animationDelay: '120ms' }}
          >
            <Image
              src={post.cover}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </div>
        )}
      </Container>
    </header>
  );
}
