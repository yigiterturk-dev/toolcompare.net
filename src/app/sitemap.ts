import { MetadataRoute } from 'next'
import toolsData from '@/data/tools.json'
import type { Arac } from '@/lib/arac'
import { sitemapCiftleri, alternatifSayfasiOlanlar } from '@/lib/compare'
import { sitemapKategorileri } from '@/lib/categories'
import { aracIndekslenir, alternatifIndekslenir } from '@/lib/indeks'
import { aracTarihi, turetilmisTarih, tarihNesnesi, TABAN_TARIH } from '@/lib/degisiklik'
import fs from 'fs';
import path from 'path';

/*
  DENETIMDE BULUNAN (2026-09-07): lastmod duzeltmesi yayina cikmadi.
  Icerik degisiklikleri dakikalar icinde canliya girerken /sitemap.xml
  30+ dakika eski kaldi ve `x-nextjs-cache: HIT` dondu -- yani sitemap
  build aninda uretilip sunucudaki route onbelleginde suresiz duruyor.
  Onde duran LiteSpeed katmani degil (onbellek basligi `must-revalidate`),
  Next'in kendi tam-route onbellegi.

  Gunluk yeniden dogrulama: sunucu yeni build'i alsa bile eski girdiyi
  sonsuza kadar servis edemez. Cikti veriden uretildigi icin (bkz.
  degisiklik.ts) yeniden dogrulama ayni veriyle ayni sonucu verir --
  yani bu ayar sitemap'i dalgalandirmaz, sadece takilmasini engeller.
*/
export const revalidate = 86400

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://toolcompare.net'

  /*
    DENETIMDE BULUNAN (2026-09-07): asagidaki her adres lastModified
    olarak `new Date()` yaziyordu -- her build'de 1.293 adresin TAMAMI
    "bugun degisti" diyordu. Google boyle bir sitemap'te lastmod'u
    tamamen yok sayar; gercekten degisen sayfalarin sinyali kayboluyordu.
    Tarih artik veriden geliyor (bkz. src/lib/degisiklik.ts): ayni veri
    ayni tarihi verir, build tekrari sitemap'i degistirmez.
  */
  const aracHaritasi = new Map((toolsData as Arac[]).map((t) => [t.slug, t]))
  
  // Base pages
  // /blog BILEREK yok: posts.json hic olusmadigi icin sayfa bos, ustelik
  // siteden hic link de almiyordu (oksuz). Bos bir sayfayi en yuksek
  // oncelikle ilan etmek Google'a yanlis sinyal. Yazi eklenince
  // asagidaki blogRoutes zaten kendiliginden dolar; o zaman buraya da
  // geri konur.
  const routes = [
    '',
    '/top-picks',
    // /categories sitemap'te hic yoktu.
    '/categories',
    // Footer'dan link alan ama sitemap'te olmayan sayfalar.
    '/contact',
    '/privacy',
    '/terms',
    '/methodology',
    '/data',
    '/about',
    '/affiliate-disclosure',
    // Metodoloji sayfasindan link aliyor; sitemap disinda kalmasin.
    '/submit',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: tarihNesnesi(TABAN_TARIH),
    changeFrequency: 'daily' as const,
    priority: 1,
  }))

  // Dynamic tool pages
  // KAPI: yalnizca incelenmis araclar. Incelenmemis kayit sadece ad +
  // fiyattan ibaret; Google bunlari "Discovered - currently not indexed"
  // diye geri ceviriyordu ve tarama butcesini yiyordu.
  const toolRoutes = (toolsData as Arac[]).filter((t) => aracIndekslenir(t)).map((tool) => ({
    url: `${baseUrl}/tools/${tool.slug}`,
    lastModified: tarihNesnesi(aracTarihi(tool)),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Dynamic blog pages
  const postsPath = path.join(process.cwd(), 'src/data/posts.json');
  let posts = [];
  if (fs.existsSync(postsPath)) {
    posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
  }
  
  type Yazi = { slug: string; date?: string }
  const blogRoutes = (posts as Yazi[]).map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: tarihNesnesi(post.date ?? TABAN_TARIH),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Karsilastirma sayfalari.
  // Onceki hali elle yazilmis uc adresti ve biri (openai-vs-claude) var
  // olmayan bir slug'a isaret ediyordu -- Google'a 404 ilan ediliyordu.
  // Artik ciftler veriden uretiliyor; sinirlar src/lib/compare.ts'te.
  const comparisonRoutes = sitemapCiftleri().map((cift) => ({
    url: `${baseUrl}/compare/${cift}`,
    lastModified: tarihNesnesi(
      turetilmisTarih(cift.split('-vs-').map((slug) => aracHaritasi.get(slug))),
    ),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Kategori sayfalari ("Best X Tools in 2026"). Bu sayfa turu yeni;
  // once yalnizca /?category=X sorgu adresi vardi ve o indekslenmiyordu.
  const categoryRoutes = sitemapKategorileri().map((k) => ({
    url: `${baseUrl}/categories/${k.slug}`,
    lastModified: tarihNesnesi(turetilmisTarih(k.araclar)),
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  // "X alternatives" sayfalari. Ucuncu buyuk arama kalibi; bu niyetle
  // gelen ziyaretci zaten ayrilmaya karar vermis oluyor.
  // KAPI: bu sayfanin tek iddiasi "su fiyata su secenekler"; fiyat
  // dogrulanmamissa sayfanin soyleyecek sozu yok.
  const alternativeRoutes = alternatifSayfasiOlanlar().filter((t) => alternatifIndekslenir(t)).map((t) => ({
    url: `${baseUrl}/alternatives/${t.slug}`,
    lastModified: tarihNesnesi(aracTarihi(t)),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...routes, ...toolRoutes, ...categoryRoutes, ...alternativeRoutes, ...blogRoutes, ...comparisonRoutes]
}
