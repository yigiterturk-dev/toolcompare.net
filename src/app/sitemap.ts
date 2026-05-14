import { MetadataRoute } from 'next'
import toolsData from '@/data/tools.json'
import fs from 'fs';
import path from 'path';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://toolcompare.net'
  
  // Base pages
  const routes = [
    '',
    '/blog',
    '/top-picks',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1,
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
  let posts = [];
  if (fs.existsSync(postsPath)) {
    posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
  }
  
  const blogRoutes = posts.map((post: any) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Smart Comparison Routes (Common ones)
  const comparisonRoutes = [
    { url: `${baseUrl}/compare/openai-vs-claude`, lastModified: new Date(), priority: 0.6 },
    { url: `${baseUrl}/compare/slack-vs-discord`, lastModified: new Date(), priority: 0.6 },
    { url: `${baseUrl}/compare/notion-vs-trello`, lastModified: new Date(), priority: 0.6 }
  ]

  return [...routes, ...toolRoutes, ...blogRoutes, ...comparisonRoutes]
}
