import test from "node:test";
import assert from "node:assert/strict";
import toolsData from "../../src/data/tools.json" with { type: "json" };
import cekirdekData from "../../src/data/gsc/cekirdek.json" with { type: "json" };
import { CEKIRDEK_VAR, cekirdekte } from "../../src/lib/cekirdek.ts";
import { aracIndekslenir, alternatifIndekslenir } from "../../src/lib/indeks.ts";
import { ciftVsSorgusuGormus, talepGormus, yolTalepGormus } from "../../src/lib/talep.ts";
import { sitemapCiftleri, oneCikanCiftler, indekslenebilirAkranlar } from "../../src/lib/compare.ts";
import type { Arac } from "../../src/lib/arac";

const araclar = toolsData as Arac[];

test("cekirdek verisi yuklu ve kapi acik", () => {
  assert.ok(CEKIRDEK_VAR);
  assert.ok(cekirdekData.yollar.length > 100);
});

test("cekirdek disinda yalnizca talep gormus sayfalar indekslenebilir", () => {
  for (const t of araclar) {
    if (aracIndekslenir(t) && !cekirdekte(`/tools/${t.slug}`))
      assert.ok(talepGormus(t.slug), `talepsiz cekirdek disi arac: ${t.slug}`);
    if (alternatifIndekslenir(t) && !cekirdekte(`/alternatives/${t.slug}`))
      assert.ok(yolTalepGormus(`/alternatives/${t.slug}`), `talepsiz cekirdek disi alternatif: ${t.slug}`);
  }
  const harita = new Map(araclar.map((t) => [t.slug, t]));
  for (const c of sitemapCiftleri()) {
    if (cekirdekte(`/compare/${c}`)) continue;
    const [aSlug, bSlug] = c.split("-vs-");
    const a = harita.get(aSlug);
    const b = harita.get(bSlug);
    const talepli =
      yolTalepGormus(`/compare/${c}`) ||
      Boolean(a && b && ciftVsSorgusuGormus([a.slug, a.name], [b.slug, b.name]));
    assert.ok(talepli, `talepsiz cekirdek disi cift: ${c}`);
  }
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
