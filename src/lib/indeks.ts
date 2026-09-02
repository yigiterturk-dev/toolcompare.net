/**
 * INDEKSLENEBILIRLIK: TEK KAYNAK.
 *
 * NEDEN (GSC olcumu, 2026-08-31):
 * Sitemap'te 3.391 adres vardi (2.345'i /compare). GSC ornekleminde
 * /compare sayfalarinin 0/10'u indeksliydi; genelde %13. Google'in
 * verdigi durumlar "URL is unknown to Google" ve "Discovered - currently
 * not indexed" -- yani sayfalari goruyor ve indekslemeye DEGMEZ diyor.
 * Binlerce zayif kombinasyon sayfasi tarama butcesini asil sayfalardan
 * caliyordu.
 *
 * Kural: bir sayfa sitemap'e ancak KENDINE OZGU, DOGRULANMIS bir sey
 * soyleyebiliyorsa girer. Digerleri silinmez -- erisilebilir ve linkli
 * kalir (ziyaretci gorur, PageRank akar) ama `noindex, follow` alir.
 *
 * Bu dosya hem sitemap'in hem sayfa metadata'sinin kaynagidir; ikisi
 * ayrisirsa Google'a celiskili sinyal gider.
 */

import { fiyatDurumu } from "./fiyat.ts";

type Kaynak = { label?: string; supports?: string[] };

type Arac = {
  slug: string;
  incelendi?: boolean;
  verdict?: string;
  longDescription?: string;
  keyFeatures?: unknown[];
  evidence?: { status?: string; sources?: Kaynak[] };
  kriterler?: Record<string, unknown>;
};

/**
 * Kaynak gercekten FIYAT iddiasini destekliyor mu?
 *
 * `vendor-sourced` kayitlar elle kuratorlu ve otomatik taramadan DAHA
 * saglam (birden cok kaynak, her kaynagin neyi destekledigi yazili).
 * Ama hepsi fiyat kaynagi degil: LangChain/Selenium/Drupal kayitlarinin
 * kaynagi dokumantasyon -- o kayitla fiyat iddia edilemez.
 *
 * Kural: en az bir kaynagin basligi veya `supports` maddesi bir fiyat
 * ifadesi icersin. Temkinli taraf dogru taraf; supheliyi disarida birakir.
 */
const FIYAT_IDDIASI =
  /(\$\s?\d|€\s?\d|£\s?\d|\bpricing\b|\bprice[sd]?\b|per (user|month|seat)|\bmonthly\b|\bfree tier\b|\bfree plan\b)/i;

function fiyatDestekleyenKaynak(t?: Arac): boolean {
  return (t?.evidence?.sources || []).some((s) =>
    FIYAT_IDDIASI.test([s.label || "", ...(s.supports || [])].join(" ")),
  );
}

/** Insan elinden gecmis: kendi yorumu ve uzun anlatimi var. */
export function incelenmis(t?: Arac): boolean {
  return t?.incelendi === true && Boolean(t?.verdict);
}

/**
 * Fiyat iddiasi bir kaynaga dayaniyor mu?
 *
 * OLCULEN HATA (2026-08-31): kural yalnizca `pricing-page-verified`
 * kabul ediyordu. Sonuc tersine dondu -- otomatik taramayla dogrulanan
 * arac kapidan geciyor, ELLE kuratorlu 140 `vendor-sourced` kayit
 * (daha saglam kanit) eleniyordu. 199 arac "incelenmis + kriterli ama
 * fiyat kaniti yok" diye disarida kaliyordu; kapiya uygun arac 225'ti.
 *
 * Iki yol da kabul edilir, ama `vendor-sourced` icin kaynagin fiyati
 * gercekten destekledigi aranir.
 */
export function fiyatiDogrulanmis(t?: Arac): boolean {
  const durum = t?.evidence?.status;
  if (durum === "pricing-page-verified") return true;
  return durum === "vendor-sourced" && fiyatDestekleyenKaynak(t);
}

/**
 * Ozellik matrisi dolu: karsilastirma tablosu gercekten bir sey gosterir.
 *
 * `null` = BAKILMADI (bkz. lib/kriterler.ts). Yalnizca null iceren bir
 * kume "dolu" degildir -- tabloda dort satir "not checked" yazar.
 */
export function kriterliMi(t?: Arac): boolean {
  return Object.values(t?.kriterler || {}).some((v) => typeof v === "boolean");
}

