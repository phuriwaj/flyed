import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: 'flyed journal',
    description: 'Stories, tips, and insights on school trips to Thailand',
    site: context.site ?? new URL('https://flyed.dev'),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id.replace(/\.mdx?$/, '')}`,
    })),
    customData: `<language>en-us</language>`,
  });
}
