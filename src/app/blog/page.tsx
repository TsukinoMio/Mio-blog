import type { Metadata } from 'next';
import { PostFilter } from '@/components/blog/PostFilter';
import { Container } from '@/components/ui/Container';
import { copy } from '@/config/copy';
import { getAllCategories, getAllPosts, getAllTags } from '@/lib/posts';

export const metadata: Metadata = {
  title: copy.blog.pageTitle,
  description: copy.blog.pageDescription,
};

export default async function BlogPage() {
  const [posts, categories, tags] = await Promise.all([
    getAllPosts(),
    getAllCategories(),
    getAllTags(),
  ]);

  return (
    <div className="py-14 sm:py-20">
      <Container size="wide">
        <header className="animate-rise mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">
            <span className="text-gradient">{copy.blog.pageTitle}</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500 sm:text-base">
            {copy.blog.pageDescription}
          </p>
        </header>

        {posts.length > 0 ? (
          <PostFilter posts={posts} categories={categories} tags={tags} />
        ) : (
          <p className="mt-20 text-center text-sm text-ink-400">{copy.blog.emptyState}</p>
        )}
      </Container>
    </div>
  );
}
