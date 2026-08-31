/**
 * Araclarin OBJEKTIF kriterlerini saticinin kendi sitesinden tespit eder.
 *
 * NEDEN: `kriterler` (api / mobil / acikKaynak / sso) indeks kapisinin uc
 * sartindan biri. 88 aracta bos oldugu icin bu araclarin karsilastirma
 * sayfalari kapidan gecemiyordu -- 36'si incelenmis ve fiyati da
 * dogrulanmis, yani tek eksigi buydu.
 *
 * KURAL: yalnizca POZITIF tespit yazilir. Sinyali bulamamak "ozellik yok"
 * demek degildir; bulunamayan kriter `null` (BAKILMADI) kalir. Bunun tersi
 * -- bulamadigina false demek -- lib/kriterler.ts'in acikca yasakladigi
 * uydurmanin ta kendisi olurdu.
 *
 * Elle kuratorlu 424 kayda DOKUNULMAZ.
 *
 *   node scripts/kanit-kriter.mjs             # tara, yazma
 *   node scripts/kanit-kriter.mjs --yaz       # tools.json'a yaz
 *   node scripts/kanit-kriter.mjs --limit 10  # deneme
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const yol = join(kok, 'src/data/tools.json');

const argv = process.argv.slice(2);
const yaz = argv.includes('--yaz');
const limitIdx = argv.indexOf('--limit');
const limit = limitIdx >= 0 ? Number(argv[limitIdx + 1]) : Infinity;

const UA = 'Mozilla/5.0 (compatible; ToolCompareBot/1.0; +https://toolcompare.net)';
const BUGUN = new Date().toISOString().slice(0, 10);

/* Sinyaller. Her biri saticinin KENDI sayfasinda gorulebilir olmali. */
const APP_STORE = /apps\.apple\.com\/[^"']*\/(app|id)|play\.google\.com\/store\/apps/i;
const SAML = /\bSAML\b|\bSCIM\b|single sign-?on/i;
const GITHUB = /github\.com\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+/i;
const ACIK = /\bopen[- ]source\b|\bself[- ]host(ed|ing)?\b|\bAGPL\b|\bApache 2\.0\b|\bMIT license\b/i;
const API = /\bAPI (docs|documentation|reference)\b|\bREST API\b|\bGraphQL API\b|\bdeveloper (docs|documentation|portal)\b/i;

/** Kayitli alan adi (ornek: app.hotjar.com -> hotjar.com). */
function kokAlanAdi(u) {
  try { return new URL(u).hostname.replace(/^www\./, '').split('.').slice(-2).join('.'); }
  catch { return ''; }
}

async function cek(url) {
  try {
    const r = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
      headers: { 'user-agent': UA, accept: 'text/html' },
    });
    if (!r.ok) return '';
    const ct = r.headers.get('content-type') || '';
    if (!ct.includes('html')) return '';
    return await r.text();
  } catch { return ''; }
}

async function tara(t) {
  const taban = t.websiteUrl.replace(/\/$/, '');
  const sayfalar = await Promise.all([
    cek(taban),
    cek(taban + '/pricing'),
    cek(taban + '/security'),
  ]);
  const hepsi = sayfalar.join('\n');
  if (!hepsi) return null;

  const k = {};
  /* API: acik ifade, ya da ARACIN KENDI alan adinda bir gelistirici adresi.
     Alan adi sarti sart: "docs.google.com" linki veren her site API sunmaz. */
  const alan = kokAlanAdi(taban);
  const kendiDoc = alan
    ? new RegExp(`https?://(docs|developer|developers|api)\\.${alan.replace(/\./g, '\\.')}|${alan.replace(/\./g, '\\.')}/(docs|api|developers)\\b`, 'i')
    : null;
  if (API.test(hepsi) || (kendiDoc && kendiDoc.test(hepsi))) k.api = true;
  if (APP_STORE.test(hepsi)) k.mobil = true;
  if (GITHUB.test(hepsi) && ACIK.test(hepsi)) k.acikKaynak = true;
  if (SAML.test(hepsi)) k.sso = true;
  return Object.keys(k).length ? k : null;
}

const araclar = JSON.parse(readFileSync(yol, 'utf8'));
const hedefler = araclar
  .filter((t) => !t.kriterler && t.websiteUrl)
  .slice(0, limit);
console.log(`${hedefler.length} arac taranacak (kuratorlu ${araclar.filter((t) => t.kriterler).length} kayda dokunulmuyor)\n`);

const ES_ZAMANLI = 8;
let bulunan = 0, bitti = 0;
const sonuc = new Map();

for (let i = 0; i < hedefler.length; i += ES_ZAMANLI) {
  const obek = hedefler.slice(i, i + ES_ZAMANLI);
  await Promise.all(obek.map(async (t) => {
    const k = await tara(t);
    if (k) { sonuc.set(t.slug, k); bulunan++; }
    bitti++;
  }));
  process.stdout.write(`\r${bitti}/${hedefler.length} · bulunan ${bulunan}`);
}
console.log('\n');

const sayac = { api: 0, mobil: 0, acikKaynak: 0, sso: 0 };
for (const k of sonuc.values()) for (const ad of Object.keys(k)) sayac[ad]++;
console.log(`${bulunan}/${hedefler.length} aracta en az bir kriter tespit edildi`);
console.log('kriter basina:', sayac);

if (yaz) {
  for (const t of araclar) {
    const k = sonuc.get(t.slug);
    if (!k) continue;
    /* Bulunamayan kriter null = BAKILMADI olarak acikca isaretlenir. */
    t.kriterler = { api: null, mobil: null, acikKaynak: null, sso: null, ...k };
    t.kriterKaynagi = { yontem: 'site-scan', checkedAt: BUGUN };
  }
  writeFileSync(yol, JSON.stringify(araclar, null, 2) + '\n');
  console.log(`→ ${yol} yazildi`);
} else {
  console.log('(yazilmadi; --yaz ile calistir)');
}
