#!/usr/bin/env node
/**
 * PLAN MERDIVENI: kanit metnindeki fiyatlari YAPISAL alana cevirir.
 *
 * NEDEN VAR (GSC olcumu, 2026-09-10):
 * Bolum verimi olculdugunde /compare sayfalarinin ilk-20'ye girme orani
 * /tools'un 7 kati cikti -- ama /compare'in 519 sayfasinin 413'u hic
 * gosterim almiyor, cunku sayfalar birbirinin ayni. Cift basina OZGUN
 * icerik uretmenin tek durust yolu, iki aracin fiyat merdivenini yan yana
 * koymak. O merdiven elimizde ZATEN VAR: satici sayfasindan okunmus
 * `evidence.sources[].supports[]` satirlarinda, ama duz metin oldugu icin
 * kod goremiyor. `basePrice` alani 512 aracin yalnizca 105'inde dolu.
 *
 * BU SCRIPT UYDURMA URETMEZ. Yaptigi tek sey, bir editorun okuyup
 * kaydettigi cumleden rakami ayiklamak. Her plan kaydi `kaynakSatiri`
 * alaninda cumlenin TAMAMINI ve `kaynakUrl` alaninda adresini tasir --
 * yani hicbir rakam kaynagindan koparilmis olmaz, ve yanlis ayiklama
 * gozle yakalanabilir.
 *
 * KESINLIK > KAPSAM. Emin olmadigi satiri atlar. Yuzdeli ucretler,
 * islem basi ucretler, donanim fiyatlari ve kredi paketleri plan
 * DEGILDIR -- bunlar bilerek disarida birakilir; "Stripe'in plani
 * $0.05" demek veriyi zehirler.
 *
 * Kullanim:
 *   node scripts/plan-merdiveni.mjs          # rapor, dosyaya yazmaz
 *   node scripts/plan-merdiveni.mjs --yaz    # tools.json'a planlar alanini yazar
 *   node scripts/plan-merdiveni.mjs --ornek 25   # rastgele 25 ayiklamayi
 *                                                # kaynak cumlesiyle bas (gozle denetim)
 */
import fs from "node:fs";

const YOL = "src/data/tools.json";

/* Plan OLMAYAN satirlarin imzalari. Bunlardan biri varsa satir atlanir. */
const PLAN_DEGIL = [
  /%/,
  /\bcapped at\b/i,
  /\bper (?:transaction|authorization|screened|invoice|dispute|payout|lookup|request|call|message|minute|GB|TB|seat added|1,?000)\b/i,
  /\bdispute\b/i,
  /\breader(s)?\b/i,
  /\bhardware\b/i,
  /\bcredits?\b.*\$/i,
  /\bfee\b/i,
  /\boverage\b/i,
  /\brefund\b/i,
  /\bdeposit\b/i,
  /\bsetup\b/i,
  /\bone-?time\b/i,
  /* Saatlik/kullanim rakami plan basamagi degil: MongoDB Flex "$0.011/hour
     ($8-$30/month)" satirinda ayiklanan sey $0,01 oluyordu. */
  /\/\s?hour\b|\bper hour\b|\bhourly\b/i,
  /* Kaynak basina fiyatlanan eklentiler: BetterStack "status page password
     authentication $50 per page/month" bir PLAN degil, bir ozellik. */
  /\bper (?:\w+\s)?(?:page|domain|IP|form|bot|channel|inbox|number|record|site|workspace)\b/i,
  /* SONUC/ETKILESIM BASINA UCRET (2026-09-12): Intercom "Fin AI agent $0.99
     per outcome" basamak olarak alinmis, birimi de "kisi-basina" sayilmisti.
     Arac sayfasi bu yuzden "Paid tiers start at $0.99/user/mo" yaziyordu --
     $29/koltuk olan gercek giris planinin 30'da biri. Kullanim basina ucret
     plan basamagi degildir. */
  /\bper (?:outcome|resolution|conversation|ticket|session|order|contact|event|run|task|query|seat-hour)\b/i,
];

/* Plan adinda olmasi imkansiz kelimeler (cumle parcasini ad saymayalim). */
const AD_DEGIL = /^(?:A|An|The|One|Two|Three|Four|Five)\s|\b(?:tiers?|and|or|the|with|for|from|includes?|including|plus|also|available|billed|paid|charged|costs?|price[ds]?|starts?|listed|each|both|all|any|no|not|its|their|you|we|this|that|these|those)\b/i;

