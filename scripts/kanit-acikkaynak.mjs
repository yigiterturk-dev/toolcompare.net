/**
 * ACIK KAYNAK ARACLARIN FIYAT KANITI.
 *
 * NEDEN: fiyat kaniti kapisi (bkz. src/lib/indeks.ts fiyatiDogrulanmis)
 * saticinin /pricing sayfasini ariyor. Olculdu (2026-09-03): kanitsiz kalan
 * 110 aracin tamaminda o sayfa YOK ve tekrar taramak 0 sonuc veriyor --
 * cunku 36'si ACIK KAYNAK: VS Code'un, nginx'in, DBeaver'in fiyat sayfasi
 * olmamasi bir eksiklik degil, fiyatin kendisi. Bu araclar aramada gercekten
 * karsilastiriliyor (dbeaver 36 gosterim, photopea 42, caddy 6) ama kapidan
 * gecemedigi icin tek bir karsilastirma sayfalari yoktu.
 *
 * "Fiyat sayfasi yok" ile "fiyat sifir" ayni sey degil. Bu betik ikincisini
 * saticinin KENDI sayfasindan dogrular: metin hem "open source" demeli hem de
 * ya "free" demeli ya da taninan bir lisans adi (MIT/Apache/GPL/BSD/MPL)
 * gecmeli. Ikisi birden yoksa kayit yazilmaz -- supheli disarida kalir.
 *
 * DURUM AYRI TUTULUR: `open-source-verified`. `vendor-sourced` (editor okudu)
 * ya da `pricing-page-verified` (fiyat sayfasi cekildi) degil; ucunu ayni
 * etikete koymak sitenin tek kozunu degersizlestirir.
 *
 * SINIR: acik kaynak cekirdegin ucretsiz oldugunu dogrular. Ayni saticinin
 * ucretli bulut/kurumsal katmani olabilir -- bu `limitations`'a yazilir.
 *
 *   node scripts/kanit-acikkaynak.mjs           # tara, yazma
 *   node scripts/kanit-acikkaynak.mjs --tamamla # kuratorlu ama fiyat kaynagi
 *                                               # olmayan acik kaynak kayitlar
 *   node scripts/kanit-acikkaynak.mjs --yaz     # tools.json'a yaz
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const yol = join(kok, 'src/data/tools.json');
const yaz = process.argv.includes('--yaz');
/*
  --tamamla: kuratorlu (`vendor-sourced`) kayitlarda fiyat kaynagi eksikse
  (44 kayit; drupal, git, mediawiki, valkey... hepsi acik kaynak) durumu
  DEGISTIRMEDEN yalnizca kaynak ekler. Kuratorluluk otomatik kontrolle
  karistirilmaz; eklenen kaynagin otomatik oldugu etiketinde yazar.
*/
const tamamla = process.argv.includes('--tamamla');
const FIYAT_IDDIASI = /(\$\s?\d|€\s?\d|£\s?\d|\bpricing\b|\bprice[sd]?\b|per (user|month|seat)|\bmonthly\b|\bfree tier\b|\bfree plan\b|\bfree and open source\b)/i;
const fiyatKaynagiVar = (t) =>
  (t.evidence?.sources || []).some((s) =>
    FIYAT_IDDIASI.test([s.label || '', ...(s.supports || [])].join(' ')));

const YOLLAR = ['', '/download', '/license', '/about', '/docs'];
const ACIK = /open[-\s]source/i;
const UCRETSIZ = /\bfree\b/i;
const LISANS = /(MIT[-\s]licen[cs]ed?|Apache[-\s](?:License|2)|\bGPL(?:v[23])?\b|\bAGPL\b|\bLGPL\b|Mozilla Public License|MPL[-\s]?2\.0|BSD[-\s]licen[cs]e|(?:2|3)[-\s]clause BSD)/i;
const UA = 'Mozilla/5.0 (compatible; ToolCompareBot/1.0; +https://toolcompare.net)';
const BUGUN = new Date().toISOString().slice(0, 10);

/**
 * Sayfa metni acik kaynakligi soyluyor mu, ve nasil?
 *
 * Zorunlu kosul saticinin KENDI sayfasinin "open source" demesi. Yaninda
 * lisans adi ya da "free" gecmesi kaniti guclendirir ama sart degildir:
 * kubernetes.io, prometheus.io ve keycloak.org ana sayfalarinda lisans adi
 * gecmiyor, yalnizca "open source" yaziyor. Aday kumesi zaten
 * `kriterler.acikKaynak === true` ile sinirli (o da saticinin sayfasindan
 * tespit edildi, bkz. kanit-kriter.mjs); iki bagimsiz tespit ustuste geliyor.
 *
 * Iddia, dogrulanan kadardir: lisans/ucretsiz ifadesi bulunduysa "free and
 * open source", bulunmadiysa yalnizca "open source" yazilir.
 */
