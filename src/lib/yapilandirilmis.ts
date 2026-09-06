/**
 * Yapilandirilmis veri (JSON-LD) uretici.
 *
 * DENETIMDE BULUNDU (2026-08-24): 674 sayfanin yalnizca 122'sinde
 * yapilandirilmis veri vardi. Karsilastirma (418), alternatif (113) ve
 * kategori (17) sayfalari -- yani sitenin en kalabalik ve en yuksek
 * ticari niyetli gruplari -- Google'a "bu sayfa neyi listeliyor" bilgisini
 * hic vermiyordu.
 *
 * KURAL (arac sayfasindaki disiplinin aynisi): buraya YALNIZCA sayfada
 * GERCEKTEN GORUNEN ve elimizde olan bilgi konur. Uydurma yildiz puani,
 * uydurma yorum sayisi yok -- Google zengin sonuclarda buna yaptirim
 * uyguluyor ve zaten yanlis beyan olurdu.
 */

const TABAN = "https://toolcompare.net";

export type ListeOgesi = { slug: string; name: string };

/**
 * Sirali arac listesi. Kategori, alternatif ve karsilastirma sayfalarinin
 * hepsi ozunde "su araclari su sirayla listeliyorum" diyor.
 */
export function listeSemasi(baslik: string, sayfaYolu: string, ogeler: ListeOgesi[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: baslik,
    url: `${TABAN}${sayfaYolu}`,
    numberOfItems: ogeler.length,
    itemListElement: ogeler.map((o, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: o.name,
      url: `${TABAN}/tools/${o.slug}`,
    })),
  };
}

/** Sayfanin sitedeki yeri. Arama sonucunda kirinti yolu olarak cikar. */
export function kirintiSemasi(basamaklar: { ad: string; yol: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: basamaklar.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.ad,
      item: `${TABAN}${b.yol}`,
    })),
  };
}

/**
 * SSS semasi.
 *
 * DENETIMDE BULUNDU (2026-09-07): arac sayfasinda SSS bloğu GORUNUYORDU
 * ama yapilandirilmis veriye HIC konmuyordu. GSC verisi bunun bedelini
 * gosteriyor: /tools/wix-studio ciplak marka teriminde 24. sirada, ama
 * "wix studio pricing" 82., "wix studio free" 44. sirada -- yani sayfanin
 * cevabini verdigi sorularda en kotu durumda. Google sorunun cevabinin
 * o sayfada oldugunu bilmiyor.
 *
 * KURAL (dosyanin geri kalaniyla ayni): buraya yalnizca sayfada GERCEKTEN
 * gorunen soru-cevaplar konur. Sayfada olmayan bir soruyu semaya koymak
 * Google'in "yapilandirilmis veri sayfa iceriginle eslesmeli" kuralini
 * cigner ve zengin sonuc yaptirimi sebebidir.
 */
export function sssSemasi(sorular: { soru: string; cevap: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: sorular.map((s) => ({
      "@type": "Question",
      name: s.soru,
      acceptedAnswer: { "@type": "Answer", text: s.cevap },
    })),
  };
}
