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

type Arac = {
  slug: string;
  incelendi?: boolean;
  verdict?: string;
  longDescription?: string;
  evidence?: { status?: string };
  kriterler?: Record<string, unknown>;
};

/** Insan elinden gecmis: kendi yorumu ve uzun anlatimi var. */
export function incelenmis(t?: Arac): boolean {
  return t?.incelendi === true && Boolean(t?.verdict);
}

/** Fiyati saticinin kendi sayfasindan dogrulanmis. */
export function fiyatiDogrulanmis(t?: Arac): boolean {
  return t?.evidence?.status === "pricing-page-verified";
}

/** Ozellik matrisi dolu: karsilastirma tablosu gercekten bir sey gosterir. */
export function kriterliMi(t?: Arac): boolean {
  return Boolean(t?.kriterler && Object.keys(t.kriterler).length > 0);
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
  const ka = (a.kriterler || {}) as Record<string, unknown>;
  const kb = (b.kriterler || {}) as Record<string, unknown>;
  return Object.keys({ ...ka, ...kb }).some((k) => Boolean(ka[k]) !== Boolean(kb[k]));
}

/**
 * ARAC SAYFASI: incelenmis olmasi yeter.
 * Kendi yorumu ve uzun anlatimi olan sayfa zaten benzersizdir; burada
 * fiyat kaniti aramak 217 gercek sayfayi bosuna disarida birakirdi.
 */
export function aracIndekslenir(t?: Arac): boolean {
  return incelenmis(t);
}

/**
 * ALTERNATIF SAYFASI: incelenmis + fiyati dogrulanmis.
 * Bu sayfa turunun tek ise yarar iddiasi "su fiyata su secenekler";
 * fiyat dogrulanmamissa sayfanin soyleyecek sozu yok.
 */
export function alternatifIndekslenir(t?: Arac): boolean {
  return incelenmis(t) && fiyatiDogrulanmis(t);
}

/**
 * KARSILASTIRMA SAYFASI: en sert kapi.
 * Iki taraf da incelenmis, iki tarafin da fiyati dogrulanmis, iki taraf
 * da kriterli VE aralarinda gercek bir fark olacak.
 *
 * Onceki kural "en az bir taraf incelenmis"ti ve 2.345 sayfayi geciriyordu;
 * arac verisinde `incelendi` alani neredeyse her kayitta dolu oldugu icin
 * kapi fiilen aciktir. Bu kural ~364 sayfa gecirir.
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
