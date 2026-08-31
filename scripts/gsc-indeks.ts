/**
 * Sitemap'ten ornek adresler alip indeks durumlarini sorar.
 *
 * Site 14 Mayis - 22 Agustos arasi noindex'ti; asil soru "kac sayfa yazildi"
 * degil, "kaci Google'da gercekten var". Arama verisi dolmadan once bunu
 * cevaplayabilen tek kaynak URL Inspection API.
 *
 * Kullanim: npm run gsc:indeks [ornek-sayisi]
 */
import "./env.ts";
import { inspectUrl, isGscConfigured, listSitemaps, submitSitemap } from "../src/lib/gsc.ts";

const SITEMAP = "https://toolcompare.net/sitemap.xml";

async function sitemapAdresleri(): Promise<string[]> {
  const xml = await (await fetch(SITEMAP)).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function main() {
  if (!isGscConfigured()) { console.log("⛔ GSC kimlik bilgileri yok"); process.exit(1); }

  const mevcut = await listSitemaps();
  if (!mevcut.some((s) => s.path === SITEMAP)) {
    await submitSitemap(SITEMAP);
    console.log(`sitemap bildirildi: ${SITEMAP}`);
  } else {
    console.log(`sitemap zaten bildirilmis: ${SITEMAP}`);
  }

  const adresler = await sitemapAdresleri();
  const ornekSayisi = Math.min(Number(process.argv[2]) || 15, 40);
  // Duzenli araliklarla ornek: bastan 15 tane almak yalnizca ana sayfalari
  // olcerdi, oysa risk derin sayfalarda.
  const adim = Math.max(1, Math.floor(adresler.length / ornekSayisi));
  const ornek = Array.from({ length: ornekSayisi }, (_, i) => adresler[i * adim]).filter(Boolean);

  console.log(`\nsitemap: ${adresler.length} adres · ornek: ${ornek.length}\n`);

  const sayac = new Map<string, number>();
  const tekil: Array<[string, string]> = [];
  for (const adres of ornek) {
    try {
      const sonuc = await inspectUrl(adres);
      sayac.set(sonuc.coverageState, (sayac.get(sonuc.coverageState) ?? 0) + 1);
      tekil.push([adres, sonuc.coverageState]);
      const isaret = sonuc.verdict === "PASS" ? "✅" : sonuc.verdict === "NEUTRAL" ? "➖" : "⛔";
      console.log(`${isaret} ${sonuc.coverageState.padEnd(38)} ${adres.replace("https://toolcompare.net", "")}`);
    } catch (error) {
      console.log(`⚠️  ${(error as Error).message.slice(0, 90)}`);
      break;
    }
  }

  console.log("\n--- bolume gore ---");
  // Karma bir "%42 indeksli" rakami karar aldirmaz; hangi SABLONUN
  // reddedildigini bilmek gerekir. Google bir sayfa tipini toptan
  // degerlendirir, tek tek degil.
  const bolumler = new Map<string, { indeksli: number; toplam: number }>();
  for (const [adres, durum] of tekil) {
    const bolum = new URL(adres).pathname.split("/")[1] || "(kok)";
    const kayit = bolumler.get(bolum) ?? { indeksli: 0, toplam: 0 };
    kayit.toplam++;
    if (durum.startsWith("Submitted and indexed") || durum === "Indexed, not submitted in sitemap") kayit.indeksli++;
    bolumler.set(bolum, kayit);
  }
  for (const [bolum, kayit] of [...bolumler.entries()].sort((a, b) => b[1].toplam - a[1].toplam)) {
    console.log(`  ${bolum.padEnd(14)} ${kayit.indeksli}/${kayit.toplam} indeksli (%${Math.round(kayit.indeksli / kayit.toplam * 100)})`);
  }

  console.log("\n--- ozet ---");
  for (const [durum, adet] of [...sayac.entries()].sort((a, b) => b[1] - a[1])) {
    const oran = Math.round((adet / ornek.length) * 100);
    console.log(`  ${String(adet).padStart(3)} (%${String(oran).padStart(3)})  ${durum}`);
  }
  const indeksli = [...sayac.entries()]
    .filter(([durum]) => durum.startsWith("Submitted and indexed") || durum === "Indexed, not submitted in sitemap")
    .reduce((toplam, [, adet]) => toplam + adet, 0);
  console.log(`\nornekte indeksli oran: %${Math.round((indeksli / ornek.length) * 100)} → tahmini ${Math.round((indeksli / ornek.length) * adresler.length)} / ${adresler.length} sayfa`);
}

main().catch((error) => { console.error(error.message); process.exit(1); });
