import { MetadataRoute } from 'next'
import toolsData from '@/data/tools.json'
import type { Arac } from '@/lib/arac'
import { sitemapCiftleri, alternatifSayfasiOlanlar } from '@/lib/compare'
import { sitemapKategorileri } from '@/lib/categories'
import { aracTaranmayaDeger, alternatifTaranmayaDeger } from '@/lib/tarama'
import { aracIndekslenir, alternatifIndekslenir } from '@/lib/indeks'
import { aracTarihi, turetilmisTarih, tarihNesnesi, enYeni, TABAN_TARIH } from '@/lib/degisiklik'
import { entegrasyonKaydi } from '@/lib/entegrasyon'
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
    // Karsilastirma giris kapisi. Footer her sayfadan buraya link
    // veriyordu ama sayfa YOKTU (canlida 404) -- 2026-09-10'da eklendi.
    '/compare',
    // Alternatif giris kapisi. /compare ve /categories'in kapisi vardi,
    // bunun yoktu -- adres canlida 404 donuyordu (olcum 2026-09-12).
    '/alternatives',
    // Footer'dan link alan ama sitemap'te olmayan sayfalar.
    '/contact',
    '/privacy',
    '/terms',
    '/methodology',
    '/data',
    /*
      Olcum sayfasi (2026-09-11). Sitenin tek amaci link olan sayfasi:
      GSC Links raporu bu domain icin bos donuyor, ortalama sira 54 ve
      sebebi otorite eksigi. Alintilanacak sayfa sitemap'te olmazsa
      is gormez.
    */
    '/research/pricing-transparency',
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
  // IKINCI KAPI (2026-09-10): indekslenebilir olmak sitemap'e girmeye
  // yetmiyor. Olculdu: 1.234 adresin 355'inin (%29) ne cifte/araca OZGU
  // bir icerigi ne de olculmus talebi vardi. Google'in "taramaya degmez"
  // karari SITE basina veriliyor -- bos adres, hak eden sayfayi da
  // bekletiyor. Elenen sayfa silinmez, noindex de olmaz; icerigi
  // buyudugu an kapidan kendiliginden geri girer (bkz. lib/tarama.ts).
  const toolRoutes = (toolsData as Arac[]).filter((t) => aracIndekslenir(t) && aracTaranmayaDeger(t)).map((tool) => ({
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
  // Kapi artik sitemapCiftleri()'nin ICINDE (bkz. lib/compare.ts): ayni
  // liste kategori ve /top-picks linklerini de besliyor, tek yerden
  // suzulmesi gerekiyordu.
  /*
    DENETIMDE BULUNAN (2026-09-13): lastmod yalnizca iki aracin tarihinden
    turetiliyordu; entegrasyon kaydinin `checkedAt`'i hesaba girmiyordu.
    Oysa kayit acmak sayfanin BASLIGINI ve meta aciklamasini bastan yaziyor
    ("Does X work with Y?"). 2026-09-12'de boyle degistirilen alti sayfa
    sitemap'te hala 09-07/09-08/09-10 ilan ediyordu -- yani icerik degisti,
    Google'a giden sinyal degismedi. Tarih yine VERIDEN geliyor: kaydin
    kendi checkedAt'i, arac tarihleriyle birlikte en yenisi aliniyor.
  */
  const comparisonRoutes = sitemapCiftleri().map((cift) => {
    const [a, b] = cift.split('-vs-')
    const kayit = entegrasyonKaydi(a, b)
    return {
      url: `${baseUrl}/compare/${cift}`,
      lastModified: tarihNesnesi(
        enYeni(
          turetilmisTarih([a, b].map((slug) => aracHaritasi.get(slug))),
          kayit?.checkedAt,
        ),
      ),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }
  })

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
  const alternativeRoutes = alternatifSayfasiOlanlar()
    .filter((t) => alternatifIndekslenir(t) && alternatifTaranmayaDeger(t))
    .map((t) => ({
    url: `${baseUrl}/alternatives/${t.slug}`,
    lastModified: tarihNesnesi(aracTarihi(t)),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...routes, ...toolRoutes, ...categoryRoutes, ...alternativeRoutes, ...blogRoutes, ...comparisonRoutes]
}