const FIYAT = String.raw`(?:US)?\$\s?(?<fiyat>\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?)`;
const KALIP = new RegExp(
  String.raw`^(?<ad>[A-Z][A-Za-z0-9+&.'’/ -]{1,44}?)` +
    String.raw`\s*(?:\((?:[^)]*)\))?\s*` +
    /* Tirnak: Trello "Standard: '$6 billed monthly'" satirinda fiyat tek
       tirnak icindeydi ve basamak hic ayiklanmiyordu. */
    String.raw`(?:—|-|:)?\s*['"“‘]?\s*` +
    String.raw`(?:starts? at\s+|starting at\s+|from\s+|listed at\s+|is\s+)?` +
    FIYAT +
    String.raw`(?<kuyruk>[^,;]{0,60})`,
  "u"
);

/** Bir satiri, plan gibi duran parcalara ayirir. */
function parcala(satir) {
  const govde = satir.split(":")[0].length < satir.length ? satir : satir;
  return govde
    .split(/;\s+|,\s+(?=[A-Z])/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/*
  ONCE KUYRUK, SONRA SATIR. Nedeni bir hata: "Advanced $549 monthly,
  $455.67 annual" satirinda tum cumleye bakinca "annual" gorunuyor ve
  $549 yillik fiyat sanilıyordu -- oysa yillik olan $455,67. Rakamin
  HEMEN ARDINDAN gelen kelime hangi fiyat oldugunu soyler; cumlenin geri
  kalani baska basamaklardan bahsediyor olabilir.
*/
function ilkEsleyen(kuyruk, satir, coz) {
  return coz(kuyruk) ?? coz(satir);
}

/* Kisi birimi satici sozlugune gore degisiyor: Sketch "editor", Whereby
   "host", Deel "contractor", Notion "member". Hepsi ayni sey demek. */
const KISI = String.raw`user|seat|member|person|editor|host|contractor|agent|admin|author|creator|employee|licen[cs]e`;

function kisiBasinaMi(alan) {
  return (
    new RegExp(String.raw`\/\s?(?:${KISI})\b`, "i").test(alan) ||
    new RegExp(String.raw`\b(?:${KISI})\s?\/\s?(?:mo|month)\b`, "i").test(alan) ||
    new RegExp(String.raw`\bper (?:${KISI})\b`, "i").test(alan) ||
    /* Figma "full seat $16/mo": birim kelimesi rakamin HEMEN oncesinde.
       Bosluk 8 karakterle sinirli -- "for 50+ users, from $99" gibi
       uzak duran bir kelimeyi birim sanmayalim. */
    new RegExp(String.raw`\b(?:${KISI})s?\b[^$]{0,8}\$`, "i").test(alan)
  );
}

/*
  BIRIMDE ONCE KISI SORULUR, SONRA SABITE DUSULUR -- ve kisi sorusu tum
  cumleye sorulur. Nedeni yine bir hata: Trello "Standard: '$6 billed
  monthly', lower per user/month if billed annually" satirinda rakamin
  hemen ardinda yalnizca "billed monthly" var, "per user" cumlenin
  ilerisinde. Kuyruga bakip sabit demek, sayfada "$6/mo" yazdiriyordu --
  oysa fiyat kisi basina. Faturalama icin kuyruk oncelikli kalir (orada
  birden fazla rakam yarisir), birim icin kalmaz: bir plan ya kisi
  basinadir ya degildir, cumle boyunca degismez.
*/
function birimiCoz(kuyruk, satir) {
  if (kisiBasinaMi(kuyruk) || kisiBasinaMi(satir)) return "kisi-basina";
  const sabitMi = (alan) => /\/\s?(?:mo|month)\b/i.test(alan) || /\bper month\b/i.test(alan) || /\bmonthly\b/i.test(alan);
  if (sabitMi(kuyruk) || sabitMi(satir)) return "sabit";
  return null;
}

/*
  Iki anahtar kelime de gecerse ONCE GELEN kazanir, "yillik" degil.
  Nedeni bir hata: Slack'in "Pro $8.75/user/month monthly or $7.25/user/
  month annual" satirinda cumlede "annual" gectigi icin $8,75 YILLIK
  fiyat diye etiketlenmisti -- oysa yillik olan $7,25. Rakama en yakin
  kelime hangi fiyat oldugunu soyler.
*/
const YILLIK_RE = /\b(?:annual(?:ly)?|paid yearly|billed yearly|yearly|per year|\/yr|annual commitment)\b/i;
const AYLIK_RE = /\bmonthly\b/i;

function faturalamaCozTek(alan) {
  const y = alan.search(YILLIK_RE);
  const a = alan.search(AYLIK_RE);
  if (y === -1 && a === -1) return null;
  if (y === -1) return "aylik";
  if (a === -1) return "yillik";
  return a < y ? "aylik" : "yillik";
}

function planlariCikar(arac) {
  const cikan = [];
  const gorulen = new Set();

  for (const kaynak of arac.evidence?.sources ?? []) {
    for (const satir of kaynak.supports ?? []) {
      if (!/\$\s?\d/.test(satir)) continue;
      if (PLAN_DEGIL.some((r) => r.test(satir))) continue;

      for (const parca of parcala(satir)) {
        const m = KALIP.exec(parca);
        if (!m?.groups) continue;

        const ad = m.groups.ad.trim().replace(/[-—:]$/, "").trim();
        if (ad.length < 2 || AD_DEGIL.test(ad)) continue;
        /* Ad tamamen buyuk harfli tek kelimeyse (ACH, VAT) plan degil. */
        if (/^[A-Z]{2,5}$/.test(ad)) continue;

        const aylik = Number(m.groups.fiyat.replace(/,/g, ""));
        if (!Number.isFinite(aylik) || aylik > 100000) continue;

        const birim = birimiCoz(m.groups.kuyruk, satir);
        if (!birim) continue;

        const anahtar = `${ad.toLowerCase()}|${aylik}|${birim}`;
        if (gorulen.has(anahtar)) continue;
        gorulen.add(anahtar);

        cikan.push({
          ad,
          aylik,
          birim,
          faturalama: ilkEsleyen(m.groups.kuyruk, satir, faturalamaCozTek),
          kaynakSatiri: satir,
          kaynakUrl: kaynak.url ?? null,
        });
      }
    }
  }

  /*
    UCRETSIZ BASAMAK. $0 yazan satirlar yukarida yakalaniyor, ama cok
    satici ucretsiz plani rakamsiz yaziyor: Linear'in kanidinda
    "Free: unlimited members, 2 teams, 250 issues" var, $ isareti yok.
    Bu yuzden sayfa "Linear'in ucretsiz plani DOGRULANMADI" diyordu --
    kanit tam onunde dururken. Satirin BASINDA "Free" varsa o bir plan
    adidir; cumlenin ortasindaki "free trial" degildir.
  */
  if (!cikan.some((p) => p.aylik === 0)) {
    for (const kaynak of arac.evidence?.sources ?? []) {
      for (const satir of kaynak.supports ?? []) {
        const m = /^Free(?: (?:Forever|Tools|plan|tier|Plan|Tier))?\b\s*(?:[:\-—$]|\d)/.exec(satir);
        if (!m) continue;
        if (/\bfree trial\b/i.test(satir.slice(0, 24))) continue;
        cikan.push({
          ad: m[0].replace(/[:\-—$\d\s]+$/, "").trim() || "Free",
          aylik: 0,
          birim: "sabit",
          faturalama: null,
          kaynakSatiri: satir,
          kaynakUrl: kaynak.url ?? null,
        });
        break;
      }
      if (cikan.some((p) => p.aylik === 0)) break;
    }
  }

  return cikan.sort((a, b) => a.aylik - b.aylik);
}

/* ---------------------------------------------------------------- */

const raw = fs.readFileSync(YOL, "utf8");
const d = JSON.parse(raw);
const arr = Array.isArray(d) ? d : d.tools;

let araclaPlan = 0;
let merdivenli = 0;
let toplamPlan = 0;
const hepsi = [];

for (const t of arr) {
  const planlar = planlariCikar(t);
  if (planlar.length) {
    araclaPlan++;
    toplamPlan += planlar.length;
    if (planlar.length >= 2) merdivenli++;
    hepsi.push(...planlar.map((p) => ({ slug: t.slug, ...p })));
  }
  if (process.argv.includes("--yaz")) {
    if (planlar.length) t.planlar = planlar;
    else delete t.planlar;
  }
}

console.log(
  `plan cikarilan arac: ${araclaPlan}/${arr.length} · en az 2 basamakli merdiven: ${merdivenli} · toplam plan: ${toplamPlan}`
);

const ornekAdet = Number(process.argv[process.argv.indexOf("--ornek") + 1]);
if (process.argv.includes("--ornek") && Number.isFinite(ornekAdet)) {
  const adim = Math.max(1, Math.floor(hepsi.length / ornekAdet));
  console.log("\n--- GOZLE DENETIM (ayiklanan / kaynak cumlesi) ---");
  for (let i = 0; i < hepsi.length && i / adim < ornekAdet; i += adim) {
    const p = hepsi[i];
    console.log(
      `\n[${p.slug}] ${p.ad} = $${p.aylik} ${p.birim}${p.faturalama ? " (" + p.faturalama + ")" : ""}` +
        `\n   << ${p.kaynakSatiri.slice(0, 170)}`
    );
  }
}

if (process.argv.includes("--yaz")) {
  fs.writeFileSync(YOL, JSON.stringify(d, null, 2) + "\n");
  console.log(`\n${YOL} yazildi.`);
}
