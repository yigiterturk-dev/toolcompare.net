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
import { alternatifIndekslenir, NOINDEX } from "@/lib/indeks";
import Footer from "@/components/Footer";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import toolsData from "@/data/tools.json"
import type { Arac } from "@/lib/arac";
import { akranlar, alternatifSayfasiOlanlar, farkCumlesi, kanonikSlug, EN_AZ_ALTERNATIF } from "@/lib/compare";
import { alternatifOzeti, ilkUcretliBasamak, planEtiketi } from "@/lib/plan";
import { ciftTaranmayaDeger } from "@/lib/tarama";
import { gitLinki } from "@/lib/outbound";
import { relDegeri } from "@/lib/affiliate";
import AffiliateNotu from "@/components/AffiliateNotu";
import { listeSemasi, kirintiSemasi } from "@/lib/yapilandirilmis";
import { fiyatDurumu, enUcuz as enUcuzArac } from "@/lib/fiyat";

import { paylasimMeta } from "@/lib/paylasim";
function aracBul(slug: string): Arac | undefined {
  return (toolsData as Arac[]).find((t) => t.slug === slug);
}

export function generateStaticParams() {
  return alternatifSayfasiOlanlar().map((t) => ({ slug: t.slug }));
}

type SayfaParametresi = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: SayfaParametresi): Promise<Metadata> {
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
    // Fiyati dogrulanmamis aracin alternatif sayfasi indekslenmez; sayfa
    // yine acik ve linkli kalir. Kural: src/lib/indeks.ts
    robots: alternatifIndekslenir(tool) ? undefined : NOINDEX,
    ...paylasimMeta({ url, title, description, type: "article" }),
  };
}

