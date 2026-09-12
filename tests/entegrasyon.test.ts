import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { tumEntegrasyonlar, entegrasyonKaydi, kanonikCift, durumEtiketi, entegrasyonOrtaklari } from "../src/lib/entegrasyon.ts";
import type { Arac } from "../src/lib/arac.ts";

/**
 * ENTEGRASYON SAYFALARI.
 *
 * Olcum (GSC 90 gun, 2026-09-12): entegrasyon sorgulari sitenin EN IYI
 * siraladigi sinif -- agirlikli sira 43,9 (marka 51,6 · fiyat 65,9 ·
 * alternatif 76,5 · vs 69,8). 457 gosterim, TIK SIFIR: sayfa "hangisi daha
 * iyi"yi cevapliyordu, soru "bunlar birlikte calisiyor mu"ydu.
 *
 * Iki kural bu testlerle kilitleniyor:
 *   KANIT  -- her kayit saticinin KENDI sayfasindan alinmis bir cumle tasir.
 *   TALEP  -- kayit yalnizca GSC'de gosterim almis cift icin acilir;
 *             kartezyen uretim bu sitenin daha once yaptigi hata
 *             (116 sayfa ilk-15'te, hepsi birlikte ayda 349 gosterim).
 */

const araclar = JSON.parse(readFileSync("src/data/tools.json", "utf8")) as Arac[];
const sluglar = new Set(araclar.map((t) => t.slug));
const sayfa = readFileSync("src/app/compare/[slug]/page.tsx", "utf8");
const gsc = JSON.parse(readFileSync("src/data/gsc/latest.json", "utf8")) as {
  rows?: { page?: string; impressions?: number }[];
};

function gosterim(cift: string): number {
  let t = 0;
  for (const r of gsc.rows ?? []) {
    if ((r.page || "").includes(`/compare/${cift}`)) t += r.impressions || 0;
  }
  return t;
}

test("her kayit satici kaynagi tasiyor", () => {
  const gecerli = new Set(["yerlesik", "dolayli", "yok"]);
  for (const [cift, k] of tumEntegrasyonlar()) {
    assert.ok(gecerli.has(k.durum), `${cift}: bilinmeyen durum '${k.durum}'`);
    assert.ok(k.ozet?.trim(), `${cift}: ozet yok`);
    assert.match(k.kaynakUrl ?? "", /^https:\/\//, `${cift}: kaynak adresi https degil`);
    assert.ok(k.kaynakSatiri?.trim(), `${cift}: kaynak cumlesi yok -- iddia dogrulanamaz`);
    assert.ok(k.kaynakSahibi?.trim(), `${cift}: kaynagin sahibi yazilmamis`);
    assert.match(k.checkedAt ?? "", /^\d{4}-\d{2}-\d{2}$/, `${cift}: kontrol tarihi yok`);
  }
});

test("kayit anahtarlari kanonik ve araclar katalogda", () => {
  for (const [cift] of tumEntegrasyonlar()) {
    const [a, b] = cift.split("-vs-");
    assert.ok(sluglar.has(a), `${cift}: '${a}' katalogda yok`);
    assert.ok(sluglar.has(b), `${cift}: '${b}' katalogda yok`);
    assert.equal(kanonikCift(a, b), cift, `${cift}: anahtar kanonik degil (alfabetik olmali)`);
  }
});

/** KARTEZYEN URETIM YASAK: kayit ancak olculmus talep varsa acilir. */
test("her kaydin arkasinda olculmus talep var", () => {
  const talepsiz: string[] = [];
  for (const [cift] of tumEntegrasyonlar()) {
    if (gosterim(cift) < 1) talepsiz.push(cift);
  }
  assert.deepEqual(talepsiz, [],
    `GSC'de gosterim almamis cift icin kayit acilmis: ${talepsiz.join(", ")}`);
});

test("kayit her iki slug sirasindan da bulunuyor", () => {
  const [cift] = tumEntegrasyonlar()[0];
  const [a, b] = cift.split("-vs-");
  assert.ok(entegrasyonKaydi(a, b), "kanonik sirada bulunamadi");
  assert.ok(entegrasyonKaydi(b, a), "ters sirada bulunamadi");
});

test("sayfa cevabi ve kaynagini basiyor", () => {
  assert.match(sayfa, /entegrasyonKaydi\(/, "sayfa kaydi okumuyor");
  assert.match(sayfa, /id="integration"/, "entegrasyon bolumunun capasi yok");
  assert.match(sayfa, /ent\.kaynakSatiri/, "satici cumlesi sayfada basilmiyor");
  assert.match(sayfa, /ent\.kaynakSahibi/, "kaynagin sahibi gosterilmiyor");
  assert.match(sayfa, /entegrasyonBasligi\(tool1\.name, tool2\.name\)/, "H1 soruya donmuyor");
});

/** Baslik etiketi de soruya donmeli: dogru cevap yanlis baslikla bulunmaz. */
test("meta baslik entegrasyon ciftinde soruya donuyor", () => {
  assert.match(sayfa, /const cekirdek = ent\s*\n?\s*\? entegrasyonBasligi/,
    "generateMetadata entegrasyon basligini kullanmiyor");
  assert.match(sayfa, /const description = ent/, "aciklama entegrasyon cevabina donmuyor");
});

test("durum etiketleri ziyaretciye anlasilir", () => {
  assert.equal(durumEtiketi("yerlesik"), "Built-in integration");
  assert.equal(durumEtiketi("dolayli"), "Needs a connector");
  assert.equal(durumEtiketi("yok"), "No direct integration");
});

/**
 * OKSUZLUK MUAFIYETININ DAYANAGI.
 *
 * Entegrasyon ciftleri akran simetrisi testlerinden muaf tutuldu (farkli
 * is gordukleri icin akran olamazlar). Muafiyetin sarti, linki BASKA bir
 * kaynaktan almalari: arac sayfasindaki "Does X work with..." listesi.
 * O liste kaybolursa muafiyet dayanaksiz kalir -- bu test onu tutar.
 */
test("arac sayfasi 'works with' listesini basiyor", () => {
  const aracSayfasi = readFileSync("src/app/tools/[slug]/page.tsx", "utf8");
  assert.match(aracSayfasi, /entegrasyonOrtaklari\(tool\.slug\)/, "ortak listesi okunmuyor");
  assert.match(aracSayfasi, /href=\{`\/compare\/\$\{o\.cift\}`\}/, "cifte link verilmiyor");
  assert.match(aracSayfasi, /Does \{tool\.name\} work with/, "baslik yok");
});

test("her cift IKI aracin da ortak listesinde gorunuyor", () => {
  for (const [cift] of tumEntegrasyonlar()) {
    const [a, b] = cift.split("-vs-");
    assert.ok(entegrasyonOrtaklari(a).some((o) => o.cift === cift), `${cift}: ${a} listesinde yok`);
    assert.ok(entegrasyonOrtaklari(b).some((o) => o.cift === cift), `${cift}: ${b} listesinde yok`);
  }
});
