/**
 * INDEKSLENEBILIRLIK: TEK KAYNAK.
 *
 * NEDEN (GSC olcumu, 2026-08-31):
 * Sitemap'te 3.391 adres vardi (2.345'i /compare). GSC ornekleminde
 * /compare sayfalarinin 0/10'u indeksliydi; genelde %13. Google'in
 * verdigi durumlar "URL is unknown to Google" ve "Discovered - currently
 * not indexed" -- yani sayfalari goruyor ve indekslemeye DEGMEZ diyor.
 * Binlerce zayif kombinasyon sayfasi tarama butcesini asil sayfalardan
 * caliyordu.
 *
 * Kural: bir sayfa sitemap'e ancak KENDINE OZGU, DOGRULANMIS bir sey
 * soyleyebiliyorsa girer. Digerleri silinmez -- erisilebilir ve linkli
 * kalir (ziyaretci gorur, PageRank akar) ama `noindex, follow` alir.
 *
 * Bu dosya hem sitemap'in hem sayfa metadata'sinin kaynagidir; ikisi
 * ayrisirsa Google'a celiskili sinyal gider.
 */

import toolsData from "../data/tools.json" with { type: "json" };
import { fiyatDurumu } from "./fiyat.ts";
import { talepGormus, yolTalepGormus, karsilastirmaSorgusuGormus } from "./talep.ts";
import { ayniIslev, islevi } from "./islev.ts";
import { entegrasyonVar, kanonikCift } from "./entegrasyon.ts";
/* Tek tip: src/lib/arac.ts (bkz. oradaki not). */
import type { Arac } from "./arac";

type Kaynak = { label?: string; supports?: string[] };



/**
 * Kaynak gercekten FIYAT iddiasini destekliyor mu?
 *
 * `vendor-sourced` kayitlar elle kuratorlu ve otomatik taramadan DAHA
 * saglam (birden cok kaynak, her kaynagin neyi destekledigi yazili).
 * Ama hepsi fiyat kaynagi degil: LangChain/Selenium/Drupal kayitlarinin
 * kaynagi dokumantasyon -- o kayitla fiyat iddia edilemez.
 *
 * Kural: en az bir kaynagin `supports` maddesi SOMUT bir fiyat ifadesi
 * icersin. Temkinli taraf dogru taraf; supheliyi disarida birakir.
 *
 * OLCULEN HATA (2026-09-10): kural "pricing" / "price" kelimesinin
 * KENDISINI kanit sayiyordu ve kaynagin BASLIGINI da tariyordu. Sonuc:
 * `supports: ["the vendor's published pricing"]` yazan ve limitations'inda
 * "An editor has not read it line by line" diyen 42 otomatik kayit --
 * yani icinde tek rakam olmayan kayitlar -- fiyat kapisindan geciyordu.
 * "Proton Mail — Pricing" baslinin kendisi de geciyordu. Fiyat
 * dogrulamasi uzerine kurulu bir sitede bu, kapinin olmamasiyla ayni sey.
 *
 * Yeni kural: rakamli para birimi, rakamli birim fiyat (per user/month/
 * seat), ya da acik "ucretsiz plan/katman yok/var" ifadesi. Cikarilanlar:
 * ciplak "pricing", ciplak "price", ciplak "monthly".
 */
const FIYAT_IDDIASI =
  /([$€£₹]\s?\d|\d+(?:[.,]\d+)?\s?(?:USD|EUR|GBP)\b|\d[^.]{0,24}\bper (?:user|seat|month|employee|contractor)\b|\bcontact sales\b|\bcustom pricing\b|\bquote\b|\bfree (?:tier|plan|forever)\b|\bno free (?:tier|plan)\b)/i;

/* Para birimi olmadan da somut kanit olur: "Free: 1,500 blocks, 1 GB storage"
   elle okunmus bir plan tablosudur, "always free with no traffic limits" da
   bir fiyat iddiasidir. Ayrim dolar isareti DEGIL, OZ: rakamli bir plan
   ifadesi ya da acik bedava beyani. Ciplak "plan limits" ve
   "the vendor's published pricing" bu kapidan gecmez. */
