/**
 * ARAC KAYDININ TEK TIPI.
 *
 * DENETIMDE BULUNAN (2026-09-07): lint'te 97 `no-explicit-any` hatasi
 * vardi ve neredeyse hepsinin sebebi ayniydi -- arac kaydinin ortak bir
 * tipi yoktu. Her dosya ya kendi kismi `Arac` tipini yaziyordu
 * (categories.ts, compare.ts, fiyat.ts, indeks.ts: dordu de farkli) ya
 * da `toolsData as any[]` deyip geciyordu.
 *
 * Bunun bedeli kozmetik degil: bugun `wix-studio` ve `spyfu` kayitlari
 * 'kullanici basina' isaretliydi, sayfa '$16/user/mo' yaziyordu; tip
 * olsaydi bile yakalanmazdi ama `any`, veriyi okuyan her yerde yanlis
 * alan adini da sessizce gecirir. Tek tip, alan adi degistiginde
 * derleyicinin konusmasini saglar.
 *
 * KURAL: veri dosyasinda GERCEKTEN olan alanlar yazilir. 512 kayit
 * tarandi; kacinda dolu oldugu yorumda duruyor. Zorunlu olanlar
 * (512/512) opsiyonel DEGIL -- boylece `t.slug` icin gereksiz kontrol
 * yazilmaz.
 */

import type { Plan } from "./plan";

/** Bir ozelligin basligi ve aciklamasi. */
export type OneCikanOzellik = { title?: string; description?: string };

/** Olculebilir kriterler; karsilastirma farkini bunlar uretiyor. */
export type Kriterler = {
  api?: boolean;
  mobil?: boolean;
  acikKaynak?: boolean;
  sso?: boolean;
};

/** Kriterlerin nereden geldigi -- denetim izi. */
export type KriterKaynagi = { yontem?: string; checkedAt?: string };

/** Tek bir kaynak: adres, tarih ve hangi iddiayi destekledigi. */
export type Kaynak = {
  label?: string;
  url?: string;
  checkedAt?: string;
  supports?: string[];
};

/** Kaydin dayanagi. Kaynaksiz iddia sayfaya cikmaz (bkz. verify-claims). */
export type Kanit = {
  status?: string;
  reviewedAt?: string;
  sources?: Kaynak[];
  limitations?: string[];
};

export type Arac = {
  /* --- 512/512 kayitta dolu --- */
  slug: string;
  name: string;
  basePrice: number;
  isFlat: boolean;
  category: string;
  shortDescription: string;
  websiteUrl: string;
  incelendi: boolean;

  /* --- incelenmis kayitlarda dolu (449-481) --- */
  kriterler?: Kriterler;
  longDescription?: string;
  pros?: string[];
  cons?: string[];
  targetAudience?: string;
  verdict?: string;
  evidence?: Kanit;
  keyFeatures?: OneCikanOzellik[];

  /* --- kismen dolu --- */
  /** Fiyat modelinin ham degeri; yorumu YALNIZCA fiyat.ts yapar. */
  fiyatModeli?: string;
  fiyatKontrolTarihi?: string;
  /**
   * Saticinin yayinladigi plan merdiveni. Her basamak kaynak cumlesiyle gelir.
   * Tipe 2026-09-12'de eklendi: alan 196 kayitta doluydu ama tipte yoktu, bu
   * yuzden her kullanim yerinde `as` ile kaciliyordu (seffaflik.ts:96 gibi).
   */
  planlar?: Plan[];
  /** "Bunu al" / "bunu alma" maddeleri -- saticinin sitesinde olmayan icerik. */
  bestFor?: string[];
  skipIf?: string[];
  /** Arama niyetine gore elle yazilmis SSS; saticinin sayfasindan dogrulanmis, kaynagi evidence.sources'ta. */
  sss?: { soru: string; cevap: string }[];
  kriterKaynagi?: KriterKaynagi;

  /* --- eski izgara gorunumunden kalan gorsel alanlar (108 kayit) --- */
  iconName?: string;
  color?: string;
  color1?: string;
  color2?: string;
  ease?: number;
  featuresScore?: number;
  features?: string[];
};
