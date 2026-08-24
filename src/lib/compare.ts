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
  const d = fiyatDurumu(t as any);
  if (d.karsilastirilabilir && d.aylik !== null) return [0, d.aylik, t.name];
  return [1, 0, t.name];
}

function siralamaKarsilastir(a: Arac, b: Arac): number {
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
  return araclar
    .filter((t) => t.slug !== slug && kategoriAnahtari(t.category) === kategoriAnahtari(arac.category))
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

  // "easier to pick up" / "deeper on features" kalemleri KALDIRILDI:
  // dayandiklari puanlar uydurmaydi ve ayrim yapamiyordu.
  return parcalar.join(", ");
}
