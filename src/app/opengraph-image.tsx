/**
 * Sitenin varsayilan paylasim gorseli: anasayfa ve kendi gorseli olmayan
 * her sayfa (compare, categories, blog, alternatives) bunu kullanir.
 */
import { ImageResponse } from "next/og";
import toolsData from "@/data/tools.json";

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
          borderTop: "16px solid #be185d",
        }}
      >
        <div style={{ fontSize: 92, color: "#09090b", fontWeight: 700, lineHeight: 1.05 }}>
          ToolCompare
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
