import { MetadataRoute } from 'next'
import toolsData from '@/data/tools.json'
import fs from 'fs';
import path from 'path';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://toolcompare.net'

  // Base pages
  const routes = [
    { path: '', priority: 1, freq: 'daily' as const },
    { path: '/categories', priority: 0.9, freq: 'weekly' as const },
    { path: '/top-picks', priority: 0.9, freq: 'weekly' as const },
    { path: '/blog', priority: 0.7, freq: 'daily' as const },
    { path: '/submit', priority: 0.5, freq: 'monthly' as const },
    { path: '/contact', priority: 0.4, freq: 'monthly' as const },
    { path: '/privacy', priority: 0.2, freq: 'yearly' as const },
    { path: '/terms', priority: 0.2, freq: 'yearly' as const },
  ].map((route) => ({
    url: `${baseUrl}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.freq,
    priority: route.priority,
  }))

  // Dynamic tool pages
  const toolRoutes = (toolsData as any[]).map((tool: any) => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Dynamic blog pages
  const postsPath = path.join(process.cwd(), 'src/data/posts.json');
  let posts: any[] = [];
  if (fs.existsSync(postsPath)) {
    try {
      posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
    } catch {
      posts = [];
    }
  }

  const blogRoutes = posts.map((post: any) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Featured comparison routes (slugs verified to exist in tools.json)
  const slugSet = new Set((toolsData as any[]).map((t) => t.slug));
  const featuredComparisons = [
    'chatgpt-vs-claude',
    'slack-vs-discord',
    'notion-vs-trello',
  ].filter((pair) => {
    const [a, b] = pair.split('-vs-');
    return slugSet.has(a) && slugSet.has(b);
  });

  const comparisonRoutes = featuredComparisons.map((pair) => ({
    url: `${baseUrl}/compare/${pair}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...routes, ...toolRoutes, ...blogRoutes, ...comparisonRoutes]
}
