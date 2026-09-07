/**
 * Karsilastirma ve alternatif sayfalarinin TEK KAYNAGI.
 *
 * NEDEN TEK KAYNAK OLMAK ZORUNDA (link taramasi, 2026-08-24):
 * Sitemap ile ic link agi ayri kurallardan uretiliyordu ve birbirini
 * tutmuyordu -- 252 sayfa siteden link aliyordu ama sitemap'te yoktu,
 * 5 sayfa sitemap'teydi ama hicbir sayfadan link almiyordu (oksuz).
 * Google'a "bu sayfa onemli" demenin yolu ona link vermektir; sitemap'te
 * olup link almayan sayfa zayif, linklenip sitemap'te olmayan sayfa ise
 * gec kesfedilir.
 *
 * Cozum: her aracin AKRAN_ADEDI kadar akrani var; hem sayfa linkleri hem
 * sitemap ayni listeden uretiliyor. Boylece her karsilastirma sayfasi
 * hem sitemap'te hem de en az bir sayfadan linkli olmak zorunda.
 *
 * AKRAN_ADEDI yukseltilirse hem sayfa sayisi hem ic link yogunlugu
 * birlikte artar; ikisi ayrisamaz.
 */

import toolsData from "../data/tools.json" with { type: "json" };
import { fiyatDurumu } from "./fiyat.ts";
import type { KriterKumesi } from "./kriterler.ts";
import { ciftIndekslenir, aracIndekslenir, fiyatiDogrulanmis, kriterliMi } from "./indeks.ts";
import { islevi, ayniIslev } from "./islev.ts";

export { kriterAyrimi, ayrimCumlesi } from "./kriter-ayrimi.ts";

/* Tek tip: src/lib/arac.ts (bkz. oradaki not). */
import type { Arac } from "./arac";
export type { Arac };

const araclar = toolsData as Arac[];

/** Her aracin kac akrani olacak. Sayfa sayisini da link agini da bu belirler. */
export const AKRAN_ADEDI = 5;

/** Alternatif sayfasi icin gereken en az akran sayisi. Altinda sayfa uretilmez. */
export const EN_AZ_ALTERNATIF = 3;

/**
 * SIRALAMA OLCUTU: FIYAT.
 *
 * Onceden `ease + featuresScore` kullaniliyordu. O iki sayi 121 aracin
 * hepsinde 80-100 (ozellik) ve 40-99 (kolaylik) araligindaydi: ayrim
 * yapamiyorlardi, ama sitenin butun iskeletini onlar kuruyordu --
 * kategori sirasi, alternatif sirasi, hangi araclarin akran sayilacagi
 * ve hangi 418 karsilastirma sayfasinin var olacagi.
 *
 * Uydurulmus bir kalite puanini siralama olcutu yapmak yerine
 * DOGRULANABILIR tek sayiyi kullaniyoruz: baslangic fiyati.
 *
 * Fiyati karsilastirilabilir olmayan arac (kullanima gore, ucretsiz
 * katman, dogrulanmamis) sona gider ve kendi arasinda ada gore siralanir
 * -- ve sayfa bunu neden yaptigini yazar. Uydurma bir yere koymak yerine
 * "bunlar siralanamiyor" demek dogru olan.
 */
function siraAnahtari(t: Arac): [number, number, string] {
  const d = fiyatDurumu(t);
  if (d.karsilastirilabilir && d.aylik !== null) return [0, d.aylik, t.name];
  return [1, 0, t.name];
}

/**
 * Aracin kapidan gecebilecek kanit setine sahip olup olmadigi.
 * (Cift kapisinin arac basina dusen on sarti: incelenmis + fiyati
 * kaynakli + en az bir bakilmis kriter.)
 */
function kanitli(t: Arac): boolean {
  return aracIndekslenir(t as never) && fiyatiDogrulanmis(t as never) && kriterliMi(t as never);
}

