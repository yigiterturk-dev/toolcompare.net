/*
  Anasayfaya gecirilen kirpilmis kayit, tam kayitla AYNI fiyat durumunu
  uretmeli.

  NEDEN VAR (olculmus olay, 2026-08-25): src/app/page.tsx anasayfaya
  yalnizca izgaranin kullandigi alanlari geciriyor (dokuman 518 KB'dan
  307 KB'a bu sayede indi). Ama alan listesi ELLE yazilmisti ve
  `fiyatModeli` unutulmustu. fiyatDurumu() o alan yokken basePrice'a
  dusuyor; basePrice 0 olan 266 arac anasayfada "Pricing not verified"
  gorunurken kendi urun sayfasinda dogru etiketi gosteriyordu.

  Performans icin veri kirpmak mesru; kirparken ANLAM kaybetmek degil.
  Bu betik ikisini karsilastirir ve fark varsa 1 ile cikar.
*/
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const kok = join(dirname(fileURLToPath(import.meta.url)), "..");
const araclar = JSON.parse(readFileSync(join(kok, "src/data/tools.json"), "utf8"));

// Alan listesini page.tsx'in kendisinden okuyoruz: tek dogruluk kaynagi orasi.
const sayfa = readFileSync(join(kok, "src/app/page.tsx"), "utf8");
const blok = sayfa.match(/IZGARA_ALANLARI\s*=\s*\[([\s\S]*?)\]\s*as const/);
if (!blok) {
  console.error("HATA: page.tsx icinde IZGARA_ALANLARI bulunamadi.");
  process.exit(2);
}
const alanlar = new Set([...blok[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]));

/* fiyat.ts'yi TS oldugu icin import etmiyoruz; kurali burada tekrar
   uretmek yerine YALNIZCA hangi alanlarin fiyati etkiledigini kontrol
   ediyoruz. Bu liste fiyat.ts'nin okudugu alanlarin tamami. */
const FIYATI_ETKILEYEN = ["basePrice", "isFlat", "fiyatModeli"];

const eksik = FIYATI_ETKILEYEN.filter((a) => !alanlar.has(a));
if (eksik.length) {
  const etkilenen = araclar.filter((t) => eksik.some((a) => t[a] !== undefined)).length;
  console.error("IZGARA ALAN KAYMASI — fiyati etkileyen alan(lar) kirpiliyor:");
  for (const a of eksik) console.error(`  ${a}`);
  console.error(`\n${etkilenen} aracin fiyat durumu anasayfada yanlis gorunur.`);
  console.error("Alani IZGARA_ALANLARI'na ekle.");
  process.exit(1);
}

console.log(`izgara alanlari tutarli: fiyati etkileyen ${FIYATI_ETKILEYEN.length} alanin hepsi geciriliyor.`);
