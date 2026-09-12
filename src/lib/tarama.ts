/**
 * TARAMAYA DEGER MI?
 *
 * NEDEN VAR (olcum, 2026-09-10): Google'in "taramaya degmez" karari
 * sayfa basina degil SITE basina veriliyor. Sitemap'teki 1.234 adresin
 * 355'inin (%29) ne ayirt edici bir icerigi ne de olculmus talebi vardi
 * -- /alternatives'in %52'si, /compare'in %38'i. Bu adresler tarama
 * butcesini yer ve sitenin ortalamasini dusurur; sonuc, HAK EDEN
 * sayfanin da beklemesidir.
 *
 * KAPI IKI SORULUK, VE "VEYA" ILE BAGLI:
 *   1) Sayfada bu cifte/araca OZGU bir sey var mi? (plan merdiveni,
 *      elle yazilmis soru, SSS, derin govde)
 *   2) Google zaten gosteriyor mu? (GSC gosterimi)
 *
 * Ikisinden BIRI yeterli. Talep gormek kurtarir, talep gormemek tek
 * basina elemez -- adreslerin %36'si "URL is unknown to Google"
 * durumunda ve gosterim yoklugu sayfa hakkinda bir sey soylemiyor
 * (ayni gerekce: lib/indeks.ts).
 *
 * ELENEN SAYFA SILINMEZ VE NOINDEX YAPILMAZ: yalnizca sitemap'ten
 * cikar. Sayfa yasar, link akitir, icerigi buyudugu an -- bir SSS, bir
 * merdiven basamagi -- kapidan kendiliginden geri girer. Sitemap bir
 * oncelik beyanidir; "bu sayfa kotudur" beyani degil.
 */

import type { Arac } from "./arac.ts";
import { talepGormus, yolTalepGormus } from "./talep.ts";
import { merdivenVar } from "./plan.ts";
import { notluCiftler } from "./karsilastirma-notlari.ts";
import { ciftIndekslenir } from "./indeks.ts";

const ELLE_NOTLU = new Set(notluCiftler());

function sssliMi(t?: Arac): boolean {
  return Array.isArray((t as { sss?: unknown[] } | undefined)?.sss) && ((t as { sss: unknown[] }).sss.length > 0);
}

function derinGovdeli(t?: Arac): boolean {
  const x = t as { bestFor?: unknown; skipIf?: unknown } | undefined;
  return Boolean(x?.bestFor && x?.skipIf);
}

/** Arac sayfasinin kendine ozgu bir seyi var mi? */
export function aracAyirtEdici(t?: Arac): boolean {
  if (!t) return false;
  return sssliMi(t) || merdivenVar(t as never) || derinGovdeli(t);
}

/**
 * Karsilastirma sayfasi: iki tarafin da merdiveni varsa sayfa gercekten
 * cifte ozgu rakamlar basiyor. Tek taraf yeterli degil -- o zaman sayfa
 * "biri fiyat yayimliyor, obüru yayimlamiyor" demekten ibaret kalir ve
 * bu cumle yuzlerce sayfada ayni.
 */
export function ciftAyirtEdici(a?: Arac, b?: Arac): boolean {
  if (!a || !b) return false;
  const kanonik = a.slug < b.slug ? `${a.slug}-vs-${b.slug}` : `${b.slug}-vs-${a.slug}`;
  if (ELLE_NOTLU.has(kanonik)) return true;
  return merdivenVar(a as never) && merdivenVar(b as never);
}

/**
 * Alternatif sayfasi: asil aracin merdiveni varsa acilis ozeti gercek
 * rakam basiyor (bkz. lib/plan.ts alternatifOzeti).
 */
export function alternatifAyirtEdici(t?: Arac): boolean {
  return Boolean(t) && merdivenVar(t as never);
}

/* ---- Sitemap kapilari: ayirt edicilik VEYA olculmus talep ---- */

export function aracTaranmayaDeger(t?: Arac): boolean {
  return aracAyirtEdici(t) || talepGormus(t?.slug);
}

export function alternatifTaranmayaDeger(t?: Arac): boolean {
  return alternatifAyirtEdici(t) || yolTalepGormus(`/alternatives/${t?.slug}`);
}

/**
 * Cift talebi, taraflarinin talebi DEGILDIR: Asana gosterim aliyor diye
 * "asana-vs-linear" de aliyor demek degil. Bu yuzden yol bazli sorulur.
 */
export function ciftTaranmayaDeger(a?: Arac, b?: Arac): boolean {
  if (!a || !b) return false;
  const kanonik = a.slug < b.slug ? `${a.slug}-vs-${b.slug}` : `${b.slug}-vs-${a.slug}`;
  return ciftAyirtEdici(a, b) || yolTalepGormus(`/compare/${kanonik}`);
}

/**
 * Bir aracin, LINK VERILEBILIR akranlari.
 *
 * NEDEN AYRI BIR FONKSIYON (olcum, 2026-09-10): sitemap'i 1.234'ten
 * 688 adrese budamak tek basina hicbir ise yaramiyordu -- site, ic
 * linkleriyle sitemap DISI 1.194 karsilastirma sayfasina 9.710 link
 * veriyordu ve Googlebot linki sitemap'ten cok daha fazla takip eder.
 * Linkleri veren de tek bir yer degildi: 4.859'u karsilastirma
 * sayfalarinin kendisinden, 1.699'u alternatif sayfalarindan,
 * 830'u arac sayfalarindan geliyordu.
 *
 * Kural tek: SITEMAP'TE OLANI LINKLE. Sitemap sayfalari yetim kalmaz
 * (olculdu: 0 yetim), sablon kopyalari tarama butcesi yemez, icerigi
 * buyuyen cift kapidan kendiliginden geri girer.
 */
export function linklenebilirAkranlar<T extends Arac>(arac: Arac | undefined, akranlar: T[]): T[] {
  if (!arac) return [];
  /*
    IKI KAPI, TEK YERDE (olcum, 2026-09-12).

    Burada yalnizca TARAMA kapisi soruluyordu; sitemap ise kanit kapisini
    DA istiyor (bkz. compare.ts/sitemapCiftleri). Arada kalan cift
    noindex olup yine de link aliyordu. Olculdu: indekslenebilir
    sayfalardan noindex sayfalara 261 ic link gidiyordu; en cok
    linklenen betterstack-vs-datadog'du (15 sayfadan).

    Noindex bir sayfaya link vermek Googlebot'u oraya gonderip bos
    dondurur -- tarama butcesi, sitenin asil sayfalarindan calinir.
    Kural tek ve bu depoda zaten yazili: SITEMAP'TE OLANI LINKLE.
    Kosul burada durdugu icin butun cagiranlar (karsilastirma sayfasinin
    "Other X comparisons" seridi, arac sayfasi, alternatif sayfasi) ayni
    cevabi alir.
  */
  return akranlar.filter(
    (t) => t.slug !== arac.slug && ciftIndekslenir(arac, t) && ciftTaranmayaDeger(arac, t),
  );
}
