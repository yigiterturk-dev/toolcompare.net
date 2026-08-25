/*
  Anasayfaya gecirilen KIRPILMIS kayit, tam kayitla AYNI fiyat sonucunu
  uretmeli.

  NEDEN VAR (olculmus olay, 2026-08-25): src/app/page.tsx anasayfaya
  yalnizca izgaranin kullandigi alanlari geciriyor (dokuman 518 KB'dan
  307 KB'a bu sayede indi). Ama alan listesi ELLE yazilmisti ve
  `fiyatModeli` unutulmustu. fiyatDurumu() o alan yokken basePrice'a
  dusuyor; basePrice 0 olan 266 arac ANASAYFADA "Pricing not verified"
  gorunurken KENDI URUN SAYFASINDA dogru etiketi gosteriyordu. Site
  kendi kendisiyle celisiyordu, hem de tam sattigi konuda.

  Ilk surum yalnizca ALAN ADLARINA bakiyordu ("fiyatModeli listede var
  mi"). Bu zayif bir kontrol: fiyat.ts yarin baska bir alan okumaya
  baslarsa betik bunu goremez. Bu surum ikisini de gercekten CALISTIRIP
  sonuclari karsilastiriyor -- olculen sey artik iddianin ta kendisi.

  `--experimental-strip-types` ile fiyat.ts dogrudan import ediliyor;
  kural tek yerde kaliyor, burada kopyalanmiyor.
*/
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { fiyatDurumu } from "../src/lib/fiyat.ts";

const kok = join(dirname(fileURLToPath(import.meta.url)), "..");
const araclar = JSON.parse(readFileSync(join(kok, "src/data/tools.json"), "utf8"));

// Alan listesini page.tsx'ten okuyoruz: tek dogruluk kaynagi orasi.
const sayfa = readFileSync(join(kok, "src/app/page.tsx"), "utf8");
const blok = sayfa.match(/IZGARA_ALANLARI\s*=\s*\[([\s\S]*?)\]\s*as const/);
if (!blok) {
  console.error("HATA: page.tsx icinde IZGARA_ALANLARI bulunamadi.");
  process.exit(2);
}
const alanlar = [...blok[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);

const farklar = [];
for (const tam of araclar) {
  const kirpik = {};
  for (const a of alanlar) if (tam[a] !== undefined) kirpik[a] = tam[a];

  const dTam = fiyatDurumu(tam);
  const dKirpik = fiyatDurumu(kirpik);
  if (dTam.kisa !== dKirpik.kisa || dTam.karsilastirilabilir !== dKirpik.karsilastirilabilir) {
    farklar.push({ slug: tam.slug, tam: dTam.kisa, kirpik: dKirpik.kisa });
  }
}

if (farklar.length) {
  console.error(`IZGARA KIRPMASI ANLAM KAYBEDIYOR — ${farklar.length} arac:`);
  for (const f of farklar.slice(0, 10)) {
    console.error(`  ${f.slug}: urun sayfasi "${f.tam}" · anasayfa "${f.kirpik}"`);
  }
  if (farklar.length > 10) console.error(`  ... ve ${farklar.length - 10} tane daha`);
  console.error("\nEksik alani IZGARA_ALANLARI'na ekle.");
  process.exit(1);
}

console.log(`izgara kirpmasi guvenli: ${araclar.length} aracin hepsinde fiyat sonucu ayni.`);
