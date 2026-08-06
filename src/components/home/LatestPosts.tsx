import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PostCard } from '@/components/blog/PostCard';
import { Container } from '@/components/ui/Container';
import { copy } from '@/config/copy';
import { getLatestPosts } from '@/lib/posts';

/** 首页的最新文章区块。数据在服务端取，卡片直接静态渲染 */
export async function LatestPosts() {
  const posts = await getLatestPosts(3);

  if (posts.length === 0) return null;

  return (
    <section className="py-14">
      <Container size="wide">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-ink-900 sm:text-3xl">
              {copy.home.latestPostsTitle}
            </h2>
            <p className="mt-2 text-sm text-ink-500">{copy.home.latestPostsSubtitle}</p>
          </div>
          <Link
            href="/blog"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-lavender-600 transition-colors hover:text-sakura-600"
          >
            {copy.home.viewAllPosts}
            <ArrowRight
              size={15}
              className="transition-transform duration-400 ease-idol group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post, index) => (
            <PostCard key={post.slug} post={post} index={index} />
          ))}
        </div>
      </Container>
    </section>
  );
}
