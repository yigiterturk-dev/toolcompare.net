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

/*
  YOL BAZLI TALEP. Yukaridaki harita yalnizca /tools/ adreslerini
  sayiyor, cunku ilk ihtiyac arac sayfasiydi. Ama tarama degeri kapisi
  (bkz. lib/tarama.ts) /compare ve /alternatives adreslerini de sormak
  zorunda: bir karsilastirma sayfasinin talebi, taraflarindan birinin
  talebi DEGILDIR -- Asana gosterim aliyor diye "asana-vs-linear" da
  aliyor demek degil.
*/
function yolToplami(): Map<string, number> {
  const toplam = new Map<string, number>();
  for (const satir of ((ham as { rows?: Satir[] }).rows || [])) {
    const yol = (satir.page || "").replace(/^https?:\/\/[^/]+/, "").replace(/[?#].*$/, "").replace(/\/$/, "");
    if (!yol) continue;
    toplam.set(yol, (toplam.get(yol) || 0) + (satir.impressions || 0));
  }
  return toplam;
}

const YOL_GOSTERIM = yolToplami();

export function yolTalepGormus(yol?: string): boolean {
  if (!yol) return false;
  return (YOL_GOSTERIM.get(yol.replace(/\/$/, "")) || 0) >= EN_AZ_GOSTERIM;
}

export function yolGosterimi(yol?: string): number {
  return yol ? YOL_GOSTERIM.get(yol.replace(/\/$/, "")) || 0 : 0;
}

/**
 * Belirli bir on ekle baslayan, talep GORMUS yollar.
 *
 * NEDEN (olcum, 2026-09-13): `akranlar()` her araca yalnizca AKRAN_ADEDI=5
 * akran veriyor. Bu bir sezgisel siralama; Google'in olcusu degil. Sonuc:
 * ayni islevli, kanit kapisini gecen ve GOOGLE'IN 1. SAYFADA GOSTERDIGI
 * ciftler evrene hic girmiyordu -- linear-vs-youtrack poz 8,3 / 26 gosterim,
 * asana-vs-teamwork 22 gosterim, clickup-vs-teamwork 18 gosterim. Talep,
 * ilk-5 sezgisinden daha guclu bir kanittir; evren ona da acilir.
 */
export function talepliYollar(onEk: string): string[] {
  const cikti: string[] = [];
  for (const [yol, gosterim] of YOL_GOSTERIM) {
    if (yol.startsWith(onEk) && gosterim >= EN_AZ_GOSTERIM) cikti.push(yol);
  }
  return cikti.sort();
}

/**
 * O yola gelen sorgular arasinda KARSILASTIRMA BICIMLI olan var mi?
 *
 * NEDEN (olcum, 2026-09-13): islev kapisi capraz islevli cifti yalnizca
 * entegrasyon kaydiyla aciyordu ve gerekcesi suydu -- "farkli is goren
 * ciftin talebi karsilastirma talebi degil, entegrasyon talebidir".
 * Bu, olculdugu kume icin (typeform x kajabi) DOGRUYDU. Ama noindex'li
 * capraz ciftlerin sorgulari cekilince tablo tersine dondu:
 *   KARSILASTIRMA 16 gosterim  /  ENTEGRASYON 0
 *   "keycloak vs firebase" poz 9 . "groupme vs slack" . "slack vs groupme"
 *   "cloudflare vs hetzner" poz 9 . "ionos vs digitalocean" poz 10,5
 * Insanlar harfiyen "A vs B" yaziyor; sayfa tam o soruyu cevapliyor ama
 * noindex yiyordu.
 *
 * OLCUT KASITLI OLARAK DAR: yalnizca "vs"/"versus" geceni sayiyoruz.
 * Salt talep yetmez -- "drizzle mongodb" gibi ima edilmis sorgu bu kapiyi
 * ACMAZ. Boylece `redis-vs-sentry` gibi gercekten anlamsiz cift kapali
 * kalir: oyle bir sorgu yoktur. Kapiyi acan talep degil, talebin BICIMI.
 */
const KARSILASTIRMA_BICIMI = /\b(vs|versus)\b/i;

/** Karsilastirma icin kimlik jetonu: kucuk harf, harf-rakam disi atilir. */
function jeton(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function yolSorgulari(): Map<string, string[]> {
  const harita = new Map<string, string[]>();
  for (const satir of ((ham as { rows?: (Satir & { query?: string })[] }).rows || [])) {
    if (!satir.query || !KARSILASTIRMA_BICIMI.test(satir.query)) continue;
    const yol = (satir.page || "").replace(/^https?:\/\/[^/]+/, "").replace(/[?#].*$/, "").replace(/\/$/, "");
    if (!yol) continue;
    const mevcut = harita.get(yol);
    if (mevcut) mevcut.push(satir.query);
    else harita.set(yol, [satir.query]);
  }
  return harita;
}

const YOL_KARSILASTIRMA_SORGULARI = yolSorgulari();

/**
 * O yola gelen sorgular arasinda, BU IKI ARACI anan karsilastirma
 * sorgusu var mi?
 *
 * OLCULEN HATA (2026-09-13, ilk deneme): olcut "yolda vs gecen sorgu var mi"
 * idi ve fazla gevsekti -- /compare/betterstack-vs-caddy'yi "caddy vs jenkins"
 * sorgusu aciyordu. Sorgu karsilastirma bicimliydi ama BASKA bir cift
 * hakkindaydi; Google sayfayi alakasiz sorguya servis etmisti. Kapiyi acan
 * sorgunun bu ciftin KENDISI hakkinda olmasi sart: iki tarafin kimlik jetonu
 * da sorguda gecmeli.
 */
export function karsilastirmaSorgusuGormus(
  yol?: string,
  aKimlikleri: (string | undefined)[] = [],
  bKimlikleri: (string | undefined)[] = [],
): boolean {
  if (!yol) return false;
  const sorgular = YOL_KARSILASTIRMA_SORGULARI.get(yol.replace(/\/$/, ""));
  if (!sorgular) return false;
  // Her taraf icin slug YA DA ad eslesebilir: "bill-com" slug'i "Bill.com"
  // adiyla ayni jetona iner, ama her zaman inmez.
  const a = aKimlikleri.filter((k): k is string => Boolean(k)).map(jeton).filter(Boolean);
  const b = bKimlikleri.filter((k): k is string => Boolean(k)).map(jeton).filter(Boolean);
  if (!a.length || !b.length) return false;
  return sorgular.some((q) => {
    const j = jeton(q);
    return a.some((x) => j.includes(x)) && b.some((y) => j.includes(y));
  });
}

/** Karsilastirma sorgusu almis yollar (evren kurulumu icin on eleme). */
export function karsilastirmaSorgusuYollari(onEk: string): string[] {
  return [...YOL_KARSILASTIRMA_SORGULARI.keys()].filter((y) => y.startsWith(onEk)).sort();
}
