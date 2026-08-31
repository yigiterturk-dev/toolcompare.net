import Header from "@/components/Header";
import Footer from "@/components/Footer";
import toolsData from "@/data/tools.json";
import { gitLinki } from "@/lib/outbound";
import { relDegeri } from "@/lib/affiliate";
import AffiliateNotu from "@/components/AffiliateNotu";
import { kanonikSlug, akranlar, karsilastirmaCiftleri, ciftIndekslenebilirMi, ayrimCumlesi } from "@/lib/compare";
import { listeSemasi, kirintiSemasi } from "@/lib/yapilandirilmis";
import { fiyatDurumu } from "@/lib/fiyat";
import { evidenceLabel, toolEvidence } from "@/lib/evidence";
import { KRITER_SIRA, KRITER_ETIKET } from "@/lib/kriterler";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, X, Zap, Star, ArrowRight, ArrowLeft, Check } from "lucide-react";
import type { Metadata } from "next";

/**
 * Karsilastirma sayfalari build aninda uretilsin.
 *
 * Onceden bu rota tek DINAMIK sayfa turuydu: 417 sayfa HER istekte
 * yeniden render ediliyordu (olculdu: ilk bayta 12,5 ms, statik
 * sayfalarda 1,5-5,2 ms). Sitenin en kalabalik sayfa grubu ve arama
 * motorunun en cok tarayacagi grup burasi.
 *
 * dynamicParams VARSAYILAN (true) birakildi: listede olmayan bir cift --
 * ornegin ters sirali /compare/zapier-vs-1password -- yine calisir ve
 * kanonik adresi gosterir. Kapatmak o adresleri 404 yapardi.
 */
