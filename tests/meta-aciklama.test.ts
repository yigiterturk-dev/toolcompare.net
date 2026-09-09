import test from "node:test";
import assert from "node:assert/strict";
import { metaAciklamasi, ACIKLAMA_UST_SINIR } from "../src/lib/meta.ts";

const arac = (over: Record<string, unknown> = {}) =>
  ({
    slug: "dbeaver",
    name: "DBeaver",
    incelendi: true,
    shortDescription: "Universal database client.",
    verdict:
      "The tool that covers everything. Single-database users often prefer a lighter native client.",
    basePrice: 0,
    isFlat: true,
    fiyatModeli: "ucretsiz-katman",
    ...over,
  }) as never;

test("kisa shortDescription fiyat ve hukumle zenginlestirilir", () => {
  const d = metaAciklamasi(arac());
  assert.ok(d.length > 100, `cok kisa kaldi: ${d}`);
  assert.ok(d.startsWith("Universal database client."));
  assert.ok(d.includes("Free tier"), d);
  assert.ok(d.includes("covers everything"), d);
});

test("ust sinir asilmaz ve kelime ortasindan kesilmez", () => {
  const d = metaAciklamasi(
    arac({ verdict: "Uzun ".repeat(80) + "son." }),
  );
  assert.ok(d.length <= ACIKLAMA_UST_SINIR, `${d.length} karakter`);
  assert.ok(!d.endsWith(" "), d);
  assert.match(d, /…$/);
});

test("dogrulanmamis fiyat cumleye eklenmez", () => {
  const d = metaAciklamasi(arac({ fiyatModeli: "abonelik", basePrice: null }));
  assert.ok(!d.includes("Not verified"), d);
  assert.ok(!d.includes("TBC"), d);
});

test("incelenmemis arac icin inceleme varmis gibi yazilmaz", () => {
  const d = metaAciklamasi(arac({ incelendi: false, verdict: null }));
  assert.ok(d.includes("not published a full review"), d);
});

test("shortDescription yoksa da anlamli cumle uretilir", () => {
  const d = metaAciklamasi(arac({ shortDescription: "" }));
  assert.ok(d.includes("DBeaver"), d);
  assert.ok(d.length > 60, d);
});

// --- Kategori basligi: "Developer Tools" + " Tools" = "Tools Tools" idi.
import { kategoriBasligi } from "../src/lib/meta.ts";

test("adi Tools ile biten kategoride kelime tekrarlanmaz", () => {
  assert.equal(kategoriBasligi("Developer Tools", 115), "Developer Tools in 2026: 115 Compared by Price");
  assert.equal(kategoriBasligi("AI Tools", 40), "AI Tools in 2026: 40 Compared by Price");
});

test("adi Tools ile bitmeyen kategoride kelime eklenir", () => {
  assert.equal(kategoriBasligi("Design", 12), "Design Tools in 2026: 12 Compared by Price");
});

test("Software ile biten kategoriye Tools eklenmez", () => {
  assert.equal(kategoriBasligi("HR Software", 9), "HR Software in 2026: 9 Compared by Price");
});
