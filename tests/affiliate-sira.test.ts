import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";


/**
 * affiliate-programlar.json BASVURU SIRASI icindir; para kazandiran
 * link src/data/affiliate.json'dan gelir. Ikisi karistirilirsa site
 * "komisyon almiyoruz" derken komisyon aliyor olur -- affiliate.ts'in
 * bastaki notu tam olarak bunu yasakliyor.
 */
const veri = JSON.parse(readFileSync("src/data/affiliate-programlar.json", "utf8"));
// affiliate.ts '@/' takma adiyla import ediyor; test kosucusu bunu
// cozmedigi icin (bkz. tests/affiliate.test.ts) veri dosyasi dogrudan
// okunuyor.
const parali: Record<string, { url?: string }> = JSON.parse(
  readFileSync("src/data/affiliate.json", "utf8"),
);
type Program = { durum: string; url?: string; checkedAt?: string; neden?: string; kosul?: string };
const programlar: Record<string, Program> = veri.programlar;

test("program listesi para kazandiran linki DEVREYE ALMIYOR", () => {
  const varOlanlar = Object.entries(programlar).filter(([, p]) => p.durum === "var");
  assert.ok(varOlanlar.length > 0, "test anlamsiz olurdu");
  for (const [slug] of varOlanlar) {
    assert.ok(!parali[slug]?.url,
      `${slug} icin program biliniyor; affiliate.json'a link girilmedigi surece site parali sayilmamali`);
  }
});

test("her kayit gecerli bir durum tasiyor", () => {
  const gecerli = new Set(["var", "yok", "kurumsal", "bilinmiyor"]);
  for (const [slug, p] of Object.entries(programlar)) {
    assert.ok(gecerli.has(p.durum), `${slug}: bilinmeyen durum '${p.durum}'`);
  }
});

test("'var' diyen her kayit kaynak URL'si veriyor", () => {
  for (const [slug, p] of Object.entries(programlar)) {
    if (p.durum !== "var") continue;
    assert.match(p.url ?? "", /^https:\/\//, `${slug}: program var deniyor ama url yok`);
    assert.match(p.checkedAt ?? "", /^\d{4}-\d{2}-\d{2}$/, `${slug}: kontrol tarihi yok`);
  }
});
