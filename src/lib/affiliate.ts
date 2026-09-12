/**
 * AFFILIATE: TEK KAYNAK.
 *
 * Neden bu dosya var: para kazandiran link ile sitenin ziyaretciye
 * verdigi soz AYNI YERDEN gelmek zorunda. Bugun /terms ve /methodology
 * sayfalari "hicbir affiliate programina katilmiyoruz" yaziyor. Bir
 * yere elle affiliate linki yapistirilirsa site YALAN SOYLEMIS olur --
 * ve FTC'nin actigi ilk basliktir bu.
 *
 * Bu yuzden tek anahtar: `src/data/affiliate.json`. Oraya bir kayit
 * girildigi anda ayni anda:
 *   - /go/<slug> affiliate hedefine gider
 *   - o aracin dis linki rel="sponsored" olur
 *   - sayfalarda aciklama serdi gorunur
 *   - /terms ve /methodology metni "katiliyoruz" haline doner
 * Hicbiri unutulamaz, cunku hepsi tek fonksiyondan okuyor.
 */

import kayitlar from "@/data/affiliate.json";

export type AffiliateKaydi = {
  /** Tam affiliate adresi. Ag ne olursa olsun sonunda bir URL'dir. */
  url: string;
  /** Hangi ag uzerinden (impact, partnerstack, shareasale, dogrudan...). */
  network?: string;
  /** Anlasmanin yapildigi tarih; denetim izi. */
  since?: string;
};

const harita = kayitlar as Record<string, AffiliateKaydi>;

export function affiliateKaydi(slug: string): AffiliateKaydi | undefined {
  const k = harita[slug];
  return k && k.url ? k : undefined;
}

/** Bu aracin linki paralı mı? rel="sponsored" bunun uzerinden veriliyor. */
export function paraliMi(slug: string): boolean {
  return Boolean(affiliateKaydi(slug));
}

/**
 * Sitede TEK BIR parali link bile var mi?
 * Aciklama serdi ve /terms metni buna bakar. Sifirsa site "komisyon
 * almiyoruz" demeye devam eder -- cunku almiyordur.
 */
export function affiliateAktifMi(): boolean {
  return Object.values(harita).some((k) => k && k.url);
}

/** Dis linkin rel degeri. Paraliysa Google'in istedigi etiket "sponsored". */
export function relDegeri(slug: string): string {
  return paraliMi(slug)
    ? "noopener noreferrer sponsored"
    : "noopener noreferrer nofollow";
}

/**
 * Aciklama metni IKI parcadan olusur:
 *   KAZANC  -- "komisyon aliyoruz" olgusu
 *   SOZ     -- "ama sunu degistirmiyor" taahhudu
 *
 * NEDEN AYRILDI (2026-09-12, ilk anlasma devreye alininca gorundu):
 * /terms ve /methodology bu olguyu zaten KENDI cumleleriyle soyluyor ve
 * ardindan tam metni basiyordu; sonuc "...earn us a commission if you sign
 * up. Some links on this page earn us a commission if you sign up." seklinde
 * kekeleyen bir paragraftı. Iki sayfa da hukuki metin; kekelemesin.
 * Olguyu kendi cumlesiyle soyleyen sayfa yalnizca SOZ'u ekler.
 */
export const ACIKLAMA_KAZANC =
  "Some links on this page earn us a commission if you sign up.";
export const ACIKLAMA_SOZ =
  "It never changes a price you pay, a verdict we publish, or the order tools appear in.";

/** Olguyu kendisi soylemeyen yerler (sayfa ici serit) icin tam cumle. */
export const ACIKLAMA_METNI = `${ACIKLAMA_KAZANC} ${ACIKLAMA_SOZ}`;