export function generateStaticParams() {
  return karsilastirmaCiftleri().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const resolvedParams = await params;
  const parts = resolvedParams.slug.split("-vs-");
  if (parts.length !== 2) return { title: "Comparison" };
  
  const tool1 = (toolsData as any[]).find((t) => t.slug === parts[0]);
  const tool2 = (toolsData as any[]).find((t) => t.slug === parts[1]);
  
  if (!tool1 || !tool2) return { title: "Comparison" };

  // Baslik 65 karakteri asarsa arama sonucunda kesilir; marka adi
  // uzun ciftlerde dusuruluyor ki asil ifade ("X vs Y") gorunur kalsin.
  // Uc kademeli kisaltma: cok uzun isimlerde CEKIRDEK basligin kendisi de
  // 65'i asiyordu (ornek: "ActiveCampaign vs Ahrefs Webmaster Tools").
  const cekirdek = `${tool1.name} vs ${tool2.name}: Which Is Better in 2026?`;
  const kisa = `${tool1.name} vs ${tool2.name} (2026)`;
  const title =
    cekirdek.length <= 46 ? `${cekirdek} | ToolCompare`
    : cekirdek.length <= 65 ? cekirdek
    : kisa.length <= 65 ? kisa
    : `${tool1.name} vs ${tool2.name}`;
  const description = `Compare ${tool1.name} and ${tool2.name} side-by-side: verified pricing, documented features, trade-offs, source dates and who each one fits.`;

  // "a-vs-b" ve "b-vs-a" ayni sayfa. Kanonik olan alfabetik sirali olan;
  // aksi halde ayni icerik iki adreste indekslenir ve ikisi de zayiflar.
  const canonical = `/compare/${kanonikSlug(tool1.slug, tool2.slug)}`;

  // Iki tarafi da incelenmemis cift indekslenmez; sayfa yine calisir.
  const indekslensin = ciftIndekslenebilirMi(tool1 as any, tool2 as any);

  return {
    title,
    description,
    robots: indekslensin ? undefined : { index: false, follow: true },
    alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: "ToolCompare", type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ComparisonPage({ params }: any) {
  const resolvedParams = await params;
  const parts = resolvedParams.slug.split("-vs-");
  if (parts.length !== 2) notFound();

  const tool1 = (toolsData as any[]).find((t) => t.slug === parts[0]);
  const tool2 = (toolsData as any[]).find((t) => t.slug === parts[1]);

  if (!tool1 || !tool2) notFound();

  // Kisa cevap icin: hangi arac hangi olcutte onde? Sadece elimizdeki
  // sayilardan turetiliyor.
  const f1 = fiyatDurumu(tool1);
  const f2 = fiyatDurumu(tool2);
  const e1 = toolEvidence(tool1);
  const e2 = toolEvidence(tool2);
  // Fiyat kiyasi ancak IKI TARAF DA dogrulanmissa yapilir.
  const fiyatKiyaslanabilir = f1.karsilastirilabilir && f2.karsilastirilabilir;
  const ucuz = fiyatKiyaslanabilir ? ((f1.aylik as number) <= (f2.aylik as number) ? tool1 : tool2) : null;
  const pahali = ucuz ? (ucuz === tool1 ? tool2 : tool1) : null;
  const ucuzF = ucuz ? fiyatDurumu(ucuz) : null;
  const pahaliF = pahali ? fiyatDurumu(pahali) : null;

  /*
    Cifte ozgu ayrim cumlesi. Tabloda zaten duran Yes/No verisinden
    turetiliyor; sayfa metninin cift degistikce degismesini saglayan tek
    parca bu. Ayrim yoksa bos doner ve satir hic basilmaz.
  */
  const ayrim = ayrimCumlesi(tool1 as any, tool2 as any);

  // Yalnizca akranlar: sitemap disi bir sayfaya link verilmemeli.
  const ilgili = akranlar(tool1.slug).filter((t: any) => t.slug !== tool2.slug);

  /*
    Karsilastirma satiri. Onceki surumde `type="score"` dali `{val1}%`
    yaziyordu -- yuzde isareti sabit metindi ve yalnizca uydurma kalite
    puanlari icin vardi. O puanlar sokuldugu icin dal da kaldirildi:
    kullanilmayan bir bicimlendirme, bir gun yanlis veriye yeniden
    baglanmayi bekleyen bir tuzaktir.
  */
  const ComparisonRow = ({ label, val1, val2 }: { label: string; val1: React.ReactNode; val2: React.ReactNode }) => (
    <tr className="border-t border-line">
      <th scope="row" className="py-3 pr-3 text-left align-top text-xs font-medium tracking-wide text-ink-muted uppercase">
        {label}
      </th>
      <td className="py-3 pr-3 align-top text-sm">{val1}</td>
      <td className="py-3 align-top text-sm">{val2}</td>
    </tr>
  );

  const sema = listeSemasi(
    `${tool1.name} vs ${tool2.name}`,
    `/compare/${kanonikSlug(tool1.slug, tool2.slug)}`,
    [tool1, tool2]
  );

  // Kirinti semasi bu sayfa turunde de yoktu.
  const semalar = [
    sema,
    kirintiSemasi([
      { ad: tool1.name, yol: `/tools/${tool1.slug}` },
      { ad: `${tool1.name} vs ${tool2.name}`, yol: `/compare/${kanonikSlug(tool1.slug, tool2.slug)}` },
    ]),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(semalar) }} />
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-soft no-underline transition-colors duration-150 hover:text-accent"
        >
          <ArrowLeft size={16} aria-hidden="true" /> All tools
        </Link>

        <header className="mt-8 border-b border-line pb-8">
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {tool1.name} <span className="text-ink-muted">vs</span> {tool2.name}
          </h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            A source-aware comparison of pricing, documented capabilities and workflow fit.
          </p>
        </header>

        {/*
          Kisa cevap. Ziyaretci "hangisi?" diye geliyor; cevabi sayfanin
          basinda veriyoruz, tablonun altinda degil.
        */}
        <section className="mt-8 rounded-[--radius-card] border border-line bg-surface p-5">
          <h2 className="text-lg font-semibold">Short answer</h2>
          <ul className="mt-3 list-none space-y-2 p-0 text-sm text-ink-soft">
            <li>
              <strong className="font-medium text-ink">Price:</strong>{" "}
              {!fiyatKiyaslanabilir
                ? `not directly comparable — ${tool1.name} is ${f1.metin.toLowerCase()}, ${tool2.name} is ${f2.metin.toLowerCase()}.`
                : f1.aylik === f2.aylik
                  ? `both start at ${f1.kisa}.`
                  : `${ucuz!.name} is cheaper — ${ucuzF!.kisa} vs ${pahaliF!.kisa}.`}
            </li>
            <li>
              <strong className="font-medium text-ink">How to start:</strong>{" "}
              {f1.metin.toLowerCase() === f2.metin.toLowerCase()
                ? `both are ${f1.metin.toLowerCase()}.`
                : `${tool1.name} is ${f1.metin.toLowerCase()}, ${tool2.name} is ${f2.metin.toLowerCase()}.`}
            </li>
            {ayrim ? (
              <li>
                <strong className="font-medium text-ink">Where they differ:</strong> {ayrim}
              </li>
            ) : null}
          </ul>
          <p className="mt-4 border-t border-line pt-3 text-xs text-ink-muted">
            These lines are generated from the pricing we track, not from a paid placement.{" "}
            <Link href="/methodology" className="text-accent underline underline-offset-4">
              How we score tools
            </Link>
            .
          </p>
        </section>

        {/*
          Elde duran longDescription hicbir karsilastirma sayfasinda
          gosterilmiyordu (460/512 aracta dolu, ortalama 45 kelime).
          Sayfa basina ~90 kelimelik, araca OZGU metin buydu; sablon
          tekrarini seyreltmenin en ucuz yolu onu basmak.
        */}
        {[tool1, tool2].some((t: any) => t.longDescription) && (
          <section className="mt-10 grid gap-6 sm:grid-cols-2">
            {[tool1, tool2]
              .filter((t: any) => t.longDescription)
              .map((t: any) => (
                <div key={t.slug} className="rounded-[--radius-card] border border-line bg-surface p-5">
                  <h2 className="text-base font-semibold">What {t.name} is</h2>
                  <p className="mt-2 text-sm text-ink-soft">{t.longDescription}</p>
                </div>
              ))}
          </section>
        )}

        {/* ---------- Karsilastirma tablosu ---------- */}
        <section className="mt-10">
          <h2 className="sr-only">Side by side</h2>
          {/* Dar ekranda tablo kendi icinde kayiyor; sayfa yatay kaymiyor. */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] border-collapse text-left">
              <thead>
                <tr>
                  <td />
                  <th scope="col" className="pb-3 font-serif text-lg font-semibold">
                    <Link href={`/tools/${tool1.slug}`} className="no-underline hover:text-accent">
                      {tool1.name}
                    </Link>
                  </th>
                  <th scope="col" className="pb-3 font-serif text-lg font-semibold">
                    <Link href={`/tools/${tool2.slug}`} className="no-underline hover:text-accent">
                      {tool2.name}
                    </Link>
                  </th>
                </tr>
              </thead>
              <tbody>
                <ComparisonRow label="Category" val1={tool1.category} val2={tool2.category} />
                <ComparisonRow
                  label="How to start"
                  val1={
                    <span className="flex flex-wrap items-baseline gap-1.5">
                      <span className="font-medium">{f1.kisa}</span>
                      <span className={`rounded-[--radius-pill] px-1.5 py-0.5 text-[11px] ${f1.karsilastirilabilir ? "bg-verified-soft text-verified" : "bg-unverified-soft text-unverified"}`}>
                        {f1.karsilastirilabilir ? "verified" : "not a monthly price"}
                      </span>
                    </span>
                  }
                  val2={
                    <span className="flex flex-wrap items-baseline gap-1.5">
                      <span className="font-medium">{f2.kisa}</span>
                      <span className={`rounded-[--radius-pill] px-1.5 py-0.5 text-[11px] ${f2.karsilastirilabilir ? "bg-verified-soft text-verified" : "bg-unverified-soft text-unverified"}`}>
                        {f2.karsilastirilabilir ? "verified" : "not a monthly price"}
                      </span>
                    </span>
                  }
                />
                {KRITER_SIRA.map((k) => {
                  const isaret = (t: any) => {
                    const v = t.kriterler?.[k];
                    if (v === true) return <span className="text-verified">Yes</span>;
                    if (v === false) return <span className="text-ink-muted">No</span>;
                    return <span className="text-unverified">not checked</span>;
                  };
                  return (
                    <ComparisonRow
                      key={k}
                      label={KRITER_ETIKET[k]}
                      val1={isaret(tool1)}
                      val2={isaret(tool2)}
                    />
                  );
                })}
                <ComparisonRow
                  label="Visit"
                  val1={
                    tool1.websiteUrl ? (
                      <a href={gitLinki(tool1.slug)} target="_blank" rel={relDegeri(tool1.slug)} className="text-accent underline underline-offset-4">
                        {tool1.name} ↗
                      </a>
                    ) : null
                  }
                  val2={
                    tool2.websiteUrl ? (
                      <a href={gitLinki(tool2.slug)} target="_blank" rel={relDegeri(tool2.slug)} className="text-accent underline underline-offset-4">
                        {tool2.name} ↗
                      </a>
                    ) : null
                  }
                />
              </tbody>
            </table>
          </div>
          <AffiliateNotu />
        </section>

        {/*
          keyFeatures 245 aracta dolu (baslik + bir cumle aciklama) ve
          yine hicbir yerde gosterilmiyordu. Tablo yalnizca dort olcute
          Yes/No diyor; aracin kendi one cikardigi is bunlarda.
        */}
        {[tool1, tool2].some((t: any) => t.keyFeatures?.length) && (
          <section className="mt-12 grid gap-6 sm:grid-cols-2">
            {[tool1, tool2]
              .filter((t: any) => t.keyFeatures?.length)
              .map((t: any) => (
                <div key={t.slug} className="rounded-[--radius-card] border border-line bg-surface p-5">
                  <h2 className="text-base font-semibold">What {t.name} is built to do</h2>
                  <dl className="mt-3 space-y-3 text-sm">
                    {t.keyFeatures.map((f: any) => (
                      <div key={f.title}>
                        <dt className="font-medium text-ink">{f.title}</dt>
                        <dd className="mt-0.5 ml-0 text-ink-soft">{f.description}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
          </section>
        )}

        {/* ---------- Is akisina uygunluk ---------- */}
        <section className="mt-12 grid gap-6 sm:grid-cols-2">
          {[tool1, tool2].map((t: any) => {
            const uygun = (t.bestFor?.length ? t.bestFor : [t.targetAudience]).filter(Boolean);
            if (!uygun.length) return null;
            return (
              <div key={t.slug} className="rounded-[--radius-card] border border-line bg-surface p-5">
                <h2 className="flex items-center gap-1.5 text-base font-semibold">
                  <CheckCircle2 size={16} className="text-verified" aria-hidden="true" />
                  Choose {t.name} if
                </h2>
                <ul className="mt-3 list-none space-y-2 p-0 text-sm text-ink-soft">
                  {uygun.map((item: string) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
                {t.skipIf?.length ? (
                  <>
                    <h3 className="mt-5 font-sans text-sm font-semibold text-ink-soft">
                      Skip {t.name} if
                    </h3>
                    <ul className="mt-2 list-none space-y-2 p-0 text-sm text-ink-muted">
                      {t.skipIf.map((item: string) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            );
          })}
        </section>

        {/* ---------- Kanit ---------- */}
        <section className="mt-12 rounded-[--radius-card] border border-line bg-surface p-5">
          <h2 className="text-lg font-semibold">Evidence and freshness</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Where a claim on this page comes from a vendor page, it is linked here.
          </p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            {[
              [tool1, e1],
              [tool2, e2],
            ].map(([t, ev]: any) => (
              <div key={t.slug}>
                <h3 className="font-sans text-sm font-semibold">{t.name}</h3>
                {ev ? (
                  <>
                    <p className="mt-1 text-xs text-ink-muted">
                      {evidenceLabel(ev.status)} · reviewed {ev.reviewedAt}
                    </p>
                    <ul className="mt-2 list-none space-y-1.5 p-0 text-sm">
                      {ev.sources.map((source: any) => (
                        <li key={source.url}>
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="text-accent underline underline-offset-4"
                          >
                            {source.label} ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-ink-muted">
                    Sources have not been attached to this record yet.
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ---------- Arti / eksi ---------- */}
        {[tool1, tool2].some((t: any) => (t.pros || []).length || (t.cons || []).length) && (
          <section className="mt-12 grid gap-6 sm:grid-cols-2">
            {[tool1, tool2]
              .filter((t: any) => (t.pros || []).length || (t.cons || []).length)
              .map((t: any) => (
                <div key={t.slug} className="rounded-[--radius-card] border border-line bg-surface p-5">
                  <h2 className="text-base font-semibold">{t.name}: pros &amp; cons</h2>
                  <ul className="mt-3 list-none space-y-2 p-0 text-sm text-ink-soft">
                    {(t.pros || []).map((pro: string, i: number) => (
                      <li key={i} className="flex gap-2">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-verified" aria-hidden="true" />
                        <span>{pro}</span>
                      </li>
                    ))}
                    {(t.cons || []).map((con: string, i: number) => (
                      <li key={`c${i}`} className="flex gap-2">
                        <X size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden="true" />
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </section>
        )}

        {/* ---------- Tam degerlendirme ---------- */}
        {[tool1, tool2].some((t: any) => t.verdict) ? (
          <section className="mt-12 space-y-6">
            {[tool1, tool2]
              .filter((t: any) => t.verdict)
              .map((t: any) => (
                <div key={t.slug} className="rounded-[--radius-card] border-l-2 border-accent bg-surface p-5">
                  <h2 className="text-base font-semibold">Our verdict on {t.name}</h2>
                  <p className="mt-2 text-sm text-ink-soft">{t.verdict}</p>
                </div>
              ))}
          </section>
        ) : (
          <p className="mt-12 rounded-[--radius-card] border border-line bg-unverified-soft p-5 text-sm">
            <strong className="font-medium">Neither tool has a full review yet.</strong>{" "}
            <span className="text-ink-soft">
              This page compares what we can verify — pricing and documented capabilities.
            </span>
          </p>
        )}

        {/* ---------- Ilgili karsilastirmalar ---------- */}
        {ilgili.length > 0 && (
          <section className="mt-12 border-t border-line pt-10">
            <h2 className="text-lg font-semibold">Other {tool1.name} comparisons</h2>
            <ul className="mt-4 flex list-none flex-wrap gap-2 p-0">
              {ilgili.map((t: any) => (
                <li key={t.slug}>
                  <Link
                    href={`/compare/${kanonikSlug(tool1.slug, t.slug)}`}
                    className="inline-flex rounded-[--radius-pill] border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft no-underline transition-colors duration-150 hover:border-line-strong hover:text-ink"
                  >
                    {tool1.name} vs {t.name}
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
