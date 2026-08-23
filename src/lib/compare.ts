/**
 * Karsilastirma ciftlerinin tek kaynagi.
 *
 * NEDEN VAR: /compare/<a>-vs-<b> rotasi her cift icin calisiyordu ama
 * sitemap'e elle uc adres yazilmisti ve biri (openai-vs-claude) hic var
 * olmayan bir slug'a isaret ediyordu. Yani en yuksek ticari niyetli sayfa
 * turu -- "X vs Y" -- arama motoruna hic sunulmuyordu.
 *
 * IKI SINIR BILEREK KONDU:
 *
 * 1. Yalnizca AYNI KATEGORI icindeki ciftler. "Figma vs QuickBooks"
 *    kimsenin aradigi bir sey degil; uretmek sadece ince sayfa yigini
 *    olusturur.
 * 2. Kategori basina en iyi KATEGORI_BASINA_TAVAN arac. 121 aracin tum
 *    kombinasyonu 7.260 sayfa eder; Google'a yeni gorunmeye baslamis bir
 *    sitede bu, tarama butcesini yakmaktan baska ise yaramaz. Tavan
 *    yukseltilebilir -- ama once bu sayfalarin indekslendigi gorulmeli.
 */

import toolsData from "@/data/tools.json";

export type Arac = {
  slug: string;
  name: string;
  category?: string;
  ease?: number;
  featuresScore?: number;
  basePrice?: number;
};

const araclar = toolsData as Arac[];

/** Kategori basina sitemap'e girecek en fazla arac sayisi. */
export const KATEGORI_BASINA_TAVAN = 10;

/** Kategori adlari tutarsiz yazilmis ("video editing" / "Design"). */
function kategoriAnahtari(k?: string): string {
  return (k || "diger").trim().toLowerCase();
}

/** Elimizdeki tek nesnel siralama olcutu: kullanim kolayligi + ozellik puani. */
function kalitePuani(t: Arac): number {
  return (t.ease ?? 0) + (t.featuresScore ?? 0);
}

/**
 * Cift adresinin KANONIK hali her zaman alfabetik sirada.
 * Boylece "slack-vs-notion" ve "notion-vs-slack" ayni sayfanin iki kopyasi
 * olarak indekslenmez.
 */
export function kanonikSlug(a: string, b: string): string {
  return a < b ? `${a}-vs-${b}` : `${b}-vs-${a}`;
}

/** Sitemap'e girecek karsilastirma adresleri. */
export function karsilastirmaCiftleri(): string[] {
  const kategoriler = new Map<string, Arac[]>();
  for (const t of araclar) {
    const k = kategoriAnahtari(t.category);
    if (!kategoriler.has(k)) kategoriler.set(k, []);
    kategoriler.get(k)!.push(t);
  }

  const ciftler: string[] = [];
  for (const grup of kategoriler.values()) {
    const secilenler = [...grup]
      .sort((a, b) => kalitePuani(b) - kalitePuani(a))
      .slice(0, KATEGORI_BASINA_TAVAN);

    for (let i = 0; i < secilenler.length; i++) {
      for (let j = i + 1; j < secilenler.length; j++) {
        ciftler.push(kanonikSlug(secilenler[i].slug, secilenler[j].slug));
      }
    }
  }
  // Ayni cift iki kategoriden gelemez ama yine de tekillestir.
  return [...new Set(ciftler)].sort();
}

/**
 * Bir aracin sayfasindan link verilecek karsilastirmalar.
 * Karsilastirma sayfalari aksi halde OKSUZ kalir: sitemap'te olurlar ama
 * siteden hicbir link almazlar, ki bu Google'a "onemsiz" sinyali verir.
 */
export function aracinKarsilastirmalari(slug: string, adet = 4): Arac[] {
  const arac = araclar.find((t) => t.slug === slug);
  if (!arac) return [];
  return araclar
    .filter(
      (t) => t.slug !== slug && kategoriAnahtari(t.category) === kategoriAnahtari(arac.category)
    )
    .sort((a, b) => kalitePuani(b) - kalitePuani(a))
    .slice(0, adet);
}
