/**
 * Arac sayfasinin sosyal paylasim gorseli.
 *
 * Site kurulalı beri hiç og:image yoktu: Slack/X/LinkedIn'de paylasilan her
 * link ciplak bir satir olarak goruluyordu. Gorsel calisma aninda uretiliyor
 * (statik dosya tutmuyoruz, 512 arac icin 512 PNG demek olurdu).
 */
import { ImageResponse } from "next/og";
import toolsData from "@/data/tools.json";
import type { Arac } from "@/lib/arac";
import { fiyatDurumu } from "@/lib/fiyat";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ToolCompare review";

export function generateStaticParams() {
  return (toolsData as Arac[]).map((t) => ({ slug: t.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tool = (toolsData as Arac[]).find((t) => t.slug === slug);
  const ad = tool?.name ?? "ToolCompare";
  const kategori = tool?.category ?? "Software";
  const fiyat = tool ? fiyatDurumu(tool).kisa : null;
  // Dogrulanmamis fiyati gorsele basmak, sayfada yazmadigimiz bir iddiayi
  // paylasim onizlemesinde yazmak olurdu.
  const fiyatGoster = fiyat && !/not verified|tbc/i.test(fiyat) ? fiyat : null;
  const incelendi = Boolean(tool?.incelendi ?? tool?.verdict);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#ffffff",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          borderTop: "16px solid #0A63E6",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 28, color: "#71717a", letterSpacing: 2, textTransform: "uppercase" }}>
            {kategori}
          </div>
          <div style={{ fontSize: 96, color: "#09090b", fontWeight: 700, marginTop: 16, lineHeight: 1.05 }}>
            {ad}
          </div>
          <div style={{ fontSize: 40, color: "#3f3f46", marginTop: 20 }}>
            {incelendi ? "Review 2026 — features, pricing & verdict" : "Pricing and alternatives, 2026"}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontSize: 34, color: "#09090b", fontWeight: 700 }}>ToolCompare</div>
          {fiyatGoster ? (
            <div
              style={{
                display: "flex",
                fontSize: 34,
                color: "#0A63E6",
                background: "#eff5ff",
                padding: "14px 28px",
                borderRadius: 999,
              }}
            >
              {fiyatGoster}
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
        </div>
      </div>
    ),
    size,
  );
}
