import test from "node:test";
import assert from "node:assert/strict";
import { findOpportunities, isoDay, summarizeByPage, type SearchRow } from "../src/lib/gsc.ts";

function row(overrides: Partial<SearchRow> = {}): SearchRow {
  return {
    date: "2026-08-01",
    page: "https://toolcompare.net/tools/example",
    query: "best analytics tool",
    clicks: 0,
    impressions: 50,
    ctr: 0,
    position: 12,
    ...overrides,
  };
}

test("bitis tarihi GSC gecikmesini hesaba katar", () => {
  const from = new Date("2026-09-10T00:00:00.000Z");
  assert.equal(isoDay(2, from), "2026-09-08");
  assert.equal(isoDay(92, from), "2026-06-10");
});

test("firsat listesi yalnizca ulasilabilir siralari alir", () => {
  const opportunities = findOpportunities([
    row({ query: "zaten birinci", position: 2 }),
    row({ query: "cok uzak", position: 61 }),
    row({ query: "ulasilabilir", position: 14 }),
  ]);
  assert.deepEqual(opportunities.map((item) => item.query), ["ulasilabilir"]);
});

test("talebi olmayan sorgu firsat sayilmaz", () => {
  assert.equal(findOpportunities([row({ impressions: 3 })]).length, 0);
});

test("sira gosterim agirlikli ortalanir", () => {
  // 1 gosterimde gorulen 3. sira, 99 gosterimde gorulen 14. sirayi
  // asagi cekmemeli; duz ortalama bu satiri listeden atardi.
  const opportunities = findOpportunities([
    row({ position: 3, impressions: 1 }),
    row({ position: 14, impressions: 99 }),
  ]);
  assert.equal(opportunities.length, 1);
  assert.ok(opportunities[0].position > 13, `beklenen >13, gelen ${opportunities[0].position}`);
});

test("ayni sorgu farkli gunlerde toplanir", () => {
  const opportunities = findOpportunities([
    row({ date: "2026-08-01", impressions: 15, clicks: 1 }),
    row({ date: "2026-08-02", impressions: 15, clicks: 2 }),
  ]);
  assert.equal(opportunities.length, 1);
  assert.equal(opportunities[0].impressions, 30);
  assert.equal(opportunities[0].clicks, 3);
});

test("sayfa ozeti benzersiz sorgu sayar", () => {
  const [summary] = summarizeByPage([
    row({ query: "a" }), row({ query: "a" }), row({ query: "b" }),
  ]);
  assert.equal(summary.queries, 2);
  assert.equal(summary.impressions, 150);
});
