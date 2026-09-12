import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { merdiven, planEtiketi } from "../src/lib/plan.ts";
import type { Plan } from "../src/lib/plan.ts";

/**
 * ARAC SAYFASINDA FIYAT BOLUMU YOKTU.
 *
 * GSC (90 gun, 2026-09-12): "<arac> pricing/cost/price" bicimindeki 920
 * sorgu 3.140 gosterim aliyor, TIK SIFIR, agirlikli sira 68,8. Sayfanin
 * baslik etiketi "Features, Pricing & Verdict" diyordu ama govdede fiyat
 * bolumu yoktu: 196 aracin kaynak satirli merdiveni yalnizca /data ile
 * API'de basiliyordu. spyfu 242 gosterim / p75 / 0 tik, oysa $39/$119/$249
 * rakamlari kayitliydi.
 *
 * Bu testler bolumun geri dusmesini ve -- daha onemlisi -- kaynagi
 * olmayan bir rakamin sayfaya sizmasini engeller.
 */

const bolum = readFileSync("src/components/FiyatBolumu.tsx", "utf8");
const sayfa = readFileSync("src/app/tools/[slug]/page.tsx", "utf8");
const araclar = JSON.parse(readFileSync("src/data/tools.json", "utf8")) as {
  slug: string;
  name: string;
  planlar?: Plan[];
}[];

test("arac sayfasi fiyat bolumunu ciziyor", () => {
  assert.match(sayfa, /<FiyatBolumu\b/, "FiyatBolumu sayfaya baglanmamis");
  assert.match(bolum, /id="pricing"/, "bolumun capa kimligi yok");
  assert.match(bolum, /\{tool\.name\} pricing/, "H2 arac adiyla 'pricing' demiyor");
});

/**
 * Sayfaya basilan her rakam merdiven basamagindan gelmeli. Bolumun kendi
 * icinde para birimi kaliba girmis bir sayi OLMAMALI -- tutar bicimlemesi
 * tek yerde, plan.ts icindeki planEtiketi'nde durur.
 */
