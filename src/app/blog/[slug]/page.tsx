import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Suspense } from 'react';
import { ArticleToc } from '@/components/blog/ArticleToc';
import { MDXContent } from '@/components/blog/MDXContent';
import { PostCard } from '@/components/blog/PostCard';
import { PostHeader } from '@/components/blog/PostHeader';
import { SearchHighlighter } from '@/components/blog/SearchHighlighter';
import { Container } from '@/components/ui/Container';
import { GlassCard } from '@/components/ui/GlassCard';
import { copy } from '@/config/copy';
import { siteConfig } from '@/config/site';
import { getAdjacentPosts, getAllSlugs, getPost, getRelatedPosts, type PostMeta } from '@/lib/posts';

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** 构建期把每篇文章都静态生成（SSG） */
export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: copy.blog.postNotFound };

  const url = `${siteConfig.url}/blog/${post.slug}`;

  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.summary,
      publishedTime: post.date,
      tags: post.tags,
      images: post.cover ? [{ url: post.cover }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.summary,
      images: post.cover ? [post.cover] : undefined,
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const [{ newer, older }, related] = await Promise.all([
    getAdjacentPosts(slug),
    getRelatedPosts(slug),
  ]);

  // 结构化数据，帮助搜索引擎理解这是一篇文章
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    author: { '@type': 'Person', name: siteConfig.author },
    url: `${siteConfig.url}/blog/${post.slug}`,
    ...(post.cover ? { image: `${siteConfig.url}${post.cover}` } : {}),
  };

  return (
    <article className="pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <PostHeader post={post} />

      {/* 从搜索结果点进来时，把关键词标出来并滚到对应那一句。
          用了 useSearchParams，静态页面里必须包一层 Suspense */}
      <Suspense fallback={null}>
        <SearchHighlighter />
      </Suspense>

      <ArticleToc headings={post.headings} />

      <Container size="narrow">
        <GlassCard padding="lg" className="animate-rise" style={{ animationDelay: '160ms' }}>
          <MDXContent source={post.content} />
        </GlassCard>

        {/* 上下篇 */}
        {(newer || older) && (
          <nav className="mt-10 grid gap-4 sm:grid-cols-2">
            <AdjacentLink post={older} direction="older" />
            <AdjacentLink post={newer} direction="newer" />
          </nav>
        )}
      </Container>

      {/* 相关文章 */}
      {related.length > 0 && (
        <Container size="wide" className="mt-16">
          <h2 className="mb-6 text-xl font-bold text-ink-900">{copy.blog.relatedPosts}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item, index) => (
              <PostCard key={item.slug} post={item} index={index} />
            ))}
          </div>
        </Container>
      )}
    </article>
  );
}

function AdjacentLink({
  post,
  direction,
}: {
  post: PostMeta | null;
  direction: 'newer' | 'older';
}) {
  if (!post) return <span className="hidden sm:block" />;

  const isOlder = direction === 'older';

  return (
    <Link href={`/blog/${post.slug}`} className="group">
      <GlassCard
        interactive
        padding="md"
        glow={isOlder ? 'aqua' : 'pink'}
        className={isOlder ? '' : 'sm:text-right'}
      >
        <span className="flex items-center gap-1.5 text-xs text-ink-400 sm:justify-start">
          {isOlder ? (
            <>
              <ArrowLeft size={13} /> {copy.blog.olderPost}
            </>
          ) : (
            <span className="flex w-full items-center gap-1.5 sm:justify-end">
              {copy.blog.newerPost} <ArrowRight size={13} />
            </span>
          )}
        </span>
        <p className="mt-2 line-clamp-2 text-sm font-semibold text-ink-800 transition-colors duration-300 group-hover:text-sakura-600">
          {post.title}
        </p>
      </GlassCard>
    </Link>
  );
}
