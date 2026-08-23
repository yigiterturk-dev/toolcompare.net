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

import toolsData from "@/data/tools.json";
import { fiyatDurumu } from "@/lib/fiyat";

export type Arac = {
  slug: string;
  name: string;
  category?: string;
  ease?: number;
  featuresScore?: number;
  basePrice?: number;
  isFlat?: boolean;
  shortDescription?: string;
  cons?: string[];
};

const araclar = toolsData as Arac[];

/** Her aracin kac akrani olacak. Sayfa sayisini da link agini da bu belirler. */
export const AKRAN_ADEDI = 5;

/** Alternatif sayfasi icin gereken en az akran sayisi. Altinda sayfa uretilmez. */
export const EN_AZ_ALTERNATIF = 3;

/** Kategori adlari veride tutarsiz yazilmis ("video editing" / "Design"). */
function kategoriAnahtari(k?: string): string {
  return (k || "diger").trim().toLowerCase();
}

/** Elimizdeki tek nesnel siralama olcutu. */
function kalitePuani(t: Arac): number {
  return (t.ease ?? 0) + (t.featuresScore ?? 0);
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
  return araclar
    .filter((t) => t.slug !== slug && kategoriAnahtari(t.category) === kategoriAnahtari(arac.category))
    .sort((a, b) => kalitePuani(b) - kalitePuani(a))
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
  ["slack", "discord"],
  ["notion", "trello"],
];

export function oneCikanCiftler(): { slug: string; label: string }[] {
  const sonuc: { slug: string; label: string }[] = [];
  for (const [a, b] of SECILMIS_CIFTLER) {
    const t1 = araclar.find((t) => t.slug === a);
    const t2 = araclar.find((t) => t.slug === b);
    if (!t1 || !t2) continue; // slug kirilmissa sessizce dus, 404 verme
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

  const ka = asil.ease ?? 0;
  const kb = alt.ease ?? 0;
  if (Math.abs(kb - ka) >= 5) parcalar.push(kb > ka ? "easier to pick up" : "harder to pick up");

  const oa = asil.featuresScore ?? 0;
  const ob = alt.featuresScore ?? 0;
  if (Math.abs(ob - oa) >= 5) parcalar.push(ob > oa ? "deeper on features" : "lighter on features");

  return parcalar.join(", ");
}
