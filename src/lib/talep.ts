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

/**
 * SITE GENELINDEKI "A vs B" SORGULARI (jetonlanmis).
 *
 * NEDEN (olcum, 2026-09-17): kapi, talebi sorgunun DUSTUGU YOLA gore
 * okuyordu. Oysa Google bir sorguyu hangi sayfaya servis edecegine kendi
 * karar veriyor ve siklikla yanlis sayfaya servis ediyor:
 *   "caddy vs jenkins" -> /compare/caddy-vs-neon        (poz 213)
 *                      -> /compare/betterstack-vs-caddy (poz 233)
 *                      -> /compare/caddy-vs-new-relic   (poz 229)
 * Ucu de yanlis cift. Dogru cift (caddy-vs-jenkins) ise sorguyu hic
 * gormedigi icin evrene bile girmiyordu: talep olculmustu, sayfa yoktu.
 *
 * Kanit sorgunun DUSTUGU YER degil, sorgunun KENDISI. Bu liste yol
 * bilgisini atar; eslesmeyi cift yapar (bkz. ciftVsSorgusuGormus). Kural
 * yol olcutunden DAHA DAR: "caddy vs jenkins" betterstack-vs-caddy'yi
 * ACMAZ, cunku sorguda "betterstack" gecmiyor -- 2026-09-13'te yol
 * olcutunun dustugu tuzak buydu.
 */
/**
 * Sorgu KELIMELERE bolunur, jetonlanmis halde degil.
 *
 * Ilk deneme sorguyu tek jetona yapistirip `includes` ile arıyordu ve
 * kelime siniri olmadigi icin uydurma cift uretti: "digitalocean" icinde
 * "git", "linear" icinde "line" geciyor -- git-vs-ionos, line-vs-monday
 * gibi kimsenin sormadigi 20'den fazla sayfa dogmustu.
 */
const VS_SORGU_KELIMELERI: string[][] = (() => {
  const kume = new Map<string, string[]>();
  for (const satir of ((ham as { rows?: { query?: string }[] }).rows || [])) {
    const q = satir.query;
    if (!q || !KARSILASTIRMA_BICIMI.test(q)) continue;
    if (kume.has(q)) continue;
    kume.set(q, q.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
  }
  return [...kume.values()];
})();

/** Jeton eslesmesi icin en kisa kimlik uzunlugu: 2 harfli slug ("go", "r")
    her sorguda tesadufen bulunur ve uydurma cift uretir. */
const EN_KISA_JETON = 3;

/**
 * Bu kimlik sorguda geciyor mu? Ya tek kelimeye ("caddy") ya da BITISIK
 * IKI kelimeye ("new relic" -> newrelic, "bill.com" -> billcom) esit
 * olmali. Parca eslesme yok.
 */
function jetonGeciyor(kelimeler: string[], jeton: string): boolean {
  for (let i = 0; i < kelimeler.length; i++) {
    if (kelimeler[i] === jeton) return true;
    if (i + 1 < kelimeler.length && kelimeler[i] + kelimeler[i + 1] === jeton) return true;
    if (i + 2 < kelimeler.length && kelimeler[i] + kelimeler[i + 1] + kelimeler[i + 2] === jeton) return true;
  }
  return false;
}

/**
 * Bu cift hakkinda, SITENIN HERHANGI BIR SAYFASINA dusmus, "vs" bicimli
 * bir sorgu var mi? Iki tarafin kimligi de sorguda gecmelidir.
 */
export function ciftVsSorgusuGormus(
  aKimlikleri: (string | undefined)[] = [],
  bKimlikleri: (string | undefined)[] = [],
): boolean {
  const a = aKimlikleri.filter((k): k is string => Boolean(k)).map(jeton).filter((k) => k.length >= EN_KISA_JETON);
  const b = bKimlikleri.filter((k): k is string => Boolean(k)).map(jeton).filter((k) => k.length >= EN_KISA_JETON);
  if (!a.length || !b.length) return false;
  return VS_SORGU_KELIMELERI.some(
    (kelimeler) => a.some((x) => jetonGeciyor(kelimeler, x)) && b.some((y) => jetonGeciyor(kelimeler, y)),
  );
}

/** Site genelindeki "vs" bicimli sorgular, kelimelerine bolunmus. */
export function vsSorguKelimeleri(): string[][] {
  return VS_SORGU_KELIMELERI;
}

/** Bir kimligin sorguda gecip gecmedigi (evren kurulumu ayni olcutu kullanir). */
export function kimlikSorgudaGeciyor(kelimeler: string[], kimlik: string): boolean {
  const j = jeton(kimlik);
  return j.length >= EN_KISA_JETON && jetonGeciyor(kelimeler, j);
}

/** Karsilastirma sorgusu almis yollar (evren kurulumu icin on eleme). */
export function karsilastirmaSorgusuYollari(onEk: string): string[] {
  return [...YOL_KARSILASTIRMA_SORGULARI.keys()].filter((y) => y.startsWith(onEk)).sort();
}
