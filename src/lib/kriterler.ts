/**
 * Araclarin OBJEKTIF ozellikleri.
 *
 * NEDEN VAR: uydurma kalite puanlarini sokunce karsilastirma sayfalarinda
 * geriye kategori ve fiyat kaldi -- karsilastirma tablosu olmayan bir
 * karsilastirma sitesi. Yerine konan sey, uydurulamayacak turden olmali.
 *
 * SECIM OLCUTU: bir ozellik buraya ancak (a) nesnel olarak dogru ya da
 * yanlis olabiliyorsa, (b) sik degismiyorsa ve (c) satin alma kararini
 * gercekten etkiliyorsa giriyor. "Kullanimi kolay mi" bu testi gecmez;
 * "acik API'si var mi" gecer.
 *
 * UCUNCU DEGER: null = BAKILMADI. false ile karistirilmamali. Bilmedigimiz
 * seyi "yok" diye yazmak, uydurma puanlarin yaptigi hatanin ta kendisi
 * olurdu. Sayfa da bunlari "not checked" diye gosterir.
 */

export type Kriter = "api" | "mobil" | "acikKaynak" | "sso";

export type KriterKumesi = Partial<Record<Kriter, boolean>>;

export const KRITER_ETIKET: Record<Kriter, string> = {
  api: "Public API",
  mobil: "Mobile app",
  acikKaynak: "Open source / self-hostable",
  sso: "SSO (SAML)",
};

export const KRITER_ACIKLAMA: Record<Kriter, string> = {
  api: "Offers a documented API you can build against.",
  mobil: "Has a native app for iOS or Android, not just a mobile website.",
  acikKaynak: "Source is open and the tool can be run on your own infrastructure.",
  sso: "Supports SAML single sign-on on at least one plan.",
};

export const KRITER_SIRA: Kriter[] = ["api", "mobil", "acikKaynak", "sso"];
