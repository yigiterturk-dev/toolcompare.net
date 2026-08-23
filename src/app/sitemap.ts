import { MetadataRoute } from 'next'
import toolsData from '@/data/tools.json'
import { karsilastirmaCiftleri } from '@/lib/compare'
import { kategoriler } from '@/lib/categories'
import fs from 'fs';
import path from 'path';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://toolcompare.net'
  
  // Base pages
  const routes = [
    '',
    '/blog',
    '/top-picks',
    // /categories sitemap'te hic yoktu.
    '/categories',
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

  // Karsilastirma sayfalari.
  // Onceki hali elle yazilmis uc adresti ve biri (openai-vs-claude) var
  // olmayan bir slug'a isaret ediyordu -- Google'a 404 ilan ediliyordu.
  // Artik ciftler veriden uretiliyor; sinirlar src/lib/compare.ts'te.
  const comparisonRoutes = karsilastirmaCiftleri().map((cift) => ({
    url: `${baseUrl}/compare/${cift}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Kategori sayfalari ("Best X Tools in 2026"). Bu sayfa turu yeni;
  // once yalnizca /?category=X sorgu adresi vardi ve o indekslenmiyordu.
  const categoryRoutes = kategoriler().map((k) => ({
    url: `${baseUrl}/categories/${k.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  return [...routes, ...toolRoutes, ...categoryRoutes, ...blogRoutes, ...comparisonRoutes]
}
