import test from "node:test";
import assert from "node:assert/strict";
import { ciftMetaAciklamasi, ACIKLAMA_UST_SINIR } from "../src/lib/meta.ts";

/*
  NEDEN BU TEST VAR (GSC, 2026-09-13): 1.320 karsilastirma sayfasinin
  hepsi AYNI aciklamayi yayinliyordu ("Compare X and Y side-by-side:
  verified pricing, documented features..."). Olculdu: /compare 1.593
  gosterim aliyor, siralamasi 4-25 arasinda olan 350 gosterimde TEK
  tik yok. Sablon aciklama, sirasi iyi olan sayfada bile tiklanmiyor.
  Aciklama artik O CIFTE ozgu, dogrulanmis rakamdan kuruluyor.
*/

const plan = (ad: string, aylik: number, birim: "kisi-basina" | "sabit" = "kisi-basina") => ({
  ad,
  aylik,
  birim,
  faturalama: "yillik" as const,
  kaynakSatiri: `${ad} $${aylik}`,
  kaynakUrl: "https://example.com/pricing",
});

const arac = (over: Record<string, unknown> = {}) =>
  ({
    slug: "linear",
    name: "Linear",
    incelendi: true,
    shortDescription: "Issue tracker for software teams.",
    fiyatKontrolTarihi: "2026-09-08",
    planlar: [plan("Free", 0), plan("Basic", 8)],
    ...over,
  }) as never;

const b = (over: Record<string, unknown> = {}) =>
  arac({
    slug: "youtrack",
    name: "YouTrack",
    shortDescription: "Issue tracker by JetBrains.",
    planlar: [plan("Free", 0), plan("Standard", 4.4)],
    ...over,
  });

test("iki tarafin baslangic fiyati da dogrulanmissa rakamlar aciklamaya girer", () => {
  const d = ciftMetaAciklamasi(arac(), b());
  assert.ok(d.includes("Linear"), d);
  assert.ok(d.includes("YouTrack"), d);
  assert.ok(d.includes("$8"), d);
  assert.ok(d.includes("$4.4"), d);
});

test("iki cift ayni aciklamayi uretmez", () => {
  const bir = ciftMetaAciklamasi(arac(), b());
  const iki = ciftMetaAciklamasi(
    arac({ slug: "jira", name: "Jira", planlar: [plan("Standard", 7.91)] }),
    b({ slug: "trello", name: "Trello", planlar: [plan("Standard", 5)] }),
  );
  assert.notEqual(bir, iki);
});

test("ucretsiz katman farki yaziliyor ama uydurulmuyor", () => {
  const farkli = ciftMetaAciklamasi(
    arac(),
    b({ planlar: [plan("Standard", 4.4)] }), // ucretsiz basamagi yok
  );
  assert.match(farkli, /free tier/i, farkli);
  assert.ok(farkli.includes("Linear"), farkli);

  // Ikisinde de ucretsiz basamak varsa bu bir AYRIM degil, satir yazilmaz.
  const ikisiDe = ciftMetaAciklamasi(arac(), b());
  assert.ok(!/only .* has a free tier/i.test(ikisiDe), ikisiDe);
});

test("fiyat dogrulanmamissa uydurma rakam cikmaz", () => {
  const d = ciftMetaAciklamasi(
    arac({ planlar: [], basePrice: null, fiyatModeli: "abonelik" }),
    b({ planlar: [], basePrice: null, fiyatModeli: "abonelik" }),
  );
  assert.ok(!d.includes("$"), d);
  assert.ok(!/not verified|tbc/i.test(d), d);
  assert.ok(d.length > 40, `bos kaldi: ${d}`);
});

test("tek taraf dogrulanmissa o taraf yazilir, digeri uydurulmaz", () => {
  const d = ciftMetaAciklamasi(arac(), b({ planlar: [], fiyatModeli: "abonelik" }));
  assert.ok(d.includes("$8"), d);
  assert.ok(!/YouTrack starts at \$/.test(d), d);
});

test("ust sinir asilmaz ve kelime ortasindan kesilmez", () => {
  const d = ciftMetaAciklamasi(
    arac({ name: "A".repeat(90) }),
    b({ name: "B".repeat(90) }),
  );
  assert.ok(d.length <= ACIKLAMA_UST_SINIR, `${d.length} karakter: ${d}`);
  assert.ok(!d.endsWith(" "), d);
});

test("fiyat dogrulama tarihi varsa aciklamada gecer", () => {
  const d = ciftMetaAciklamasi(arac(), b());
  assert.ok(d.includes("2026-09-08"), d);
});
