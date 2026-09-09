import { NextResponse } from "next/server";
import { getTools } from "@/lib/tools";

/**
 * Acik veri endpoint'i (bkz. /data sayfasi, CC BY 4.0).
 *
 * Yukleme mantigi src/lib/tools.ts'e tasindi; sunucu bileseni de ayni
 * kaynagi kullaniyor, iki yerde kopya mantik kalmasin diye.
 *
 * NEDEN SUZGEC VAR (2026-09-10): tum kayit ~1,8 MB. Veri kumesini
 * alintilanabilir bir varlik olarak yayimliyoruz; sayfalamasiz ve alan
 * secimsiz 1,8 MB'lik tek yanit, veriyi kullanmak isteyen gelistiricinin
 * ilk sikayeti olur. Uc kapi eklendi:
 *   ?fields=slug,name,basePrice   -> yalnizca istenen ust duzey alanlar
 *   ?format=compact               -> fiyat karsilastirmasi icin yeterli cekirdek
 *   ?limit=50&offset=100          -> sayfalama
 * Hicbiri verilmezse davranis ESKISIYLE AYNI (tam dizi) -- mevcut
 * kullanicilari kirmamak icin.
 *
 * Cache: veri gunde en fazla bir kez degisiyor, her istekte yeniden
 * serialize etmenin anlami yok.
 */

const COMPACT_ALANLAR = [
  "slug",
  "name",
  "category",
  "websiteUrl",
  "basePrice",
  "fiyatModeli",
  "isFlat",
  "fiyatKontrolTarihi",
] as const;

type Kayit = Record<string, unknown>;

function suz(kayit: Kayit, alanlar: string[]): Kayit {
  const cikti: Kayit = {};
  for (const alan of alanlar) {
    if (alan in kayit) cikti[alan] = kayit[alan];
  }
  return cikti;
}

/** `compact` ayrica evidence'i ozetliyor: durum + tarih, tum kaynaklar degil. */
function compact(kayit: Kayit): Kayit {
  const cikti = suz(kayit, [...COMPACT_ALANLAR]);
  const kanit = kayit.evidence as { status?: string; reviewedAt?: string } | undefined;
  if (kanit) {
    cikti.evidence = { status: kanit.status, reviewedAt: kanit.reviewedAt };
  }
  return cikti;
}

function sayi(deger: string | null, varsayilan: number, enCok: number): number {
  const n = Number.parseInt(deger ?? "", 10);
  if (!Number.isFinite(n) || n < 0) return varsayilan;
  return Math.min(n, enCok);
}

export async function GET(request: Request) {
  const tools = await getTools();
  if (tools.length === 0) {
    return NextResponse.json({ error: "Failed to read tools data" }, { status: 500 });
  }

  const p = new URL(request.url).searchParams;
  const alanlar = (p.get("fields") || "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  const kompaktMi = p.get("format") === "compact";

  const offset = sayi(p.get("offset"), 0, tools.length);
  const limit = p.has("limit") ? sayi(p.get("limit"), tools.length, tools.length) : tools.length;

  let cikti = (tools as unknown as Kayit[]).slice(offset, offset + limit);
  if (alanlar.length > 0) {
    cikti = cikti.map((k) => suz(k, alanlar));
  } else if (kompaktMi) {
    cikti = cikti.map(compact);
  }

  return NextResponse.json(cikti, {
    headers: {
      // Veri gunde bir degisiyor; CDN bir gun tutsun, arkadan tazelesin.
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      // Acik veri kumesi: tarayiciden de cagirilabilsin (public-apis CORS alani).
      "Access-Control-Allow-Origin": "*",
      "X-Total-Count": String(tools.length),
      "X-License": "CC-BY-4.0 https://toolcompare.net/data",
    },
  });
}
