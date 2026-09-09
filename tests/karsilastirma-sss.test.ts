import test from "node:test";
import assert from "node:assert/strict";
import { karsilastirmaSss } from "../src/lib/sss.ts";

const arac = (over: Record<string, unknown> = {}) =>
  ({
    slug: "a",
    name: "A",
    incelendi: true,
    basePrice: 10,
    isFlat: true,
    fiyatModeli: "aylik",
    kriterler: { api: true, sso: false },
    ...over,
  }) as never;

test("iki taraf da dogrulanmissa fiyat sorusu uretilir", () => {
  const s = karsilastirmaSss(arac({ name: "A", basePrice: 10 }), arac({ name: "B", basePrice: 25 }));
  const fiyat = s.find((q) => /cheaper/i.test(q.soru));
  assert.ok(fiyat, "fiyat sorusu yok");
  assert.match(fiyat!.cevap, /A/);
  assert.match(fiyat!.cevap, /\$10/);
});

test("bir taraf dogrulanmamissa fiyat sorusu URETILMEZ", () => {
  const s = karsilastirmaSss(
    arac({ name: "A" }),
    arac({ name: "B", fiyatModeli: "teklif", basePrice: null }),
  );
  assert.equal(s.find((q) => /cheaper/i.test(q.soru)), undefined);
});

test("ucretsiz plan sorusu her iki aracin modelini soyler", () => {
  const s = karsilastirmaSss(
    arac({ name: "A", fiyatModeli: "ucretsiz-katman" }),
    arac({ name: "B", fiyatModeli: "aylik" }),
  );
  const q = s.find((x) => /free plan/i.test(x.soru));
  assert.ok(q, "ucretsiz plan sorusu yok");
  assert.match(q!.cevap, /A/);
  assert.match(q!.cevap, /B/);
});

test("ayrim cumlesi varsa fark sorusu uretilir", () => {
  const s = karsilastirmaSss(arac({ name: "A" }), arac({ name: "B", kriterler: { api: false, sso: true } }));
  assert.ok(s.find((q) => /difference/i.test(q.soru)), "fark sorusu yok");
});

test("her soru ve cevap dolu, soru tekrarlanmaz", () => {
  const s = karsilastirmaSss(arac({ name: "A" }), arac({ name: "B", basePrice: 25 }));
  assert.ok(s.length >= 2, `az soru: ${s.length}`);
  for (const q of s) {
    assert.ok(q.soru.trim().length > 8, q.soru);
    assert.ok(q.cevap.trim().length > 20, q.cevap);
  }
  assert.equal(new Set(s.map((q) => q.soru)).size, s.length);
});
