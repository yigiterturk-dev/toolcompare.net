/**
 * Dis link yonlendirmesi + tik olcumu.
 *
 * Tasarim kararlari:
 *  - Tik kaydi ASLA yonlendirmeyi geciktirmez veya engellemez. DB yoksa,
 *    yavassa veya patlarsa kullanici yine de hedefe gider. Para kazandiran
 *    sey tiklamanin kendisi; olcum ikincil.
 *  - Kisisel veri saklanmaz: IP ve tam user-agent yazilmaz. Amac "hangi
 *    arac ilgi cekiyor" sorusunu cevaplamak, ziyaretciyi takip etmek degil.
 *  - 302 (kalici degil): affiliate anlasmasi yapildiginda hedef degisecek,
 *    tarayicilarin eski adresi onbellege almasini istemiyoruz.
 */

import { NextRequest, NextResponse } from "next/server";
import { araciBul, hedefUrl } from "@/lib/outbound";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

async function tikiKaydet(slug: string, referer: string | null) {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS outbound_clicks (
         id INT AUTO_INCREMENT PRIMARY KEY,
         slug VARCHAR(255) NOT NULL,
         referer VARCHAR(500),
         clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         INDEX idx_slug (slug),
         INDEX idx_clicked_at (clicked_at)
       )`
    );
    await query(
      `INSERT INTO outbound_clicks (slug, referer) VALUES (?, ?)`,
      [slug, referer ? referer.slice(0, 500) : null]
    );
  } catch {
    // Sessizce gec: olcum kaybi kabul edilebilir, yonlendirme kaybi degil.
  }
}

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
