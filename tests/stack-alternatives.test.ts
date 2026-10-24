import test from "node:test";
import assert from "node:assert/strict";
import toolsData from "../src/data/tools.json" with { type: "json" };
import type { Arac } from "../src/lib/arac.ts";
import { aracIndekslenir } from "../src/lib/indeks.ts";
import { islevi } from "../src/lib/islev.ts";
import { stackAlternatifleri } from "../src/lib/stack-alternatives.ts";
import { stackPlanlari } from "../src/lib/stack.ts";

const ARACLAR = toolsData as Arac[];
const HARITA = new Map(ARACLAR.map((tool) => [tool.slug, tool]));
const ONERILER = stackAlternatifleri(ARACLAR);

test("alternatif onerileri ayni islevde, indeksli ve daha ucuz", () => {
  const slugs = Object.keys(ONERILER);
  assert.ok(slugs.length >= 20, `yalnizca ${slugs.length} arac icin oneri var`);

  for (const slug of slugs) {
    const tool = HARITA.get(slug);
    assert.ok(tool, `${slug} katalogda yok`);
    const own = stackPlanlari(tool)
      .filter((plan) => plan.aylik > 0)
      .sort((a, b) => a.aylik - b.aylik)[0];
    assert.ok(own, `${slug}: ucretli plan yok`);
    assert.ok(ONERILER[slug].length <= 3);

    for (const alternative of ONERILER[slug]) {
      const target = HARITA.get(alternative.slug);
      assert.ok(target, `${slug}: oneri hedefi yok (${alternative.slug})`);
      assert.notEqual(alternative.slug, slug);
      assert.equal(islevi(alternative.slug), islevi(slug), `${slug} -> ${alternative.slug}: islev farkli`);
      assert.equal(aracIndekslenir(target), true, `${slug} -> ${alternative.slug}: noindex hedef`);
      assert.equal(alternative.birim, own.birim, `${slug} -> ${alternative.slug}: birim farkli`);
      assert.ok(alternative.aylik < own.aylik, `${slug} -> ${alternative.slug}: daha ucuz degil`);
      const plan = stackPlanlari(target).find((entry) => entry.ad === alternative.plan);
      assert.ok(plan, `${alternative.slug}: ${alternative.plan} plani yok`);
      assert.equal(plan.aylik, alternative.aylik);
    }
  }
});
