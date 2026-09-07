import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Bu testler asil olarak SITENIN YALAN SOYLEMEMESINI koruyor:
 * affiliate.json bos oldugu surece hicbir link "sponsored" olmamali,
 * dolu oldugu anda /terms metni de degismeli. Ikisi tek kaynaktan
 * okundugu icin burada kaynagi ve tuketicileri dogruluyoruz.
 */

const kaynak = readFileSync("src/lib/affiliate.ts", "utf8");
const kayitlar = JSON.parse(readFileSync("src/data/affiliate.json", "utf8"));

test("affiliate.json gecerli bir sozluk", () => {
  assert.equal(typeof kayitlar, "object");
  assert.ok(!Array.isArray(kayitlar));
  for (const [slug, k] of Object.entries<{ url?: string }>(kayitlar)) {
    assert.ok(k.url, `${slug}: url zorunlu`);
    assert.match(k.url, /^https:\/\//, `${slug}: url https olmali`);
  }
});

test("parali link sponsored, parasiz link nofollow", () => {
  assert.match(kaynak, /paraliMi\(slug\)\s*\n?\s*\?\s*"noopener noreferrer sponsored"/);
  assert.match(kaynak, /"noopener noreferrer nofollow"/);
});

test("sayfalar rel degerini elle yazmiyor", () => {
  for (const p of [
    "src/app/tools/[slug]/page.tsx",
    "src/app/compare/[slug]/page.tsx",
    "src/app/alternatives/[slug]/page.tsx",
  ]) {
    const s = readFileSync(p, "utf8");
    // gitLinki ile giden her dis link rel'ini relDegeri()'nden almali.
    const gitLinkleri = s.match(/href=\{gitLinki\([^)]*\)\}[\s\S]{0,120}?rel=[^\s]+/g) || [];
    assert.ok(gitLinkleri.length > 0, `${p}: dis link bulunamadi`);
    for (const l of gitLinkleri) {
      assert.match(l, /rel=\{relDegeri\(/, `${p}: elle yazilmis rel var -> ${l.slice(0, 80)}`);
    }
  }
});

test("ads.txt yayinci kimligi olmadan yayinlanmaz", () => {
  const s = readFileSync("src/app/ads.txt/route.ts", "utf8");
  assert.match(s, /ADSENSE_PUBLISHER_ID/);
  assert.match(s, /status:\s*404/);
});
