import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { unescape as htmlUnescape } from "node:querystring";

/**
 * BASLIK VE ACIKLAMA SAGLIGI (uretim ciktisi uzerinden).
 *
 * Olcum (2026-09-12, 2.297 uretilen sayfa): iki gercek sorun cikti --
 *   1. /blog kendi basligini hic tanimlamamis, kok layout'tan ANASAYFANIN
 *      basligini ve aciklamasini miras aliyordu. Ayni baslik iki adreste.
 *      Ustelik posts.json yok: sayfa bos ve 90 gunde 0 gosterim almis.
 *   2. /research/pricing-transparency basligi 67 karakterdi ve arama
 *      sonucunda kesiliyordu.
 *
 * Test uretim ciktisini tarar; .next yoksa sessizce atlanir (CI'da build
 * her zaman kosmuyor).
 */

const KOK = ".next/server/app";

function htmlDosyalari(dizin: string, biriken: string[] = []): string[] {
  let girisler;
  try {
    girisler = readdirSync(dizin);
  } catch {
    return biriken;
  }
  for (const g of girisler) {
    const tam = join(dizin, g);
    if (statSync(tam).isDirectory()) htmlDosyalari(tam, biriken);
    else if (g.endsWith(".html")) biriken.push(tam);
  }
  return biriken;
}

function coz(s: string): string {
  return s.replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

const dosyalar = htmlDosyalari(KOK);
const varMi = dosyalar.length > 0;

test("uretilen sayfalarda baslik 65 karakteri asmiyor", { skip: !varMi && "build yok" }, () => {
  const uzun: string[] = [];
  for (const f of dosyalar) {
    const s = readFileSync(f, "utf8");
    const t = /<title>([^<]*)<\/title>/.exec(s);
    if (!t) continue;
    const metin = coz(t[1]);
    // Olculen sey EKRANDA gorunen uzunluk: &amp; bes karakter yazilir,
    // bir karakter gorunur. Kacislari cozmeden olcmek yanlis alarm verir.
    if (metin.length > 65) uzun.push(`${f.slice(KOK.length)} (${metin.length}): ${metin}`);
  }
  assert.deepEqual(uzun, [], `arama sonucunda kesilecek baslik:\n${uzun.join("\n")}`);
});

test("indekslenebilir iki sayfa ayni basligi paylasmiyor", { skip: !varMi && "build yok" }, () => {
  const gorulen = new Map<string, string>();
  const cakisan: string[] = [];
  for (const f of dosyalar) {
    const s = readFileSync(f, "utf8");
    const r = /<meta name="robots" content="([^"]*)"/.exec(s);
    if (r && r[1].includes("noindex")) continue;
    const t = /<title>([^<]*)<\/title>/.exec(s);
    if (!t) continue;
    const metin = coz(t[1]);
    const yol = f.slice(KOK.length);
    const onceki = gorulen.get(metin);
    if (onceki) cakisan.push(`"${metin}" → ${onceki} + ${yol}`);
    else gorulen.set(metin, yol);
  }
  assert.deepEqual(cakisan, [], `ayni basligi beyan eden indekslenebilir sayfalar:\n${cakisan.join("\n")}`);
});

test("bos yazi listesi indekslenmiyor", () => {
  const kaynak = readFileSync("src/app/blog/page.tsx", "utf8");
  assert.match(kaynak, /robots: yazilar\.length > 0 \? undefined : NOINDEX/,
    "bos blog sayfasi noindex almiyor");
  assert.match(kaynak, /title: "SaaS Insights/, "blog kendi basligini tanimlamiyor");
});