export default async function AlternativesPage({ params }: SayfaParametresi) {
  const { slug } = await params;
  const tool = aracBul(slug);
  if (!tool) notFound();

  const alts = akranlar(slug);
  const ozet = alternatifOzeti(tool as never, alts as never[]);
  // Sayfa yalnizca yeterli alternatif varsa anlamli.
  if (alts.length < EN_AZ_ALTERNATIF) notFound();

  const enUcuz = enUcuzArac(alts);

  const semalar = [
    listeSemasi(`Best ${tool.name} Alternatives in 2026`, `/alternatives/${tool.slug}`, alts),
    kirintiSemasi([
      { ad: tool.name, yol: `/tools/${tool.slug}` },
      { ad: `${tool.name} alternatives`, yol: `/alternatives/${tool.slug}` },
    ]),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(semalar) }} />
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Link
          href={`/tools/${tool.slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-ink-soft no-underline transition-colors duration-150 hover:text-accent"
        >
          ← Back to the {tool.name} review
        </Link>

        <h1 className="mt-8 text-3xl font-semibold sm:text-4xl">
          Best {tool.name} alternatives in 2026
        </h1>

        <p className="mt-4 text-ink-soft">
          These are the {alts.length} closest tools to {tool.name} that we track, ordered by what
          they cost to start. Each entry says how its pricing differs from {tool.name}&apos;s —
          based on the numbers we hold, not on who pays us. We do not publish a quality score,
          because we do not have one we can stand behind.
          {/*
            Merdiven ozeti varsa BU cumle basilmaz. Nedeni olculdu: ikisi
            ayni sayfada farkli rakam soyluyordu (Trello icin biri
            $5/user/mo, obulu $6) cunku biri `basePrice` alanindan, obulu
            saticinin cumlesinden geliyor. Okur icin bu celiski, iki
            rakamdan hangisinin dogru oldugundan daha kotudur. Kaynagini
            gosteren cumle kazanir.
          */}
          {!ozet && enUcuz && (
            <>
              {" "}
              The cheapest verified option is{" "}
              <strong className="font-medium text-ink">{enUcuz.name}</strong> at{" "}
              {fiyatDurumu(enUcuz).kisa}.
            </>
          )}
        </p>

        {/*
          OLCUM (2026-09-10): bu sayfa turu 90 gunde 1.068 gosterim aldi,
          ortalama sira 77,3, tik SIFIR -- ve sayfada tek bir rakam yoktu.
          "X alternatives" arayan kisi isim listesi degil daha ucuz bir sey
          ariyor. Cumle yalnizca dogrulanmis plan basamaklarindan kuruluyor
          (bkz. lib/plan.ts); hicbiri yoksa hic basilmaz.
        */}
        {ozet && <p className="mt-3 max-w-4xl text-ink-soft">{ozet}</p>}

        {Array.isArray(tool.cons) && tool.cons.length > 0 && (
          <section className="mt-8 max-w-4xl rounded-[--radius-card] border border-line bg-surface p-5">
            <h2 className="text-lg font-semibold">Why people leave {tool.name}</h2>
            <ul className="mt-3 list-none space-y-2 p-0 text-sm text-ink-soft">
              {tool.cons.map((c: string, i: number) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
            <p className="mt-4 border-t border-line pt-3 text-xs text-ink-muted">
              These are the drawbacks listed in our own {tool.name} review — not complaints we
              invented for this page.
            </p>
          </section>
        )}

        <ol className="mt-8 max-w-4xl list-none space-y-3 p-0">
          {alts.map((alt: Arac, i: number) => (
            <li
              key={alt.slug}
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
                  href={`/tools/${alt.slug}`}
                  className="font-serif text-base font-semibold no-underline transition-colors duration-150 hover:text-accent"
                >
                  {alt.name}
                </Link>
                {alt.shortDescription && (
                  <p className="mt-1 text-sm text-ink-soft">{alt.shortDescription}</p>
                )}
                <p className="mt-2 text-sm text-ink-soft">
                  <strong className="font-medium text-ink">vs {tool.name}:</strong>{" "}
                  {farkCumlesi(tool, alt)}.
                </p>
                {/* Dogrulanmis ilk ucretli basamak: "daha ucuz mu" sorusunun
                    tek somut cevabi. Merdiveni olmayan aracta hic basilmaz. */}
                {ilkUcretliBasamak(alt as never) ? (
                  <p className="mt-1 text-sm text-ink-soft">
                    <strong className="font-medium text-ink">First paid step:</strong>{" "}
                    {ilkUcretliBasamak(alt as never)!.ad} at {planEtiketi(ilkUcretliBasamak(alt as never)!)}
                  </p>
                ) : null}
                {/*
                  OLCUMDE BULUNAN (2026-08-31): bu sayfa arac verisinden yalnizca
                  adi, 3-5 kelimelik aciklamayi ve fiyat farkini gosteriyordu --
                  alternatif basina ~15 kelime. Oysa 460 aracin hepsinde elle
                  yazilmis pros/cons duruyor ve bu sayfa onlara hic dokunmuyordu.
                  Alternatif ariyan kisinin sordugu iki soru "neden gecerim" ve
                  "neyden vazgecerim"; ikisinin cevabi da zaten veride yaziliydi.
                  Uydurma yok: gosterilen her cumle o aracin kendi incelemesinden.
                */}
                {(Array.isArray(alt.pros) && alt.pros.length > 0) || (Array.isArray(alt.cons) && alt.cons.length > 0) ? (
                  <div className="mt-3 grid gap-2 border-t border-line pt-3 text-sm sm:grid-cols-2">
                    {Array.isArray(alt.pros) && alt.pros.length > 0 && (
                      <div>
                        <h3 className="font-sans text-xs font-semibold uppercase tracking-wide text-verified">
                          Why switch to {alt.name}
                        </h3>
                        <ul className="mt-1.5 list-none space-y-1 p-0 text-ink-soft">
                          {alt.pros.slice(0, 2).map((item: string, j: number) => (
                            <li key={j}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(alt.cons) && alt.cons.length > 0 && (
                      <div>
                        <h3 className="font-sans text-xs font-semibold uppercase tracking-wide text-ink-muted">
                          What you give up
                        </h3>
                        <ul className="mt-1.5 list-none space-y-1 p-0 text-ink-soft">
                          {alt.cons.slice(0, 1).map((item: string, j: number) => (
                            <li key={j}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : null}
                {typeof alt.targetAudience === "string" && alt.targetAudience.trim() ? (
                  <p className="mt-2 text-sm text-ink-muted">
                    <strong className="font-medium text-ink-soft">Best for:</strong> {alt.targetAudience}
                  </p>
                ) : null}
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  {/* Karsilastirma linki yalnizca o cift sitemap'teyse
                      verilir (bkz. lib/tarama.ts): olculdu, alternatif
                      sayfalari sitemap disi ciftlere 1.699 link
                      veriyordu ve budamayi anlamsiz kiliyordu. */}
                  {ciftTaranmayaDeger(tool, alt) ? (
                    <Link
                      href={`/compare/${kanonikSlug(tool.slug, alt.slug)}`}
                      className="text-accent underline underline-offset-4"
                    >
                      {tool.name} vs {alt.name} →
                    </Link>
                  ) : null}
                  <a
                    href={gitLinki(alt.slug)}
                    target="_blank"
                    rel={relDegeri(alt.slug)}
                    className="text-ink-soft underline decoration-line-strong underline-offset-4 transition-colors duration-150 hover:text-accent"
                  >
                    Visit {alt.name} →
                  </a>
                </p>
              </div>
            </li>
          ))}
        </ol>
        <AffiliateNotu />
      </main>

      <Footer />
    </>
  );
}
