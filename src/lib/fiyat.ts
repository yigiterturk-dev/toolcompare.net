/**
 * Fiyatin TEK yorumlayicisi.
 *
 * DENETIMDE BULUNAN (2026-08-24): tools.json'da fiyat tek bir sayi
 * (`basePrice`) ve 121 aracin 51'inde bu sayi 0. Ama 0 UC AYRI SEYI
 * ayni kefeye koyuyordu:
 *   - gercekten bedava olan arac
 *   - ucretsiz katmani olan ama ucretli plani da olan arac
 *   - kullanima/isleme gore fiyatlanan arac (Stripe, AWS)
 *
 * Sonucu: site "Stripe $0/mo", "cheapest entry point is Vercel at $0/mo"
 * ve 418 karsilastirma sayfasinda "cheaper to start ($0 vs $39/mo)"
 * diyordu. Stripe islem basina, AWS kullanima gore ucretlendiriyor;
 * ikisi de "aylik $0" degil. Bu, fiyat karsilastirma sitesinde
 * soylenebilecek en kotu yanlis.
 *
 * COZUM: 0 artik "bedava" DEGIL, "dogrulanmadi" demek. Dogrulanmamis
 * fiyat hicbir karsilastirmaya, "en ucuz" hesabina veya fark cumlesine
 * GIRMEZ; sayfada da fiyat yerine durumu yazilir.
 *
 * DUZELTME YOLU: tools.json'daki araca `fiyatModeli` alani eklenir.
 *   "bedava"          -> gercekten ucretsiz, ucretli plani yok
 *   "ucretsiz-katman" -> ucretsiz baslanir, ucretli plani var
 *   "kullanima-gore"  -> islem/kullanim basina (Stripe, AWS)
 *   "aylik"           -> basePrice aylik gercek fiyat
 * Alan yoksa ve basePrice 0 ise: dogrulanmadi.
 */

export type FiyatModeli =
  | "bedava"
  | "ucretsiz-katman"
  | "kullanima-gore"
  | "aylik"
  /* Katalog 121'den 512'ye buyurken veriye yazilan modeller. */
  | "kullanici-basina"
  | "abonelik"
  | "abonelik-arti-islem"
  | "teklif"
  | "ucretsiz-kredi"
  | "urun-bazli"
  | "degisken"
  /*
    DENETIMDE BULUNAN (2026-09-07): tek seferlik satin alinan araclar
    (Sublime Text $99, Procreate) "abonelik" olarak isaretlenince sayfa
    "From $99/mo" yaziyordu -- fiyat karsilastirma sitesinde bir lisansi
    aylik ucret gibi gostermek en pahali yanlislardan biri. Tek seferlik
    tutar aylik karsilastirmaya GIRMEZ: $99 bir kere ile $99/ay ayni
    kefeye konamaz.
  */
  | "tek-seferlik";

/*
  DENETIMDE BULUNAN (2026-08-25): veri bu sozlesmeden kaymisti.
  tools.json'da 13 farkli `fiyatModeli` degeri vardi, bu dosya 4 tanesini
  taniyordu. Tanimayan her deger `return`a dusuyor ve sayfada
  "Pricing not verified" yaziyordu -- MODEL VERIDE YAZILI OLDUGU HALDE.
  Olculdu: 60 aracin modeli yazilmis ama tanimiyordu; 22'si basePrice > 0
  oldugu icin kurtuluyordu, geriye kalan 38 arac sitede yanlis yere
  "dogrulanmadi" diyordu.

  Ikisi duz esanlamliydi ve once onlar tekillestiriliyor:
    "ucretsiz"      -> "bedava"
    "kullanim-bazli"-> "kullanima-gore"
*/
const ESANLAMLI: Record<string, FiyatModeli> = {
  ucretsiz: "bedava",
  "kullanim-bazli": "kullanima-gore",
};

/** Veriden gelen ham degeri sozlesmedeki modele cevirir. */
function modeliCoz(ham: string | undefined): FiyatModeli | undefined {
  if (!ham) return undefined;
  return (ESANLAMLI[ham] ?? ham) as FiyatModeli;
}

/** Bu dosyanin tanidigi butun modeller. Denetim betigi bunu okuyor. */
export const TANINAN_MODELLER: readonly string[] = [
  "bedava", "ucretsiz-katman", "kullanima-gore", "aylik",
  "kullanici-basina", "abonelik", "abonelik-arti-islem",
  "teklif", "ucretsiz-kredi", "urun-bazli", "degisken", "tek-seferlik",
  ...Object.keys(ESANLAMLI),
];

/*
  Bu dosyanin GIRDI tipi bilerek dar ve gevsek: fiyatDurumu'nu kismi
  nesnelerle de cagirabilmek gerekiyor (testler, izgara kirpmasi).
  `fiyatModeli` burada `string` -- cunku veride bu dosyanin tanimadigi
  degerler VAR ve tanimamak bir hata degil, `modeliCoz` bunun icin var.
  Union yazmak "veri hep sozlesmeye uyar" yalanini tipe kazimak olurdu;
  denetimde tam bu kayma bulunmustu (13 deger, 4 taninan).
*/
export type Arac = {
  name: string;
  basePrice?: number;
  isFlat?: boolean;
  fiyatModeli?: string;
  fiyatKontrolTarihi?: string;
};

