import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fiyatDurumu } from "../src/lib/fiyat.ts";
import { ilkUcretliBasamak } from "../src/lib/plan.ts";
import type { Arac } from "../src/lib/arac.ts";

/**
 * AYNI SAYFADA IKI FARKLI "BASLANGIC FIYATI".
 *
 * Fiyat merdiveni arac sayfasina basildigi gun (2026-09-12) ortaya cikti:
 * yan panel elle girilmis `basePrice`'i, tablo ise saticinin fiyat
 * sayfasindan okunmus merdiveni gosteriyordu. Readwise "From $9.99/mo"
 * derken hemen altinda "Lite $5.59/mo billed annually" yaziyordu;
 * ms-teams'te $6'ya karsi $4, slack'te $7,25'e karsi $8,75.
 *
 * Deponun kurali zaten vardi: KAYNAGINI GOSTEREBILEN RAKAM KAZANIR.
 * Merdiven basamagi `kaynakSatiri` ile geliyor, `basePrice` gelmiyor.
 * Kural artik fiyatin TEK yorumlayicisinda (fiyat.ts) uygulaniyor, boylece
 * kartlar, kategori listeleri ve karsilastirma tablolari da ayni rakami
 * soyluyor -- celiski tek yerde cozuluyor.
 */

const araclar = JSON.parse(readFileSync("src/data/tools.json", "utf8")) as Arac[];

test("merdiveni olan araclarda gosterilen rakam merdivenden geliyor", () => {
  const celiskili: string[] = [];
  for (const t of araclar) {
    const basamak = ilkUcretliBasamak(t as never);
    if (!basamak) continue;
    const d = fiyatDurumu(t);
    if (!d.karsilastirilabilir || d.aylik === null) continue;
    /*
      Bedava arac ile merdivenin ucretli basamagi CELISMEZ: Penpot gercekten
      ucretsiz ve $25'lik bir Enterprise katmani var. Yasak olan sey ayni
      arac icin iki farkli POZITIF baslangic fiyati gostermek.
    */
    if (d.aylik === 0) continue;
    if (d.aylik !== basamak.aylik) {
      celiskili.push(`${t.slug}: gosterilen $${d.aylik} vs merdiven $${basamak.aylik}`);
    }
  }
  assert.deepEqual(celiskili, [],
    `ayni arac icin iki farkli baslangic fiyati:\n${celiskili.join("\n")}`);
});

/** Olcumde bulunan somut ornekler. */
test("bilinen celiskiler kapandi", () => {
  for (const [slug, beklenen] of [["readwise", 5.59], ["ms-teams", 4], ["slack", 8.75], ["linear", 10]] as [string, number][]) {
    const t = araclar.find((x) => x.slug === slug);
    assert.ok(t, `${slug} katalogda yok`);
    assert.equal(fiyatDurumu(t).aylik, beklenen, `${slug}: merdiven rakami kullanilmiyor`);
  }
});

/** Merdiveni olmayan aracin davranisi DEGISMEDI. */
test("merdivensiz arac eski davranisini koruyor", () => {
  const t = araclar.find((x) => !ilkUcretliBasamak(x as never) && x.fiyatModeli === "teklif");
  assert.ok(t, "teklif modelli merdivensiz arac bulunamadi");
  assert.equal(fiyatDurumu(t).karsilastirilabilir, false);
  assert.match(fiyatDurumu(t).metin, /quote/i);
});

/** Bedava arac "From $..." demiyor: merdiven bedava basamagi fiyat degildir. */
test("bedava arac fiyat iddia etmiyor", () => {
  const t = araclar.find((x) => x.fiyatModeli === "bedava");
  assert.ok(t, "bedava arac yok");
  assert.equal(fiyatDurumu(t).metin, "Free");
});

/**
 * YILLIK TOPLAM, AYLIK TUTAR SANILMASIN.
 *
 * Penpot satirinda "Private Server $50,000/year" gecen tutar `aylik`
 * alanina yazilmisti: sayfa "Private Server $50,000/user/mo" diyordu ve
 * ayni rakam AggregateOffer highPrice olarak Google'a gidiyordu.
 * "billed yearly" mesrudur (tutar zaten aylik); elenen sey tutarin
 * KENDISININ yillik toplam olmasi.
 */
test("hicbir basamak yillik toplami aylik tutar olarak tasimiyor", () => {
  const bozuk: string[] = [];
  for (const t of araclar) {
    for (const p of t.planlar ?? []) {
      if (/\$[\d,.]+\s*(?:\/\s*|per\s+)(?:yr|year)\b/i.test(p.kaynakSatiri)) {
        // Kaynak cumlesinde yillik toplam GECEBILIR (baska bir plani
        // anlatiyor olabilir); yasak olan, bu basamagin tutarinin o
        // yillik rakam olmasi.
        const yillik = p.kaynakSatiri.match(/\$([\d,]+)\s*(?:\/\s*|per\s+)(?:yr|year)\b/i);
        // $0/yr bedava plandir, hata degil: bedava hem yillik hem aylik $0.
        if (yillik && p.aylik > 0 && Number(yillik[1].replace(/,/g, "")) === p.aylik) {
          bozuk.push(`${t.slug}/${p.ad}: $${p.aylik} aylik sayilmis ama kaynak "/year" diyor`);
        }
      }
    }
  }
  assert.deepEqual(bozuk, [], `yillik toplam aylik tutar sayilmis:\n${bozuk.join("\n")}`);
});

test("ayiklayici yillik toplamlari eliyor", () => {
  const betik = readFileSync("scripts/plan-merdiveni.mjs", "utf8");
  assert.match(betik, /YILLIK TOPLAMI AYLIK TUTAR SAYMA/, "ayiklayicida yillik-toplam korumasi yok");
  assert.match(betik, /\(\?:yr\|year\)\\b\/i\.test\(m\.groups\.kuyruk/, "koruma tutar duzeyinde degil");
});
