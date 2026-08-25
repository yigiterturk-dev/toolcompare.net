import Header from "@/components/Header";
import Footer from "@/components/Footer";
import toolsData from "@/data/tools.json";
import { gitLinki } from "@/lib/outbound";
import { kanonikSlug, akranlar, EN_AZ_ALTERNATIF } from "@/lib/compare";
import { fiyatDurumu } from "@/lib/fiyat";
import { KRITER_SIRA, KRITER_ETIKET, KRITER_ACIKLAMA } from "@/lib/kriterler";
import { evidenceLabel, toolEvidence } from "@/lib/evidence";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Award, Target, MessageSquareQuote } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const tool = (toolsData as any[]).find((t) => t.slug === resolvedParams.slug);
  
  if (!tool) return { title: "Tool Not Found" };

  // Baslik 65 karakteri asarsa arama sonucunda kesilir. Marka adi
  // uzun arac isimlerinde dusuruluyor ki asil ifade gorunur kalsin.
  // Katalogda olup HENUZ INCELENMEMIS araclar var. Onlara "Review ...
  // & Verdict" demek, yazmadigimiz bir incelemeyi varmis gibi gostermek
  // olurdu.
  const incelendi = Boolean(tool.incelendi ?? tool.verdict);
  const cekirdek = incelendi
    ? `${tool.name} Review 2026: Features, Pricing & Verdict`
    : `${tool.name}: Pricing and Alternatives (2026)`;
  const title = cekirdek.length <= 51 ? `${cekirdek} | ToolCompare` : cekirdek;
  const description = incelendi
    ? (tool.shortDescription || `Comprehensive review of ${tool.name}.`)
    : `${tool.shortDescription || tool.name} What it costs to start and the closest alternatives we track — we have not published a full review of ${tool.name} yet.`;
  const url = `/tools/${tool.slug}`;

  return {
    title,
    description,
    // Canonical yoktu: ayni sayfaya farkli yollardan (sorgu parametresi,
    // www) gelindiginde Google hangisini asil sayacagini kendi tahmin
    // ediyordu. Open Graph de yoktu; paylasilan link ciplak gorunuyordu.
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "ToolCompare", type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export function generateStaticParams() {
  return toolsData.map((tool: any) => ({ slug: tool.slug }));
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const tool = (toolsData as any[]).find((t) => t.slug === resolvedParams.slug);

  if (!tool) notFound();


  // Smart Data Normalization (Handle camelCase, snake_case, and nested objects)
  const longDesc = tool.longDescription || tool.description || (tool.review?.text || tool.review?.body || tool.review?.introduction || "");
  const features = tool.keyFeatures || tool.key_features || tool.features || [];
  const targetAud = typeof tool.targetAudience === 'string' ? tool.targetAudience : (tool.targetAudience?.description || tool.targetAudience?.text || tool.target_audience?.description || tool.target_audience?.text || tool.target_audience?.small_businesses || "");
  const verdictText = typeof tool.verdict === 'string' ? tool.verdict : (tool.expertVerdict?.conclusion || tool.expertVerdict?.summary || tool.expert_verdict?.conclusion || tool.expert_verdict?.summary || tool.expertVerdict?.text || tool.expert_verdict || tool.verdict?.text || tool.verdict || "");
  const evidence = toolEvidence(tool);

  // Yapilandirilmis veri. DIKKAT: buraya YALNIZCA sayfada gercekten gorunen
  // ve elimizde olan bilgi konur. Genel bir yildiz puani BILEREK yok:
  // elimizdeki tek gorunur skor "Ease of Use" (tek boyut), onu genel puan
  // diye sunmak yanlis beyan olurdu ve Google zengin sonuclarda buna
  // yaptirim uyguluyor. Genel puan gostermeye karar verilirse once sayfada
  // gorunur olmali, sonra buraya reviewRating eklenmeli.
  const sayfaUrl = `https://toolcompare.net/tools/${tool.slug}`;
  const yapilandirilmis: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: tool.name,
    description: tool.shortDescription || longDesc || undefined,
    applicationCategory: tool.category || undefined,
    operatingSystem: "Web",
    url: sayfaUrl,
    sameAs: tool.websiteUrl || undefined,
  };
  // Dogrulanmamis fiyat yapilandirilmis veriye KONMAZ: Google'a yanlis
  // fiyat beyan etmek zengin sonuclarda yaptirim sebebi.
  if (fiyatDurumu(tool).karsilastirilabilir) {
    yapilandirilmis.offers = {
      "@type": "Offer",
      price: tool.basePrice,
      priceCurrency: "USD",
      // isFlat=false ise fiyat kullanici basina aylik; sayfada da boyle yaziyor.
      description: tool.isFlat ? "Flat monthly price" : "Per user, per month",
    };
  }
  if (verdictText) {
    yapilandirilmis.review = {
      "@type": "Review",
      author: { "@type": "Organization", name: "ToolCompare" },
      reviewBody: typeof verdictText === "string" ? verdictText : verdictText.text,
      ...((tool.pros || []).length
        ? { positiveNotes: { "@type": "ItemList", itemListElement: (tool.pros || []).map((x: string, i: number) => ({ "@type": "ListItem", position: i + 1, name: x })) } }
        : {}),
      ...((tool.cons || []).length
        ? { negativeNotes: { "@type": "ItemList", itemListElement: (tool.cons || []).map((x: string, i: number) => ({ "@type": "ListItem", position: i + 1, name: x })) } }
        : {}),
    };
  }

  const incelendi = Boolean(tool.incelendi ?? tool.verdict);
  const karsilastirmalar = akranlar(tool.slug);


  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(yapilandirilmis) }}
      />
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-soft no-underline transition-colors duration-150 hover:text-accent"
        >
          <ArrowLeft size={16} aria-hidden="true" /> All tools
        </Link>

        <article className="mt-8">
          <header className="flex flex-wrap items-start gap-4 border-b border-line pb-8">
            <span
              aria-hidden="true"
              className="grid size-16 shrink-0 place-items-center rounded-[--radius-card] bg-surface-sunken font-serif text-2xl font-semibold text-ink-soft"
            >
              {tool.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              {tool.category ? (
                <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">
                  {tool.category}
                </p>
              ) : null}
              <h1 className="mt-1 text-3xl font-semibold break-words sm:text-4xl">{tool.name}</h1>
              {tool.shortDescription ? (
                <p className="mt-2 text-ink-soft">{tool.shortDescription}</p>
              ) : null}
            </div>
          </header>

          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
            {/* ---------- Ana sutun ---------- */}
            <div className="min-w-0 space-y-10">
              {!incelendi && (
                <section className="rounded-[--radius-card] border border-line bg-unverified-soft p-5">
                  <h2 className="text-lg font-semibold">We have not reviewed {tool.name} yet</h2>
                  <p className="mt-2 text-sm text-ink-soft">
                    This page lists what it costs to start and the closest alternatives we track.
                    There is no verdict here because we have not written one.
                  </p>
                </section>
              )}

              {longDesc ? (
                <section>
                  <h2 className="text-xl font-semibold">What it is</h2>
                  <p className="mt-3 whitespace-pre-line text-ink-soft">{longDesc}</p>
                </section>
              ) : null}

              {features.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold">Key features</h2>
                  <ul className="mt-4 grid list-none gap-4 p-0 sm:grid-cols-2">
                    {features.map((f: any, i: number) => {
                      const title = typeof f === "string" ? f : f?.title || "";
                      const description = typeof f === "string" ? "" : f?.description || "";
                      if (!title) return null;
                      return (
                        <li
                          key={i}
                          className="rounded-[--radius-card] border border-line bg-surface p-4"
                        >
                          <h3 className="font-sans text-sm font-semibold">{title}</h3>
                          {description ? (
                            <p className="mt-1.5 text-sm text-ink-soft">{description}</p>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              {targetAud ? (
                <section>
                  <h2 className="text-xl font-semibold">Who it is for</h2>
                  <p className="mt-3 text-ink-soft">{targetAud}</p>
                </section>
              ) : null}

              {verdictText ? (
                <section className="rounded-[--radius-card] border-l-2 border-accent bg-surface p-5">
                  <h2 className="text-xl font-semibold">Our verdict</h2>
                  <p className="mt-3 text-ink-soft">
                    {typeof verdictText === "string" ? verdictText : verdictText.text || ""}
                  </p>
                </section>
              ) : null}

              {/*
                DENETIMDE BULUNAN (2026-08-25): bu bolum "Best Alternatives to X"
                basligini tasiyordu ama listeyi
                `.sort(() => 0.5 - Math.random()).slice(0, 3)` ile seciyordu --
                yani "en iyi alternatifler" rastgele uc kayitti. Depoda zaten
                dogru fonksiyon vardi (`akranlar()`, fiyata gore siralar) ve
                ayni sayfanin alt kisminda kullaniliyordu. Basligi da artik
                yaptigi seyi soyluyor.
              */}
              {karsilastirmalar.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold">Closest alternatives we track</h2>
                  <p className="mt-2 text-sm text-ink-muted">
                    Same category, ordered by verified starting price.
                  </p>
                  <ul className="mt-4 grid list-none gap-3 p-0 sm:grid-cols-3">
                    {karsilastirmalar.slice(0, 3).map((alt: any) => {
                      const d = fiyatDurumu(alt);
                      return (
                        <li key={alt.slug}>
                          <Link
                            href={`/tools/${alt.slug}`}
                            className="block h-full rounded-[--radius-card] border border-line bg-surface p-4 no-underline transition-colors duration-150 hover:border-line-strong"
                          >
                            <p className="font-serif text-base font-semibold">{alt.name}</p>
                            <p className="mt-1 text-sm text-ink-soft">{d.kisa}</p>
                            {alt.shortDescription ? (
                              <p className="mt-2 line-clamp-2 text-sm text-ink-muted">
                                {alt.shortDescription}
                              </p>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}
            </div>

            {/* ---------- Yan sutun ---------- */}
            <aside className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-[--radius-card] border border-line bg-surface p-5">
                <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">
                  How to start
                </p>
                <p className="mt-2 font-serif text-2xl font-semibold">{fiyatDurumu(tool).metin}</p>
                <p
                  className={`mt-2 inline-block rounded-[--radius-pill] px-2 py-0.5 text-[11px] font-medium ${
                    fiyatDurumu(tool).karsilastirilabilir
                      ? "bg-verified-soft text-verified"
                      : "bg-unverified-soft text-unverified"
                  }`}
                >
                  {fiyatDurumu(tool).karsilastirilabilir
                    ? "Verified price"
                    : "Not a monthly price"}
                </p>

                {tool.websiteUrl ? (
                  <a
                    href={gitLinki(tool.slug)}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-tap
                    className="mt-4 block rounded-[--radius-control] bg-brand px-4 py-2.5 text-center text-sm font-medium text-brand-ink no-underline transition-opacity duration-150 hover:opacity-90"
                  >
                    Visit {tool.name}
                  </a>
                ) : null}
              </div>

              {(tool.pros?.length || tool.cons?.length) && (
                <div className="rounded-[--radius-card] border border-line bg-surface p-5">
                  {tool.pros?.length ? (
                    <>
                      <h2 className="flex items-center gap-1.5 font-sans text-sm font-semibold text-verified">
                        <CheckCircle2 size={16} aria-hidden="true" /> Pros
                      </h2>
                      <ul className="mt-2 list-none space-y-1.5 p-0 text-sm text-ink-soft">
                        {(tool.pros || []).map((pro: string, i: number) => (
                          <li key={i}>{pro}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                  {tool.cons?.length ? (
                    <>
                      <h2 className="mt-5 flex items-center gap-1.5 font-sans text-sm font-semibold text-danger">
                        <XCircle size={16} aria-hidden="true" /> Cons
                      </h2>
                      <ul className="mt-2 list-none space-y-1.5 p-0 text-sm text-ink-soft">
                        {(tool.cons || []).map((con: string, i: number) => (
                          <li key={i}>{con}</li>
                        ))}
                      </ul>
                    </>
                  ) : null}
                </div>
              )}
            </aside>
          </div>

          {/* ---------- Ne kontrol edildi ---------- */}
          <section className="mt-14 border-t border-line pt-10">
            <h2 className="text-xl font-semibold">What we checked</h2>
            <ul className="mt-4 grid list-none gap-2 p-0 sm:grid-cols-2">
              {KRITER_SIRA.map((k) => {
                const v = (tool as any).kriterler?.[k];
                const yazi = v === true ? "Yes" : v === false ? "No" : "Not checked";
                const renkSinifi =
                  v === true
                    ? "bg-verified-soft text-verified"
                    : v === false
                      ? "bg-surface-sunken text-ink-soft"
                      : "bg-unverified-soft text-unverified";
                return (
                  <li
                    key={k}
                    className="flex items-center justify-between gap-3 rounded-[--radius-card] border border-line bg-surface px-4 py-3"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-medium">{KRITER_ETIKET[k]}</span>
                      <span className="block text-xs text-ink-muted">{KRITER_ACIKLAMA[k]}</span>
                    </span>
                    <span
                      className={`shrink-0 rounded-[--radius-pill] px-2 py-0.5 text-xs font-medium ${renkSinifi}`}
                    >
                      {yazi}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-xs text-ink-muted">
              “Not checked” means exactly that — we have not verified it, and we do not guess.
            </p>
          </section>

          {/*
            ---------- Kanit ----------
            `evidence` yalnizca 140 aracta var; digerlerinde toolEvidence()
            null donuyor. Bu koruma ilk yazimimda dusmustu ve sayfa
            "Cannot read properties of null" ile 500 veriyordu.
          */}
          {evidence && (
          <section className="mt-12 rounded-[--radius-card] border border-line bg-surface p-5">
            <h2 className="text-xl font-semibold">Evidence and freshness</h2>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
              <span>
                <strong className="font-medium text-ink">Status:</strong>{" "}
                {evidenceLabel(evidence.status)}
              </span>
              <span>
                <strong className="font-medium text-ink">Reviewed:</strong> {evidence.reviewedAt}
              </span>
            </p>

            {evidence.sources.length > 0 && (
              <ul className="mt-4 list-none space-y-3 p-0">
                {evidence.sources.map((source) => (
                  <li key={source.url}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="text-sm text-accent underline underline-offset-4"
                    >
                      {source.label} ↗
                    </a>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      Checked {source.checkedAt} · Supports: {source.supports.join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}

            {evidence.limitations && (
              <p className="mt-4 border-t border-line pt-3 text-xs text-ink-muted">
                <strong className="font-medium text-ink">Limit:</strong>{" "}
                {evidence.limitations.join(" ")}
              </p>
            )}
          </section>
          )}

          {/* ---------- Karsilastirma ic linkleri ---------- */}
          {karsilastirmalar.length >= EN_AZ_ALTERNATIF && (
            <section className="mt-12 border-t border-line pt-10">
              <h2 className="text-xl font-semibold">Compare {tool.name} with alternatives</h2>
              <p className="mt-2 text-sm">
                <Link
                  href={`/alternatives/${tool.slug}`}
                  className="text-accent underline underline-offset-4"
                >
                  See all {tool.name} alternatives ranked →
                </Link>
              </p>
              <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
                {karsilastirmalar.map((t: any) => (
                  <li key={t.slug}>
                    <Link
                      href={`/compare/${kanonikSlug(tool.slug, t.slug)}`}
                      className="inline-flex rounded-[--radius-pill] border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft no-underline transition-colors duration-150 hover:border-line-strong hover:text-ink"
                    >
                      {tool.name} vs {t.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </main>

      <Footer />
    </>
  );
}
