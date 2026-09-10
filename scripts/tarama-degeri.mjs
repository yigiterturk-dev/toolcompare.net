#!/usr/bin/env node
/**
 * TARAMA DEGERI RAPORU.
 *
 * NEDEN VAR (2026-09-10): Google'in "taramaya degmez" karari sayfa
 * basina degil SITE basina veriliyor. 1.259 adresin cogu zayifsa,
 * Google sonraki taramalari da kisar ve iyi sayfalar da bekler.
 * Bu script her sitemap adresini iki soruyla olcer:
 *
 *   1) AYIRT EDICI bir seyi var mi? (plan merdiveni, elle yazilmis
 *      soru, SSS, derin govde) -- yoksa sayfa sablonun kopyasidir
 *   2) TALEP gormus mu? (GSC'de gosterim) -- Google zaten gosteriyorsa
 *      sayfa hakkinda karar vermistir, elemek yanlis olur
 *
 * Ikisi de yoksa adres sitemap'te yer kapliyor demektir. Script
 * KENDILIGINDEN SILMEZ; sayilari verir, karar insanindir.
 *
 * Kullanim: node scripts/tarama-degeri.mjs
 */
import fs from "node:fs";

const araclar = JSON.parse(fs.readFileSync("src/data/tools.json", "utf8"));
const arr = Array.isArray(araclar) ? araclar : araclar.tools;
const bySlug = new Map(arr.map((t) => [t.slug, t]));

const notlar = JSON.parse(fs.readFileSync("src/data/karsilastirma-notlari.json", "utf8"));
const elleNot = new Set(Object.keys(notlar).filter((k) => !k.startsWith("_")));

let gsc = { rows: [] };
try {
  gsc = JSON.parse(fs.readFileSync("src/data/gsc/latest.json", "utf8"));
} catch {
  console.log("uyari: gsc/latest.json yok, talep sutunu bos kalir");
}
const gosterim = new Map();
for (const r of gsc.rows ?? []) {
  const yol = r.page.replace(/^https?:\/\/[^/]+/, "").replace(/\/$/, "");
  gosterim.set(yol, (gosterim.get(yol) ?? 0) + r.impressions);
}

const merdivenli = (slug) => (bySlug.get(slug)?.planlar ?? []).length >= 2;
const sssli = (slug) => (bySlug.get(slug)?.sss ?? []).length > 0;
const derin = (slug) => Boolean(bySlug.get(slug)?.bestFor && bySlug.get(slug)?.skipIf);

function ayirtEdici(yol) {
  if (yol.startsWith("/compare/")) {
    const cift = yol.slice("/compare/".length);
    const [a, b] = cift.split("-vs-");
    if (elleNot.has(cift)) return "elle-not";
    if (merdivenli(a) && merdivenli(b)) return "cift-merdiven";
    if (merdivenli(a) || merdivenli(b)) return "tek-merdiven";
    return null;
  }
  if (yol.startsWith("/alternatives/")) {
    const slug = yol.slice("/alternatives/".length);
    /* Alternatif sayfasinin ayirt ediciligi akranlarindan gelir:
       en az biri merdivenliyse sayfada gercek rakam basiliyor. */
    return merdivenli(slug) ? "merdiven" : null;
  }
  if (yol.startsWith("/tools/")) {
    const slug = yol.slice("/tools/".length);
    if (sssli(slug)) return "sss";
    if (merdivenli(slug)) return "merdiven";
    if (derin(slug)) return "derin-govde";
    return null;
  }
  return "sabit-sayfa";
}

const { sitemapCiftleri, alternatifSayfasiOlanlar } = await import("../src/lib/compare.ts");
const { aracIndekslenir, alternatifIndekslenir } = await import("../src/lib/indeks.ts");
const { aracTaranmayaDeger, alternatifTaranmayaDeger } = await import("../src/lib/tarama.ts");

/*
  Adres listesi sitemap ile AYNI kapilardan gecer; yoksa rapor
  yayimlanmayan adresleri sayar ve olculen sey gercek olmaz.
  (sitemapCiftleri zaten iki kapiyi da iceriden uyguluyor.)
*/
const adresler = [
  ...arr.filter((t) => aracIndekslenir(t) && aracTaranmayaDeger(t)).map((t) => `/tools/${t.slug}`),
  ...sitemapCiftleri().map((c) => `/compare/${c}`),
  ...alternatifSayfasiOlanlar()
    .filter((t) => alternatifIndekslenir(t) && alternatifTaranmayaDeger(t))
    .map((t) => `/alternatives/${t.slug}`),
];

const bolumler = new Map();
for (const yol of adresler) {
  const bolum = "/" + yol.split("/")[1];
  const b = bolumler.get(bolum) ?? { toplam: 0, ayirt: 0, talep: 0, ikisiDe: 0, hicbiri: [] };
  b.toplam++;
  const a = ayirtEdici(yol);
  const g = gosterim.get(yol) ?? 0;
  if (a) b.ayirt++;
  if (g > 0) b.talep++;
  if (a && g > 0) b.ikisiDe++;
  if (!a && g === 0) b.hicbiri.push(yol);
  bolumler.set(bolum, b);
}

console.log("BOLUM           adres  ayirtedici  talepgormus  ikisi-de  NE-OLAN-NE-BUNU");
let toplamAtil = 0;
for (const [bolum, b] of [...bolumler.entries()].sort((x, y) => y[1].toplam - x[1].toplam)) {
  toplamAtil += b.hicbiri.length;
  console.log(
    bolum.padEnd(15) +
      String(b.toplam).padStart(5) +
      String(b.ayirt).padStart(12) +
      String(b.talep).padStart(13) +
      String(b.ikisiDe).padStart(10) +
      String(b.hicbiri.length).padStart(17) +
      ` (%${Math.round((100 * b.hicbiri.length) / b.toplam)})`
  );
}
console.log(
  `\nTOPLAM ${adresler.length} adres · ayirt edicisi de talebi de olmayan: ${toplamAtil} (%${Math.round((100 * toplamAtil) / adresler.length)})`
);

if (process.argv.includes("--liste")) {
  console.log("\n--- ne ayirt edicisi ne talebi olanlar (ilk 40) ---");
  for (const [, b] of bolumler) for (const y of b.hicbiri.slice(0, 40)) console.log("  " + y);
}
