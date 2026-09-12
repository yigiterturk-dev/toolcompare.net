/**
 * ENTEGRASYON KAYITLARI: "bu ikisi birlikte calisiyor mu" sorusunun cevabi.
 *
 * NEDEN (GSC olcumu, 90 gun, 2026-09-12): entegrasyon sorgulari sitenin EN
 * IYI siraladigi sinifti -- agirlikli sira 43,9 (marka 51,6 · fiyat 65,9 ·
 * alternatif 76,5 · vs 69,8). 457 gosterim, TIK SIFIR. Sebebi yapisal:
 * insanlar "typeform kajabi integration" ariyor, /compare/kajabi-vs-typeform
 * sayfasina dusuyor, sayfa ise "hangisi daha iyi" sorusunu cevapliyor.
 * Soru bu degil.
 *
 * Ayni kumeyi sitenin kendi ISLEV kapisi da bagimsiz olarak isaretlemisti:
 * gosterim alip noindex kalan 85 cift sayfasinin 65'i "farkli isi goruyor"
 * diye kapatilmisti. Farkli is gormek, karsilastirmayi anlamsiz kilar ama
 * ENTEGRASYONU anlamli kilar -- zaten o yuzden entegre ediliyorlar.
 *
 * KURAL 1 -- KANIT: buraya yalnizca saticinin KENDI sayfasinda gorulen bilgi
 * girilir. Her kayit, o sayfadan alinmis gercek bir cumleyi (`kaynakSatiri`)
 * ve sayfanin sahibini (`kaynakSahibi`) tasir. "Muhtemelen Zapier'la olur"
 * bir kayit degildir.
 *
 * KURAL 2 -- TALEP KAPISI: kayit yalnizca GSC'de OLCULMUS talebi olan cift
 * icin acilir. Kartezyen uretim bu sitenin daha once yaptigi hata: 116 sayfa
 * ilk-15'te ve hepsi birlikte ayda 349 gosterim aliyor (sayfa basina 3).
 */
import ham from "../data/entegrasyonlar.json" with { type: "json" };

export type EntegrasyonDurumu = "yerlesik" | "dolayli" | "yok";

export type EntegrasyonKaydi = {
  durum: EntegrasyonDurumu;
  /** Ziyaretciye gosterilecek cevap. Tek paragraf, iddia degil aktarim. */
  ozet: string;
  /** Satici sayfasindan alinmis gercek cumle. */
  kaynakSatiri: string;
  kaynakUrl: string;
  /** Hangi saticinin sayfasi: "Kajabi dedi" ile "biz dedik" ayri seylerdir. */
  kaynakSahibi: string;
  checkedAt: string;
};

const KAYITLAR = (ham as { ciftler?: Record<string, EntegrasyonKaydi> }).ciftler ?? {};

/** Iki slug'dan kanonik cift anahtari. compare.ts ile ayni kural. */
export function kanonikCift(a: string, b: string): string {
  return a < b ? `${a}-vs-${b}` : `${b}-vs-${a}`;
}

export function entegrasyonKaydi(a?: string, b?: string): EntegrasyonKaydi | undefined {
  if (!a || !b) return undefined;
  const k = KAYITLAR[kanonikCift(a, b)];
  return k && k.ozet && k.kaynakUrl ? k : undefined;
}

export function entegrasyonVar(a?: string, b?: string): boolean {
  return Boolean(entegrasyonKaydi(a, b));
}

/** Bolum basligi: sorunun kendisi. Arayan kisi bunu yaziyor. */
export function entegrasyonBasligi(adA: string, adB: string): string {
  return `Does ${adA} work with ${adB}?`;
}

/** Kisa rozet metni. Durumu tek kelimede soyler. */
export function durumEtiketi(d: EntegrasyonDurumu): string {
  return d === "yerlesik" ? "Built-in integration" : d === "dolayli" ? "Needs a connector" : "No direct integration";
}

/** Kayit acilmis butun ciftler (denetim ve test icin). */
export function tumEntegrasyonlar(): [string, EntegrasyonKaydi][] {
  return Object.entries(KAYITLAR);
}

/**
 * Bu aracin, entegrasyon kaydi acilmis ortaklari.
 *
 * NEDEN (2026-09-12): entegrasyon ciftleri `akranlar()` evreninde YOK --
 * akranlik ayni isi gormeye bakar, bu ciftler farkli is gorur. Sitemap'e
 * alinip link verilmezse OKSUZ kalirlar; bu repo'nun kurulus kurali
 * bunu yasakliyor (bkz. compare.ts basligi: "sitemap'te olani linkle").
 * Arac sayfasi bu listeyi basarak cifte IKI taraftan da link verir.
 */
export function entegrasyonOrtaklari(slug?: string): { cift: string; diger: string; durum: EntegrasyonDurumu }[] {
  if (!slug) return [];
  const cikti: { cift: string; diger: string; durum: EntegrasyonDurumu }[] = [];
  for (const [cift, k] of tumEntegrasyonlar()) {
    const [a, b] = cift.split("-vs-");
    if (a !== slug && b !== slug) continue;
    cikti.push({ cift, diger: a === slug ? b : a, durum: k.durum });
  }
  return cikti.sort((x, y) => x.diger.localeCompare(y.diger));
}
