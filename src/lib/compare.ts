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
import { tumEntegrasyonlar, entegrasyonVar } from "./entegrasyon.ts";
import { ilkUcretliBasamak, planEtiketi } from "./plan.ts";
import { ciftTaranmayaDeger, alternatifTaranmayaDeger } from "./tarama.ts";
import type { KriterKumesi } from "./kriterler.ts";
import { ciftIndekslenir, aracIndekslenir, alternatifIndekslenir, fiyatiDogrulanmis, kriterliMi } from "./indeks.ts";
import { islevi, ayniIslev } from "./islev.ts";
import { talepliYollar, yolTalepGormus, karsilastirmaSorgusuYollari, vsSorguKelimeleri, kimlikSorgudaGeciyor } from "./talep.ts";

export { kriterAyrimi, ayrimCumlesi } from "./kriter-ayrimi.ts";

/* Tek tip: src/lib/arac.ts (bkz. oradaki not). */
import type { Arac } from "./arac";
export type { Arac };

const araclar = toolsData as Arac[];

/** Her aracin kac akrani olacak. Sayfa sayisini da link agini da bu belirler. */
export const AKRAN_ADEDI = 5;

/**
 * Alternatif sayfasi icin gereken en az akran sayisi.
 *
 * 3 -> 2 (olcum, 2026-09-12). Esik 3 iken sayfa `notFound()` cagiriyordu ve
 * bu SIRALANAN adreslerde sert 404 demekti: /alternatives/gumroad 90 gunde
 * 175 gosterim aliyor ve 404 donuyordu. Google sonucu gosteriyor, tiklayan
 * hicbir sey bulmuyordu -- alternatif sinifinin sifir tikinin bir kismi bu.
 *
 * Neden 2'de duruyor: iki arac bir secim yapar, bir arac yapmaz. Tek akranli
 * sayfa "alternatifler" degildir; oradaki ziyaretci 404 yerine kategori
 * sayfasina yonlendiriliyor (bkz. app/alternatives/[slug]/page.tsx).
 */
export const EN_AZ_ALTERNATIF = 2;

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
  const ayniIslevliler = araclar.filter((t) => t.slug !== slug && islevi(t.slug) === i);
  const secilen = ayniIslevliler.sort(siralamaKarsilastir).slice(0, adet);
  /*
    TALEP, ILK-5 SEZGISINI EZER (2026-09-13). `adet` bizim siralamamiz;
    Google'in olcusu degil. Olculdu: linear-vs-youtrack poz 8,3 / 26
    gosterim alirken youtrack linear'in ilk 5'inde degildi, dolayisiyla
    cift ne sitemap'e ne de ic linklere giriyordu. Talep cift bazli
    olculdugu icin bu promosyon SIMETRIKTIR: A, B'yi talep yuzunden
    listeliyorsa B de A'yi listeler -- yetim ya da tek yonlu cift olusmaz.
  */
  const secilmis = new Set(secilen.map((t) => t.slug));
  for (const t of ayniIslevliler) {
    if (secilmis.has(t.slug)) continue;
    if (yolTalepGormus(`/compare/${kanonikSlug(slug, t.slug)}`)) secilen.push(t);
  }
  return secilen;
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
    /* Ve tarama degeri kapisindan da gecer: anasayfadan one cikarilan
       cift, sitemap'te olmayan bir sayfaya link olamaz. Bu kapi bir
       cifti dusuruyorsa cozum kapiyi gevsetmek degil, o cifte ozgu
       icerik yazmaktir (elle not ya da plan merdiveni). */
    if (!ciftTaranmayaDeger(t1, t2)) continue;
    sonuc.push({ slug: kanonikSlug(a, b), label: `${t1.name} vs ${t2.name}` });
  }
  return sonuc;
}

/**
 * "A vs B" SORGUSUNDAN TURETILEN CAPRAZ CIFTLER (2026-09-17).
 *
 * Yol olcutunun ikizi, ama yolu degil sorgunun kendisini okuyor: Google
 * "caddy vs jenkins" sorgusunu caddy-vs-neon, betterstack-vs-caddy ve
 * caddy-vs-new-relic sayfalarina servis etmisti (poz 213-233) -- ucu de
 * yanlis cift, dogru cift ise evrende yoktu. Sorgu iki aracin kimligini
 * de aniyorsa cift oradadir, sayfanin nereye dustugunden bagimsiz.
 *
 * Uc sinir: kimlik jetonu 3 harften kisa olan arac sayilmaz (2 harfli
 * slug her sorgunun icinde tesadufen gecer); bir sorgu UCTEN fazla araci
 * aniyorsa atlanir (hangi ciftten soz ettigi belirsizdir); kapi
 * (ciftIndekslenir) asagida aynen uygulanir -- bu liste yalnizca adayi
 * evrene sokar.
 */
