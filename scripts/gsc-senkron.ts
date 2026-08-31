/**
 * Son 90 gunun arama verisini ceker ve JSON olarak diske yazar.
 *
 * Neden dosya: bu veri gunde bir kez degisir ve uygulama onu yalnizca okur.
 * MySQL'e tasimak, tek yazan/tek okuyan bir veri icin gereksiz bagimlilik.
 */
import "./env.ts";
import { mkdir, writeFile } from "node:fs/promises";
import { fetchSearchRows, isGscConfigured, isoDay } from "../src/lib/gsc.ts";

const DIZIN = new URL("../src/data/gsc/", import.meta.url);

async function main() {
  if (!isGscConfigured()) {
    console.log("⛔ GSC kimlik bilgileri tanimli degil (.env.local)");
    process.exit(1);
  }
  const gun = Number(process.argv[2]) || 90;
  const rows = await fetchSearchRows(gun);
  await mkdir(DIZIN, { recursive: true });

  const dosya = new URL("latest.json", DIZIN);
  await writeFile(dosya, JSON.stringify({
    site: process.env.GSC_SITE_URL,
    fetchedAt: new Date().toISOString(),
    startDate: isoDay(gun + 2),
    endDate: isoDay(2),
    rows,
  }, null, 2));

  const gosterim = rows.reduce((toplam, row) => toplam + row.impressions, 0);
  const tik = rows.reduce((toplam, row) => toplam + row.clicks, 0);
  const sayfa = new Set(rows.map((row) => row.page)).size;
  console.log(`${rows.length} satir yazildi · ${gosterim} gosterim / ${tik} tik / ${sayfa} sayfa`);
  console.log(`→ src/data/gsc/latest.json`);
}

main().catch((error) => { console.error(error.message); process.exit(1); });
