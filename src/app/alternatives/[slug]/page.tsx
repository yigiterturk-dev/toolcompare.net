/**
 * "Best <Arac> Alternatives in 2026" sayfasi.
 *
 * Karsilastirma ve kategoriden sonraki ucuncu buyuk arama kalibi:
 * insan bir araci kullaniyor, memnun degil, "X alternatives" ariyor.
 * Bu niyetle gelen ziyaretci zaten ayrilmaya karar vermis -- yani
 * donusum orani en yuksek trafik turlerinden biri.
 *
 * INCE SAYFA URETMEMEK ICIN:
 *  - en az 3 alternatifi olmayan arac icin sayfa hic uretilmez
 *  - her alternatifin asil araca gore farki ELDEKI VERIDEN yaziliyor
 *  - aracin bilinen eksileri (cons) "neden alternatif ariyorsun"
 *    bolumunde gosteriliyor; uydurma gerekce yazilmiyor
 */

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import toolsData from "@/data/tools.json";
import { akranlar, alternatifSayfasiOlanlar, farkCumlesi, kanonikSlug, EN_AZ_ALTERNATIF } from "@/lib/compare";
import { gitLinki } from "@/lib/outbound";

function aracBul(slug: string): any {
  return (toolsData as any[]).find((t) => t.slug === slug);
}

export function generateStaticParams() {
  return alternatifSayfasiOlanlar().map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { slug } = await params;
  const tool = aracBul(slug);
  if (!tool) return { title: "Not Found" };

  const alts = akranlar(slug);
  // Baslik 65 karakteri asarsa arama sonucunda kesilir.
  const cekirdek = `${alts.length} Best ${tool.name} Alternatives in 2026`;
  const title = cekirdek.length <= 51 ? `${cekirdek} | ToolCompare` : cekirdek;
  const description = `Looking for a ${tool.name} alternative? We compared ${alts.length} tools in the same category on starting price, ease of use and feature depth — and what each one does differently.`;
  const url = `/alternatives/${tool.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "ToolCompare", type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AlternativesPage({ params }: any) {
  const { slug } = await params;
  const tool = aracBul(slug);
  if (!tool) notFound();

  const alts = akranlar(slug);
  // Sayfa yalnizca yeterli alternatif varsa anlamli.
  if (alts.length < EN_AZ_ALTERNATIF) notFound();

  const enUcuz = [...alts].sort((a, b) => (a.basePrice ?? 0) - (b.basePrice ?? 0))[0];

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: 'white' }}>
      <Header />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <Link href={`/tools/${tool.slug}`} style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← Back to the {tool.name} review
        </Link>

        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: '1.5rem 0' }}>
          Best {tool.name} Alternatives in 2026
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: 1.7, maxWidth: '70ch' }}>
          These are the {alts.length} closest tools to {tool.name} that we track, ordered by our combined
          score. Each entry says what it does differently — cheaper, easier, or deeper on features — based
          on the numbers we hold, not on who pays us.
          {enUcuz && enUcuz.basePrice !== undefined && (
            <> The cheapest way out is <strong style={{ color: 'white' }}>{enUcuz.name}</strong> at ${enUcuz.basePrice}/mo.</>
          )}
        </p>

        {Array.isArray(tool.cons) && tool.cons.length > 0 && (
          <div style={{ marginTop: '3rem', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '28px', padding: '2.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1.2rem' }}>Why people leave {tool.name}</h2>
            <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '1.2rem', margin: 0 }}>
              {tool.cons.map((c: string, i: number) => <li key={i}>{c}</li>)}
            </ul>
            <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '1.2rem', marginBottom: 0 }}>
              These are the drawbacks listed in our own {tool.name} review — not complaints we invented for this page.
            </p>
          </div>
        )}

        <ol style={{ listStyle: 'none', padding: 0, margin: '3rem 0 0' }}>
          {alts.map((alt: any, i: number) => (
            <li key={alt.slug} style={{ display: 'flex', gap: '1.5rem', padding: '2rem 0', borderTop: '1px solid #1a1a1a', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--brand-primary)', fontWeight: 900, fontSize: '1.4rem', minWidth: '2.5rem' }}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <Link href={`/tools/${alt.slug}`} style={{ color: 'white', textDecoration: 'none', fontWeight: 800, fontSize: '1.2rem' }}>
                  {alt.name}
                </Link>
                {alt.shortDescription && (
                  <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0', lineHeight: 1.6 }}>{alt.shortDescription}</p>
                )}
                <p style={{ color: '#888', margin: '0.8rem 0 0', fontSize: '0.95rem' }}>
                  <strong style={{ color: 'white' }}>vs {tool.name}:</strong> {farkCumlesi(tool, alt)}.
                </p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <Link href={`/compare/${kanonikSlug(tool.slug, alt.slug)}`} style={{ color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                    {tool.name} vs {alt.name} →
                  </Link>
                  <a href={gitLinki(alt.slug)} target="_blank" rel="noopener noreferrer nofollow sponsored" style={{ color: '#666', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                    Visit {alt.name} →
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </main>
      <Footer />
    </div>
  );
}
