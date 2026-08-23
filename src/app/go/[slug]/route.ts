/**
 * Dis link yonlendirmesi + tik olcumu.
 *
 * Tasarim kararlari:
 *  - Tik kaydi ASLA yonlendirmeyi geciktirmez veya engellemez. Depo yoksa,
 *    yavassa veya patlarsa kullanici yine de hedefe gider. Para kazandiran
 *    sey tiklamanin kendisi; olcum ikincil.
 *  - Kisisel veri saklanmaz: IP ve tam user-agent yazilmaz.
 *  - 302 (kalici degil): affiliate anlasmasi yapildiginda hedef degisecek,
 *    tarayicilarin eski adresi onbellege almasini istemiyoruz.
 */

import { NextRequest, NextResponse } from "next/server";
import { araciBul, hedefUrl } from "@/lib/outbound";
import { tikiKaydet } from "@/lib/clicks";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tool = araciBul(slug);

  // Bilinmeyen slug: sessiz 302 yerine 404. Bozuk link fark edilsin.
  if (!tool) {
    return new NextResponse("Not found", { status: 404 });
  }

  await tikiKaydet(slug, request.headers.get("referer"));

  return NextResponse.redirect(hedefUrl(tool), {
    status: 302,
    // Yonlendirme sayfasi arama sonuclarinda yer almamali.
    headers: { "X-Robots-Tag": "noindex, nofollow" },
  });
}
