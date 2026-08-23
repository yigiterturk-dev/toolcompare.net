/**
 * Kategorilerin tek kaynagi.
 *
 * IKI SORUNU BIRDEN COZUYOR:
 *
 * 1. Kategori adlari veride tutarsiz yazilmis: "Design" ve "Developer
 *    Tools" buyuk harfle, "video editing" ve "payment gateway" kucuk
 *    harfle. Ayni kategori iki farkli yazimla gelirse iki ayri kategori
 *    gibi gorunur. tools.json'a DOKUNULMUYOR -- normallestirme okuma
 *    aninda yapiliyor, boylece anasayfanin mevcut filtresi bozulmuyor.
 *
 * 2. Kategorilerin kendi sayfasi yoktu. /categories, /?category=X gibi
 *    sorgu adreslerine link veriyordu; arama motoru sorgu parametresini
 *    ayri bir sayfa saymaz. Yani "best CRM software" gibi en degerli
 *    aramalarin inecegi hicbir adres yoktu.
 */

import toolsData from "@/data/tools.json";

export type Arac = {
  slug: string;
  name: string;
  category?: string;
  ease?: number;
  featuresScore?: number;
  basePrice?: number;
  isFlat?: boolean;
  shortDescription?: string;
};

export type Kategori = {
  slug: string;
  ad: string;
  araclar: Arac[];
};

const araclar = toolsData as Arac[];

export function kategoriSlug(ad: string): string {
  return ad.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** "video editing" -> "Video Editing" */
function baslikYap(ad: string): string {
  return ad
    .trim()
    .split(/\s+/)
    .map((k) => k.charAt(0).toUpperCase() + k.slice(1).toLowerCase())
    .join(" ");
}

function kalitePuani(t: Arac): number {
  return (t.ease ?? 0) + (t.featuresScore ?? 0);
}

/** Kategoriler, arac sayisina gore coktan aza. */
export function kategoriler(): Kategori[] {
  const gruplar = new Map<string, { ad: string; araclar: Arac[] }>();

  for (const t of araclar) {
    const ham = t.category || "Other";
    const slug = kategoriSlug(ham);
    if (!gruplar.has(slug)) gruplar.set(slug, { ad: baslikYap(ham), araclar: [] });
    gruplar.get(slug)!.araclar.push(t);
  }

  return [...gruplar.entries()]
    .map(([slug, g]) => ({
      slug,
      ad: g.ad,
      araclar: [...g.araclar].sort((a, b) => kalitePuani(b) - kalitePuani(a)),
    }))
    .sort((a, b) => b.araclar.length - a.araclar.length);
}

export function kategoriBul(slug: string): Kategori | undefined {
  return kategoriler().find((k) => k.slug === slug);
}

/**
 * Sitemap'e girecek kategoriler.
 *
 * ALT SINIR: "Best X Tools in 2026" basligi altinda bir-iki secenek
 * gostermek ziyaretciye de arama motoruna da degersiz gelir. Denetimde
 * olculdu: tek araclik kategoriler 178 kelimede kaliyordu.
 * Sayfa yine ERISILEBILIR kalir (siteden link alir), sadece Google'a
 * "bunu indeksle" diye ilan edilmez.
 */
export const EN_AZ_ARAC = 3;

export function sitemapKategorileri(): Kategori[] {
  return kategoriler().filter((k) => k.araclar.length >= EN_AZ_ARAC);
}
