import { getAllPosts, getPost } from '@/lib/posts';
import { markdownToPlainText, type SearchDoc } from '@/lib/search';

/**
 * 搜索索引：/search-index.json
 *
 * force-static 让它在构建期就生成好一个静态 JSON，运行时不占服务器资源；
 * 用户第一次点搜索图标时前端才去 fetch 它（见 components/layout/SearchBox.tsx）。
 *
 * 数据来自 lib/posts.ts —— 也就是全站唯一的数据访问层。
 * 所以以后往 content/blog/ 里加文章，重新构建就自动进索引，这里不用改。
 */
export const dynamic = 'force-static';

export async function GET() {
  const posts = await getAllPosts();

  const docs: SearchDoc[] = [];
  for (const meta of posts) {
    const post = await getPost(meta.slug);
    if (!post) continue;

    docs.push({
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      category: post.category,
      tags: post.tags,
      content: markdownToPlainText(post.content),
    });
  }

  return Response.json(docs);
}