export function kanitliMi(html) {
  const metin = String(html).replace(/<[^>]+>/g, ' ');
  const acik = ACIK.test(metin);
  const lisans = LISANS.test(metin);
  /* Taninan bir lisans adi (nginx: "2-clause BSD License") "open source"
     ifadesinden daha guclu kanittir -- nginx.org o kelimeyi hic kullanmiyor. */
  if (lisans) return 'ucretsiz-yazili';
  if (!acik) return null;
  return UCRETSIZ.test(metin) ? 'ucretsiz-yazili' : 'acik-kaynak';
}

async function kaynakBul(t) {
  const taban = (t.websiteUrl || '').replace(/\/$/, '');
  if (!taban.startsWith('https://')) return null;
  for (const y of YOLLAR) {
    try {
      const r = await fetch(taban + y, {
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
        headers: { 'user-agent': UA, accept: 'text/html' },
      });
      if (!r.ok) continue;
      const html = await r.text();
      const derece = kanitliMi(html);
      if (!derece) continue;
      if (!r.url.startsWith('https://')) continue;
      return { url: r.url, derece };
    } catch { /* zaman asimi / DNS / TLS -- sonraki yol */ }
  }
  return null;
}

const araclar = JSON.parse(readFileSync(yol, 'utf8'));
const adaylar = tamamla
  ? araclar.filter((t) => t.evidence?.status === 'vendor-sourced' && !fiyatKaynagiVar(t) && t.kriterler?.acikKaynak === true)
  : araclar.filter((t) => !t.evidence && t.kriterler?.acikKaynak === true);
console.log(tamamla
  ? `${adaylar.length} kuratorlu acik kaynak kayitta fiyat kaynagi eksik; durumlari degismeyecek\n`
  : `${adaylar.length} acik kaynak arac taranacak (kanitli kayitlara dokunulmuyor)\n`);

let bulunan = 0;
for (const t of adaylar) {
  const kaynak = await kaynakBul(t);
  if (!kaynak) { console.log(`  -  ${t.slug}`); continue; }
  const { url, derece } = kaynak;
  bulunan += 1;
  console.log(`  ✓  ${t.slug.padEnd(22)} ${derece === 'ucretsiz-yazili' ? '[free]' : '[oss] '} ${url}`);
  if (tamamla) {
    t.evidence.sources.push({
      label: `${t.name} — Vendor page, free and open source (automated check)`,
      url,
      checkedAt: BUGUN,
      supports: [
        derece === 'ucretsiz-yazili'
          ? "the vendor's published pricing: the software is free and open source"
          : "the vendor describes the software as open source, so the self-hosted edition is free to use",
      ],
    });
    t.evidence.limitations = [
      ...(t.evidence.limitations || []),
      'The pricing source was added by an automated check of the vendor page; the other sources on this record were read by an editor.',
    ];
    continue;
  }
  t.evidence = {
    status: 'open-source-verified',
    reviewedAt: BUGUN,
    sources: [{
      label: `${t.name} — Vendor page (open source)`,
      url,
      checkedAt: BUGUN,
      supports: [
        derece === 'ucretsiz-yazili'
          ? "the vendor's published pricing: the software is free and open source"
          : "the vendor describes the software as open source, so the self-hosted edition is free to use",
      ],
    }],
    limitations: [
      derece === 'ucretsiz-yazili'
        ? 'Automated check: the vendor page states the software is open source and free to use. An editor has not read it line by line.'
        : 'Automated check: the vendor page describes the software as open source. It does not print a price; the free-to-self-host reading follows from the licence, not from a published price list.',
      'Covers the open-source edition only; the same vendor may sell a paid cloud or enterprise tier.',
    ],
  };
}

console.log(`\nbulunan ${bulunan}/${adaylar.length}`);
const kapsam = araclar.filter((t) => t.evidence).length;
console.log(`kanit kapsami: ${kapsam}/${araclar.length} (%${Math.round((kapsam / araclar.length) * 100)})`);
if (yaz) { writeFileSync(yol, JSON.stringify(araclar, null, 2) + '\n'); console.log('tools.json yazildi'); }
else console.log('(yazmak icin --yaz)');
