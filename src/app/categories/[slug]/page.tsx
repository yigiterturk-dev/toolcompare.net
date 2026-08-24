/**
 * Kategori sayfasi: "Best <kategori> Tools in 2026".
 *
 * Bu sayfa turu daha once hic yoktu. /categories, /?category=X sorgu
 * adresine link veriyordu ve arama motoru sorgu parametresini ayri bir
 * sayfa saymaz -- yani kategori aramalarinin inecegi bir adres yoktu.
 *
 * Sayfayi INCE birakmamak icin: siralama olcutu acikca yaziliyor,
 * her aracin kisa tanimi ve fiyati listeleniyor, ve kategori icindeki
 * karsilastirma sayfalarina link veriliyor.
 */

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { kategoriBul, kategoriler, EN_AZ_ARAC } from "@/lib/categories";
import { kanonikSlug } from "@/lib/compare";
import { listeSemasi, kirintiSemasi } from "@/lib/yapilandirilmis";
import { fiyatDurumu, enUcuz as enUcuzArac } from "@/lib/fiyat";

export function generateStaticParams() {
  return kategoriler().map((k) => ({ slug: k.slug }));
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { slug } = await params;
  const kategori = kategoriBul(slug);
  if (!kategori) return { title: "Category Not Found" };

  // "Best" DEMIYORUZ: sayfa fiyata gore siraliyor, kalite puanina gore
  // degil. Uydurma puan kaldirildi; basligin da onu yansitmasi gerekiyor.
  const cekirdek = `${kategori.ad} Tools in 2026: ${kategori.araclar.length} Compared by Price`;
  const title = cekirdek.length <= 51 ? `${cekirdek} | ToolCompare` : cekirdek;
  const description = `${kategori.araclar.length} ${kategori.ad.toLowerCase()} tools compared on what they cost to start: monthly price, free tiers and usage-based plans. See the full list and who each one is for.`;
  const url = `/categories/${kategori.slug}`;

  // Uc aractan azi olan kategori sayfasi sitemap'e girmiyor (ince).
  // Ama /categories'ten link almaya devam ediyor -- yani ziyaretci
  // erisebiliyor. Bu ikisi celismesin diye ACIKCA noindex: "ulasilabilir
  // ama indeksleme" demek, sessizce sitemap disinda birakmaktan durust.
  const indekslensin = kategori.araclar.length >= EN_AZ_ARAC;

  return {
    title,
    description,
    robots: indekslensin ? undefined : { index: false, follow: true },
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "ToolCompare", type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function CategoryPage({ params }: any) {
  const { slug } = await params;
  const kategori = kategoriBul(slug);
  if (!kategori) notFound();

  // "En ucuz" iddiasina yalnizca DOGRULANMIS fiyatlar girer; onceden
  // dogrulanmamis 0'lar en basa gecip "cheapest is AWS at $0/mo" gibi
  // yanlis cumleler uretiyordu.
  const enUcuz = enUcuzArac(kategori.araclar as any);

  // Kategori icindeki en guclu iki arac: dogal "X vs Y" merakini karsilar.
  const [birinci, ikinci] = kategori.araclar;

  const semalar = [
    listeSemasi(`${kategori.ad} Tools in 2026, Compared by Price`, `/categories/${kategori.slug}`, kategori.araclar),
    kirintiSemasi([
      { ad: "Categories", yol: "/categories" },
      { ad: kategori.ad, yol: `/categories/${kategori.slug}` },
    ]),
  ];

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: 'white' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(semalar) }} />
      <Header />
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <Link href="/categories" style={{ color: '#666', textDecoration: 'none', fontSize: '0.9rem' }}>
          ← All categories
        </Link>

        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.03em', margin: '1.5rem 0 1.5rem' }}>
          {kategori.ad} Tools in 2026, Compared by Price
        </h1>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: 1.7, maxWidth: '70ch' }}>
          We track {kategori.araclar.length} {kategori.ad.toLowerCase()} {kategori.araclar.length === 1 ? 'tool' : 'tools'}.
          The list below is ordered by <strong style={{ color: 'white' }}>what it costs to start</strong>, cheapest first.
          Tools that cannot be put on that scale — usage-based pricing, a free tier, or a price we could not
          verify — come last, and each one says which case it is.{' '}
          {enUcuz ? <>The cheapest verified entry point is <strong style={{ color: 'white' }}>{enUcuz.name}</strong> at {fiyatDurumu(enUcuz as any).kisa}.</> : null}
        </p>

        <p style={{ color: '#666', fontSize: '0.9rem', maxWidth: '70ch', marginTop: '1rem' }}>
          No vendor has paid for a position on this page. Price is not quality: the cheapest tool here is
          not the best one for your team, it is only the cheapest. We do not publish a quality score
          because we do not have one we can stand behind.{' '}
          <Link href="/methodology" style={{ color: 'var(--brand-primary)' }}>How we score tools</Link>.
        </p>

        <ol style={{ listStyle: 'none', padding: 0, margin: '3rem 0 0' }}>
          {kategori.araclar.map((t, i) => (
            <li
              key={t.slug}
              style={{ display: 'flex', gap: '1.5rem', padding: '1.8rem 0', borderTop: '1px solid #1a1a1a', alignItems: 'flex-start' }}
            >
              <span style={{ color: 'var(--brand-primary)', fontWeight: 900, fontSize: '1.4rem', minWidth: '2.5rem' }}>
                {i + 1}
              </span>
              <div style={{ flex: 1 }}>
                <Link href={`/tools/${t.slug}`} style={{ color: 'white', textDecoration: 'none', fontWeight: 800, fontSize: '1.2rem' }}>
                  {t.name}
                </Link>
                {t.shortDescription && (
                  <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 0', lineHeight: 1.6 }}>
                    {t.shortDescription}
                  </p>
                )}
                <p style={{ color: '#666', fontSize: '0.85rem', margin: '0.7rem 0 0' }}>
                  {fiyatDurumu(t as any).metin}
                </p>
              </div>
            </li>
          ))}
        </ol>

        {birinci && ikinci && (
          <div style={{ marginTop: '4rem', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '28px', padding: '2.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Still deciding?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              The two cheapest tools in this category are {birinci.name} and {ikinci.name}. Put them side by side:
            </p>
            <Link
              href={`/compare/${kanonikSlug(birinci.slug, ikinci.slug)}`}
              style={{ display: 'inline-block', padding: '0.9rem 1.6rem', borderRadius: '14px', background: 'var(--brand-primary)', color: 'white', textDecoration: 'none', fontWeight: 700 }}
            >
              {birinci.name} vs {ikinci.name} →
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
