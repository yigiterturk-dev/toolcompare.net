import test from "node:test";
import assert from "node:assert/strict";
import {
  aracIndekslenir,
  icerikDerin,
  alternatifIndekslenir,
  ciftIndekslenir,
  fiyatiDogrulanmis,
  gercekFarkVar,
} from "../src/lib/indeks.ts";

const tam = (over: Record<string, unknown> = {}) => ({
  slug: "redis",
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
  assert.equal(aracIndekslenir(tam({ slug: "anytype", longDescription: "x".repeat(299) }) as never), false);
  assert.equal(aracIndekslenir(tam({ slug: "anytype", keyFeatures: ["a", "b"] }) as never), false);
  assert.equal(aracIndekslenir(tam({ slug: "anytype", keyFeatures: undefined }) as never), false);
});

test("alternatif sayfasi fiyat kaniti olmadan indekslenmez", () => {
  assert.equal(alternatifIndekslenir(tam({ slug: "docker" }) as never), true);
  assert.equal(fiyatiDogrulanmis(tam({ evidence: { status: "unverified" } }) as never), false);
});

// Cift testlerinde GERCEK slug kullaniliyor: ciftIndekslenir islev kapisini da
// uyguluyor (src/lib/islev.ts) ve cekirdek talep verisi sinyali eziyor.
// buzzsumo + clearscope: ayni islev, cekirdekte, yol talebi yok.
test("karsilastirmada tek tarafin kaniti yetmez", () => {
  const a = tam({ slug: "buzzsumo" });
  const b = tam({ slug: "clearscope", basePrice: 20, evidence: { status: "unverified" } });
  assert.equal(ciftIndekslenir(a as never, b as never), false);
});

test("farki olmayan cift indekslenmez", () => {
  const a = tam({ slug: "buzzsumo" });
  const b = tam({ slug: "clearscope" }); // ayni fiyat, ayni kriterler
  assert.equal(gercekFarkVar(a as never, b as never), false);
  assert.equal(ciftIndekslenir(a as never, b as never), false);
});

test("fiyati ayni ama ozelligi farkli cift indekslenir", () => {
  const a = tam({ slug: "buzzsumo" });
  const b = tam({ slug: "clearscope", kriterler: { api: true, sso: true } });
  assert.equal(ciftIndekslenir(a as never, b as never), true);
});

test("farkli islevden cift, kaniti tam olsa bile indekslenmez", () => {
  // Redis bir veri deposu, Sentry bir hata izleyici. Ikisinin de kaniti
  // tam ve aralarinda "fark" var -- ama karsilastirilacak bir sey yok.
  const a = tam({ slug: "redis" });
  const b = tam({ slug: "sentry", kriterler: { api: true, sso: true } });
  assert.equal(ciftIndekslenir(a as never, b as never), false);
});

test("elle kuratorlu vendor-sourced kayit fiyat kaniti sayilir", () => {
  const vendor = (sources: unknown[]) =>
    tam({ slug: "docker", evidence: { status: "vendor-sourced", sources } });

  // Kaynak fiyati destekliyor -> gecer.
  assert.equal(
    fiyatiDogrulanmis(vendor([{ label: "OpenAI - Plus", supports: ["$20 monthly Plus price"] }]) as never),
    true,
  );
  // Somut iddia (ucretsiz plan) -> gecer.
  assert.equal(
    fiyatiDogrulanmis(vendor([{ label: "Slack - Plans", supports: ["free plan with 90-day history"] }]) as never),
    true,
  );

  /* BASLIK KANIT DEGIL (2026-09-10): eskiden bu kayit GECIYORDU, cunku
     kural kaynagin basligini da tariyor ve ciplak "pricing" kelimesini
     kanit sayiyordu. "… — Pricing" her saticide var; supports'ta tek
     rakam yoksa fiyat iddia edilemez. 42 otomatik kayit bu bosluktan
     geciyordu (bkz. lib/indeks.ts FIYAT_IDDIASI). */
  assert.equal(
    fiyatiDogrulanmis(vendor([{ label: "Slack - Pricing", supports: ["plan limits"] }]) as never),
    false,
  );

  // Kaynak yalnizca dokumantasyon -> fiyat iddia edilemez, elenir.
  assert.equal(
    fiyatiDogrulanmis(vendor([{ label: "Selenium - WebDriver", supports: ["browser automation"] }]) as never),
    false,
  );
  assert.equal(fiyatiDogrulanmis(vendor([]) as never), false);

  /* OTOMATIK TARAMA KANIT DEGIL (2026-09-10). 42 kayitta supports tam olarak
     buydu: "the vendor's published pricing" -- fiyat sayfasinin ULASILABILIR
     oldugunu soyluyor, fiyat hakkinda hicbir sey soylemiyor. Bu satir kapidan
     gecerse site "fiyati dogrulanmis" iddiasini bos yere tasir. */
  assert.equal(
    fiyatiDogrulanmis(vendor([{ label: "Zoom — Pricing", supports: ["the vendor's published pricing"] }]) as never),
    false,
  );

  /* Para birimi OLMADAN somut kanit gecer: elle okunmus plan tablosu. */
  assert.equal(
    fiyatiDogrulanmis(vendor([{ label: "Craft — Plans", supports: ["Free: 1,500 blocks, 1 GB storage"] }]) as never),
    true,
  );
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
      tam({ slug: "buzzsumo", kriterler: { api: null, sso: null } }) as never,
      tam({ slug: "clearscope" }) as never,
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
  /* Test kosusu CEKIRDEK_KAPALI=1 ile calisir: cekirdek kapisi aciktir.
     Cekirdek kapisinin gercek davranisi tests/canli/cekirdek.test.ts'te. */
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
