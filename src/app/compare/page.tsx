import Header from "@/components/Header";
import Footer from "@/components/Footer";
import toolsData from "@/data/tools.json";
import type { Arac } from "@/lib/arac";
import Link from "next/link";
import type { Metadata } from "next";
import { sitemapCiftleri } from "@/lib/compare";
import { kirintiSemasi } from "@/lib/yapilandirilmis";
import { ilkUcretliBasamak, planEtiketi } from "@/lib/plan";
import { paylasimMeta } from "@/lib/paylasim";

/*
  NEDEN BU SAYFA VAR (olcum, 2026-09-10):
  Footer HER sayfada "/compare" adresine link veriyordu ve o adres
  CANLIDA 404 donuyordu -- 2.247 uretilen sayfanin hepsinden bos bir
  adrese link. Googlebot icin bu, sitenin kendi ic yapisini bilmedigi
  anlamina gelir; ustelik karsilastirma sayfalari sitenin ilk-20'ye en
  cok giren sayfa turu ve hicbir toplu giris kapisi yoktu.

  Sayfa iki isi birden yapar: 404'u kapatir ve sitemap'teki
  karsilastirmalara tek noktadan guclu ic link verir. Listelenen cift
  sayisi sitemap ile AYNI kaynaktan (sitemapCiftleri) gelir; boylece
  "linkledigimiz sey ile beyan ettigimiz sey ayni" kurali kendiliginden
  korunur.
*/

const araclar = toolsData as Arac[];
const harita = new Map(araclar.map((t) => [t.slug, t]));

export const metadata: Metadata = {
  title: "Software Comparisons: Verified Pricing Side by Side",
  description:
    "Every head-to-head comparison we publish, with each vendor's own plan prices shown next to the sentence they were read from.",
  alternates: { canonical: "/compare" },
  ...paylasimMeta({
    url: "/compare",
    title: "Software Comparisons: Verified Pricing Side by Side",
    description:
      "Every head-to-head comparison we publish, with each vendor's own plan prices shown next to the sentence they were read from.",
    type: "website",
  }),
};

type Satir = { slug: string; a: Arac; b: Arac; harf: string };

function satirlar(): Satir[] {
  const cikan: Satir[] = [];
  for (const cift of sitemapCiftleri()) {
    const [x, y] = cift.split("-vs-");
    const a = harita.get(x);
    const b = harita.get(y);
    if (!a || !b) continue;
    cikan.push({ slug: cift, a, b, harf: a.name[0].toUpperCase() });
  }
  return cikan.sort((p, q) => p.a.name.localeCompare(q.a.name) || p.b.name.localeCompare(q.b.name));
}

function fiyatEtiketi(t: Arac): string {
  const p = ilkUcretliBasamak(t as never);
  return p ? planEtiketi(p) : "no published price";
}

export default function ComparisonsHub() {
  const liste = satirlar();

  /* Harfe gore gruplanir: 100+ satirlik duz bir liste taranamaz. */
  const gruplar = new Map<string, Satir[]>();
  for (const s of liste) {
    const g = gruplar.get(s.harf) ?? [];
    g.push(s);
    gruplar.set(s.harf, g);
  }

  const sema = kirintiSemasi([{ ad: "Comparisons", yol: "/compare" }]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sema) }} />
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-semibold sm:text-4xl">Software comparisons</h1>
        <p className="mt-4 max-w-3xl text-ink-soft">
          {liste.length} head-to-head pages, each one built from the two vendors&apos; own pricing pages.
          Where a vendor publishes plan prices we list every step and the sentence it came from; where a
          vendor publishes nothing, we say that instead of guessing. Pairs only appear here once the page
          has something specific to say about that combination.
        </p>

        {[...gruplar.entries()].map(([harf, satir]) => (
          <section key={harf} className="mt-10">
            <h2 className="text-lg font-semibold text-ink-soft">{harf}</h2>
            <ul className="mt-3 list-none space-y-2 p-0">
              {satir.map((s) => (
                <li key={s.slug} className="border-t border-line pt-2">
                  <Link
                    href={`/compare/${s.slug}`}
                    className="font-medium no-underline transition-colors duration-150 hover:text-accent"
                  >
                    {s.a.name} vs {s.b.name}
                  </Link>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {s.a.name}: {fiyatEtiketi(s.a)} · {s.b.name}: {fiyatEtiketi(s.b)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>

      <Footer />
    </>
  );
}
