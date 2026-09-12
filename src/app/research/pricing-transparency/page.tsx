/**
 * PRICING TRANSPARENCY INDEX (/research/pricing-transparency).
 *
 * NEDEN VAR: 2026-09-08 GSC olcumu -- 626 URL'nin tamami indeksli, robots
 * temiz, canonical dogru, ortalama sira 54. Yani sayfalar goruluyor ve
 * begenilmiyor degil; domain'in agirligi yok. GSC Links raporu bu domain
 * icin "processing data" donuyor: raporlanacak dis link YOK. Icerik
 * cilalamak bu tabloyu degistirmez, atif degistirir.
 *
 * Karsilastirma sayfasi kimse linklemez. OLCUM linklenir. Elimizde
 * kimsede olmayan hammadde var: 512 urunun fiyat sayfasi elle acildi,
 * her iddia kaynak URL'si ve okunma tarihiyle duruyor (bkz. /data).
 * Bu sayfa o hammaddeden alintilanabilir tek bir bulgu cikariyor.
 *
 * Sayfanin en onemli bolumu "What this does not claim". Bu tur bir
 * olcumu curutmenin en kolay yolu, iddiayi tasidigindan buyuk gostermek:
 * "rakam bulunamadi" ile "satici gizliyor" ayni sey degil ve bunu bizim
 * yazmamiz gerekiyor -- itiraz eden okuyucunun degil. Sayilarin nasil
 * uretildigi src/lib/seffaflik.ts'te, testi tests/seffaflik.test.ts'te.
 */

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";
import toolsData from "@/data/tools.json";
import type { Arac } from "@/lib/arac";
import { seffaflikOzeti, ASGARI_ORNEKLEM, type BulunamamaSebebi } from "@/lib/seffaflik";
import { OG_GORSEL } from "@/lib/paylasim";

/* Olcumun surumu. Tekrarlandiginda artar; eski surum alintilarda yasar. */
const SURUM = "2026-09-11";

export const metadata: Metadata = {
  // 67 karakterdi ve arama sonucunda kesiliyordu (olcum, 2026-09-12).
  // Marka adi dusuruldu: kesilen sey basligin ANLAMI olmamali.
  title: "The Pricing Transparency Index: 472 Software Products",
  description:
    "We opened the pricing page of 472 software products by hand and recorded whether a price could actually be read. 43% carried no usable figure. Full method, per-category breakdown and the raw CSV.",
  alternates: { canonical: "/research/pricing-transparency" },
  openGraph: {
    title: "The Pricing Transparency Index: 472 Software Products",
    description:
      "43% of software products publish no usable price figure on their own pricing page. Method, per-category breakdown and raw data, free under CC BY 4.0.",
    url: "/research/pricing-transparency",
    siteName: "ToolCompare",
    type: "article",
    images: [{ url: OG_GORSEL, width: 1200, height: 630, alt: "ToolCompare Pricing Transparency Index" }],
  },
};

const SEBEP_METNI: Record<BulunamamaSebebi, { baslik: string; aciklama: string }> = {
  "free-tier-only": {
    baslik: "Free tier announced, paid tier priced nowhere",
    aciklama:
      "The most common shape by a distance. The vendor is happy to tell you the part that costs nothing and goes quiet about the part that costs money.",
  },
  "no-figure-published": {
    baslik: "Pricing page exists, carries no number at all",
    aciklama:
      "A page titled Pricing that names plans and features without ever printing a figure. In some of these the number is rendered by JavaScript we could not read — see the caveats below.",
  },
  "usage-based": {
    baslik: "Priced per unit of usage",
    aciklama:
      "Per request, per seat-hour, per gigabyte. These are genuinely hard to reduce to one monthly figure, and we do not count them as evasion.",
  },
  "quote-only": {
    baslik: "Contact us for a quote",
    aciklama:
      "The honest version of opacity: the vendor states plainly that the price is negotiated. Rarer than the reputation of enterprise software suggests.",
  },
};

const SEBEP_SIRASI: BulunamamaSebebi[] = [
  "free-tier-only",
  "no-figure-published",
  "usage-based",
  "quote-only",
];

