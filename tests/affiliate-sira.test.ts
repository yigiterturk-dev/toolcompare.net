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
type Program = { durum: string; url?: string; checkedAt?: string; neden?: string; kosul?: string; anlasma?: string };
const programlar: Record<string, Program> = veri.programlar;

/*
  2026-09-12: ilk gercek anlasma yapildi (railway). Test o gune kadar
  "durum=var olan HICBIR arac parali olamaz" diyordu -- dogru niyet, ama
  anlasma yapilinca testi yalanci cikaran bir bicimde yazilmisti.
  Gevsetmek yerine kapi dogru yere baglandi: ayrim "program biliniyor" ile
  "ANLASMA yapildi" arasindadir. Bir programin varligini ogrenmek siteyi
  parali yapmaz; parali yapan sey, kaydinda `anlasma` izi olan bir link.
*/
test("anlasma YAPILMAMIS program siteyi parali yapmiyor", () => {
  const varOlanlar = Object.entries(programlar).filter(([, p]) => p.durum === "var");
  assert.ok(varOlanlar.length > 0, "test anlamsiz olurdu");
  for (const [slug, p] of varOlanlar) {
    if (p.anlasma) continue;
    assert.ok(!parali[slug]?.url,
      `${slug} icin program biliniyor ama anlasma kaydi yok; affiliate.json'a link girilmemeli`);
  }
});

/*
  Ters yon: affiliate.json'a elle bir link yapistirilmasi, arkasinda
  arastirma ve anlasma izi OLMADAN mumkun olmasin. Para kazandiran link
  her zaman bir denetim izine bagli kalir.
*/
test("para kazandiran her link arastirma ve anlasma izine dayaniyor", () => {
  for (const [slug, k] of Object.entries(parali)) {
    if (!k?.url) continue;
    const p = programlar[slug];
    assert.ok(p, `${slug}: affiliate.json'da link var ama program arastirmasi yok`);
    assert.equal(p.durum, "var", `${slug}: link var ama program durumu '${p.durum}'`);
    assert.ok(p.anlasma, `${slug}: link var ama anlasma izi (anlasma alani) yok`);
    assert.match(k.url, /^https:\/\//, `${slug}: affiliate adresi https degil`);
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
