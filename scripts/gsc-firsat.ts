/**
 * Kaydedilmis GSC anlik goruntusunden hizli kazanc listesi cikarir.
 * Model cagirmaz, aga cikmaz — bedava.
 */
import { readFile } from "node:fs/promises";
import { findOpportunities, summarizeByPage, type SearchRow } from "../src/lib/gsc.ts";

async function main() {
  const dosya = new URL("../src/data/gsc/latest.json", import.meta.url);
  let veri: { site?: string; startDate?: string; endDate?: string; rows: SearchRow[] };
  try {
    veri = JSON.parse(await readFile(dosya, "utf8"));
  } catch {
    console.log("Once veri cek: npm run gsc:senkron");
    return;
  }

  const rows = veri.rows ?? [];
  console.log(`${veri.site} · ${veri.startDate} → ${veri.endDate} · ${rows.length} satir\n`);

  const firsatlar = findOpportunities(rows);
  if (!firsatlar.length) {
    console.log("8-25. sirada gosterim alan sorgu yok. Site ya hic gorunmuyor ya da zaten ust siralarda.");
  } else {
    console.log("--- hizli kazanc: talep var, sira eksik ---");
    for (const item of firsatlar) {
      console.log(`  ${String(Math.round(item.position)).padStart(3)}. sira · ${String(item.impressions).padStart(5)} gosterim · ${item.query}`);
      console.log(`        ${item.page}`);
    }
  }

  const sayfalar = summarizeByPage(rows, 15);
  if (sayfalar.length) {
    console.log("\n--- en cok gosterim alan sayfalar ---");
    for (const sayfa of sayfalar) {
      console.log(`  ${String(sayfa.impressions).padStart(6)} gosterim ${String(sayfa.clicks).padStart(4)} tik ${String(sayfa.queries).padStart(4)} sorgu  ${sayfa.page}`);
    }
  }
}

main().catch((error) => { console.error(error.message); process.exit(1); });