/**
 * Iki arac arasinda YAZILACAK gercek bir fark var mi?
 *
 * Fiyatlari da ozellikleri de ayni olan iki aracin karsilastirma sayfasi
 * iki isimden ibaret kalir; Google'in "duplicate" saydigi tam budur.
 */
export function gercekFarkVar(a?: Arac, b?: Arac): boolean {
  if (!a || !b) return false;
  const da = fiyatDurumu(a as never);
  const db = fiyatDurumu(b as never);
  if (da.karsilastirilabilir && db.karsilastirilabilir && da.aylik !== db.aylik) return true;
  /* Bir kriter ancak IKI TARAFTA DA bakilmissa karsilastirilir. `null`
     (bakilmadi) ile `false` (yok) ayni sey degil; null'i false saymak
     "A'da API var, B'de yok" gibi BAKILMAMIS bir farki uydurur ve
     sayfayi kapidan yanlislikla gecirirdi. */
  const ka = (a.kriterler || {}) as Record<string, unknown>;
  const kb = (b.kriterler || {}) as Record<string, unknown>;
  return Object.keys({ ...ka, ...kb }).some(
    (k) => typeof ka[k] === "boolean" && typeof kb[k] === "boolean" && ka[k] !== kb[k],
  );
}

/**
 * ARAC SAYFASI: incelenmis olmasi yeter.
 * Kendi yorumu ve uzun anlatimi olan sayfa zaten benzersizdir; burada
 * fiyat kaniti aramak 217 gercek sayfayi bosuna disarida birakirdi.
 */
/**
 * Icerik yeterince DERIN mi?
 *
 * GSC OLCUMU (2026-09-02): kapiyi gecen 460 aracin 42'si "Crawled -
 * currently not indexed" dondu (drizzle, clerk, turso, attio...).
 * Ortak noktalari: longDescription 94-142 karakter, keyFeatures bos.
 * Kapiyi gecen 460 aracin 196'sinda aciklama 150 karakterin altinda,
 * 215'inde ozellik listesi 3'ten kisa. Google bunlara "sadece ad + fiyat"
 * diyor ve haklı; G2/Capterra'nin yaninda iki cumlelik sayfa indekse
 * giremiyor.
 *
 * Esik: en az 300 karakter anlatim + en az 3 ozellik. Bu esikle 233 arac
 * kalir; gerisi sayfa olarak yasar (noindex, follow), icerigi
 * buyutulunce kendiliginden sitemap'e doner.
 */
export const EN_AZ_ANLATIM = 300;
export const EN_AZ_OZELLIK = 3;

export function icerikDerin(t?: Arac): boolean {
  const anlatim = (t?.longDescription || "").trim().length;
  const ozellik = Array.isArray(t?.keyFeatures) ? t!.keyFeatures!.length : 0;
  return anlatim >= EN_AZ_ANLATIM && ozellik >= EN_AZ_OZELLIK;
}

export function aracIndekslenir(t?: Arac): boolean {
  return incelenmis(t) && icerikDerin(t);
}

/**
 * ALTERNATIF SAYFASI: incelenmis + fiyati dogrulanmis.
 * Bu sayfa turunun tek ise yarar iddiasi "su fiyata su secenekler";
 * fiyat dogrulanmamissa sayfanin soyleyecek sozu yok.
 */
export function alternatifIndekslenir(t?: Arac): boolean {
  return aracIndekslenir(t) && fiyatiDogrulanmis(t);
}

/**
 * KARSILASTIRMA SAYFASI: en sert kapi.
 * Iki taraf da incelenmis, iki tarafin da fiyati dogrulanmis, iki taraf
 * da kriterli VE aralarinda gercek bir fark olacak.
 *
 * Onceki kural "en az bir taraf incelenmis"ti ve 2.345 sayfayi geciriyordu;
 * arac verisinde `incelendi` alani neredeyse her kayitta dolu oldugu icin
 * kapi fiilen aciktir.
 *
 * Kapiya uygun arac 323/512 (fiyat kanitindaki hata duzeltilmeden once
 * 225'ti). Uretilen sitemap: 600 /compare, 341 /alternatives, 460 /tools.
 */
export function ciftIndekslenir(a?: Arac, b?: Arac): boolean {
  return (
    incelenmis(a) && incelenmis(b) &&
    fiyatiDogrulanmis(a) && fiyatiDogrulanmis(b) &&
    kriterliMi(a) && kriterliMi(b) &&
    gercekFarkVar(a, b)
  );
}

/** Metadata'ya konacak robots degeri. Indekslenmeyen sayfa yine de link akitir. */
export const NOINDEX = { index: false, follow: true } as const;
