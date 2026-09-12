import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { akranlar, alternatifSayfasiOlanlar, EN_AZ_ALTERNATIF } from "../src/lib/compare.ts";
import { alternatifIndekslenir } from "../src/lib/indeks.ts";
import { alternatifTaranmayaDeger } from "../src/lib/tarama.ts";
import type { Arac } from "../src/lib/arac.ts";

/**
 * SIRALANAN ADRESTE SERT 404.
 *
 * Olcum (GSC 90 gun, 2026-09-12): gosterim alan 61 alternatif sayfasinin
 * 20'si sitemap disindaydi ve 14'u `notFound()` cagirdigi icin **404**
 * donuyordu. Icinde /alternatives/gumroad vardi: 175 gosterim, sitenin
 * en yuksek talepli alternatif adresi, ve Google onu sonuclarda
 * gosterirken tiklayan hicbir sey bulmuyordu.
 *
 * Sebep akran esigiydi (3). Esik 2'ye indi; 2'nin de altinda kalan sayfa
 * artik 404 degil kategori sayfasina yonleniyor.
 */

const araclar = JSON.parse(readFileSync("src/data/tools.json", "utf8")) as Arac[];
const sayfa = readFileSync("src/app/alternatives/[slug]/page.tsx", "utf8");
const gsc = JSON.parse(readFileSync("src/data/gsc/latest.json", "utf8")) as {
  rows?: { page?: string; impressions?: number }[];
};

function talepliAlternatifler(): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of gsc.rows ?? []) {
    const e = (r.page || "").match(/\/alternatives\/([^/?#]+)/);
    if (e) m.set(e[1], (m.get(e[1]) || 0) + (r.impressions || 0));
  }
  return m;
}

test("esigin altinda 404 degil yonlendirme var", () => {
  assert.match(sayfa, /redirect\(`\/categories\/\$\{kategoriSlug\(tool\.category\)\}`\)/,
    "esik altinda kategori sayfasina yonlendirilmiyor");
  assert.ok(!/alts\.length < EN_AZ_ALTERNATIF\) notFound\(\)/.test(sayfa),
    "esik altinda hala notFound() cagriliyor -- siralanan adreste sert 404");
});

/** Gosterim alan ve iki kapidan gecen sayfa URETILMELI: 404 en kotu cevaptir. */
test("talepli alternatif sayfalari artik uretiliyor", () => {
  const uretilen = new Set(alternatifSayfasiOlanlar().map((t) => t.slug));
  const eksik: string[] = [];
  for (const [slug, gosterim] of talepliAlternatifler()) {
    const t = araclar.find((x) => x.slug === slug);
    if (!t) continue;
    if (akranlar(slug).length < EN_AZ_ALTERNATIF) continue; // yonlendiriliyor, 404 degil
    if (!alternatifIndekslenir(t) || !alternatifTaranmayaDeger(t)) continue;
    if (!uretilen.has(slug)) eksik.push(`${slug} (g${gosterim})`);
  }
  assert.deepEqual(eksik, [], `talep var, kapilar acik ama sayfa uretilmiyor:\n${eksik.join("\n")}`);
});

test("gumroad ornegi: 175 gosterimli sayfa artik uretiliyor", () => {
  assert.ok(akranlar("gumroad").length >= EN_AZ_ALTERNATIF,
    "gumroad akran sayisi esigin altina dustu");
  assert.ok(alternatifSayfasiOlanlar().some((t) => t.slug === "gumroad"),
    "gumroad alternatif sayfasi hala uretilmiyor");
});

/**
 * Esik 1'e DUSMEMELI: iki arac bir secim yapar, bir arac yapmaz.
 * "1 Best X Alternatives" hem yanlis hem de ince icerik olurdu.
 */
test("esik ikinin altina inmiyor", () => {
  assert.equal(EN_AZ_ALTERNATIF, 2, "esik degisti -- tek akranli sayfa 'alternatifler' degildir");
});

/** Az akranli sayfada baslik sayiyi one cikarmaz. */
test("baslik az akranda sayi basmiyor", () => {
  assert.match(sayfa, /alts\.length >= 3/, "baslik akran sayisina gore ayrilmiyor");
  assert.match(sayfa, /`Best \$\{tool\.name\} Alternatives in 2026`/, "az akran icin sayisiz baslik yok");
});

/**
 * KAPI, KORUMADIGI BIR IDDIA ICIN SAYFAYI KAPATIYORDU.
 *
 * Eski kural: alternatif sayfasi ancak ARACIN KENDI fiyati dogrulanmissa
 * indekslenir. Ama "gorgias alternatives" arayan kisinin ihtiyaci
 * ALTERNATIFLERIN rakamlari; aracin kendi fiyati yalnizca "sundan ucuz"
 * cumlesi icin gerekli ve o cumle zaten iki taraf da dogrulanmadikca
 * kurulmuyor (compare.ts/farkCumlesi).
 *
 * Olculdu (2026-09-12): gosterim alan 8 alternatif sayfasi (99 gosterim)
 * yalnizca bu yuzden noindex'ti -- gorgias 40, greenhouse 26, ionos 16.
 * Cogu kullanima-gore fiyatlanan arac: onlarda "baslangic fiyati" zaten yok.
 */
test("kendi fiyati dogrulanmayan arac, fiyatli alternatifleri varsa aciliyor", () => {
  for (const slug of ["gorgias", "ionos", "azure"]) {
    const t = araclar.find((x) => x.slug === slug);
    assert.ok(t, `${slug} katalogda yok`);
    assert.equal(alternatifIndekslenir(t), true,
      `${slug}: fiyatli akranlari var ama alternatif sayfasi hala noindex`);
  }
});

/** Fiyatli alternatifi olmayan arac ACILMAMALI: rakamsiz liste liste degildir. */
test("fiyatli alternatifi olmayan arac acilmiyor", () => {
  const t = araclar.find((x) => x.slug === "wise");
  assert.ok(t, "wise katalogda yok");
  assert.equal(alternatifIndekslenir(t), false,
    "wise'in fiyati dogrulanmis akrani yok; sayfa acilmamaliydi");
});

/** Esik iki fiyatli alternatif: bir secim icin iki rakam gerekir. */
test("kapi kaynaginda iki fiyatli akran sarti duruyor", () => {
  const kaynak = readFileSync("src/lib/indeks.ts", "utf8");
  assert.match(kaynak, /fiyatliAkranSayisi\(t!\.slug\) >= 2/, "iki fiyatli akran sarti kaybolmus");
});
