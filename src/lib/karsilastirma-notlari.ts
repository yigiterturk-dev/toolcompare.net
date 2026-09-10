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
};

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
