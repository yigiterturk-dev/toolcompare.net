import test from "node:test";
import assert from "node:assert/strict";
import toolsData from "../src/data/tools.json" with { type: "json" };
import islevData from "../src/data/islev.json" with { type: "json" };
import { islevi, ayniIslev, ISLEV_HARITASI } from "../src/lib/islev.ts";
import {
  akranlar,
  indekslenebilirAkranlar,
  sitemapCiftleri,
  alternatifSayfasiOlanlar,
  oneCikanCiftler,
  kumeIcindekiCiftler,
  aracListesindenLinkli,
  karsilastirmaOrtaklari,
} from "../src/lib/compare.ts";
import { kategoriler } from "../src/lib/categories.ts";
import { aracIndekslenir, fiyatiDogrulanmis, kriterliMi } from "../src/lib/indeks.ts";
import { entegrasyonVar, tumEntegrasyonlar } from "../src/lib/entegrasyon.ts";

type Kayit = Parameters<typeof aracIndekslenir>[0];
const araclar = toolsData as unknown as { slug: string; category?: string }[];
const kanitli = (t: unknown) =>
  aracIndekslenir(t as Kayit) && fiyatiDogrulanmis(t as Kayit) && kriterliMi(t as Kayit);

test("islev haritasindaki her slug gercekten var", () => {
  const mevcut = new Set(araclar.map((t) => t.slug));
  const hayalet = Object.keys(ISLEV_HARITASI).filter((s) => !mevcut.has(s));
  assert.deepEqual(hayalet, [], `veride olmayan slug: ${hayalet.join(", ")}`);
});

test("kanit kapisini gecen her arac siniflandirilmis (grup ya da acikca tekil)", () => {
  const eksik = araclar.filter(kanitli).filter((t) => !(t.slug in islevData));
  assert.deepEqual(
    eksik.map((t) => t.slug),
    [],
    "yeni arac eklendiginde src/data/islev.json'a da islev yazilmali",
  );
});

test("akranlar yalnizca ayni islevden secilir", () => {
  for (const t of araclar) {
    const i = islevi(t.slug);
    for (const a of akranlar(t.slug)) {
      assert.equal(islevi(a.slug), i, `${t.slug} -> ${a.slug} farkli islev`);
      assert.notEqual(i, null, `${t.slug} tekil oldugu halde akran uretti`);
    }
  }
});

test("islevi olmayan aracin akrani da karsilastirma sayfasi da yok", () => {
  const tekil = araclar.filter((t) => islevi(t.slug) === null);
  for (const t of tekil) assert.equal(akranlar(t.slug).length, 0, `${t.slug} akran uretti`);
  const tekilSlug = new Set(tekil.map((t) => t.slug));
  for (const c of sitemapCiftleri()) {
    const [a, b] = c.split("-vs-");
    assert.ok(!tekilSlug.has(a) && !tekilSlug.has(b), `tekil arac sayfaya girdi: ${c}`);
  }
});

/*
  2026-09-12: kural "ayni islev" olmaktan cikip "ayni islev YA DA dogrulanmis
  entegrasyon kaydi"na genisledi -- gevsemedi, YER DEGISTIRDI. Capraz islevli
  bir cift hala kendiliginden sitemap'e giremez; girebilmesi icin saticinin
  kendi sayfasindan alinmis bir entegrasyon cevabi tasimasi sart
  (src/data/entegrasyonlar.json). Sebep olculdu: "typeform kajabi integration"
  gibi sorgular sitenin EN IYI siraladigi sinifti (ort. sira 43,9) ve capraz
  islev tam da entegrasyonun SEBEBI.
*/
test("sitemap'teki capraz islevli cift yalnizca entegrasyon kaydiyla giriyor", () => {
  const kotu = sitemapCiftleri().filter((c) => {
    const [a, b] = c.split("-vs-");
    return !ayniIslev(a, b) && !aracListesindenLinkli(a, b);
  });
  assert.deepEqual(kotu, [], `kaydi olmayan capraz islev cifti: ${kotu.slice(0, 5).join(", ")}`);
});

