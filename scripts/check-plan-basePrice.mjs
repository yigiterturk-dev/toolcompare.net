#!/usr/bin/env node
/**
 * basePrice ile plan merdiveninin ilk ucretli basamagi uyusuyor mu?
 *
 * NEDEN VAR: merdiven eklendigi gun ayni sayfada iki farkli rakam
 * gorundu -- Trello icin "cheapest verified option $5/user/mo"
 * (`basePrice` alanindan) ve "First paid step: Premium $10/user/mo"
 * (satici cumlesinden). `basePrice` elle girilmis eski bir alan; kanit
 * cumlesi ise okundugu yerden geliyor. Ikisi ayrilmissa biri eskimis
 * demektir ve okur celiskiyi gorur.
 *
 * Bu script sayfayi DEGISTIRMEZ, yalnizca ayrilanlari listeler ki
 * editor kanidi tekrar okuyup hangisinin dogru oldugunu soylesin.
 * Cikis kodu her zaman 0: bu bir kalite raporu, kapi degil -- bazi
 * ayrilmalar mesru (yillik/aylik farki gibi).
 */
import fs from "node:fs";

const arr = JSON.parse(fs.readFileSync("src/data/tools.json", "utf8"));
const araclar = Array.isArray(arr) ? arr : arr.tools;

/** Sapma esigi: %20'den az fark yillik/aylik ayrimiyla aciklanabilir. */
const ESIK = 0.2;

const ayrilan = [];
for (const t of araclar) {
  if (typeof t.basePrice !== "number" || t.basePrice <= 0) continue;
  const ilk = (t.planlar ?? []).filter((p) => p.aylik > 0).sort((a, b) => a.aylik - b.aylik)[0];
  if (!ilk) continue;

  const fark = Math.abs(ilk.aylik - t.basePrice) / t.basePrice;
  if (fark <= ESIK) continue;
  ayrilan.push({ slug: t.slug, basePrice: t.basePrice, plan: ilk, fark });
}

ayrilan.sort((a, b) => b.fark - a.fark);

console.log(
  `plan/basePrice ayrimi: ${ayrilan.length} arac (%${Math.round(ESIK * 100)} ustu sapma) — ` +
    `merdiveni olan ${araclar.filter((t) => (t.planlar ?? []).some((p) => p.aylik > 0)).length} aractan`
);
for (const a of ayrilan.slice(0, 25)) {
  console.log(
    `  ${a.slug.padEnd(22)} basePrice $${a.basePrice}  vs  ${a.plan.ad} $${a.plan.aylik}` +
      ` (${a.plan.faturalama ?? "faturalama belirsiz"})`
  );
  console.log(`     << ${a.plan.kaynakSatiri.slice(0, 120)}`);
}
if (ayrilan.length > 25) console.log(`  ... ve ${ayrilan.length - 25} tane daha`);
