import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { kategoriler } from "@/lib/categories";
import { kirintiSemasi } from "@/lib/yapilandirilmis";
import { fiyatDurumu } from "@/lib/fiyat";
import { aracIndekslenir } from "@/lib/indeks";
import type { Arac } from "@/lib/arac";

/*
  ARAC DIZINI -- /tools

  Bu adres CANLIDA 404 DONUYORDU. /tools/<slug> altinda 518 sayfa var,
  ustundeki dizin adresi hic uretilmemisti; Footer ve Header da oraya
  link vermiyordu. Sonuc iki tarafli:

  1. Ziyaretci /tools/notion adresinden bir ust basamaga cikamiyordu
     (kirinti semasinda "Tools" yaziyor ama tiklanacak sayfa yok).
  2. Arac sayfalarinin yarisindan fazlasi siteden yalnizca kendi
     kategorisi uzerinden link aliyordu. Kategori sayfalari fiyata gore
     siralanip kirpilmiyor ama 117 araclik "Developer Tools" gibi bir
     listede asagi kisim pratikte derinde kaliyor.

  Dizin sayfasi bunun standart cozumu: TEK sayfadan her arac sayfasina
  dogrudan link. Sayfa kurgulanmis metin degil, kasitli olarak bir
  kapi -- ama bos bir sablon da degil: her satir aracin baslangic
  fiyatini ve o fiyatin dogrulanip dogrulanmadigini tasiyor, ki sitenin
  tek gercek verisi budur.
*/

export const metadata = {
  alternates: { canonical: "/tools" },
  title: "All Software Tools A–Z | ToolCompare",
  description:
    "Every tool we track, grouped by category with its verified starting price — the full index of individual tool reviews and pricing pages.",
};

export default function ToolsIndexPage() {
  /*
    INDEKS KAPISI (2026-09-16): dizin sayfasindaki her link, hedefin
    indeks kapisini de sormali. Katalog yeni eklenen (incelenmemis)
    araclar noindex durumdayken dizin onlari basiyordu — taze build'te
    71 siziintinin kaynagi bu sayfaydi. Kural tek: SITEMAP'TE OLANI LINKLE.
  */
  const kategoriListesi = kategoriler()
    .map((k) => ({ ...k, araclar: k.araclar.filter(aracIndekslenir) }))
    .filter((k) => k.araclar.length > 0);
  const sema = kirintiSemasi([{ ad: "Tools", yol: "/tools" }]);

  const tumAraclar = kategoriListesi.flatMap((k) => k.araclar);
  const dogrulanmis = tumAraclar.filter((t) => {
    const d = fiyatDurumu(t);
    return d.karsilastirilabilir && d.aylik !== null;
  }).length;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sema) }} />
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">All tools</h1>
        <p className="mt-3 max-w-2xl text-ink-soft">
          {tumAraclar.length} tools across {kategoriListesi.length} categories. {dogrulanmis} of them
          have a starting price we checked against the vendor&apos;s own pricing page; the rest are
          listed with what the vendor publishes and marked unverified. Inside each category the
          cheapest verified price comes first.
        </p>

        {/* Kategori atlama serisi: 518 satirlik bir sayfada ust kisim
            olmadan gezinme imkansiz. */}
        <nav aria-label="Jump to category" className="mt-8">
          <ul className="flex list-none flex-wrap gap-2 p-0">
            {kategoriListesi.map((kat) => (
              <li key={kat.slug}>
                <a
                  href={`#${kat.slug}`}
                  className="inline-flex rounded-[--radius-pill] border border-line bg-surface px-3 py-1.5 text-sm text-ink-soft no-underline transition-colors duration-150 hover:border-line-strong hover:text-ink"
                >
                  {kat.ad} <span className="ml-1.5 text-ink-muted tabular-nums">{kat.araclar.length}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {kategoriListesi.map((kat) => (
          <section key={kat.slug} id={kat.slug} className="mt-14 scroll-mt-24 border-t border-line pt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-serif text-2xl font-semibold">{kat.ad}</h2>
              <Link
                href={`/categories/${kat.slug}`}
                className="text-sm text-accent underline underline-offset-4"
              >
                {kat.ad} compared and ranked →
              </Link>
            </div>

            <ul className="mt-5 grid list-none grid-cols-1 gap-x-8 gap-y-px p-0 sm:grid-cols-2 lg:grid-cols-3">
              {kat.araclar.map((tool: Arac) => {
                const d = fiyatDurumu(tool);
                return (
                  <li key={tool.slug} className="border-b border-line">
                    <Link
                      href={`/tools/${tool.slug}`}
                      className="flex items-baseline justify-between gap-3 py-2.5 no-underline transition-colors duration-150 hover:text-accent"
                    >
                      <span className="min-w-0 truncate text-sm font-medium text-ink">{tool.name}</span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className="text-xs text-ink-soft tabular-nums">{d.kisa}</span>
                        <span
                          aria-hidden="true"
                          className={`size-1.5 shrink-0 rounded-full ${
                            d.karsilastirilabilir ? "bg-verified" : "bg-unverified"
                          }`}
                        />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </main>

      <Footer />
    </>
  );
}
