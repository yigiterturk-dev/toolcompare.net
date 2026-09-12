import test from "node:test";
import assert from "node:assert/strict";
import { sitemapCiftleri, karsilastirmaAkranlari, kanonikSlug, oneCikanCiftler } from "../src/lib/compare.ts";
import { entegrasyonVar } from "../src/lib/entegrasyon.ts";

/*
  OLCULEN (2026-09-09): sitemap'teki 1.314 karsilastirma sayfasinin 641'i
  (%49) YALNIZCA BIR arac sayfasindan link aliyordu. Akranlik tek yonlu
  olabiliyor: A'nin ilk 5'inde B varsa cift sitemap'e giriyor, ama B'nin
  ilk 5'inde A yoksa B'nin sayfasi o karsilastirmaya link vermiyordu.
  URL Inspection ornegi bunu dogruladi: indekslenen sayfalarin hepsi cift
  yonlu, indekslenmeyenlerin cogu tek yonlu.

  KURAL: Google'dan indekslemesini istedigimiz her cift sayfasi, IKI
  aracinin sayfasindan da link almali. Sitemap ile ic linkleme ayrisamaz.
*/

test("sitemap'teki her cift, iki aracinin listesinde de gorunur", () => {
  // One cikan ciftler linkini ANASAYFADAN alir, akranliktan degil; yetim
  // olmadiklari icin bu kuralin disindalar.
  const oneCikan = new Set(oneCikanCiftler().map((c) => c.slug));
  /*
    Entegrasyon ciftleri de bu kuralin disinda (2026-09-12): linklerini
    akranliktan degil, arac sayfasindaki "Does X work with..." listesinden
    alirlar -- ve o liste IKI taraftan da basildigi icin simetri korunur,
    yalnizca kaynagi baskadir. Akran olamazlar: farkli is goruyorlar.
  */
  const ciftler = sitemapCiftleri()
    .filter((c) => !oneCikan.has(c))
    .filter((c) => !entegrasyonVar(...(c.split("-vs-") as [string, string])));
  const eksik: string[] = [];
  for (const cift of ciftler) {
    const [a, b] = cift.split("-vs-");
    const aListesi = karsilastirmaAkranlari(a).map((t) => kanonikSlug(a, t.slug));
    const bListesi = karsilastirmaAkranlari(b).map((t) => kanonikSlug(b, t.slug));
    if (!aListesi.includes(cift) || !bListesi.includes(cift)) eksik.push(cift);
  }
  assert.equal(eksik.length, 0, `tek yonlu kalan ${eksik.length} cift, ornek: ${eksik.slice(0, 5).join(", ")}`);
});

test("karsilastirmaAkranlari kendini akran saymaz ve tekrar uretmez", () => {
  const l = karsilastirmaAkranlari("slack").map((t) => t.slug);
  assert.ok(!l.includes("slack"));
  assert.equal(new Set(l).size, l.length);
});

/*
  OLCULEN (2026-09-09): sitemap'te 584 karsilastirma cifti var ama 15'i
  HIC ic link almiyordu. Sebep: arac sayfasi listeyi yalnizca
  EN_AZ_ALTERNATIF (3) kosulunda basiyordu, uc alti karsilastirmasi olan
  aracin sayfasi hicbirine link vermiyordu. Iki tarafi da esik alti olan
  41 cift boyle yetim kaliyordu -- icinde dbeaver-vs-tableplus gibi,
  arac sayfasi ayda 559 gosterim alan ciftler var.

  Esigin isi "alternatifler siralandi" iddiasini korumak; var olan bir
  sayfaya link vermeyi engellemek degil.
*/
test("sitemap'teki her cift, en az bir aracinin listesinde yer alir", () => {
  const oneCikan = new Set(oneCikanCiftler().map((c) => c.slug));
  const yetim = sitemapCiftleri()
    .filter((c) => !oneCikan.has(c))
    // Entegrasyon cifti linkini arac sayfasindaki "Does X work with..."
    // listesinden alir, akranliktan degil (2026-09-12).
    .filter((c) => !entegrasyonVar(...(c.split("-vs-") as [string, string])))
    .filter((c) => {
      const [a, b] = c.split("-vs-");
      return karsilastirmaAkranlari(a).length === 0 && karsilastirmaAkranlari(b).length === 0;
    });
  assert.equal(yetim.length, 0, `hicbir arac sayfasindan link almayan ${yetim.length} cift`);
});
