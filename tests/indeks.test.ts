import test from "node:test";
import assert from "node:assert/strict";
import {
  aracIndekslenir,
  icerikDerin,
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
  longDescription: "x".repeat(300),
  keyFeatures: ["a", "b", "c"],
  ...over,
});

test("incelenmemis arac sayfasi indekslenmez", () => {
  assert.equal(aracIndekslenir(tam() as never), true);
  assert.equal(aracIndekslenir(tam({ incelendi: false }) as never), false);
  assert.equal(aracIndekslenir(tam({ verdict: undefined }) as never), false);
});

test("ince icerikli arac sayfasi indekslenmez (GSC: crawled, not indexed)", () => {
  assert.equal(aracIndekslenir(tam({ longDescription: "x".repeat(299) }) as never), false);
  assert.equal(aracIndekslenir(tam({ keyFeatures: ["a", "b"] }) as never), false);
  assert.equal(aracIndekslenir(tam({ keyFeatures: undefined }) as never), false);
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

/**
 * Talep muafiyeti TEK YONLU olmali: gösterim almış sayfa kurtarılır,
 * gösterim almamış sayfa bu yüzden elenmez. İlk tasarım bunu filtre olarak
 * kurmuştu ve `notion` gibi tanınan ama henüz taranmamış araçları eliyordu.
 */
test("talep görmüş ince sayfa noindex'e düşmez", () => {
  const ince = {
    slug: "photopea", // ölçümde 42 gösterim, 106 karakter, 0 özellik
    incelendi: true,
    verdict: "Tarayıcıda çalışan Photoshop alternatifi.",
    longDescription: "Kısa açıklama.",
    keyFeatures: [],
  };
  assert.equal(icerikDerin(ince as never), false);
  assert.equal(aracIndekslenir(ince as never), true);
});

test("talep görmemek tek başına sayfayı elemez", () => {
  const derin = {
    slug: "hic-gosterim-almamis-arac",
    incelendi: true,
    verdict: "Değerlendirme.",
    longDescription: "x".repeat(320),
    keyFeatures: [{ title: "a" }, { title: "b" }, { title: "c" }],
  };
  assert.equal(aracIndekslenir(derin as never), true);
});

/**
 * Kanıt kaynağı editoryal atıftır: takip edilir. Tek istisna, affiliate
 * anlaşmamız olan aracın KENDİ alan adına giden kaynak — orası `sponsored`.
 */
test("kanıt kaynağı takip edilir", async () => {
  const { kanitRelHesapla } = await import("../src/lib/kanit-rel.ts");
  assert.equal(kanitRelHesapla(false, "https://photopea.com", "https://github.com/x/y"), "noopener noreferrer");
  assert.equal(kanitRelHesapla(true, "https://photopea.com", "https://github.com/x/y"), "noopener noreferrer");
});

test("affiliate aracın kendi alan adına giden kanıt sponsored olur", async () => {
  const { kanitRelHesapla } = await import("../src/lib/kanit-rel.ts");
  assert.equal(
    kanitRelHesapla(true, "https://photopea.com", "https://www.photopea.com/pricing"),
    "noopener noreferrer sponsored",
  );
  assert.equal(
    kanitRelHesapla(false, "https://photopea.com", "https://www.photopea.com/pricing"),
    "noopener noreferrer",
  );
});
