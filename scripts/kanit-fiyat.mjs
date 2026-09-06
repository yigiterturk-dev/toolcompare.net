/**
 * Saticinin fiyat sayfasini bulur, canli oldugunu dogrular ve kanit olarak
 * isler.
 *
 * NEDEN: sitenin G2/Capterra'ya karsi tek iddiasi "dogrulanmis fiyat +
 * kaynak + tarih". Olculdu (2026-08-31): `evidence` 512 aracin yalnizca
 * 140'inda doluydu. Kalan 372 icin elle kurator olmak aylar surer; uydurmak
 * ise siteyi bitirir. Otomatiklestirilebilecek DOGRU sey su: saticinin
 * fiyat sayfasini gercekten cek, o tarihte yasadigini ve fiyat icerdigini
 * dogrula, ve BUNU -- sadece bunu -- iddia et.
 *
 * Bu yuzden durum `pricing-page-verified`, `vendor-sourced` DEGIL. Elle
 * kuratorlu 140 kayda DOKUNULMAZ.
 *
 * Kaynaklar curur (gelecekfinans'ta RSS listesi ayni sekilde curudu):
 * betik yeniden calistirilabilir, `checkedAt` her turda tazelenir.
 *
 *   node scripts/kanit-fiyat.mjs            # kanitsiz araclari tara
 *   node scripts/kanit-fiyat.mjs --tamamla  # kuratorlu ama FIYAT kaynagi
 *                                           # olmayan kayitlara kaynak ekle
 *   node scripts/kanit-fiyat.mjs --yaz      # tools.json'a yaz
 *   node scripts/kanit-fiyat.mjs --limit 20 # ilk 20 arac (deneme)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const yol = join(kok, 'src/data/tools.json');

const argv = process.argv.slice(2);
const yaz = argv.includes('--yaz');
/*
  --tamamla: kuratorlu (`vendor-sourced`) ama fiyat kaynagi olmayan kayitlar.
  Olculdu (2026-09-03): 44 kayit boyle -- kaynaklari saticinin DOKUMANI
  (LangChain Docs, Pinecone Docs). Indeks kapisi fiyat iddiasini destekleyen
  bir kaynak aradigi icin bu araclarin tek karsilastirma sayfasi yoktu, oysa
  fiyat sayfalari duruyor (pinecone.io/pricing canli ve fiyatli).
  Bu kipte kaydin DURUMU DEGISMEZ -- kuratorluluk otomatik kontrolle
  karistirilmaz; yalnizca yeni bir kaynak eklenir ve o kaynagin otomatik
  oldugu kendi etiketinde ve limitations'ta yazar.
*/
const tamamla = argv.includes('--tamamla');
const FIYAT_IDDIASI = /(\$\s?\d|€\s?\d|£\s?\d|\bpricing\b|\bprice[sd]?\b|per (user|month|seat)|\bmonthly\b|\bfree tier\b|\bfree plan\b)/i;
const fiyatKaynagiVar = (t) =>
  (t.evidence?.sources || []).some((s) =>
    FIYAT_IDDIASI.test([s.label || '', ...(s.supports || [])].join(' ')));
const limitIdx = argv.indexOf('--limit');
const limit = limitIdx >= 0 ? Number(argv[limitIdx + 1]) : Infinity;

const YOLLAR = ['/pricing', '/plans', '/pricing/', '/pricing-plans', '/price'];

/*
  ELLE ADRES: fiyat sayfasi baska bir alan adinda ya da alisildik yolun
  disinda olan araclar. Olculdu (2026-09-03): kanitsiz 110 aracin hicbiri
  otomatik yollardan bulunamadi; yol listesini buyutmek ise yanlis sayfa
  yakaliyordu (blender ve webflow'un /store'u yazilim degil TISORT satiyor).
  Bu yuzden adres elle secilir -- ama iddia yine otomatik dogrulanir:
  sayfa canli olacak VE fiyat icerecek, yoksa kayit yazilmaz.
*/
/* Photopea bilerek YOK: photopea.com/api/accounts sayfasi KENDI BARINDIRMA
   lisansini fiyatliyor ($500-2000/ay), kullanicinin gordugu Premium
   aboneligini degil. Yanlis urunun fiyatini kanit diye yazmak, kanit
   fikrinin kendisini bozar; Photopea'nin herkese acik fiyat sayfasi yok. */