export type FiyatDurumu = {
  /** Sayisal karsilastirmaya girebilir mi? */
  karsilastirilabilir: boolean;
  /** Girebiliyorsa aylik tutar. */
  aylik: number | null;
  /** Sayfada gosterilecek metin. */
  metin: string;
  /** Kisa etiket (tablo hucresi gibi dar yerler icin). */
  kisa: string;
};

export function fiyatDurumu(t: Arac): FiyatDurumu {
  const model = modeliCoz(t.fiyatModeli) ?? (typeof t.basePrice === "number" && t.basePrice > 0 ? "aylik" : undefined);
  const birim = t.isFlat ? "/mo" : "/user/mo";
  const fiyatVar = typeof t.basePrice === "number" && t.basePrice > 0;

  /*
    Abonelik ve kullanici-basina, rakami olan modeller: ikisi de aylik
    tutar demek. Rakam yoksa fiyat iddia edilmiyor, model soyleniyor.
  */
  if ((model === "abonelik" || model === "kullanici-basina") && fiyatVar) {
    return {
      karsilastirilabilir: true,
      aylik: t.basePrice as number,
      metin: `From $${t.basePrice}${model === "kullanici-basina" ? "/user/mo" : birim}`,
      kisa: `$${t.basePrice}${model === "kullanici-basina" ? "/user/mo" : birim}`,
    };
  }

  /*
    Asagidakilerin hicbiri sayisal karsilastirmaya GIRMEZ -- ama "bilinmiyor"
    da degil. Fark onemli: musteriye "fiyatini bilmiyoruz" demekle "fiyati
    teklife bagli" demek ayni sey degil.
  */
  if (model === "teklif") {
    return { karsilastirilabilir: false, aylik: null, metin: "Custom pricing — quote required", kisa: "Quote only" };
  }
  if (model === "ucretsiz-kredi") {
    return { karsilastirilabilir: false, aylik: null, metin: "Starts with free credits", kisa: "Free credits" };
  }
  if (model === "urun-bazli") {
    return { karsilastirilabilir: false, aylik: null, metin: "Priced per product", kisa: "Per product" };
  }
  if (model === "abonelik-arti-islem") {
    return { karsilastirilabilir: false, aylik: null, metin: "Subscription plus transaction fees", kisa: "Sub + fees" };
  }
  if (model === "degisken") {
    return { karsilastirilabilir: false, aylik: null, metin: "Variable pricing", kisa: "Variable" };
  }
  if (model === "tek-seferlik") {
    return fiyatVar
      ? { karsilastirilabilir: false, aylik: null, metin: `$${t.basePrice} one-time purchase`, kisa: `$${t.basePrice} once` }
      : { karsilastirilabilir: false, aylik: null, metin: "One-time purchase", kisa: "One-time" };
  }
  if (model === "abonelik" || model === "kullanici-basina") {
    return { karsilastirilabilir: false, aylik: null, metin: "Subscription — amount not verified", kisa: "Sub, amount TBC" };
  }

  if (model === "aylik" && typeof t.basePrice === "number" && t.basePrice > 0) {
    return {
      karsilastirilabilir: true,
      aylik: t.basePrice,
      metin: `From $${t.basePrice}${birim}`,
      kisa: `$${t.basePrice}${birim}`,
    };
  }

  if (model === "bedava") {
    // Bedava = aylik 0, ve bu DOGRULANMIS bir 0. Karsilastirmaya girer.
    return { karsilastirilabilir: true, aylik: 0, metin: "Free", kisa: "Free" };
  }

  if (model === "ucretsiz-katman") {
    // Ucretsiz baslanir ama ucretli plan var; "en ucuz" iddiasinda
    // kullanmak yaniltici olur, o yuzden karsilastirma disi.
    return { karsilastirilabilir: false, aylik: null, metin: "Free tier available", kisa: "Free tier" };
  }

  if (model === "kullanima-gore") {
    return { karsilastirilabilir: false, aylik: null, metin: "Usage-based pricing", kisa: "Usage-based" };
  }

  return {
    karsilastirilabilir: false,
    aylik: null,
    metin: "Pricing not verified",
    kisa: "Not verified",
  };
}

/** "En ucuz" hesabina yalnizca dogrulanmis fiyatlar girer. */
export function enUcuz<T extends Arac>(araclar: T[]): T | null {
  const uygun = araclar
    .map((t) => ({ t, d: fiyatDurumu(t) }))
    .filter((x) => x.d.karsilastirilabilir && x.d.aylik !== null)
    .sort((a, b) => (a.d.aylik as number) - (b.d.aylik as number));
  return uygun.length ? uygun[0].t : null;
}

/** Fiyatin en son ne zaman dogrulandigi. Yoksa null. */
export function kontrolTarihi(t: Arac): string | null {
  return t.fiyatKontrolTarihi || null;
}

/** Kac aracin fiyati dogrulanmamis? Denetim ve panel icin. */
export function dogrulanmamisSayisi(araclar: Arac[]): number {
  return araclar.filter((t) => !fiyatDurumu(t).karsilastirilabilir).length;
}