/**
 * SIRALAMA: once KANIT, sonra fiyat.
 *
 * NEDEN (olcum, 2026-08-31): akran secimi yalnizca fiyata bakiyordu ve
 * kanit durumunu hic umursamiyordu. Sonuc: 3.138 karsilastirma sayfasi
 * uretiliyor, yalnizca 623'u (%20) indekslenebiliyordu. Kalan 2.515 sayfa
 * Google'in tarama butcesini yiyor -- her birini tarayip "noindex" oldugunu
 * gormesi gerekiyor -- ve bunu sitenin asil sayfalarindan caliyor.
 *
 * AKRAN_ADEDI'ni dusurmek yanlis cozumdu: hem cop hem cevher birlikte
 * azalirdi. Dogrusu ayni akran butcesini kanitli araclara harcamak --
 * sayfa sayisi ve ic link yogunlugu aynen korunur, nitelikli sayfa orani
 * artar. Kanitli arac ziyaretci icin de daha iyi bir akran: gercek
 * verisi olan araci gosteriyoruz.
 */
function siralamaKarsilastir(a: Arac, b: Arac): number {
  const ka = kanitli(a) ? 0 : 1;
  const kb = kanitli(b) ? 0 : 1;
  if (ka !== kb) return ka - kb;
  const [ga, fa, na] = siraAnahtari(a);
  const [gb, fb, nb] = siraAnahtari(b);
  if (ga !== gb) return ga - gb;
  if (fa !== fb) return fa - fb;
  return na.localeCompare(nb);
}

/**
 * Cift adresinin KANONIK hali her zaman alfabetik sirada.
 * "slack-vs-notion" ve "notion-vs-slack" ayni sayfanin iki kopyasi
 * olarak indekslenmesin.
 */
export function kanonikSlug(a: string, b: string): string {
  return a < b ? `${a}-vs-${b}` : `${b}-vs-${a}`;
}

/**
 * Bir aracin akranlari: ayni kategorideki en yuksek puanli diger araclar.
 *
 * BU FONKSIYON SISTEMIN OMURGASI. Sayfalarin verdigi her karsilastirma
 * linki buradan gelir ve sitemap de buradan uretilir; ikisi ayrisamaz.
 */
export function akranlar(slug: string, adet: number = AKRAN_ADEDI): Arac[] {
  const arac = araclar.find((t) => t.slug === slug);
  if (!arac) return [];
  // AKRANLIK OLCUTU: kategori DEGIL, islev. Kategori cok kaba (bkz.
  // src/lib/islev.ts); "Developer Tools" Redis ile Sentry'yi akran
  // sayiyordu. Islevi olmayan arac tekildir: akrani yoktur, dolayisiyla
  // karsilastirma ya da alternatif sayfasi da uretmez.
  const i = islevi(slug);
  if (i === null) return [];
  return araclar
    .filter((t) => t.slug !== slug && islevi(t.slug) === i)
    .sort(siralamaKarsilastir)
    .slice(0, adet);
}

/** Geriye donuk ad. */
export const aracinKarsilastirmalari = akranlar;
export const alternatifler = akranlar;


/**
 * Anasayfadaki "Trending VS" seridi.
 *
 * Elle secilmis ciftler -- puana gore degil, insanlarin gercekten
 * karsilastirdigi araclar oldugu icin. AMA elle yazilmis slug sessizce
 * kirilir (sitemap'te 'openai-vs-claude' tam bunu yapmisti: var olmayan
 * bir arac icin Google'a 404 ilan ediliyordu). Bu yuzden:
 *   - liste burada, tek yerde durur
 *   - oneCikanCiftler() her iki slug'in GERCEKTEN var oldugunu dogrular
 *   - dogrulanan ciftler sitemap'e de girer, boylece anasayfadan link
 *     alan bir sayfa sitemap disinda kalmaz
 */
const SECILMIS_CIFTLER: [string, string][] = [
  ["chatgpt", "claude"],
  ["notion", "obsidian"],
  ["semrush", "ahrefs"],
  ["figma", "sketch"],
  ["stripe", "paddle"],
];

