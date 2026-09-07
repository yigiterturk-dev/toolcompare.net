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
import { kumeIcindekiCiftler, alternatifSayfasiOlan } from "@/lib/compare";
import { listeSemasi, kirintiSemasi } from "@/lib/yapilandirilmis";
import { fiyatDurumu, enUcuz as enUcuzArac } from "@/lib/fiyat";

export function generateStaticParams() {
  return kategoriler().map((k) => ({ slug: k.slug }));
}

type SayfaParametresi = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: SayfaParametresi): Promise<Metadata> {
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

export default async function CategoryPage({ params }: SayfaParametresi) {
  const { slug } = await params;
  const kategori = kategoriBul(slug);
  if (!kategori) notFound();

  // "En ucuz" iddiasina yalnizca DOGRULANMIS fiyatlar girer; onceden
  // dogrulanmamis 0'lar en basa gecip "cheapest is AWS at $0/mo" gibi
  // yanlis cumleler uretiyordu.
  const enUcuz = enUcuzArac(kategori.araclar);

  // Kategori icindeki en guclu iki arac: dogal "X vs Y" merakini karsilar.
  // Bu kategorideki araclar arasindaki GERCEKTEN VAR OLAN karsilastirma
  // ve alternatif sayfalari. Onceden burada elle hesaplanmis tek bir cift
  // vardi ("en ucuz iki arac") -- o cift kanit kapisindan gecmiyorsa
  // sayfa yoktu ve link bosa dusuyordu.
  const kategoriSluglari = kategori.araclar.map((t: { slug: string }) => t.slug);
  const ciftler = kumeIcindekiCiftler(kategoriSluglari, 8);
  const alternatifliler = alternatifSayfasiOlan(kategoriSluglari).slice(0, 8);

  const semalar = [
    listeSemasi(`${kategori.ad} Tools in 2026, Compared by Price`, `/categories/${kategori.slug}`, kategori.araclar),
    kirintiSemasi([
      { ad: "Categories", yol: "/categories" },
      { ad: kategori.ad, yol: `/categories/${kategori.slug}` },
    ]),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(semalar) }} />
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Link
          href="/categories"
          className="inline-flex items-center gap-1.5 text-sm text-ink-soft no-underline transition-colors duration-150 hover:text-accent"
        >
          ← All categories
        </Link>

        <h1 className="mt-8 text-3xl font-semibold sm:text-4xl">
          {kategori.ad} tools in 2026, compared by price
        </h1>

        <p className="mt-4 text-ink-soft">
          We track {kategori.araclar.length} {kategori.ad.toLowerCase()}{" "}
          {kategori.araclar.length === 1 ? "tool" : "tools"}. The list below is ordered by{" "}
          <strong className="font-medium text-ink">what it costs to start</strong>, cheapest first.
          Tools that cannot be put on that scale — usage-based pricing, a free tier, or a price we
          could not verify — come last, and each one says which case it is.{" "}
          {enUcuz ? (
            <>
              The cheapest verified entry point is{" "}
              <strong className="font-medium text-ink">{enUcuz.name}</strong> at{" "}
              {fiyatDurumu(enUcuz).kisa}.
            </>
          ) : null}
        </p>

        <p className="mt-4 rounded-[--radius-card] border border-line bg-surface p-4 text-sm text-ink-soft">
          No vendor has paid for a position on this page. Price is not quality: the cheapest tool
          here is not the best one for your team, it is only the cheapest. We do not publish a
          quality score because we do not have one we can stand behind.{" "}
          <Link href="/methodology" className="text-accent underline underline-offset-4">
            How we score tools
          </Link>
          .
        </p>

        <ol className="mt-8 max-w-4xl list-none space-y-3 p-0">
          {kategori.araclar.map((t, i) => {
            const d = fiyatDurumu(t);
            return (
              <li
                key={t.slug}
                className="flex gap-4 rounded-[--radius-card] border border-line bg-surface p-4 transition-colors duration-150 hover:border-line-strong"
              >
                <span
                  aria-hidden="true"
                  className="grid size-8 shrink-0 place-items-center rounded-[--radius-control] bg-surface-sunken font-serif text-sm font-semibold text-ink-soft"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/tools/${t.slug}`}
                    className="font-serif text-base font-semibold no-underline transition-colors duration-150 hover:text-accent"
                  >
                    {t.name}
                  </Link>
                  {t.shortDescription && (
                    <p className="mt-1 text-sm text-ink-soft">{t.shortDescription}</p>
                  )}
                  {/*
                    OLCUMDE BULUNAN (2026-08-31): bu sayfa arac verisinden yalnizca
                    adi, 3-5 kelimelik aciklamayi ve fiyati gosteriyordu ("Secure
                    password manager." gibi) -- ve URL Inspection ornekleminde
                    kategori sayfalarinin indekslenme orani 0/1 idi. Her aracin
                    incelemesinde 4 elle yazilmis arti duruyor; listede en guclu
                    olani gostermek, uydurma tek kelime eklemeden kategori
                    sayfasini gercek bir secim listesine cevirir.
                  */}
                  {Array.isArray(t.pros) && t.pros.length > 0 && (
                    <p className="mt-1 text-sm text-ink-muted">{t.pros[0]}</p>
                  )}
                  <p className="mt-2 flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-medium">{d.metin}</span>
                    <span
                      className={`rounded-[--radius-pill] px-2 py-0.5 text-[11px] ${
                        d.karsilastirilabilir
                          ? "bg-verified-soft text-verified"
                          : "bg-unverified-soft text-unverified"
                      }`}
                    >
                      {d.karsilastirilabilir ? "verified" : "not a monthly price"}
                    </span>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {ciftler.length > 0 && (
          <section className="mt-12 max-w-4xl rounded-[--radius-card] border border-line bg-surface p-5">
            <h2 className="text-lg font-semibold">Head-to-head comparisons</h2>
            <p className="mt-2 text-sm text-ink-soft">
              Two {kategori.ad.toLowerCase()} tools side by side, on price and on the features we
              actually checked.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {ciftler.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/compare/${c.slug}`}
                    className="inline-flex rounded-[--radius-control] border border-line px-3 py-1.5 text-sm no-underline transition-colors duration-150 hover:border-accent"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {alternatifliler.length > 0 && (
          <section className="mt-6 max-w-4xl rounded-[--radius-card] border border-line bg-surface p-5">
            <h2 className="text-lg font-semibold">Looking to switch?</h2>
            <p className="mt-2 text-sm text-ink-soft">
              What each of these costs to replace, with the closest tools that do the same job.
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {alternatifliler.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/alternatives/${t.slug}`}
                    className="inline-flex rounded-[--radius-control] border border-line px-3 py-1.5 text-sm no-underline transition-colors duration-150 hover:border-accent"
                  >
                    {t.name} alternatives
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
