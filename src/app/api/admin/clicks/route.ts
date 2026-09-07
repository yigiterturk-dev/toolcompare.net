/**
 * Tik raporu. Yalnizca yonetici.
 *
 * Arac adi ve dis linkin o an cozulen hedefi de dondurulur; panelde
 * "hangi araca kac kere tiklandi ve nereye gidiyor" tek bakista gorulsun.
 */

import { NextResponse } from "next/server";
import { paraliMi } from "@/lib/affiliate";
import { yoneticiMi, hizFreni, istekKaynagi } from "@/lib/adminAuth";
import { tikOzeti } from "@/lib/clicks";
import { araciBul, hedefUrl } from "@/lib/outbound";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!hizFreni(`tik:${istekKaynagi(request)}`, 30)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  if (!yoneticiMi(body?.password)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { satirlar, kaynak } = await tikOzeti();

  const zenginlestirilmis = satirlar.map((s) => {
    const tool = araciBul(s.slug);
    return {
      slug: s.slug,
      name: tool?.name || s.slug,
      adet: s.adet,
      son: s.son,
      hedef: tool ? hedefUrl(tool) : null,
      /*
        DENETIMDE BULUNAN (2026-09-07): burasi `tool?.affiliateUrl`
        okuyordu -- tools.json'da boyle bir alan YOK (512 kayit tarandi,
        sifir). Yani panel, anlasma yapilsa bile her satiri "free"
        gosterirdi. Parali link tek kaynaktan gelir: affiliate.json
        (bkz. src/lib/affiliate.ts bastaki not).
      */
      affiliate: paraliMi(s.slug),
    };
  });

  return NextResponse.json({
    kaynak,
    toplam: zenginlestirilmis.reduce((t, s) => t + s.adet, 0),
    satirlar: zenginlestirilmis,
  });
}
