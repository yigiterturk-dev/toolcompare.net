import test from "node:test";
import assert from "node:assert/strict";
import {
  aracIndekslenir,
  alternatifIndekslenir,
  ciftIndekslenir,
  gercekFarkVar,
} from "../src/lib/indeks.ts";

const tam = (over: Record<string, unknown> = {}) => ({
  slug: "a",
  name: "A",
  incelendi: true,
  verdict: "iyi",
  basePrice: 10,
  isFlat: true,
  evidence: { status: "pricing-page-verified" },
  kriterler: { api: true, sso: false },
  ...over,
});

test("incelenmemis arac sayfasi indekslenmez", () => {
  assert.equal(aracIndekslenir(tam() as never), true);
  assert.equal(aracIndekslenir(tam({ incelendi: false }) as never), false);
  assert.equal(aracIndekslenir(tam({ verdict: undefined }) as never), false);
});

test("alternatif sayfasi fiyat kaniti olmadan indekslenmez", () => {
  assert.equal(alternatifIndekslenir(tam() as never), true);
  assert.equal(alternatifIndekslenir(tam({ evidence: { status: "unverified" } }) as never), false);
});

test("karsilastirmada tek tarafin kaniti yetmez", () => {
  const a = tam({ slug: "a" });
  const b = tam({ slug: "b", basePrice: 20, evidence: { status: "unverified" } });
  assert.equal(ciftIndekslenir(a as never, b as never), false);
});

test("farki olmayan cift indekslenmez", () => {
  const a = tam({ slug: "a" });
  const b = tam({ slug: "b" }); // ayni fiyat, ayni kriterler
  assert.equal(gercekFarkVar(a as never, b as never), false);
  assert.equal(ciftIndekslenir(a as never, b as never), false);
});

test("fiyati ayni ama ozelligi farkli cift indekslenir", () => {
  const a = tam({ slug: "a" });
  const b = tam({ slug: "b", kriterler: { api: true, sso: true } });
  assert.equal(ciftIndekslenir(a as never, b as never), true);
});

test("elle kuratorlu vendor-sourced kayit fiyat kaniti sayilir", () => {
  const vendor = (sources: unknown[]) =>
    tam({ evidence: { status: "vendor-sourced", sources } });

  // Kaynak fiyati destekliyor -> gecer.
  assert.equal(
    alternatifIndekslenir(
      vendor([{ label: "OpenAI - Plus", supports: ["$20 monthly Plus price"] }]) as never,
    ),
    true,
  );
  assert.equal(
    alternatifIndekslenir(
      vendor([{ label: "Slack - Pricing", supports: ["plan limits"] }]) as never,
    ),
    true,
  );

  // Kaynak yalnizca dokumantasyon -> fiyat iddia edilemez, elenir.
  assert.equal(
    alternatifIndekslenir(
      vendor([{ label: "Selenium - WebDriver", supports: ["browser automation"] }]) as never,
    ),
    false,
  );
  assert.equal(alternatifIndekslenir(vendor([]) as never), false);
});

test("bakilmamis kriter (null) fark sayilmaz, dolu da saymaz", () => {
  // null = BAKILMADI. false ile karistirilirsa uydurma fark uretir.
  assert.equal(
    gercekFarkVar(
      tam({ kriterler: { api: true } }) as never,
      tam({ kriterler: { api: null } }) as never,
    ),
    false,
  );
  // Iki tarafta da bakilmissa gercek fark.
  assert.equal(
    gercekFarkVar(
      tam({ kriterler: { api: true } }) as never,
      tam({ kriterler: { api: false } }) as never,
    ),
    true,
  );
  // Yalnizca null iceren kume kriterli sayilmaz.
  assert.equal(
    ciftIndekslenir(
      tam({ kriterler: { api: null, sso: null } }) as never,
      tam() as never,
    ),
    false,
  );
});
