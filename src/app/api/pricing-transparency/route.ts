import { getTools } from "@/lib/tools";
import { seffaflikOzeti, seffaflikCsv } from "@/lib/seffaflik";

/**
 * Pricing Transparency Index'in ham verisi (CSV, CC BY 4.0).
 *
 * NEDEN CSV: bu dosyayi indirecek kisi gelistirici degil -- gazeteci,
 * analist, blog yazari. JSON'u acamayan ama tabloyu acabilen biri.
 * /api/tools zaten JSON veriyor; burada isteneni bir kez daha JSON
 * yapmak, veriyi kullanacak kitleyi disarida birakirdi.
 *
 * NEDEN ATIF ONEMLI: sayfanin varlik sebebi atif toplamak (bkz.
 * src/app/research/pricing-transparency/page.tsx). Lisans ve kaynak
 * satiri bu yuzden yanit basliklarina da yaziliyor: dosya sitedan
 * koptugunda bile nereden geldigi uzerinde kaliyor.
 */

const KAYNAK = "https://toolcompare.net/research/pricing-transparency";
const LISANS = "https://creativecommons.org/licenses/by/4.0/";

export const revalidate = 86400;

export async function GET() {
  const araclar = await getTools();
  const csv = seffaflikCsv(seffaflikOzeti(araclar));

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'inline; filename="toolcompare-pricing-transparency.csv"',
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*",
      /* Dosya siteden koptugunda bile kaynagini tasisin. */
      "X-Source": KAYNAK,
      "X-License": LISANS,
      Link: `<${KAYNAK}>; rel="canonical", <${LISANS}>; rel="license"`,
    },
  });
}
