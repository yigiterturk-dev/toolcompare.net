/**
 * AFFILIATE BASVURU SIRASI -- tahmine gore degil, GERCEK TRAFIGE gore.
 *
 * DENETIMDE BULUNAN (2026-09-07): docs/affiliate-basvuru.md fiyat ve
 * kategori tahminiyle yazilmisti. Olculdu: arac sayfasi gosteriminin
 * yalnizca %8,5'i o listedeki araclara geliyor. Yani para plani
 * trafigin geldigi yerden kopuktu.
 *
 * Bu betik iki kaynagi birlestirir:
 *   src/data/gsc/latest.json          -- gercekte nereye trafik geliyor
 *   src/data/affiliate-programlar.json -- o saticinin programi var mi
 *
 * Cikti: once basvurulacak araclar, gosterime gore.
 *
 * Kullanim: npx tsx scripts/affiliate-sira.ts
 */
import "./env.ts";
import araclar from "../src/data/tools.json" with { type: "json" };
import gsc from "../src/data/gsc/latest.json" with { type: "json" };
import programlar from "../src/data/affiliate-programlar.json" with { type: "json" };

type Satir = { page: string; impressions: number; clicks: number };
type Program = { durum: string; ag?: string; url?: string; kosul?: string; neden?: string };

const P = (programlar as any).programlar as Record<string, Program>;
const satirlar = ((gsc as any).rows ?? (gsc as any).data ?? gsc) as Satir[];

const gosterim = new Map<string, number>();
for (const r of satirlar) {
  const m = r.page.match(/\/tools\/([^/?#]+)/);
  if (!m) continue;
  gosterim.set(m[1], (gosterim.get(m[1]) ?? 0) + r.impressions);
}

const ad = new Map((araclar as any[]).map((t) => [t.slug, t.name as string]));
const sirali = [...gosterim].sort((a, b) => b[1] - a[1]);
const toplam = sirali.reduce((s, [, i]) => s + i, 0);

const kova = { var: 0, kurumsal: 0, yok: 0, bilinmiyor: 0 } as Record<string, number>;
for (const [slug, imp] of sirali) kova[P[slug]?.durum ?? "bilinmiyor"] += imp;

const yuzde = (n: number) => `%${((n / toplam) * 100).toFixed(1)}`;

console.log(`arac sayfasi gosterimi (90 gun): ${toplam}\n`);
console.log("--- gosterim nereye gidiyor ---");
console.log(`  program VAR        ${String(kova.var).padStart(5)}  ${yuzde(kova.var)}   <-- para kazanilabilir`);
console.log(`  kurumsal satis     ${String(kova.kurumsal).padStart(5)}  ${yuzde(kova.kurumsal)}`);
console.log(`  program YOK        ${String(kova.yok).padStart(5)}  ${yuzde(kova.yok)}`);
console.log(`  bilinmiyor         ${String(kova.bilinmiyor).padStart(5)}  ${yuzde(kova.bilinmiyor)}`);

console.log("\n--- 1. SIRADA BASVUR (program dogrulandi, trafik var) ---");
for (const [slug, imp] of sirali) {
  const p = P[slug];
  if (p?.durum !== "var") continue;
  console.log(`  ${String(imp).padStart(4)} gos | ${(ad.get(slug) ?? slug).padEnd(14)} | ${p.url}`);
  if (p.kosul) console.log(`            ${p.kosul}`);
}

console.log("\n--- 2. ONCE ARASTIR (trafik var, program bilinmiyor) ---");
for (const [slug, imp] of sirali) {
  if ((P[slug]?.durum ?? "bilinmiyor") !== "bilinmiyor" || imp < 20) continue;
  console.log(`  ${String(imp).padStart(4)} gos | ${ad.get(slug) ?? slug}`);
}

console.log("\n--- 3. PARA CIKMAZ (trafigi var ama satici odemez) ---");
let n = 0;
for (const [slug, imp] of sirali) {
  const p = P[slug];
  if (!p || (p.durum !== "yok" && p.durum !== "kurumsal") || n >= 10) continue;
  n++;
  console.log(`  ${String(imp).padStart(4)} gos | ${(ad.get(slug) ?? slug).padEnd(16)} | ${p.durum}: ${p.neden}`);
}
