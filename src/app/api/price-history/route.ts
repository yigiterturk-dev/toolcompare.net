import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import repoHistory from "@/data/fiyat-gecmisi.json";
import type { FiyatGecmisi, FiyatDegisimi, PlanPoint } from "@/lib/fiyat-gecmisi";

export const dynamic = "force-dynamic";

const LICENSE = "CC BY 4.0";
const ATTRIBUTION =
  "ToolCompare, Verified SaaS Pricing History. https://toolcompare.net/price-changes — CC BY 4.0.";

/*
  Canli gecmis sunucuda (/opt/toolcompare-data) birikir; repo'daki dosya
  yalnizca baseline'dir. Endpoint once sunucu kopyasini okur, yoksa repo
  baseline'ina duser. Boylece Vercel/local build'de de calisir.
*/
async function gecmisiOku(): Promise<FiyatGecmisi> {
  const dir = process.env.TOOLCOMPARE_DATA_DIR || "/opt/toolcompare-data";
  try {
    const raw = await readFile(path.join(dir, "fiyat-gecmisi.json"), "utf8");
    const parsed = JSON.parse(raw) as FiyatGecmisi;
    if (Array.isArray(parsed.baseline)) return parsed;
  } catch {
    return repoHistory as FiyatGecmisi;
  }
  return repoHistory as FiyatGecmisi;
}

function csvHucre(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function csvUret(gecmis: FiyatGecmisi): string {
  const rows: (string | number | null | undefined)[][] = [
    [
      "record_type",
      "slug",
      "name",
      "plan",
      "monthly_usd",
      "billing_unit",
      "billing",
      "checked_at",
      "source_url",
      "from_usd",
      "to_usd",
      "delta_pct",
      "changed_at",
    ],
  ];
  for (const point of gecmis.baseline as PlanPoint[]) {
    rows.push([
      "snapshot",
      point.slug,
      point.name,
      point.plan,
      point.aylik,
      point.birim,
      point.faturalama ?? "",
      point.checkedAt ?? "",
      point.sourceUrl ?? "",
      "",
      "",
      "",
      "",
    ]);
  }
  for (const change of gecmis.changes as FiyatDegisimi[]) {
    rows.push([
      "change",
      change.slug,
      change.name,
      change.plan,
      "",
      change.toBirim ?? change.fromBirim ?? "",
      change.toFaturalama ?? change.fromFaturalama ?? "",
      change.checkedAt ?? "",
      change.sourceUrl ?? "",
      change.from ?? "",
      change.to ?? "",
      change.deltaPct ?? "",
      change.at,
    ]);
  }
  return `${rows.map((row) => row.map(csvHucre).join(",")).join("\n")}\n`;
}

export async function GET(request: Request) {
  const gecmis = await gecmisiOku();
  const format = new URL(request.url).searchParams.get("format");

  if (format === "csv") {
    return new NextResponse(csvUret(gecmis), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="toolcompare-price-history.csv"',
        "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  }

  return NextResponse.json(
    {
      license: LICENSE,
      attribution: ATTRIBUTION,
      version: gecmis.version,
      updatedAt: gecmis.updatedAt,
      lastSnapshot: gecmis.sonKontrol,
      baseline: gecmis.baseline,
      changes: gecmis.changes,
    },
    {
      headers: {
        "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "access-control-allow-origin": "*",
      },
    },
  );
}
