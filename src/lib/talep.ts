/**
 * TALEP SINYALI: Google'in bu site icin OLCTUGU gercek arama ilgisi.
 *
 * NEDEN (GSC olcumu, 2026-09-02, 90 gun):
 * Ince icerik kapisi (bkz. indeks.ts icerikDerin) 512 aracin 227'sini
 * `noindex, follow` yapiyor. Olculdugunde bunlarin 82'si Google'da ZATEN
 * GOSTERIM ALIYORDU -- sitenin 700 gosteriminin 414'u (%59). Icinde
 * `pinecone` var: "pinecone vector" sorgusunda POZISYON 2.
 *
 * Karakter sayan bir vekil olcut, Google'in fiilen sirada gosterdigi bir
 * sayfayi gizliyordu. Sitenin elindeki tek gercek sinyali kendi eliyle
 * yok etmek demekti bu.
 *
 * KURAL: talep, sayfa ELEMEZ -- yalnizca KURTARIR.
 * Gosterim almis olmak olumlu kanittir; gosterim almamis olmak kanit
 * DEGILDIR (adreslerin %36'si "URL is unknown to Google" -- Google oraya
 * hic bakmamis). Bu yuzden talep verisi bir filtre degil, ince icerik
 * kapisinin ustunde calisan bir muafiyettir. Ilk tasarim bunu filtre
 * olarak kurmustu ve `notion` gibi taninan ama henuz taranmamis araclari
 * eliyordu; o yaklasim olculup birakildi.
 *
 * Kurtarilan sayfa "iyi" degil, "acil zenginlestirilecek" demektir:
 * `npm run gsc:borc` listeyi verir.
 *
 * Veri `npm run gsc:senkron` ile tazelenir.
 */
import ham from "../data/gsc/latest.json" with { type: "json" };

/** 90 gunde en az bu kadar gosterim almis sayfa "talep gormus" sayilir. */
export const EN_AZ_GOSTERIM = 1;

type Satir = { page?: string; impressions?: number };

function gosterimToplami(): Map<string, number> {
  const toplam = new Map<string, number>();
  for (const satir of ((ham as { rows?: Satir[] }).rows || [])) {
    const eslesme = (satir.page || "").match(/\/tools\/([^/?#]+)/);
    if (!eslesme) continue;
    toplam.set(eslesme[1], (toplam.get(eslesme[1]) || 0) + (satir.impressions || 0));
  }
  return toplam;
}

const GOSTERIM = gosterimToplami();

/** Yeni klonda / CI'da veri bos olabilir; o zaman muafiyet hic calismaz. */
export const TALEP_VERISI_VAR = GOSTERIM.size > 0;

export function talepGormus(slug?: string): boolean {
  if (!slug) return false;
  return (GOSTERIM.get(slug) || 0) >= EN_AZ_GOSTERIM;
}

export function gosterimSayisi(slug?: string): number {
  return slug ? GOSTERIM.get(slug) || 0 : 0;
}