const OZLU_PLAN_IDDIASI =
  /(\bfree\b|\bno price\b|\bopen source\b|\b(?:plan|tier|edition)s?\b[^.]{0,60}\d|\d[^.]{0,60}\b(?:plan|tier|edition)s?\b)/i;

function fiyatDestekleyenKaynak(t?: Arac): boolean {
  // Baslik KANIT DEGIL: "… — Pricing" her saticide var, hicbir sey soylemez.
  return (t?.evidence?.sources || []).some((s) => {
    const destek = (s.supports || []).join(" ");
    return FIYAT_IDDIASI.test(destek) || OZLU_PLAN_IDDIASI.test(destek);
  });
}

/** Insan elinden gecmis: kendi yorumu ve uzun anlatimi var. */
export function incelenmis(t?: Arac): boolean {
  return t?.incelendi === true && Boolean(t?.verdict);
}

/**
 * Fiyat iddiasi bir kaynaga dayaniyor mu?
 *
 * OLCULEN HATA (2026-08-31): kural yalnizca `pricing-page-verified`
 * kabul ediyordu. Sonuc tersine dondu -- otomatik taramayla dogrulanan
 * arac kapidan geciyor, ELLE kuratorlu 140 `vendor-sourced` kayit
 * (daha saglam kanit) eleniyordu. 199 arac "incelenmis + kriterli ama
 * fiyat kaniti yok" diye disarida kaliyordu; kapiya uygun arac 225'ti.
 *
 * Iki yol da kabul edilir, ama `vendor-sourced` icin kaynagin fiyati
 * gercekten destekledigi aranir.
 */
export function fiyatiDogrulanmis(t?: Arac): boolean {
  const durum = t?.evidence?.status;
  if (durum === "pricing-page-verified") return true;
  /* ACIK KAYNAK (olcum, 2026-09-03): kanitsiz kalan 110 aracin 36'si acik
     kaynak. Onlarda /pricing sayfasi olmamasi eksiklik degil, fiyatin
     kendisi -- ve bu araclar aramada gercekten karsilastiriliyor (dbeaver
     36 gosterim, caddy 6). `open-source-verified` durumu saticinin kendi
     sayfasindan "acik kaynak + ucretsiz" ifadesini dogrular
     (scripts/kanit-acikkaynak.mjs); fiyat iddiasi sifirdir ve kaynaklidir. */
  if (durum === "open-source-verified") return true;
  return durum === "vendor-sourced" && fiyatDestekleyenKaynak(t);
}

/**
 * Ozellik matrisi dolu: karsilastirma tablosu gercekten bir sey gosterir.
 *
 * `null` = BAKILMADI (bkz. lib/kriterler.ts). Yalnizca null iceren bir
 * kume "dolu" degildir -- tabloda dort satir "not checked" yazar.
 */
export function kriterliMi(t?: Arac): boolean {
  return Object.values(t?.kriterler || {}).some((v) => typeof v === "boolean");
}

/**
 * Iki arac arasinda YAZILACAK gercek bir fark var mi?
 *
 * Fiyatlari da ozellikleri de ayni olan iki aracin karsilastirma sayfasi
 * iki isimden ibaret kalir; Google'in "duplicate" saydigi tam budur.
 */
export function gercekFarkVar(a?: Arac, b?: Arac): boolean {
  if (!a || !b) return false;
  const da = fiyatDurumu(a as never);
  const db = fiyatDurumu(b as never);
  if (da.karsilastirilabilir && db.karsilastirilabilir && da.aylik !== db.aylik) return true;
  /* Bir kriter ancak IKI TARAFTA DA bakilmissa karsilastirilir. `null`
     (bakilmadi) ile `false` (yok) ayni sey degil; null'i false saymak
     "A'da API var, B'de yok" gibi BAKILMAMIS bir farki uydurur ve
     sayfayi kapidan yanlislikla gecirirdi. */
  const ka = (a.kriterler || {}) as Record<string, unknown>;
  const kb = (b.kriterler || {}) as Record<string, unknown>;
  return Object.keys({ ...ka, ...kb }).some(
    (k) => typeof ka[k] === "boolean" && typeof kb[k] === "boolean" && ka[k] !== kb[k],
  );
}

