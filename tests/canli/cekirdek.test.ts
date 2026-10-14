import test from "node:test";
import assert from "node:assert/strict";
import toolsData from "../../src/data/tools.json" with { type: "json" };
import cekirdekData from "../../src/data/gsc/cekirdek.json" with { type: "json" };
import { CEKIRDEK_VAR, cekirdekte } from "../../src/lib/cekirdek.ts";
import { aracIndekslenir, alternatifIndekslenir } from "../../src/lib/indeks.ts";
import { sitemapCiftleri, oneCikanCiftler, indekslenebilirAkranlar } from "../../src/lib/compare.ts";
import type { Arac } from "../../src/lib/arac";

const araclar = toolsData as Arac[];

test("cekirdek verisi yuklu ve kapi acik", () => {
  assert.ok(CEKIRDEK_VAR);
  assert.ok(cekirdekData.yollar.length > 100);
});

test("cekirdek disindaki hicbir arac/alternatif/cift indekslenmez", () => {
  for (const t of araclar) {
    if (aracIndekslenir(t)) assert.ok(cekirdekte(`/tools/${t.slug}`), t.slug);
    if (alternatifIndekslenir(t)) assert.ok(cekirdekte(`/alternatives/${t.slug}`), t.slug);
  }
  for (const c of sitemapCiftleri()) assert.ok(cekirdekte(`/compare/${c}`), c);
});

test("anasayfa seridi ve akran linkleri yalnizca cekirdege gider", () => {
  const ciftler = new Set(sitemapCiftleri());
  for (const c of oneCikanCiftler()) assert.ok(ciftler.has(c.slug), `noindex ciftte serit: ${c.slug}`);
  for (const t of araclar) {
    for (const a of indekslenebilirAkranlar(t.slug)) {
      const c = t.slug < a.slug ? `${t.slug}-vs-${a.slug}` : `${a.slug}-vs-${t.slug}`;
      assert.ok(ciftler.has(c), `noindex sayfaya link: ${c}`);
    }
  }
});
