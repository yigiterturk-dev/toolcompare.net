import test from "node:test";
import assert from "node:assert/strict";
import { rozetUygun, rozetSvg, rozetKodu, okumaTarihi, rozetMetni } from "../src/lib/rozet.ts";
import type { Arac } from "../src/lib/arac.ts";

const arac = (over: Record<string, unknown> = {}) =>
  ({
    slug: "acme",
    name: "Acme & Co",
    incelendi: true,
    verdict: "iyi",
    basePrice: 10,
    isFlat: true,
    evidence: {
      status: "pricing-page-verified",
      reviewedAt: "2026-08-01",
      sources: [{ url: "https://acme.test/pricing", checkedAt: "2026-09-14" }],
    },
    ...over,
  }) as unknown as Arac;

test("rozet yalnizca incelenmis + fiyati dogrulanmis araca verilir", () => {
  assert.equal(rozetUygun(arac()), true);
  assert.equal(rozetUygun(arac({ incelendi: false })), false);
  assert.equal(rozetUygun(arac({ evidence: { status: "unverified", reviewedAt: "2026-08-01" } })), false);
  assert.equal(rozetUygun(undefined), false);
});

test("okuma tarihi en son kaynak tarihidir", () => {
  assert.equal(okumaTarihi(arac()), "2026-09-14");
  assert.equal(okumaTarihi(arac({ evidence: { status: "pricing-page-verified" } })), null);
});

test("tarihsiz kanit rozet almaz: tarihsiz 'verified' iddiasi yok", () => {
  assert.equal(rozetUygun(arac({ evidence: { status: "pricing-page-verified" } })), false);
});

test("uygun olmayan arac kirik gorsel yerine notr rozete duser", () => {
  assert.deepEqual(rozetMetni(arac({ incelendi: false })), { sol: "ToolCompare", sag: "Listed" });
  assert.match(rozetSvg(arac({ incelendi: false })), /Listed/);
});

test("svg ayi gosterir ve ozel karakterleri kacirir", () => {
  const svg = rozetSvg(arac());
  assert.match(svg, /Pricing verified · Sep 2026/);
  assert.match(svg, /Acme &amp; Co/);
  assert.doesNotMatch(svg, /Acme & Co/);
});

test("gomme kodu arac sayfasina link verir, nofollow koymaz", () => {
  const kod = rozetKodu(arac());
  assert.match(kod, /href="https:\/\/toolcompare\.net\/tools\/acme"/);
  assert.match(kod, /src="https:\/\/toolcompare\.net\/api\/badge\/acme"/);
  assert.doesNotMatch(kod, /nofollow/);
});
