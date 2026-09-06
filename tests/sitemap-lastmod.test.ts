import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { aracTarihi, turetilmisTarih, enYeni, TABAN_TARIH } from "../src/lib/degisiklik.ts";

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

test("ayni veri ayni tarihi verir (build tekrari sitemap'i degistirmez)", () => {
  const t = { evidence: { reviewedAt: "2026-09-07", sources: [{ checkedAt: "2026-09-07" }] } };
  assert.equal(aracTarihi(t), aracTarihi(t));
});
