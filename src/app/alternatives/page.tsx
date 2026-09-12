import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReklamBirimi from "@/components/ReklamBirimi";
import Link from "next/link";
import type { Metadata } from "next";
import { akranlar, alternatifSayfasiOlanlar } from "@/lib/compare";
import { alternatifIndekslenir, fiyatiDogrulanmis } from "@/lib/indeks";
import { alternatifTaranmayaDeger } from "@/lib/tarama";
import { kirintiSemasi } from "@/lib/yapilandirilmis";
import { ilkUcretliBasamak, planEtiketi } from "@/lib/plan";
import { paylasimMeta } from "@/lib/paylasim";
import { reklamAcik, reklamYayinci, icerikSlotu } from "@/lib/reklam";
import type { Arac } from "@/lib/arac";

/*
  NEDEN BU SAYFA VAR (olcum, 2026-09-12):
  /compare ve /categories'in birer toplu giris kapisi vardi, /alternatives
  yoktu -- adres CANLIDA 404 donuyordu. Bu sefer footer'dan kirik bir link
  gitmiyordu (bkz. /compare/page.tsx'teki 2026-09-10 olcumu), yani zarar
  daha sessizdi: sitemap'teki "X alternatives" sayfalari yalnizca kendi
  arac sayfalarindan link aliyordu ve aralarinda tek bir toplu kapi yoktu.
  Bu sayfa turu gosterimin %8,5'ini getiriyor -- ucuncu buyuk kalip.

  KAYNAK SITEMAP ILE AYNI: liste `alternatifSayfasiOlanlar` +
  `alternatifIndekslenir` + `alternatifTaranmayaDeger` uclusunden geciyor,
  yani sitemap.ts'in kullandigi kapinin aynisi. Boylece "linkledigimiz sey
  ile beyan ettigimiz sey ayni" kurali kendiliginden korunur ve 2026-09-12
  (10. tur) ic link sizintisi bir daha dogmaz.
*/

const liste = (): Arac[] =>
  alternatifSayfasiOlanlar()
    .filter((t) => alternatifIndekslenir(t) && alternatifTaranmayaDeger(t))
    .sort((a, b) => a.name.localeCompare(b.name));

const BASLIK = "Software Alternatives: What Each One Costs Instead";
const ACIKLAMA =
  "Every 'alternatives to X' page we publish, with the price the alternatives actually start at — read from each vendor's own pricing page, not estimated.";

export const metadata: Metadata = {
  title: BASLIK,
  description: ACIKLAMA,
  alternates: { canonical: "/alternatives" },
  ...paylasimMeta({ url: "/alternatives", title: BASLIK, description: ACIKLAMA, type: "website" }),
};

function fiyatEtiketi(t: Arac): string {
  const p = ilkUcretliBasamak(t as never);
  return p ? planEtiketi(p) : "no published price";
}

export default function AlternativesHub() {
  const sayfalar = liste();

  /* Harfe gore gruplanir: duz uzun liste taranamaz (bkz. /compare). */
  const gruplar = new Map<string, Arac[]>();
  for (const t of sayfalar) {
    const h = t.name[0].toUpperCase();
    gruplar.set(h, [...(gruplar.get(h) ?? []), t]);
  }

  const sema = kirintiSemasi([{ ad: "Alternatives", yol: "/alternatives" }]);
  const yayinci = reklamYayinci();
  const slot = icerikSlotu();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sema) }} />
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold sm:text-4xl">Software alternatives</h1>
        <p className="mt-4 max-w-3xl text-ink-soft">
          {sayfalar.length} pages, each answering the same question for one tool: if you leave it, what
          do the realistic replacements cost? A page only appears here once at least two of its
          alternatives have a price we read from the vendor&apos;s own pricing page — otherwise
          &quot;cheaper than X&quot; would be a claim we could not support. Where a vendor publishes no
          price at all, the page says so rather than guessing.
        </p>

        {[...gruplar.entries()].map(([harf, araclar]) => (
          <section key={harf} className="mt-10">
            <h2 className="text-lg font-semibold text-ink-soft">{harf}</h2>
            <ul className="mt-3 list-none space-y-2 p-0">
              {araclar.map((t) => {
                const akran = akranlar(t.slug);
                const fiyatli = akran.filter(fiyatiDogrulanmis).length;
                return (
                  <li key={t.slug} className="border-t border-line pt-2">
                    <Link
                      href={`/alternatives/${t.slug}`}
                      className="font-medium no-underline transition-colors duration-150 hover:text-accent"
                    >
                      {t.name} alternatives
                    </Link>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {t.name}: {fiyatEtiketi(t)} · {akran.length} alternatives compared,{" "}
                      {fiyatli} with a verified price
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {reklamAcik() && yayinci && slot ? <ReklamBirimi yayinci={yayinci} slot={slot} /> : null}
      </main>

      <Footer />
    </>
  );
}
