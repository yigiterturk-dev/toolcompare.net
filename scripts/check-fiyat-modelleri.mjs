/*
  Veri ile fiyat sozlesmesi arasindaki kaymayi yakalar.

  NEDEN VAR (olculmus olay, 2026-08-25): katalog 121'den 512 araca
  cikarken tools.json'a `fiyatModeli` icin 13 farkli deger yazildi;
  src/lib/fiyat.ts ise 4 tanesini taniyordu. Tanimayan her deger sessizce
  "Pricing not verified"a dusuyordu -- yani model VERIDE YAZILIYKEN site
  "dogrulanmadi" diyordu. 38 arac bu durumdaydi.

  Sessiz olmasinin sebebi, bilinmeyen degerin hata vermeyip son `return`a
  dusmesiydi. Bu betik o sessizligi bozuyor.
*/
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const kok = join(dirname(fileURLToPath(import.meta.url)), "..");
const araclar = JSON.parse(readFileSync(join(kok, "src/data/tools.json"), "utf8"));

// fiyat.ts'yi TS olarak import etmemek icin listeyi kaynaktan okuyoruz;
// tek dogruluk kaynagi yine orasi kaliyor.
const kaynak = readFileSync(join(kok, "src/lib/fiyat.ts"), "utf8");
const blok = kaynak.match(/TANINAN_MODELLER[^=]*=\s*\[([\s\S]*?)\];/);
if (!blok) {
  console.error("HATA: fiyat.ts icinde TANINAN_MODELLER bulunamadi.");
  process.exit(2);
}
const taninan = new Set([...blok[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]));

/*
  TANINAN_MODELLER sonunda `...Object.keys(ESANLAMLI)` yayiyor; duz metin
  taramasi onu goremez. Ilk surumde tam bu yuzden iki esanlamliyi "bilinmeyen"
  diye bildirdi. Esanlamli anahtarlari da ayrica okunuyor.
*/
const esBlok = kaynak.match(/ESANLAMLI[^=]*=\s*\{([\s\S]*?)\};/);
if (esBlok) {
  for (const m of esBlok[1].matchAll(/(?:^|[\s{,])"?([a-zA-Z-]+)"?\s*:/g)) taninan.add(m[1]);
}

const bilinmeyen = new Map();
for (const t of araclar) {
  const m = t.fiyatModeli;
  if (!m) continue;
  if (!taninan.has(m)) bilinmeyen.set(m, (bilinmeyen.get(m) ?? 0) + 1);
}

if (bilinmeyen.size) {
  console.error("FIYAT MODELI KAYMASI — bu degerler fiyat.ts'de tanimli degil:");
  for (const [deger, adet] of [...bilinmeyen].sort((a, b) => b[1] - a[1])) {
    console.error(`  ${deger}: ${adet} arac  -> sitede "Pricing not verified" gorunur`);
  }
  console.error("\nYa fiyat.ts'ye ekle ya da veriyi mevcut bir modele esle.");
  process.exit(1);
}

console.log(`fiyat modelleri tutarli: ${araclar.length} arac, ${taninan.size} tanimli model.`);