/**
 * ARAC SAYFASI: incelenmis olmasi yeter.
 * Kendi yorumu ve uzun anlatimi olan sayfa zaten benzersizdir; burada
 * fiyat kaniti aramak 217 gercek sayfayi bosuna disarida birakirdi.
 */
/**
 * Icerik yeterince DERIN mi?
 *
 * GSC OLCUMU (2026-09-02): kapiyi gecen 460 aracin 42'si "Crawled -
 * currently not indexed" dondu (drizzle, clerk, turso, attio...).
 * Ortak noktalari: longDescription 94-142 karakter, keyFeatures bos.
 * Kapiyi gecen 460 aracin 196'sinda aciklama 150 karakterin altinda,
 * 215'inde ozellik listesi 3'ten kisa. Google bunlara "sadece ad + fiyat"
 * diyor ve haklı; G2/Capterra'nin yaninda iki cumlelik sayfa indekse
 * giremiyor.
 *
 * Esik: en az 300 karakter anlatim + en az 3 ozellik. Bu esikle 233 arac
 * kalir; gerisi sayfa olarak yasar (noindex, follow), icerigi
 * buyutulunce kendiliginden sitemap'e doner.
 */
export const EN_AZ_ANLATIM = 300;
export const EN_AZ_OZELLIK = 3;

export function icerikDerin(t?: Arac): boolean {
  const anlatim = (t?.longDescription || "").trim().length;
  const ozellik = Array.isArray(t?.keyFeatures) ? t!.keyFeatures!.length : 0;
  return anlatim >= EN_AZ_ANLATIM && ozellik >= EN_AZ_OZELLIK;
}

/**
 * Ince icerik kapisinin TEK MUAFIYETI: Google'in zaten gosterdigi sayfa.
 *
 * OLCUM (2026-09-02): `icerikDerin` 227 arac sayfasini noindex yapiyordu;
 * bunlarin 82'si o sirada gosterim aliyordu -- sitenin 700 gosteriminin
 * 414'u. `pinecone` "pinecone vector" sorgusunda 2. siradaydi ve gizlenmisti.
 * Karakter sayan bir vekil olcut, Google'in fiilen siraladigi sayfayi
 * susturamaz; dogru cevap sayfayi gizlemek degil zenginlestirmektir
 * (`npm run gsc:borc`).
 *
 * Muafiyet tek yonludur: talep GORMEK kurtarir, talep GORMEMEK elemez.
 * Adreslerin %36'si "URL is unknown to Google" -- gosterim yoklugu sayfa
 * hakkinda bir sey soylemiyor.
 */
export function aracIndekslenir(t?: Arac): boolean {
  if (!incelenmis(t)) return false;
  return icerikDerin(t) || talepGormus(t?.slug);
}

/**
 * ALTERNATIF SAYFASI: incelenmis + fiyati dogrulanmis.
 * Bu sayfa turunun tek ise yarar iddiasi "su fiyata su secenekler";
 * fiyat dogrulanmamissa sayfanin soyleyecek sozu yok.
 */
/**
 * Ayni islevi goren, FIYATI DOGRULANMIS arac sayisi.
 *
 * Neden `akranlar()` cagrilmiyor: o fonksiyon compare.ts'te ve compare.ts
 * bu dosyayi iceri aliyor -- dongusel bagimlilik olurdu. Sayim burada
 * dogrudan yapiliyor ve sonuc ayni: akran siralamasi kanitli araci one
 * aldigi icin (bkz. compare.ts/siralamaKarsilastir) ve kanitli olmak
 * fiyati dogrulanmis olmayi ICERDIGI icin, iki fiyatli akran varsa ikisi
 * de listelenen ilk bese girer.
 */
function fiyatliAkranSayisi(slug: string): number {
  const i = islevi(slug);
  if (i === null) return 0;
  return (toolsData as Arac[]).filter(
    (t) => t.slug !== slug && islevi(t.slug) === i && fiyatiDogrulanmis(t),
  ).length;
}

