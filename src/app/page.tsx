import Link from "next/link";
import ToolGridClient from "@/components/ToolGridClient";
import { getTools } from "@/lib/tools";

// Sunucu bileseni: veriyi burada yukluyoruz ki urun linkleri HTML'e girsin.
// Onceden sayfanin tamami "use client" idi ve useSearchParams() yuzunden
// statik uretimde bailout ediyordu; Google yalnizca "Loading..." goruyordu.
export const revalidate = 3600;

export default async function Home() {
  const tools = await getTools();

  // Izgara sayfalama yaptigi icin HTML'e yalnizca ilk sayfanin linkleri
  // giriyordu; kalan urun sayfalari hicbir yerden linklenmiyordu (orphan).
  // Kategoriye gore gruplanmis tam dizin hem taranabilirligi hem de
  // gezinmeyi cozer.
  const kategoriler = new Map<string, { slug: string; name: string }[]>();
  for (const t of tools) {
    if (!t?.slug || !t?.name) continue;
    const k = t.category || "Other";
    if (!kategoriler.has(k)) kategoriler.set(k, []);
    kategoriler.get(k)!.push({ slug: t.slug, name: t.name });
  }
  const sirali = [...kategoriler.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  for (const [, liste] of sirali) liste.sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <ToolGridClient initialTools={tools} />

      <nav
        aria-label="All tools by category"
        style={{
          borderTop: "1px solid #e5e7eb",
          padding: "3rem 1.5rem 4rem",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <h2 style={{ fontSize: "1.5rem", fontWeight: 800, marginBottom: "0.5rem" }}>
          Browse all {tools.length} tools
        </h2>
        <p style={{ color: "#6b7280", marginBottom: "2rem", fontSize: "0.95rem" }}>
          Every tool we have reviewed, grouped by category.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
            gap: "2rem",
          }}
        >
          {sirali.map(([kategori, liste]) => (
            <div key={kategori}>
              <h3
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  color: "#9ca3af",
                  marginBottom: "0.75rem",
                }}
              >
                {kategori}
              </h3>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {liste.map((t) => (
                  <li key={t.slug} style={{ marginBottom: "0.4rem" }}>
                    <Link
                      href={`/tools/${t.slug}`}
                      style={{ color: "#374151", textDecoration: "none", fontSize: "0.9rem" }}
                    >
                      {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
