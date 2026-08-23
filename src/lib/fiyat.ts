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

export type FiyatModeli = "bedava" | "ucretsiz-katman" | "kullanima-gore" | "aylik";

export type Arac = {
  name: string;
  basePrice?: number;
  isFlat?: boolean;
  fiyatModeli?: FiyatModeli;
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
  const model = t.fiyatModeli ?? (typeof t.basePrice === "number" && t.basePrice > 0 ? "aylik" : undefined);
  const birim = t.isFlat ? "/mo" : "/user/mo";

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
