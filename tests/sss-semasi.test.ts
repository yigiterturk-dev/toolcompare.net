import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { sssSemasi } from "../src/lib/yapilandirilmis.ts";

/**
 * Arac sayfasinda SSS blogu GORUNUYORDU ama yapilandirilmis veriye
 * konmuyordu. GSC (2026-09-07): /tools/wix-studio ciplak marka
 * teriminde 24., ama sayfanin cevabini verdigi "wix studio pricing"
 * sorgusunda 82. sirada. Sema geri dusmesin diye test.
 */

test("arac sayfasi SSS semasini basiyor", () => {
  const s = readFileSync("src/app/tools/[slug]/page.tsx", "utf8");
  assert.match(s, /sssSemasi\(/, "sssSemasi cagrilmiyor");
  assert.match(s, /sss\.length >= 2/, "tek soruluk SSS icin esik yok");
});

test("sssSemasi gecerli FAQPage uretiyor", () => {
  const s: any = sssSemasi([
    { soru: "How much does Wix Studio cost?", cevap: "From $16/user/mo." },
    { soru: "What are the main drawbacks?", cevap: "Steep learning curve." },
  ]);
  assert.equal(s["@type"], "FAQPage");
  assert.equal(s.mainEntity.length, 2);
  assert.equal(s.mainEntity[0]["@type"], "Question");
  assert.equal(s.mainEntity[0].name, "How much does Wix Studio cost?");
  assert.equal(s.mainEntity[0].acceptedAnswer["@type"], "Answer");
  assert.equal(s.mainEntity[0].acceptedAnswer.text, "From $16/user/mo.");
});

test("bos soru listesi bos mainEntity verir, patlamaz", () => {
  const s: any = sssSemasi([]);
  assert.deepEqual(s.mainEntity, []);
});

/**
 * bestFor/skipIf 140 aracta doluydu ama arac sayfasinda hic ciziliyordu.
 * "Bunu alma" maddesi saticinin sitesinde bulunmayan tek icerik; sessizce
 * kaybolmasin diye test.
 */
test("arac sayfasi bestFor/skipIf blogunu ciziyor", () => {
  const s = readFileSync("src/app/tools/[slug]/page.tsx", "utf8");
  assert.match(s, /Pick it or skip it/, "Pick it or skip it bolumu yok");
  assert.match(s, /bestFor\.length > 0 \|\| skipIf\.length > 0/, "render kosulu yok");
  assert.match(s, /When should you not use/, "skipIf SSS sorusu yok");
});
