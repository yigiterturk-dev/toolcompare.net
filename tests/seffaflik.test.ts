import test from "node:test";
import assert from "node:assert/strict";
import {
  seffaflikOzeti,
  seffaflikCsv,
  rakamBulundu,
  bulunamamaSebebi,
  ASGARI_ORNEKLEM,
} from "../src/lib/seffaflik.ts";
import type { Arac } from "../src/lib/arac.ts";
import toolsData from "../src/data/tools.json" with { type: "json" };

const arac = (over: Record<string, unknown> = {}) =>
  ({
    slug: "a",
    name: "A",
    category: "CRM",
    basePrice: 0,
    isFlat: true,
    shortDescription: "x",
    websiteUrl: "https://x.test",
    evidence: { status: "vendor-sourced", reviewedAt: "2026-09-01", sources: [{ url: "https://x.test/pricing" }] },
    ...over,
  }) as unknown as Arac;

/* --- kural 1: kanitsiz urun olcume girmez --- */

test("kanit kaynagi olmayan urun paydaya girmez", () => {
  const o = seffaflikOzeti([
    arac({ slug: "kanitli", basePrice: 10 }),
    arac({ slug: "kanitsiz", evidence: { status: "unknown", reviewedAt: "", sources: [] } }),
    arac({ slug: "kanitalani-yok", evidence: undefined }),
  ]);
  assert.equal(o.toplam, 3);
  assert.equal(o.incelenen, 1);
  assert.equal(o.haricTutulan, 2);
});

/* --- kural 2: $0 bir rakamdir, bilinmeyen fiyat degil --- */

test("bedava urun rakamsiz sayilmaz", () => {
  assert.equal(rakamBulundu(arac({ fiyatModeli: "bedava", basePrice: 0 })), true);
  assert.equal(rakamBulundu(arac({ fiyatModeli: "ucretsiz", basePrice: 0 })), true);
});

test("planlar icindeki aylik rakam basePrice 0 olsa da sayilir", () => {
  assert.equal(
    rakamBulundu(arac({ basePrice: 0, planlar: [{ ad: "Free", aylik: 0 }, { ad: "Pro", aylik: 12 }] })),
    true,
  );
  assert.equal(rakamBulundu(arac({ basePrice: 0, planlar: [{ ad: "Free", aylik: 0 }] })), false);
});

test("sebep tek torbaya atilmaz", () => {
  assert.equal(bulunamamaSebebi(arac({ fiyatModeli: "teklif" })), "quote-only");
  assert.equal(bulunamamaSebebi(arac({ fiyatModeli: "ucretsiz-katman" })), "free-tier-only");
  assert.equal(bulunamamaSebebi(arac({ fiyatModeli: "kullanima-gore" })), "usage-based");
  assert.equal(bulunamamaSebebi(arac({ fiyatModeli: undefined })), "no-figure-published");
});

/* --- kucuk orneklem yayimlanmaz --- */

test("asgari orneklemin altindaki kategori tabloya girmez", () => {
  const az = Array.from({ length: ASGARI_ORNEKLEM - 1 }, (_, i) => arac({ slug: `az${i}`, category: "Tiny" }));
  const cok = Array.from({ length: ASGARI_ORNEKLEM }, (_, i) => arac({ slug: `c${i}`, category: "Big" }));
  const o = seffaflikOzeti([...az, ...cok]);
  assert.deepEqual(o.kategoriler.map((k) => k.kategori), ["Big"]);
});

/* --- toplamlar tutarli olmali; sayfa bu sayilari yayimliyor --- */

test("gercek katalogda toplamlar tutuyor", () => {
  const o = seffaflikOzeti(toolsData as unknown as Arac[]);
  assert.equal(o.rakamVar + o.rakamsiz, o.incelenen);
  assert.equal(o.incelenen + o.haricTutulan, o.toplam);
  const sebepToplami = Object.values(o.sebepler).reduce((a, b) => a + b, 0);
  assert.equal(sebepToplami, o.rakamsiz, "her rakamsiz kaydin bir sebebi olmali");
  assert.ok(o.incelenen > 400, "olcum anlamli bir orneklem uzerinde durmali");
});

test("csv her incelenen kayit icin bir satir ve sabit basliklar uretir", () => {
  const o = seffaflikOzeti([arac({ slug: "a", name: 'Vir, "gul"', basePrice: 5 })]);
  const satirlar = seffaflikCsv(o).trimEnd().split("\n");
  assert.equal(satirlar.length, 2);
  assert.equal(satirlar[0], "slug,name,category,price_figure_found,reason,evidence_reviewed_at,source_count");
  assert.match(satirlar[1], /^a,"Vir, ""gul""",CRM,yes,,2026-09-01,1$/);
});
