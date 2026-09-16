import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { aracTarihi, turetilmisTarih, enYeni, TABAN_TARIH } from "../src/lib/degisiklik.ts";
import { karsilastirmaTarihi, notluCiftler } from "../src/lib/karsilastirma-notlari.ts";

/**
 * Sitemap'teki her adres lastModified olarak `new Date()` yaziyordu:
 * her build'de 1.293 adres "bugun degisti" diyordu. Google boyle bir
 * sitemap'te lastmod'u tamamen yok sayar. Geri dusmesin diye test.
 */

test("sitemap build zamanini lastmod olarak yazmiyor", () => {
  const s = readFileSync("src/app/sitemap.ts", "utf8");
  const kod = s.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
  assert.doesNotMatch(kod, /lastModified:\s*new Date\(\)/, "lastModified hala build zamani");
  assert.match(kod, /tarihNesnesi\(/, "veriden tarih uretilmiyor");
});

test("aracTarihi en yeni dogrulanmis tarihi veriyor", () => {
  const t = {
    evidence: {
      reviewedAt: "2026-08-24",
      sources: [{ checkedAt: "2026-09-07" }, { checkedAt: "2026-08-31" }],
    },
  };
  assert.equal(aracTarihi(t), "2026-09-07");
});

test("tarih yoksa taban tarihe duser, bugune degil", () => {
  assert.equal(aracTarihi(undefined), TABAN_TARIH);
  assert.equal(aracTarihi({}), TABAN_TARIH);
  assert.equal(enYeni(undefined, "gecersiz"), TABAN_TARIH);
});

test("turetilmis sayfa icerdigi araclarin en yenisini alir", () => {
  const a = { evidence: { reviewedAt: "2026-08-24" } };
  const b = { evidence: { reviewedAt: "2026-09-07" } };
  assert.equal(turetilmisTarih([a, b]), "2026-09-07");
  assert.equal(turetilmisTarih([a, undefined]), TABAN_TARIH, "bilinmeyen arac tabani getirir");
});

test("plan merdiveninin kontrol tarihi arac tarihine girer", () => {
  const t = {
    evidence: { reviewedAt: "2026-09-07" },
    planlar: [{ ad: "Pro", aylik: 29, kontrolTarihi: "2026-09-15" }],
  };
  assert.equal(aracTarihi(t), "2026-09-15");
  // kontrolTarihi olmayan eski plan kayitlari tabana dusurmez:
  assert.equal(aracTarihi({ planlar: [{ ad: "Pro", aylik: 29 }] }), TABAN_TARIH);
});

test("karsilastirma tarihi: notlu her cift gecerli ISO veriyor, bilinmeyen cift tanimsiz", () => {
  for (const anahtar of notluCiftler()) {
    const t = karsilastirmaTarihi(anahtar);
    if (t) assert.match(t, /^\d{4}-\d{2}-\d{2}/, `${anahtar}: kontrolTarihi gecersiz`);
  }
  assert.equal(karsilastirmaTarihi("olmayan-vs-arac"), undefined);
});

test("ayni veri ayni tarihi verir (build tekrari sitemap'i degistirmez)", () => {
  const t = { evidence: { reviewedAt: "2026-09-07", sources: [{ checkedAt: "2026-09-07" }] } };
  assert.equal(aracTarihi(t), aracTarihi(t));
});

/**
 * degisiklik.ts once dar bir arac tipi bekliyordu; cagiran dosyalarin
 * kendi `Arac` tipleri `evidence` alanini beyan etmedigi icin build
 * TS2345/TS2559 ile kiriliyordu (tsc calistirilmadan commit edildi).
 * Girdi genis, cikti dar olmali.
 */
test("aracTarihi beyan edilmemis sekilleri de okuyabiliyor", () => {
  const gevsek: unknown = { slug: "x", evidence: { reviewedAt: "2026-09-01" } };
  assert.equal(aracTarihi(gevsek), "2026-09-01");
  assert.equal(aracTarihi({ slug: "y" }), TABAN_TARIH);
  assert.equal(aracTarihi("saçma"), TABAN_TARIH);
  assert.equal(aracTarihi(null), TABAN_TARIH);
});
