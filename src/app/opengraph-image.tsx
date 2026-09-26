/**
 * Sitenin varsayilan paylasim gorseli: anasayfa ve kendi gorseli olmayan
 * her sayfa (compare, categories, blog, alternatives) bunu kullanir.
 */
import { ImageResponse } from "next/og";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import toolsData from "@/data/tools.json";

// Header'daki ayni marka: public/brand/mark.svg (1704x1088).
const mark = `data:image/svg+xml;base64,${readFileSync(join(process.cwd(), "public/brand/mark.svg")).toString("base64")}`;

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ToolCompare — software tools compared on price";

export default function Image() {
  const adet = (toolsData as unknown[]).length;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#ffffff",
          padding: "80px",
          fontFamily: "sans-serif",
          borderTop: "16px solid #0A6CFA",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} width={144} height={92} alt="" />
          <div style={{ display: "flex", fontSize: 92, color: "#1B2633", fontWeight: 700, lineHeight: 1.05 }}>
            Tool<span style={{ color: "#0A6CFA" }}>Compare</span>
          </div>
        </div>
        <div style={{ fontSize: 46, color: "#3f3f46", marginTop: 24 }}>
          {`${adet} software tools, compared on what they actually cost.`}
        </div>
        <div style={{ fontSize: 32, color: "#71717a", marginTop: 40 }}>
          Verified pricing · no invented scores
        </div>
      </div>
    ),
    size,
  );
}