test("bilinen anlamsiz ciftler artik uretilmiyor", () => {
  const ciftler = new Set(sitemapCiftleri());
  for (const c of ["redis-vs-sentry", "appwrite-vs-jira", "hotjar-vs-typeform"]) {
    assert.ok(!ciftler.has(c), `${c} hala uretiliyor`);
  }
});

test("alternatif sayfasi olan her aracin akranlari ayni islevden", () => {
  for (const t of alternatifSayfasiOlanlar()) {
    const i = islevi(t.slug);
    assert.notEqual(i, null, `${t.slug} tekil oldugu halde alternatif sayfasi aldi`);
    for (const a of akranlar(t.slug)) assert.equal(islevi(a.slug), i);
  }
});

test("anasayfada one cikan cift her zaman sitemap'te de var", () => {
  const ciftler = new Set(sitemapCiftleri());
  for (const c of oneCikanCiftler()) {
    assert.ok(ciftler.has(c.slug), `one cikan cift sitemap disinda: ${c.slug}`);
  }
  assert.ok(oneCikanCiftler().length >= 3, "one cikan serit bosaldi");
});

test("arac sayfasi yalnizca indekslenebilir karsilastirmalara link verir", () => {
  const harita = new Map(araclar.map((t) => [t.slug, t]));
  const ciftler = new Set(sitemapCiftleri());
  for (const t of araclar) {
    for (const a of indekslenebilirAkranlar(t.slug)) {
      const c = t.slug < a.slug ? `${t.slug}-vs-${a.slug}` : `${a.slug}-vs-${t.slug}`;
      assert.ok(ciftler.has(c), `noindex sayfaya link: ${c}`);
      assert.ok(harita.has(a.slug));
    }
  }
});

test("sitemap'teki her karsilastirma sayfasi en az bir yerden link aliyor", () => {
  // Repo'nun kurulus kurali (bkz. src/lib/compare.ts basligi): sitemap'te
  // olup link almayan sayfa oksuzdur. Bu test o kurali islev degisikligi
  // sonrasi da kilitliyor.
  const linkli = new Set<string>();
  for (const t of araclar) {
    for (const a of indekslenebilirAkranlar(t.slug)) {
      linkli.add(t.slug < a.slug ? `${t.slug}-vs-${a.slug}` : `${a.slug}-vs-${t.slug}`);
    }
  }
  for (const kat of kategoriler()) {
    for (const p of kumeIcindekiCiftler(kat.araclar.map((a) => a.slug), 8)) linkli.add(p.slug);
  }
  for (const p of oneCikanCiftler()) linkli.add(p.slug);
  /*
    YENI LINK KAYNAGI (2026-09-12): arac sayfasindaki "Does X work with..."
    listesi. Entegrasyon ciftleri akran evreninde olmadigi icin yukaridaki
    kaynaklarin hicbirinden link almiyorlar; liste iki taraftan da basildigi
    icin her cift iki arac sayfasindan link alir.
  */
  for (const [cift] of tumEntegrasyonlar()) linkli.add(cift);
  /*
    IKINCI LISTE KAYNAGI (2026-09-13): arac sayfasindaki "People also
    compare X with..." listesi. Karsilastirma sorgusuyla acilmis capraz
    ciftler de akran evreninde degil; linklerini bu listeden alirlar ve
    liste iki taraftan da basilir.
  */
  for (const t of araclar) {
    for (const o of karsilastirmaOrtaklari(t.slug)) linkli.add(o.cift);
  }
  const oksuz = sitemapCiftleri().filter((c) => !linkli.has(c));
  assert.deepEqual(oksuz, [], `hicbir sayfadan link almayan cift: ${oksuz.slice(0, 5).join(", ")}`);
});