export function alternatifIndekslenir(t?: Arac): boolean {
  if (!aracIndekslenir(t)) return false;
  if (fiyatiDogrulanmis(t)) return true;
  /*
    KAPI YER DEGISTIRDI (olcum, 2026-09-12). Eski kural, ARACIN KENDI
    fiyatinin dogrulanmis olmasini sartti. Ama "gorgias alternatives"
    arayan kisinin ihtiyaci ALTERNATIFLERIN rakamlari; Gorgias'in kendi
    fiyati yalnizca "sundan ucuz" cumlesi icin gerekli -- ve o cumle zaten
    iki taraf da dogrulanmadikca kurulmuyor (bkz. compare.ts/farkCumlesi).
    Yani kapi, korumadigi bir iddia icin sayfayi kapatiyordu.

    Olculdu: gosterim alan 8 alternatif sayfasi (99 gosterim) yalnizca bu
    yuzden noindex'ti -- gorgias 40, greenhouse 26, ionos 16. Hepsinin
    fiyati DOGRULANMIS akranlari vardi; eksik olan tek sey, sayfanin
    konusu olan aracin kendi rakamiydi. Cogu kullanima-gore fiyatlanan
    arac (azure, gorgias): onlarda "baslangic fiyati" zaten yok.

    Yeni sart: en az IKI alternatifin fiyati dogrulanmis olsun. Bir secim
    icin iki rakam gerekir; tek rakam liste degildir (ayni gerekce:
    EN_AZ_ALTERNATIF).
  */
  return fiyatliAkranSayisi(t!.slug) >= 2;
}

/**
 * KARSILASTIRMA SAYFASI: en sert kapi.
 * Iki taraf da incelenmis, iki tarafin da fiyati dogrulanmis, iki taraf
 * da kriterli VE aralarinda gercek bir fark olacak.
 *
 * Onceki kural "en az bir taraf incelenmis"ti ve 2.345 sayfayi geciriyordu;
 * arac verisinde `incelendi` alani neredeyse her kayitta dolu oldugu icin
 * kapi fiilen aciktir.
 *
 * Kapiya uygun arac 323/512 (fiyat kanitindaki hata duzeltilmeden once
 * 225'ti). Uretilen sitemap: 600 /compare, 341 /alternatives, 460 /tools.
 */
/** Bu ciftin KENDI adresi Google'da gosterim almis mi. */
function ciftTalebi(a: Arac, b: Arac): boolean {
  const kanonik = a.slug < b.slug ? `${a.slug}-vs-${b.slug}` : `${b.slug}-vs-${a.slug}`;
  return yolTalepGormus(`/compare/${kanonik}`);
}

