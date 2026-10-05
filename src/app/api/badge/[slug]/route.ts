import { getTools } from "@/lib/tools";
import { rozetSvg } from "@/lib/rozet";

/**
 * Saticinin sitesine gomdugu rozet gorseli (SVG). Bkz. src/lib/rozet.ts.
 *
 * Bilinmeyen slug 404. Bilinen ama artik dogrulanmamis arac 404 DEGIL:
 * notr "Listed" rozetine duser -- saticinin sayfasinda kirik gorsel kalmasin.
 */

export const revalidate = 86400;

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const arac = (await getTools()).find((t) => t.slug === slug);
  if (!arac) return new Response("Not found", { status: 404 });

  return new Response(rozetSvg(arac), {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
