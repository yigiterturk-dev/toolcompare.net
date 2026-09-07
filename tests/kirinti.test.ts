import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * Kirinti semasi 512 arac ve 2.353 karsilastirma sayfasinda hic yoktu;
 * arama sonucunda ciplak URL gorunuyordu. Sayfa turleri bir daha sessizce
 * kirintisiz kalmasin diye test.
 */
const SAYFALAR = [
  "src/app/tools/[slug]/page.tsx",
  "src/app/compare/[slug]/page.tsx",
  "src/app/alternatives/[slug]/page.tsx",
  "src/app/categories/[slug]/page.tsx",
];

for (const p of SAYFALAR) {
  test(`${p} kirinti semasi basiyor`, () => {
    const s = readFileSync(p, "utf8");
    assert.match(s, /kirintiSemasi\(/, "kirintiSemasi cagrilmiyor");
    assert.match(s, /application\/ld\+json/, "ld+json blogu yok");
  });
}

test("kirintiSemasi gecerli BreadcrumbList uretiyor", async () => {
  const { kirintiSemasi } = await import("../src/lib/yapilandirilmis.ts");
  const s = kirintiSemasi([{ ad: "A", yol: "/a" }, { ad: "B", yol: "/a/b" }]);
  assert.equal(s["@type"], "BreadcrumbList");
  assert.equal(s.itemListElement.length, 2);
  assert.equal(s.itemListElement[0].position, 1);
  assert.match(s.itemListElement[1].item, /^https:\/\/toolcompare\.net\/a\/b$/);
});