export function ciftIndekslenir(a?: Arac, b?: Arac): boolean {
  // ISLEV KAPISI (bkz. src/lib/islev.ts): iki arac ayni isi gormuyorsa
  // sayfanin karsilastiracak bir seyi yok. Bu kural sitemap'ten ONCE
  // sayfanin kendi robots etiketine de uygulanir: eski adreslerden
  // (ornegin /compare/redis-vs-sentry) gelen Googlebot noindex gormeli,
  // yoksa sitemap disina cikardigimiz sayfa indekste kalir.
  if (!a || !b) return false;
  /*
    FARKLI ISI GOREN CIFT (olcum, 2026-09-12). Islev kapisi bu ciftleri
    karsilastirma olarak dogru biçimde reddediyor -- ama talep oradaydi ve
    karsilastirma talebi DEGILDI: "typeform kajabi integration",
    "woocommerce teachable integration". Farkli is gormek karsilastirmayi
    anlamsiz kilar, ENTEGRASYONU anlamli kilar; zaten o yuzden entegre
    ediliyorlar. Bu yuzden kapiyi acan sey talep degil, saticinin kendi
    sayfasindan DOGRULANMIS bir entegrasyon kaydidir (lib/entegrasyon.ts).
    Kayit yoksa sayfa noindex kalir: yanlis soruyu cevaplayan sayfayi
    indekslemek talebi karsilamaz, yalnizca tarama butcesi yer.
  */
  /*
    KARSILASTIRMA SORGUSU MUAFIYETI (olcum, 2026-09-13). Yukaridaki gerekce
    olculdugu kume icin dogruydu ama genel degilmis: noindex'li capraz
    ciftlerin sorgulari cekilince niyet dagilimi KARSILASTIRMA 16 gosterim /
    ENTEGRASYON 0 cikti -- "keycloak vs firebase" (poz 9), "groupme vs slack",
    "cloudflare vs hetzner" (poz 9), "ionos vs digitalocean" (poz 10,5).
    Farkli is goren iki arac bazen tam da bu yuzden karsilastirilir (ORM x
    veritabani, terminal x editor, CDN x hosting) ve soruyu soran Google'in
    bize yolladigi kisidir.

    Kapiyi acan sey yine TALEP DEGIL, talebin BICIMI: yalnizca "vs"/"versus"
    gecen sorgu sayilir (bkz. talep.ts). "drizzle mongodb" gibi ima edilmis
    sorgu acmaz; `redis-vs-sentry` de kapali kalir cunku oyle bir sorgu yok.
    Islev kapisi hala mutlak -- yalnizca "anlamsiz" tanimi olcume baglandi.
  */
  if (!ayniIslev(a.slug, b.slug)) {
    if (entegrasyonVar(a.slug, b.slug)) return true;
    /*
      TEKIL ARAC MUAFIYETIN DISINDA (olcum, 2026-09-13). `ayniIslev` islevi
      olmayan cift icin de false doner; muafiyeti oraya da uygulayinca
      mailchimp-vs-substack, bill-com-vs-ramp, bill-com-vs-brex robots
      etiketinde indekslenebilir olup sitemap'te YOK haline geldi --
      sitemap ile sayfa metadata'si celisti (bkz. bu dosyanin basligi).
      Islevi olmayan arac karsilastirma sayfasi uretmez; kural burada da
      gecerli, yoksa evren ile etiket ayrisiyor.
    */
    if (islevi(a.slug) === null || islevi(b.slug) === null) return false;
    return karsilastirmaSorgusuGormus(
      `/compare/${kanonikCift(a.slug, b.slug)}`,
      [a.slug, a.name],
      [b.slug, b.name],
    );
  }
  /*
    TALEP MUAFIYETI (olcum, 2026-09-12). Bu kural arac sayfalarina cok once
    konulmustu (aracIndekslenir: `icerikDerin || talepGormus`) ama ciftlere
    hic uygulanmamisti. Olculdugunde: GSC'de gosterim alan 106 karsilastirma
    sayfasinin yalnizca 21'i indekslenebiliyordu. 85'i `noindex, follow`
    aliyordu -- yani site, Google'in FIILEN SIRADA GOSTERDIGI sayfalara
    "beni indeksleme" diyordu. Icinde 13. sirada duran bir sayfa vardi.

    Bunlarin 65'i islev kapisindan dusuyor (farkli isi goren araclar --
    orada kalmalari DOGRU, talebin kaynagi karsilastirma degil entegrasyon
    sorgusu). Geri kalan 20'si ayni isi goren, Google'in sirada tuttugu,
    yalnizca fiyat/kriter kaniti eksik oldugu icin kapatilan sayfalar:
    discord-vs-slack (62 gosterim), teamwork-vs-trello (31),
    asana-vs-smartsheet (23)...

    talep.ts'in kendi kurali: TALEP SAYFA ELEMEZ, YALNIZCA KURTARIR.
    Gosterim almis olmak olumlu kanittir. Islev kapisi mutlak kalir:
    anlamsiz cifti talep bile kurtarmaz.
  */
  if (ciftTalebi(a, b)) return true;
  return (
    incelenmis(a) && incelenmis(b) &&
    fiyatiDogrulanmis(a) && fiyatiDogrulanmis(b) &&
    kriterliMi(a) && kriterliMi(b) &&
    gercekFarkVar(a, b)
  );
}

/** Metadata'ya konacak robots degeri. Indekslenmeyen sayfa yine de link akitir. */
export const NOINDEX = { index: false, follow: true } as const;