export function oneCikanCiftler(): { slug: string; label: string }[] {
  const sonuc: { slug: string; label: string }[] = [];
  for (const [a, b] of SECILMIS_CIFTLER) {
    const t1 = araclar.find((t) => t.slug === a);
    const t2 = araclar.find((t) => t.slug === b);
    if (!t1 || !t2) continue; // slug kirilmissa sessizce dus, 404 verme
    // Elle secilmis cift de otomatik ciftlerle AYNI kapidan gecer: farkli
    // islevden ya da kaniti eksik bir cifti anasayfadan one cikarmak,
    // sitemap disinda kalan (ve indekslenmeyen) bir sayfaya link vermektir.
    if (!ayniIslev(a, b)) continue;
    if (!ciftIndekslenir(t1, t2)) continue;
    sonuc.push({ slug: kanonikSlug(a, b), label: `${t1.name} vs ${t2.name}` });
  }
  return sonuc;
}

/** Sitemap'e girecek karsilastirma adresleri: akranlar + one cikan ciftler. */
export function karsilastirmaCiftleri(): string[] {
  const ciftler = new Set<string>();
  for (const t of araclar) {
    for (const a of akranlar(t.slug)) {
      ciftler.add(kanonikSlug(t.slug, a.slug));
    }
  }
  // Anasayfadan link alan ciftler de sitemap'te olmali.
  for (const c of oneCikanCiftler()) ciftler.add(c.slug);
  return [...ciftler].sort();
}

/** Alternatif sayfasi uretilecek araclar. */
export function alternatifSayfasiOlanlar(): Arac[] {
  return araclar.filter((t) => akranlar(t.slug).length >= EN_AZ_ALTERNATIF);
}

/**
 * Bu arac icin /alternatives/<slug> sayfasi URETILIYOR mu?
 *
 * NEDEN AYRI BIR KAPI (GSC olcumu, 2026-09-07):
 * Arac sayfasindaki "Compare X with alternatives" bolumu tek bir kosula
 * baglanmisti: INDEKSLENEBILIR karsilastirma cifti sayisi. Alternatif
 * sayfasinin baglantisi da o bolumun ICINDE oldugu icin, cifti olmayan
 * araclarda sayfa VAR ama ona giden link YOKTU.
 *
 * Olculdu: /alternatives/photopea ve /alternatives/sublime-text canlida
 * 200 donuyor, ama /tools/photopea ve /tools/sublime-text o sayfalara
 * SIFIR link veriyordu -- ustelik bu ikisi sitenin en cok gosterim alan
 * sayfalarindan (374 ve 158 gosterim). Uretilen ama link almayan sayfa
 * yetimdir; Google'a "bu onemli" diyemeyiz.
 *
 * Kapi, sayfanin gercekten uretildigi kosulun aynisi olmali -- yukaridaki
 * alternatifSayfasiOlanlar() ile ayni olcut.
 */
export function alternatifSayfasiVar(slug: string): boolean {
  return akranlar(slug).length >= EN_AZ_ALTERNATIF;
}

/**
 * Iki arac arasindaki farki ELDEKI VERIDEN tek cumleye cevirir.
 * Uydurma bir ustunluk iddiasi yok; fark kucukse o olcut hic yazilmaz.
 */
export function farkCumlesi(asil: Arac, alt: Arac): string {
  const parcalar: string[] = [];

  // Fiyat yalnizca IKI TARAF DA dogrulanmissa karsilastirilir. Onceden
  // dogrulanmamis fiyat 0 sayiliyor ve "cheaper to start ($0 vs $39/mo)"
  // gibi yanlis cumleler uretiyordu (Stripe, AWS gibi kullanima gore
  // fiyatlanan araclar icin).
  const da = fiyatDurumu(asil);
  const db = fiyatDurumu(alt);
  if (da.karsilastirilabilir && db.karsilastirilabilir) {
    const fa = da.aylik as number;
    const fb = db.aylik as number;
    if (fb < fa) parcalar.push(`cheaper to start (${db.kisa} vs ${da.kisa})`);
    else if (fb > fa) parcalar.push(`pricier to start (${db.kisa} vs ${da.kisa})`);
    else parcalar.push(`the same starting price (${db.kisa})`);
  } else {
    parcalar.push(`priced differently (${db.kisa} vs ${da.kisa})`);
  }

  // "easier to pick up" / "deeper on features" kalemleri KALDIRILDI:
  // dayandiklari puanlar uydurmaydi ve ayrim yapamiyordu.
  return parcalar.join(", ");
}