test("fiyat bolumu kendi rakamini uydurmuyor", () => {
  // Yorumlar haric: aciklamada gecen ornek rakam ("spyfu $39") kodda
  // basilan bir deger degil, teste takilmasi yanlis alarm olurdu.
  const kod = bolum.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  assert.ok(!/\$\d/.test(kod), "bolumun kaynaginda elle yazilmis bir dolar rakami var");
  assert.match(bolum, /planEtiketi\(/, "tutar bicimlemesi plan.ts'ten gelmiyor");
  assert.match(bolum, /kaynakSatiri/, "rakamin yaninda kaynak cumlesi basilmiyor");
  assert.ok(
    !/tool\.basePrice/.test(bolum),
    "bolum basePrice okuyor: merdivenle celisen ikinci bir rakam dogurur",
  );
});

/** Merdiveni olan her aracin her basamagi kaynak cumlesi tasimali. */
test("her basamak kaynak cumlesiyle geliyor", () => {
  const kaynaksiz: string[] = [];
  for (const t of araclar) {
    for (const p of t.planlar ?? []) {
      if (!p.kaynakSatiri || !p.kaynakSatiri.trim()) kaynaksiz.push(`${t.slug}/${p.ad}`);
    }
  }
  assert.deepEqual(kaynaksiz, [], `kaynak cumlesi olmayan basamak: ${kaynaksiz.join(", ")}`);
});

/** merdiven() siraliyor: sema lowPrice/highPrice bu siraya guveniyor. */
test("merdiven artan sirali, sema ucu dogru aliyor", () => {
  const spyfu = araclar.find((t) => t.slug === "spyfu");
  assert.ok(spyfu, "spyfu kaydi yok");
  const b = merdiven(spyfu);
  assert.ok(b.length >= 2, "spyfu merdiveni 2 basamaktan az");
  for (let i = 1; i < b.length; i++) {
    assert.ok(b[i].aylik >= b[i - 1].aylik, "merdiven artan sirali degil");
  }
  assert.match(sayfa, /"@type": "AggregateOffer"/, "coklu basamak AggregateOffer'a cevrilmiyor");
  assert.match(sayfa, /lowPrice: semaBasamaklari\[0\]\.aylik/, "lowPrice en ucuz basamaktan alinmiyor");
});

/**
 * PARA HUNISI. Fiyat sorgusu ticari niyetin en yogun oldugu yer; sayfa
 * rakami gosterip kisiyi bos birakirsa hunide adim yok. /alternatives
 * 90 gunde 1.545 gosterim / 0 tik aliyordu -- oraya nitelikli ic trafik
 * gitmedigi icin.
 */
test("fiyat bolumu alternatif sayfasina koprü kuruyor", () => {
  assert.match(bolum, /\/alternatives\/\$\{tool\.slug\}/, "alternatif sayfasina link yok");
  assert.match(sayfa, /altSayfasiVar=\{altSayfasiVar\}/, "link yalnizca sayfa VARSA cizilmiyor");
});

/** SSS cevabi artik basamaklari sayiyor; ucretsiz katmanlilar da kapidan gecmeli. */
test("fiyat SSS'si merdiveni okuyor ve ucretsiz katmanlilari disarida birakmiyor", () => {
  assert.match(sayfa, /fiyat\.karsilastirilabilir \|\| merdiven\(tool\)\.length >= 2/, "SSS kapisi dar kalmis");
  assert.match(sayfa, /publishes \$\{basamaklar\.length\} plans/, "SSS cevabi basamaklari saymiyor");
  const netlify = araclar.find((t) => t.slug === "netlify");
  assert.ok(netlify && merdiven(netlify).length >= 2, "netlify ornegi merdivensiz kalmis");
});

/** planEtiketi ciplak sayi degil, birim ve faturalama tasiyor. */
test("plan etiketi birimi soyluyor", () => {
  const spyfu = araclar.find((t) => t.slug === "spyfu")!;
  const etiket = planEtiketi(merdiven(spyfu)[0]);
  assert.match(etiket, /^\$\d/, "etiket para birimiyle baslamiyor");
  assert.match(etiket, /\/mo|\/user\/mo/, "etiket donemi soylemiyor");
});

/**
 * KULLANIM BASINA UCRET PLAN BASAMAGI DEGILDIR.
 *
 * 2026-09-12'de bulundu: Intercom'un "Fin AI agent $0.99 per outcome" satiri
 * merdivene basamak olarak girmis, birimi "kisi-basina" sayilmisti. Fiyat
 * bolumu eklenince sayfa "Paid tiers start at $0.99/user/mo" yazdi -- gercek
 * giris plani $29/koltuk. Yanlis veri sessizce duruyordu; gorunur olunca
 * yakalandi. Ayiklayici (scripts/plan-merdiveni.mjs) artik bu satirlari
 * eliyor, bu test de geri gelmelerini engelliyor.
 */
test("merdivende kullanim basina ucret yok", () => {
  const BIRIMI_YOK =
    /per (outcome|resolution|conversation|credit|message|ticket|session|request|lookup|hour|minute|transaction|order|contact|record)\b|per 1[,0]?000|% of/i;
  const bozuk: string[] = [];
  for (const t of araclar) {
    for (const p of t.planlar ?? []) {
      if (BIRIMI_YOK.test(p.kaynakSatiri)) bozuk.push(`${t.slug}/${p.ad}: ${p.kaynakSatiri}`);
    }
  }
  assert.deepEqual(bozuk, [], `aylik olmayan birim basamak sayilmis:\n${bozuk.join("\n")}`);
});

/** Ayiklayici da elemeli: test tek basina veriyi temiz tutmaz, kaynagi tutar. */
test("ayiklayici kullanim basina satirlari eliyor", () => {
  const betik = readFileSync("scripts/plan-merdiveni.mjs", "utf8");
  assert.match(betik, /per \(\?:outcome\|resolution/, "PLAN_DEGIL listesinde sonuc-basina imzasi yok");
});
