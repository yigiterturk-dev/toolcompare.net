import { MetadataRoute } from 'next'
import toolsData from '@/data/tools.json'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://toolcompare.net'
  
  // Base pages
  const routes = [
    '',
    '/categories',
    '/top-picks',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 1,
  }))

  // Dynamic tool pages
  const toolRoutes = toolsData.map((tool: any) => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...routes, ...toolRoutes]
}
