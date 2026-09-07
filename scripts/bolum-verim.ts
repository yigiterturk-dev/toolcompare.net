/**
 * BOLUM VERIMI: hangi sayfa turu tarama butcesini hak ediyor?
 *
 * Uc sayiyi YAN YANA koyar; tek basina hicbiri karar verdirmiyor:
 *   sitemap payi  -- Google'dan ne kadar tarama istiyoruz
 *   indeksli oran -- istedigimizin ne kadarini kabul ediyor
 *   gosterim payi -- kabul ettiginin ne kadari ise yariyor
 *
 * OLCUM (2026-09-07):
 *   compare       %43 sitemap · %17 indeksli · %5 gosterim
 *   tools         %34 sitemap · %83 indeksli · %85 gosterim
 *   alternatives  %21 sitemap · %50 indeksli · %7 gosterim
 *
 * Yani sitemap'in en buyuk parcasi, en cok reddedilen ve en az is yapan
 * bolum. NE YAPILMAYACAGI da olculdu: compare kapisini "gosterim almamis
 * cifti ele" diye sikmak YANLIS -- talep.ts'in bastaki notu bu tuzagin
 * daha once olculup birakildigini anlatiyor (gosterim almamak kanit
 * degil; adreslerin %36'sina Google hic bakmamis). Compare sayfalarinin
 * sorunu kapi degil, birbirine benzemeleri.
 *
 * Kullanim: npx tsx scripts/bolum-verim.ts [ornek-sayisi]
 */
import "./env.ts";
import { inspectUrl, isGscConfigured } from "../src/lib/gsc.ts";
import sitemap from "../src/app/sitemap.ts";
import ham from "../src/data/gsc/latest.json" with { type: "json" };

const ORNEK = Number(process.argv[2] ?? 10);
const BOLUMLER = ["tools", "compare", "alternatives"] as const;

type Satir = { page?: string; impressions?: number };
const satirlar = ((ham as { rows?: Satir[] }).rows ?? []);

function gosterimPayi() {
  const k = new Map<string, number>();
  let toplam = 0;
  for (const s of satirlar) {
    const m = (s.page ?? "").replace("https://toolcompare.net", "").match(/^\/([a-z-]+)/);
    const g = m ? m[1] : "(kok)";
    k.set(g, (k.get(g) ?? 0) + (s.impressions ?? 0));
    toplam += s.impressions ?? 0;
  }
  return { k, toplam };
}

async function main() {
  if (!isGscConfigured()) { console.log("⛔ GSC kimlik bilgileri yok"); process.exit(1); }

  const adresler = sitemap().map((r) => r.url);
  const { k: gos, toplam: gosToplam } = gosterimPayi();

  console.log(`sitemap ${adresler.length} adres · gosterim ${gosToplam} (90 gun) · ornek ${ORNEK}/bolum\n`);
  console.log("bolum          sitemap   indeksli   gosterim");

  for (const b of BOLUMLER) {
    const grup = adresler.filter((u) => u.includes(`/${b}/`));
    const ornek = grup.slice().sort(() => Math.random() - 0.5).slice(0, ORNEK);
    let indeksli = 0;
    for (const u of ornek) {
      try {
        const r = await inspectUrl(u);
        if ((r as { coverageState?: string }).coverageState === "Submitted and indexed") indeksli++;
      } catch { /* sayilmaz */ }
    }
    const pay = (n: number, t: number) => `%${Math.round((n / t) * 100)}`.padStart(4);
    console.log(
      `${b.padEnd(14)}${pay(grup.length, adresler.length)} (${String(grup.length).padStart(4)})` +
      `${pay(indeksli, ornek.length)}      ${pay(gos.get(b) ?? 0, gosToplam)}`,
    );
  }
  console.log("\nKural: uc sayi birlikte okunur. Dusuk indeks TEK BASINA sayfayi");
  console.log("elemek icin sebep degil -- bkz. src/lib/talep.ts.");
}
main().catch((e) => console.error("HATA:", (e as Error).message));
