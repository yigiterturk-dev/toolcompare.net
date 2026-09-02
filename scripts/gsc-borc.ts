/**
 * ICERIK BORCU: Google'in gosterdigi ama icerigi zayif olan arac sayfalari.
 *
 * Bu sayfalar `talepGormus` muafiyetiyle sitemap'te tutuluyor (bkz. talep.ts).
 * Muafiyet bir odul degil bir borc: sayfa siralamada ama soyleyecek sozu yok.
 * Liste, en cok gosterim alandan basalayarak zenginlestirme sirasini verir.
 */
import "./env.ts";
import { icerikDerin, incelenmis, EN_AZ_ANLATIM, EN_AZ_OZELLIK } from "../src/lib/indeks.ts";
import { gosterimSayisi, TALEP_VERISI_VAR } from "../src/lib/talep.ts";
import araclar from "../src/data/tools.json" with { type: "json" };

type Arac = {
  slug: string;
  name?: string;
  longDescription?: string;
  keyFeatures?: unknown[];
};

function main() {
  if (!TALEP_VERISI_VAR) {
    console.log("⛔ Talep verisi yok. Once: npm run gsc:senkron");
    process.exit(1);
  }
  const liste = (araclar as Arac[])
    .filter((t) => incelenmis(t as never) && !icerikDerin(t as never))
    .map((t) => ({
      slug: t.slug,
      gosterim: gosterimSayisi(t.slug),
      anlatim: (t.longDescription || "").trim().length,
      ozellik: Array.isArray(t.keyFeatures) ? t.keyFeatures.length : 0,
    }))
    .filter((t) => t.gosterim > 0)
    .sort((a, b) => b.gosterim - a.gosterim);

  const toplam = liste.reduce((t, x) => t + x.gosterim, 0);
  console.log(`${liste.length} sayfa muafiyetle sitemap'te · ${toplam} gosterim`);
  console.log(`hedef: ${EN_AZ_ANLATIM} karakter anlatim + ${EN_AZ_OZELLIK} ozellik\n`);
  console.log("gosterim  eksik                       arac");
  for (const t of liste) {
    const eksikAnlatim = Math.max(0, EN_AZ_ANLATIM - t.anlatim);
    const eksikOzellik = Math.max(0, EN_AZ_OZELLIK - t.ozellik);
    const eksik = [
      eksikAnlatim ? `${eksikAnlatim} karakter` : "",
      eksikOzellik ? `${eksikOzellik} ozellik` : "",
    ].filter(Boolean).join(" + ");
    console.log(`${String(t.gosterim).padStart(8)}  ${eksik.padEnd(26)} ${t.slug}`);
  }
}

main();
