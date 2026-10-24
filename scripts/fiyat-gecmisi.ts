/**
 * FIYAT GECMISI SNAPSHOT'U.
 *
 * tools.json'daki plan merdivenlerini okur, son snapshot ile karsilastirir ve
 * degisen planlari src/data/fiyat-gecmisi.json'a yazar. Amac: "kac arac var"
 * degil, "hangi fiyat ne zaman degisti" sorusuna cevap vermek. Saticinin
 * kendi sayfasindan dogrulanmis plan rakamlari disinda veri yazilmaz.
 */
import { readFile, writeFile } from "node:fs/promises";
import toolsData from "../src/data/tools.json" with { type: "json" };
import {
  farklariHesapla,
  planlariTopla,
  type FiyatGecmisi,
} from "../src/lib/fiyat-gecmisi.ts";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const dateIndex = args.indexOf("--date");
const at = dateIndex >= 0 ? args[dateIndex + 1] : new Date().toISOString().slice(0, 10);

if (!/^\d{4}-\d{2}-\d{2}$/.test(at)) {
  console.error(`Gecersiz tarih: ${at} (YYYY-MM-DD bekleniyor)`);
  process.exit(1);
}

const dosya = new URL("../src/data/fiyat-gecmisi.json", import.meta.url);

let gecmis: FiyatGecmisi = { version: 1, updatedAt: "", sonKontrol: at, baseline: [], changes: [] };
try {
  gecmis = JSON.parse(await readFile(dosya, "utf8")) as FiyatGecmisi;
} catch {
  // Ilk calisma: dosya yok, baseline asagida kurulur.
}

const current = planlariTopla(toolsData as never);
const ilkKayit = !Array.isArray(gecmis.baseline) || gecmis.baseline.length === 0;
const changes = ilkKayit ? [] : farklariHesapla(gecmis.baseline, current, at);

const next: FiyatGecmisi = {
  version: 1,
  updatedAt: new Date().toISOString(),
  sonKontrol: at,
  baseline: current,
  changes: [...changes, ...((gecmis.changes || []) as FiyatGecmisi["changes"])].slice(0, 2000),
};

if (ilkKayit) {
  console.log(`Ilk snapshot: ${current.length} plan, ${new Set(current.map((p) => p.slug)).size} arac.`);
} else {
  const say = (tip: string) => changes.filter((change) => change.type === tip).length;
  console.log(
    `${changes.length} degisiklik: ${say("price-up")} zam, ${say("price-down")} indirim, ` +
      `${say("plan-added")} yeni plan, ${say("plan-removed")} kaldirilan plan, ` +
      `${say("terms-changed")} sart degisikligi.`,
  );
  for (const change of changes.slice(0, 10)) {
    console.log(`  ${change.type.padEnd(14)} ${change.name} / ${change.plan}: ${change.from ?? "-"} -> ${change.to ?? "-"}`);
  }
}

if (dryRun) {
  console.log("Dry-run: dosya yazilmadi.");
} else {
  await writeFile(dosya, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  console.log(`Yazildi: src/data/fiyat-gecmisi.json (${next.baseline.length} plan, ${next.changes.length} kayit)`);
}
