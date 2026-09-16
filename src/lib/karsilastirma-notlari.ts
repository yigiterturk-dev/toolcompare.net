/**
 * ELLE YAZILMIS KARSILASTIRMA SORULARI.
 *
 * NEDEN VAR (GSC olcumu, 2026-09-10):
 * `lib/sss.ts` sorulari veriden turetiyor -- fiyat kiyasi, ucretsiz plan,
 * kriter ayrimi. Bunlar iyi ama Search Console'da /compare/* sayfalarina
 * gelen sorgularin bir kismi bambaska bir sey soruyor:
 *   "woocommerce teachable integration"   -> p20.9, 14 gosterim
 *   "typeform getresponse integration"    -> p13.6, 14 gosterim
 *   "drizzle mongodb"                     -> p9.4,   5 gosterim
 *   "youtrack vs linear"                  -> p8.7,   6 gosterim
 * Cevap katalogda YOK: "bu ikisi birbirine baglanir mi" sorusu fiyat
 * verisinden turetilemez, arastirilip yazilmasi gerekir. Bu dosya o
 * arastirmanin durdugu yer.
 *
 * KURAL: her maddenin arkasinda okunmus bir kaynak vardir ve `kaynak`
 * alaninda durur. Dogrulanamayan sey uydurulmaz -- "dogrulayamadik" diye
 * yazilir. Sitenin tek iddiasi dogruluk; entegrasyon sorusunda tahmin
 * yurutmek onu bitirir.
 *
 * Bu maddeler turetilmis sorularin ONUNE konur: kullanicinin fiilen
 * yazdigi cumlenin cevabi once gelir.
 */

import notlarData from "../data/karsilastirma-notlari.json" with { type: "json" };
import type { Soru } from "./sss.ts";

type Not = {
  kontrolTarihi?: string;
  sorular?: { soru?: string; cevap?: string; kaynak?: { etiket?: string; url?: string } }[];
  kisaCevap?: {
    ozet?: string;
    sec?: Record<string, string[]>;
    kaynaklar?: { etiket?: string; url?: string }[];
  };
};

/**
 * ELLE YAZILMIS KISA CEVAP (olcum, 2026-09-15).
 *
 * Sayfanin "Short answer" kutusu fiyat verisinden turetiliyordu:
 * "Price: not directly comparable -- Firebase is free tier available,
 * Keycloak is free." Her ciftte ayni kalip. firebase-vs-keycloak 9. sirada
 * dururken ustundeki kucuk siteler (skycloak, solodevstack) SAML/LDAP,
 * mobil SDK, self-host gibi GERCEK ayrimlari yaziyordu; bizde o ayrim
 * dort bitlik kriter tablosundan cikmiyordu.
 *
 * Ayni dort bit ikinci bir zarar daha veriyordu: semrush-vs-similarweb,
 * amplitude-vs-hotjar, elevenlabs-vs-synthesia gibi ciftlerde iki tarafin
 * api/mobil/acikKaynak/sso degerleri birebir ayni ciktigi icin
 * `gercekFarkVar` false donuyor, sayfa noindex kaliyordu -- oysa fark var,
 * tabloda gorunmuyor. Elle yazilmis kisa cevap o farkin kendisidir; varsa
 * kapiyi acar (bkz. lib/indeks.ts gercekFarkVar).
 *
 * `sec` anahtari arac slug'idir: her iki taraf icin "bunu sec, eger..."
 * maddeleri. Rakam yazilmaz -- fiyat zaten izlenen veriden basiliyor ve
 * elle yazilan rakam eskir.
 */
export type KisaCevap = {
  ozet: string;
  sec: Record<string, string[]>;
  kaynaklar: { etiket: string; url: string }[];
  kontrolTarihi?: string;
};

export function elleYazilmisKisaCevap(kanonik: string): KisaCevap | null {
  const kayit = notlar[kanonik];
  if (!kayit || typeof kayit === "string" || !kayit.kisaCevap) return null;
  const k = kayit.kisaCevap;
  if (typeof k.ozet !== "string" || !k.ozet.trim()) return null;
  const sec: Record<string, string[]> = {};
  for (const [slug, maddeler] of Object.entries(k.sec ?? {})) {
    if (!Array.isArray(maddeler)) continue;
    const temiz = maddeler.filter((m): m is string => typeof m === "string" && m.trim().length > 0).map((m) => m.trim());
    if (temiz.length) sec[slug] = temiz;
  }
  return {
    ozet: k.ozet.trim(),
    sec,
    kaynaklar: (k.kaynaklar ?? [])
      .filter((x): x is { etiket: string; url: string } => Boolean(x && x.etiket && x.url))
      .map((x) => ({ etiket: x.etiket, url: x.url })),
    kontrolTarihi: kayit.kontrolTarihi,
  };
}

/** Kisa cevabi elle yazilmis ciftler -- denetim ve testler icin. */
export function kisaCevapliCiftler(): string[] {
  return Object.keys(notlar).filter((k) => !k.startsWith("_") && elleYazilmisKisaCevap(k) !== null);
}

const notlar = notlarData as unknown as Record<string, Not | string>;

/**
 * Kanonik cift slug'i icin elle yazilmis sorular.
 * Cagiran taraf slug'i `kanonikSlug(a, b)` ile uretir.
 */
export function elleYazilmisSorular(kanonik: string): Soru[] {
  const kayit = notlar[kanonik];
  if (!kayit || typeof kayit === "string" || !Array.isArray(kayit.sorular)) return [];

  return kayit.sorular
    .filter((s): s is { soru: string; cevap: string; kaynak?: { etiket?: string; url?: string } } =>
      Boolean(s && typeof s.soru === "string" && s.soru.trim() && typeof s.cevap === "string" && s.cevap.trim())
    )
    .map((s) => ({
      soru: s.soru.trim(),
      cevap: s.cevap.trim(),
      kaynak:
        s.kaynak?.url && s.kaynak.etiket
          ? { etiket: s.kaynak.etiket, url: s.kaynak.url }
          : undefined,
    }));
}

/** Elle not yazilmis cift sayisi -- denetim scriptleri icin. */
export function notluCiftler(): string[] {
  return Object.keys(notlar).filter((k) => !k.startsWith("_"));
}

/*
  Kanonik ciftin not kontrol tarihi (sitemap lastmod'u besler).

  NEDEN (2026-09-15): sitemap'te compare sayfasinin lastmod'u iki aracin
  kanit tarihi + entegrasyon kaydindan turetiliyordu; elle yazilan
  soru-cevap ve kisa cevap eklenince sayfa icerigi degistigi halde tarih
  degismiyordu. chatwoot-vs-zendesk 09-15'te yeniden yazildi, sitemap
  09-07 ilan etti -- Google'a "degismedi" sinyali. Tarih yine VERIDEN
  gelir: not kaydinin kendi kontrolTarihi.
*/
export function karsilastirmaTarihi(kanonik: string): string | undefined {
  const kayit = notlar[kanonik];
  if (!kayit || typeof kayit === "string") return undefined;
  return typeof kayit.kontrolTarihi === "string" ? kayit.kontrolTarihi : undefined;
}