/**
 * Bir karsilastirma sayfasi indekslenmeye deger mi?
 *
 * Kural artik `src/lib/indeks.ts`te; hem sitemap hem sayfa metadata'si
 * ayni yerden okuyor. Buradaki eski kural ("en az bir taraf incelenmis")
 * fiilen kapiyi acik birakiyordu: veride `incelendi` alani 512 kaydin
 * hepsinde dolu oldugu icin 2.345 sayfa geciyordu ve Google bunlarin
 * neredeyse hicbirini indekslemiyordu.
 */
export function ciftIndekslenebilirMi(a: Arac | undefined, b: Arac | undefined): boolean {
  return ciftIndekslenir(a, b);
}

/** Sitemap'e girecek ciftler: iki tarafi da kanitli ve aralarinda gercek fark olanlar. */
let _sitemapCiftleri: string[] | null = null;
export function sitemapCiftleri(): string[] {
  if (_sitemapCiftleri) return _sitemapCiftleri;
  const harita = new Map(araclar.map((t) => [t.slug, t]));
  _sitemapCiftleri = karsilastirmaCiftleri().filter((c) => {
    const [a, b] = c.split("-vs-");
    return ciftIndekslenir(harita.get(a), harita.get(b));
  });
  return _sitemapCiftleri;
}

/**
 * Verilen arac kumesi ICINDEKI indekslenebilir karsilastirma sayfalari.
 *
 * NEDEN (link taramasi, 2026-09-03): kategori ve /top-picks sayfalari
 * karsilastirma sayfalarina hic link vermiyordu (kategori sayfasi tek bir
 * cifte veriyordu, o da elle hesaplandigi icin artik var olmayan bir
 * sayfaya isaret edebiliyordu). 300'den fazla karsilastirma sayfasi
 * neredeyse yalnizca sitemap'e asiliydi; Google onlari "URL is unknown"
 * diye geri ceviriyordu. Link vermeyen sayfa "onemli" diyemez.
 *
 * Liste HER ZAMAN sitemapCiftleri()'nden suzuluyor -- yani linkledigimiz
 * her sayfa sitemap'te de var, tersi de dogru.
 */
export function kumeIcindekiCiftler(sluglar: string[], adet = 8): { slug: string; label: string }[] {
  const kume = new Set(sluglar);
  const ad = new Map(araclar.map((t) => [t.slug, t.name]));
  return sitemapCiftleri()
    .filter((c) => {
      const [a, b] = c.split("-vs-");
      return kume.has(a) && kume.has(b);
    })
    .slice(0, adet)
    .map((c) => {
      const [a, b] = c.split("-vs-");
      return { slug: c, label: `${ad.get(a)} vs ${ad.get(b)}` };
    });
}

/**
 * Bir aracin, KARSILASTIRMA SAYFASI GERCEKTEN INDEKSLENEBILEN akranlari.
 *
 * Arac sayfasi butun akranlara link veriyordu; bunlarin bir kisminin
 * cift sayfasi kanit kapisindan gecmiyor ve noindex donuyor. Noindex bir
 * sayfaya site ici link vermek Google'a onu tarattirip bos donduruyor --
 * tarama butcesi bosa gidiyor. Link yalnizca indekslenebilir sayfaya.
 */
export function indekslenebilirAkranlar(slug: string, adet: number = AKRAN_ADEDI): Arac[] {
  const arac = araclar.find((t) => t.slug === slug);
  if (!arac) return [];
  return akranlar(slug, adet).filter((t) => ciftIndekslenir(arac, t));
}

/** Verilen araclardan alternatif sayfasi OLANLAR (link vermek guvenli). */
export function alternatifSayfasiOlan(sluglar: string[]): Arac[] {
  const kume = new Set(sluglar);
  return alternatifSayfasiOlanlar().filter((t) => kume.has(t.slug));
}