export default function PricingTransparencyPage() {
  const ozet = seffaflikOzeti(toolsData as Arac[]);
  const enKotu = ozet.kategoriler[0];
  const enIyi = ozet.kategoriler[ozet.kategoriler.length - 1];
  const atif = `ToolCompare, Pricing Transparency Index (version ${SURUM}). https://toolcompare.net/research/pricing-transparency — licensed CC BY 4.0.`;

  const sema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "ToolCompare Pricing Transparency Index",
    description: `Whether a readable price figure could be found on the vendor's own pricing page, for ${ozet.incelenen} software products, with the source URL and the date each page was read.`,
    url: "https://toolcompare.net/research/pricing-transparency",
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: { "@type": "Organization", name: "ToolCompare", url: "https://toolcompare.net" },
    version: SURUM,
    isAccessibleForFree: true,
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "text/csv",
        contentUrl: "https://toolcompare.net/api/pricing-transparency",
      },
    ],
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sema) }} />
      <Header />
      <main className="doc">
        <p className="text-sm uppercase tracking-wide text-ink-muted">
          Research · version {SURUM}
        </p>
        <h1>The pricing transparency index</h1>
        <p>
          Between August and September 2026 we opened the pricing page of every product in this catalogue
          by hand and wrote down one thing: could a person actually read a price off it?
        </p>
        <p>
          Of the <strong>{ozet.incelenen}</strong> products where an editor reached the vendor&apos;s own
          page, <strong>{ozet.rakamsiz}</strong> carried no usable figure — <strong>{ozet.rakamsizYuzde}%</strong>.
          Not a rounded number, not an estimate: {ozet.rakamVar} products told us what they cost and{" "}
          {ozet.rakamsiz} did not.
        </p>

        <section>
          <h2>What this does not claim</h2>
          <p>
            This is the part most write-ups skip, so it goes first. The measurement is{" "}
            <strong>&quot;no readable figure was found&quot;</strong>, not{" "}
            <strong>&quot;the vendor is hiding the price&quot;</strong>. Those are different sentences and
            only the first one is supported by our data.
          </p>
          <ul>
            <li>
              Some prices are rendered by JavaScript our reader could not execute. The figure exists; we could
              not see it. Those records count as &quot;not found&quot; and that is a limit of the method.
            </li>
            <li>
              Some vendors show prices in the visitor&apos;s local currency. We refused to write a figure we
              could not attribute to a stable source, so those count as not found too.
            </li>
            <li>
              Usage-based pricing is not evasion. It is broken out separately below precisely so nobody has to
              take our word for how it was classified.
            </li>
            <li>
              {ozet.haricTutulan} products in the catalogue carry no dated evidence record — nobody has checked
              them properly yet. They are <strong>excluded</strong> from every number on this page. &quot;We did
              not look&quot; is not a finding about a vendor.
            </li>
          </ul>
          <p>
            Every classification is traceable to a source URL and the date it was read. If you think a record is
            wrong, the CSV below names the product; tell us and we will re-check it.
          </p>
        </section>

        <section>
          <h2>Why {ozet.rakamsiz} products had no figure</h2>
          <p>
            Lumping these together would hide the most interesting result. Split by reason:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line-strong">
                  <th className="py-2 pr-4 font-semibold">Reason</th>
                  <th className="py-2 pr-4 text-right font-semibold">Products</th>
                  <th className="py-2 text-right font-semibold">Share of the {ozet.rakamsiz}</th>
                </tr>
              </thead>
              <tbody>
                {SEBEP_SIRASI.map((s) => (
                  <tr key={s} className="border-b border-line align-top">
                    <td className="py-3 pr-4">
                      <strong>{SEBEP_METNI[s].baslik}</strong>
                      <br />
                      <span className="text-ink-soft">{SEBEP_METNI[s].aciklama}</span>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">{ozet.sebepler[s]}</td>
                    <td className="py-3 text-right tabular-nums">
                      {Math.round((ozet.sebepler[s] / ozet.rakamsiz) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            The headline is not &quot;contact us for a quote&quot; — that accounts for only{" "}
            {ozet.sebepler["quote-only"]} products. It is the free tier. {ozet.sebepler["free-tier-only"]}{" "}
            vendors advertise the tier that costs nothing and never print the price of the one that does.
            The opacity has moved from the enterprise sales call to the top of the funnel.
          </p>
        </section>

        <section>
          <h2>By category</h2>
          <p>
            Categories with fewer than {ASGARI_ORNEKLEM} reviewed products are left out; a percentage drawn
            from eight products is a headline, not a measurement.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-line-strong">
                  <th className="py-2 pr-4 font-semibold">Category</th>
                  <th className="py-2 pr-4 text-right font-semibold">Reviewed</th>
                  <th className="py-2 pr-4 text-right font-semibold">No figure</th>
                  <th className="py-2 text-right font-semibold">Share</th>
                </tr>
              </thead>
              <tbody>
                {ozet.kategoriler.map((k) => (
                  <tr key={k.kategori} className="border-b border-line">
                    <td className="py-2 pr-4">{k.kategori}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{k.incelenen}</td>
                    <td className="py-2 pr-4 text-right tabular-nums">{k.rakamsiz}</td>
                    <td className="py-2 text-right tabular-nums">{Math.round(k.oran * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {enKotu && enIyi && (
            <p>
              <strong>{enKotu.kategori}</strong> is the least forthcoming at {Math.round(enKotu.oran * 100)}%
              ({enKotu.rakamsiz} of {enKotu.incelenen}); <strong>{enIyi.kategori}</strong> the most, at{" "}
              {Math.round(enIyi.oran * 100)}%. The spread between the two is the finding worth arguing about:
              nothing about selling e-commerce software makes a price harder to print than selling project
              management software. It is a norm, not a constraint.
            </p>
          )}
        </section>

        <section>
          <h2>Method</h2>
          <ul>
            <li>
              <strong>Population:</strong> {ozet.toplam} products in the ToolCompare catalogue.{" "}
              {ozet.haricTutulan} excluded for having no dated evidence record, leaving {ozet.incelenen}.
            </li>
            <li>
              <strong>Source:</strong> the vendor&apos;s own pricing page, read by an editor, with the URL and
              the date recorded. Third-party reports, review sites and resellers were not used.
            </li>
            <li>
              <strong>&quot;Figure found&quot;</strong> means one of: a paid plan with a stated monthly amount,
              a stated starting price, or a product that is genuinely free. A published $0 is a published
              price, so free software counts as transparent rather than unknown.
            </li>
            <li>
              <strong>&quot;No figure&quot;</strong> means none of the above appeared in the page text, and is
              always recorded with one of the four reasons above.
            </li>
            <li>
              <strong>Window:</strong> pages were read between August and September 2026. Pricing pages change;
              each record carries its own read date so you can judge how stale it is.
            </li>
          </ul>
          <p>
            The full ranking method for the rest of the site, including what our scores can and cannot support,
            is on the <Link href="/methodology">methodology page</Link>.
          </p>
        </section>

        <section>
          <h2>Take the data</h2>
          <p>
            The record behind every number on this page is downloadable, free, and licensed{" "}
            <strong>CC BY 4.0</strong> — including commercially. One row per product: the classification, the
            reason, the date the evidence was read and how many sources back it.
          </p>
          <p>
            <a href="/api/pricing-transparency" rel="nofollow">
              <code>GET https://toolcompare.net/api/pricing-transparency</code>
            </a>{" "}
            — CSV, {ozet.incelenen} rows.
          </p>
          <p>
            The underlying per-product pricing records, with every source URL and quoted line, are on the{" "}
            <Link href="/data">open dataset page</Link>.
          </p>
          <h3>Citation</h3>
          <p>
            <code>{atif}</code>
          </p>
          <p>
            If you publish something using this, we would like to see it — <Link href="/contact">tell us</Link>.
            Corrections are welcome and get applied; this index is meant to be repeated, and a repeated
            measurement is only worth something if the first one was honest about its mistakes.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