const ELLE_YOLLAR = {
  'sublime-text': 'https://www.sublimehq.com/store/text',
  jetbrains: 'https://www.jetbrains.com/store/',
  youtrack: 'https://www.jetbrains.com/youtrack/buy/',
  omnifocus: 'https://www.omnigroup.com/omnifocus/buy',
  ticktick: 'https://ticktick.com/pricing',
  dbeaver: 'https://dbeaver.com/buy/',
  swagger: 'https://swagger.io/tools/swaggerhub/pricing/',
  dribbble: 'https://dribbble.com/pro',
  'notion-calendar': 'https://www.notion.so/pricing',
  'premiere-pro': 'https://www.adobe.com/creativecloud/plans.html',
  hetzner: 'https://www.hetzner.com/cloud/',
  contentful: 'https://www.contentful.com/pricing/',
  carrd: 'https://carrd.co/#pricing',
  procreate: 'https://procreate.com/procreate',
  'affinity-designer': 'https://affinity.serif.com/en-us/store/',
  'tally-solutions': 'https://tallysolutions.com/buy-tally/',
  terraform: 'https://www.hashicorp.com/en/pricing',
  'microsoft-365': 'https://www.microsoft.com/en-us/microsoft-365/buy/compare-all-microsoft-365-products',
  'google-workspace': 'https://workspace.google.com/pricing',
};
/* Fiyat sayfasi oldugunu gosteren isaret. Yalnizca 200 donmesi yetmez -- cok
   site 404'u 200 ile servis eder ("soft 404"). */
const PARA = /(\$|€|£)\s?\d|\bper month\b|\/mo\b|\bper user\b|\bfree plan\b/i;
const UA = 'Mozilla/5.0 (compatible; ToolCompareBot/1.0; +https://toolcompare.net)';
const BUGUN = new Date().toISOString().slice(0, 10);

/** Kayitli alan adi (ornek: app.hotjar.com -> hotjar.com). */
function kokAlanAdi(u) {
  try { return new URL(u).hostname.replace(/^www\./, '').split('.').slice(-2).join('.'); }
  catch { return ''; }
}

async function fiyatSayfasi(t) {
  const taban = t.websiteUrl.replace(/\/$/, '');
  const adaylar = ELLE_YOLLAR[t.slug]
    ? [ELLE_YOLLAR[t.slug]]
    : YOLLAR.map((y) => taban + y);
  for (const adres of adaylar) {
    try {
      const r = await fetch(adres, {
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
        headers: { 'user-agent': UA, accept: 'text/html' },
      });
      if (!r.ok) continue;
      const html = await r.text();
      if (!PARA.test(html)) continue;
      return { url: r.url, yonlendirildi: kokAlanAdi(r.url) !== kokAlanAdi(taban) };
    } catch { /* zaman asimi / DNS / TLS -- sonraki yol */ }
  }
  return null;
}

const araclar = JSON.parse(readFileSync(yol, 'utf8'));
const hedefler = (tamamla
  ? araclar.filter((t) => t.evidence?.status === 'vendor-sourced' && !fiyatKaynagiVar(t) && t.websiteUrl)
  : araclar.filter((t) => !t.evidence && t.websiteUrl)
).slice(0, limit);
console.log(tamamla
  ? `${hedefler.length} kuratorlu kayitta fiyat kaynagi eksik; durumlari degismeyecek\n`
  : `${hedefler.length} arac taranacak (kuratorlu ${araclar.filter((t) => t.evidence).length} kayda dokunulmuyor)\n`);

let bulunan = 0, yonlendirme = 0;
const ES_ZAMANLI = 8;
for (let i = 0; i < hedefler.length; i += ES_ZAMANLI) {
  const oberk = hedefler.slice(i, i + ES_ZAMANLI);
  const sonuclar = await Promise.all(oberk.map(fiyatSayfasi));
  oberk.forEach((t, j) => {
    const s = sonuclar[j];
    if (!s) return;
    bulunan++;
    if (s.yonlendirildi) yonlendirme++;
    if (tamamla) {
      t.evidence.sources.push({
        label: `${t.name} — Pricing (automated check)`,
        url: s.url,
        checkedAt: BUGUN,
        supports: ["the vendor's published pricing"],
      });
      t.evidence.limitations = [
        ...(t.evidence.limitations || []),
        'The pricing source was added by an automated check: the page was fetched on this date and contained pricing information. The other sources on this record were read by an editor.',
      ];
      return;
    }
    t.evidence = {
      status: 'pricing-page-verified',
      reviewedAt: BUGUN,
      sources: [{
        label: `${t.name} — Pricing`,
        url: s.url,
        checkedAt: BUGUN,
        supports: ['the vendor\'s published pricing'],
      }],
      limitations: [
        'Automated check: the pricing page was fetched on this date and contained pricing information. An editor has not read it line by line.',
        ...(s.yonlendirildi ? [`The vendor's pricing URL redirects to ${kokAlanAdi(s.url)}.`] : []),
      ],
    };
  });
  process.stdout.write(`\r${Math.min(i + ES_ZAMANLI, hedefler.length)}/${hedefler.length} · bulunan ${bulunan}`);
}

const kanitli = araclar.filter((t) => t.evidence).length;
console.log(`\n\nbulunan ${bulunan}/${hedefler.length} (%${Math.round(bulunan / hedefler.length * 100)})`);
console.log(`baska alan adina yonlendiren ${yonlendirme} (limitations'a yazildi)`);
console.log(`kanit kapsami: ${kanitli}/${araclar.length} (%${Math.round(kanitli / araclar.length * 100)})`);

if (yaz) {
  writeFileSync(yol, JSON.stringify(araclar, null, 2) + '\n');
  console.log(`→ ${yol} yazildi`);
} else {
  console.log('(yazmak icin --yaz)');
}