function vsSorgusuCaprazCiftleri(): string[] {
  const kimlikler = araclar.map((t) => ({ slug: t.slug, jetonlar: [t.slug, t.name].filter(Boolean).map(String) }));
  const cikti = new Set<string>();
  for (const kelimeler of vsSorguKelimeleri()) {
    const eslesen = kimlikler
      .filter((k) => k.jetonlar.some((j) => kimlikSorgudaGeciyor(kelimeler, j)))
      .map((k) => k.slug);
    if (eslesen.length < 2 || eslesen.length > 3) continue;
    for (let i = 0; i < eslesen.length; i++) {
      for (let j = i + 1; j < eslesen.length; j++) cikti.add(kanonikSlug(eslesen[i], eslesen[j]));
    }
  }
  return [...cikti];
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
  /*
    ENTEGRASYON CIFTLERI (2026-09-12). Bunlar `akranlar()` evreninde YOK --
    cunku akranlik ayni isi gormeye bakar ve bu ciftler farkli isi goruyor
    (typeform × kajabi, teachable × woocommerce). Ama talep olculdu ve
    cevap saticinin kendi sayfasindan dogrulandi; sayfanin soyleyecek
    sozu var. Evrene alinmazsa sonuc yarim kalirdi: sayfa indekslenebilir
    ama sitemap'te olmayan, ic link almayan bir yetim olurdu.
  */
  for (const [c] of tumEntegrasyonlar()) ciftler.add(c);
  /*
    OLCULMUS TALEBI OLAN AYNI-ISLEV CIFTLERI (2026-09-13). `akranlar()`
    araç basina AKRAN_ADEDI=5 akran veriyor; bu bizim sezgisel siralamamiz,
    Google'in olcusu degil. Olculdu: ayni islevli, kanit kapisini gecen ve
    Google'in 1. SAYFADA gosterdigi ciftler evrene hic giremiyordu --
    linear-vs-youtrack (poz 8,3 / 26 gosterim), asana-vs-teamwork (22),
    clickup-vs-teamwork (18). Sayfa indekslenebiliyor ama sitemap'te yok ve
    ic link almiyordu; entegrasyon ciftlerinde cozdugumuz YETIM sorununun
    aynisi. Kapi GEVSEMIYOR: asagidaki iki suzgec (ciftIndekslenir +
    ciftTaranmayaDeger) bu ciftlere de aynen uygulaniyor. Capraz islevli
    cift buradan GIREMEZ -- onun yolu hala entegrasyon kaydi.
  */
  const mevcutSlug = new Set(araclar.map((t) => t.slug));
  const harita = new Map(araclar.map((t) => [t.slug, t]));
  for (const yol of talepliYollar("/compare/")) {
    const [a, b] = yol.slice("/compare/".length).split("-vs-");
    if (!a || !b) continue;
    if (!mevcutSlug.has(a) || !mevcutSlug.has(b)) continue;
    if (!ayniIslev(a, b)) continue;
    ciftler.add(kanonikSlug(a, b));
  }
  /*
    KARSILASTIRMA SORGUSU ALMIS CAPRAZ CIFTLER (2026-09-13). Entegrasyon
    ciftleriyle ayni gerekce: akran evreninde yoklar, ama sorgu harfiyen
    "A vs B" oldugu icin sayfanin cevabi gercek. Evrene alinmazsa yine
    yetim olurlardi. Kapi (ciftIndekslenir) asagida aynen uygulanir.
  */
  const capraAdaylar = new Set<string>([
    ...karsilastirmaSorgusuYollari("/compare/").map((y) => y.slice("/compare/".length)),
    ...vsSorgusuCaprazCiftleri(),
  ]);
  for (const cift of capraAdaylar) {
    const [a, b] = cift.split("-vs-");
    if (!a || !b) continue;
    if (!mevcutSlug.has(a) || !mevcutSlug.has(b)) continue;
    if (ayniIslev(a, b)) continue;
    /* TEKIL ARAC HARIC: islevi olmayan aracin hic karsilastirma sayfasi
       olmaz (bkz. akranlar). Capraz islev muafiyeti bu kurali delmez --
       `ayniIslev` tekil ciftte de false doner, o yuzden ayrica eleniyor. */
    if (islevi(a) === null || islevi(b) === null) continue;
    const A = harita.get(a);
    const B = harita.get(b);
    if (!A || !B || !ciftIndekslenir(A, B)) continue;
    ciftler.add(kanonikSlug(a, b));
  }
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
  if (akranlar(slug).length < EN_AZ_ALTERNATIF) return false;
  /* Sitemap disi bir alternatif sayfasina link vermek, budamayi
     anlamsiz kilar (ayni gerekce: sitemapCiftleri). Olculdu: sitemap
     disi 261 alternatif sayfasina 316 ic link gidiyordu. */
  const arac = araclar.find((t) => t.slug === slug);
  return alternatifIndekslenir(arac) && alternatifTaranmayaDeger(arac);
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
  /*
    MERDIVEN VARSA O KAZANIR. Olculmus bir celiski yuzunden: Trello icin
    bu cumle "cheaper to start ($5/user/mo...)" derken hemen altindaki
    satir "First paid step: Standard at $6/user/mo" diyordu. $5 elle
    girilmis eski `basePrice` alanindan, $6 ise saticinin kanit kaydina
    yazilmis cumlesinden geliyordu. Ayni sayfada iki rakam, okurun
    guvenini bu sitenin tek varligi olan seyden -- dogruluktan -- eder.
    Kaynagini gosterebilen rakam tercih edilir.
  */
  const ma = ilkUcretliBasamak(asil as never);
  const mb = ilkUcretliBasamak(alt as never);
  if (ma && mb && ma.birim === mb.birim) {
    const eA = planEtiketi(ma);
    const eB = planEtiketi(mb);
    if (mb.aylik < ma.aylik) return `cheaper to start (${eB} vs ${eA})`;
    if (mb.aylik > ma.aylik) return `pricier to start (${eB} vs ${eA})`;
    return `the same starting price (${eB})`;
  }

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
  /*
    IKI KAPI. Birincisi kanit kapisi (ciftIndekslenir): iki tarafin da
    fiyati dogrulanmis mi, gercek bir fark var mi. Ikincisi tarama
    degeri kapisi (ciftTaranmayaDeger, 2026-09-10): bu sayfada bu CIFTE
    OZGU bir sey var mi, ya da Google zaten gosteriyor mu. Ikincisi
    olcumle geldi: 1.234 adresin 355'inin ne ozgu icerigi ne talebi
    vardi ve "taramaya degmez" karari SITE basina veriliyor.
    Bu liste sitemap'in yani sira kategori ve /top-picks linklerini de
    besliyor -- kapi burada oldugu icin hepsi ayni cevabi aliyor.
  */
  _sitemapCiftleri = karsilastirmaCiftleri().filter((c) => {
    const [a, b] = c.split("-vs-");
    return ciftIndekslenir(harita.get(a), harita.get(b)) && ciftTaranmayaDeger(harita.get(a), harita.get(b));
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
  /* Tarama degeri kapisi burada da uygulanir: sitemap disi bir cifte
     link vermek budamayi anlamsiz kilar (bkz. lib/tarama.ts). */
  return akranlar(slug, adet).filter((t) => ciftIndekslenir(arac, t) && ciftTaranmayaDeger(arac, t));
}

/**
 * Bir aracin GORUNMESI GEREKEN butun karsilastirmalari.
 *
 * OLCULEN HATA (2026-09-09): akranlar() tek yonlu. A'nin ilk bes akrani
 * arasinda B varsa `A-vs-B` sitemap'e giriyor, ama B'nin ilk besinde A
 * yoksa B'nin sayfasi o karsilastirmaya link VERMIYORDU. Sonuc: sitemap'e
 * konan 1.314 ciftin 641'i (%49) yalnizca tek bir arac sayfasindan link
 * aliyordu ve URL Inspection ornegi bunlarin indekslenmedigini gosterdi
 * (indekslenen yedi sayfanin hepsi cift yonluydu, indekslenmeyenlerin
 * cogu tek yonlu).
 *
 * Kural: Google'dan indekslemesini istedigimiz bir sayfa, sitenin kendi
 * icinde de ulasilabilir olmali. Sitemap ile ic linkleme ayrisamaz --
 * ayristigi anda "kesfedildi, indekslenmedi" yigini olusuyor.
 *
 * Bu yuzden liste iki yonun BIRLESIMI: kendi akranlari + kendisini akran
 * sayanlar. Yalnizca cifti gercekten indekslenebilir olanlar kalir, yani
 * ciftIndekslenir kapisi aynen korunur.
 */
export function karsilastirmaAkranlari(slug: string): Arac[] {
  const arac = araclar.find((t) => t.slug === slug);
  if (!arac) return [];
  const kume = new Map<string, Arac>();
  for (const t of akranlar(slug)) kume.set(t.slug, t);
  // Ters yon: beni akran sayan araclar.
  for (const t of araclar) {
    if (t.slug === slug || kume.has(t.slug)) continue;
    if (akranlar(t.slug).some((a) => a.slug === slug)) kume.set(t.slug, t);
  }
  /*
    IKINCI KAPI (olcum, 2026-09-10): `ciftIndekslenir` tek basina 1.194
    sitemap DISI karsilastirma sayfasina 9.710 ic link uretiyordu.
    Googlebot linki sitemap'ten cok daha fazla takip eder; yani sitemap'i
    688 adrese budamak, site ic linkleriyle 1.298 karsilastirmayi
    bagirirken hicbir ise yaramiyordu. Kural artik tek: SITEMAP'TE OLANI
    LINKLE. Boylece sitemap sayfalari yetim kalmaz (olculdu: 0 yetim) ve
    sablon kopyalari tarama butcesi yemez. Icerigi buyuyen cift kapidan
    kendiliginden geri girer.
  */
  return [...kume.values()]
    .filter((t) => ciftIndekslenir(arac, t) && ciftTaranmayaDeger(arac, t))
    .sort(siralamaKarsilastir);
}

/** Verilen araclardan alternatif sayfasi OLANLAR (link vermek guvenli). */
export function alternatifSayfasiOlan(sluglar: string[]): Arac[] {
  const kume = new Set(sluglar);
  /*
    Kategori sayfasi bu listeyi LINK olarak basiyor; o yuzden "sayfa
    uretiliyor mu" degil "sayfa SITEMAP'TE mi" sorulmali. Onceki hali
    yalnizca akran sayisina bakiyordu ve noindex alternatif sayfalarina
    link veriyordu (olcum, 2026-09-12: 6 link). Kural tek:
    SITEMAP'TE OLANI LINKLE.
  */
  return alternatifSayfasiOlanlar().filter((t) => kume.has(t.slug) && alternatifSayfasiVar(t.slug));
}

/**
 * KARSILASTIRMA SORGUSUYLA ACILMIS capraz islevli ciftler.
 *
 * Entegrasyon ciftlerinin ikizi (bkz. entegrasyonOrtaklari): bunlar da
 * akran evreninde YOK -- farkli is goruyorlar -- ama Google'a gelen sorgu
 * harfiyen "A vs B" oldugu icin sayfanin cevapladigi soru gercek. Liste
 * IKI arac sayfasindan da basilir; simetri ve yetimsizlik boyle korunur.
 */
export function karsilastirmaOrtaklari(slug?: string): { cift: string; diger: string }[] {
  if (!slug) return [];
  const cikti: { cift: string; diger: string }[] = [];
  const adaylar = new Set<string>([
    ...karsilastirmaSorgusuYollari("/compare/").map((y) => y.slice("/compare/".length)),
    ...vsSorgusuCaprazCiftleri(),
  ]);
  for (const cift of adaylar) {
    const [a, b] = cift.split("-vs-");
    if (!a || !b || (a !== slug && b !== slug)) continue;
    if (ayniIslev(a, b)) continue; // ayni islevliler zaten akran listesinden gelir
    const A = araclar.find((t) => t.slug === a);
    const B = araclar.find((t) => t.slug === b);
    if (!A || !B || !ciftIndekslenir(A, B)) continue;
    cikti.push({ cift: kanonikSlug(a, b), diger: a === slug ? b : a });
  }
  return cikti;
}

/**
 * Bu cift linkini AKRANLIKTAN degil, arac sayfasindaki bir LISTEDEN alir.
 *
 * Iki tur var ve ikisi de capraz islevli oldugu icin akran olamazlar:
 *   - entegrasyon kaydi olanlar  -> "Does X work with…" listesi
 *   - karsilastirma sorgusu alanlar -> "People also compare X with…" listesi
 * Her iki liste de IKI arac sayfasindan basildigi icin simetri korunur;
 * yetim kalmazlar. Testler bu yuklemi kullanir, kural tek yerde durur.
 */
export function aracListesindenLinkli(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  if (entegrasyonVar(a, b)) return true;
  return karsilastirmaOrtaklari(a).some((o) => o.diger === b);
}
