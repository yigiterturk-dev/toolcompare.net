/**
 * Acik veri sayfasi (/data).
 *
 * NEDEN VAR: `/api/tools` bu veriyi en basindan herkese aciyordu ama
 * hicbir yerde BELGELENMEMISTI -- lisans yok, atif satiri yok, alanlarin
 * ne anlama geldigi yazili degil. Yani sitenin nisinde kimsede olmayan
 * varligi (TARIHLI, KAYNAKLI, "bunu dogrulayamadik" notlu fiyat verisi)
 * kapali bir kapinin arkasinda duruyordu.
 *
 * OLCUM (2026-09-10, GSC): 11.800 gosterim / 1 tik, niyet sorgulari
 * geldi ama ortalama sira 57. On-page tarafinda yapacak is bitti;
 * eksik olan OTORITE. Otorite satin alinmaz, ATIF ile gelir: veriyi
 * CC BY 4.0 ile yayimlamak, kullanan kisiyi kaynak GOSTERMEK zorunda
 * birakir -- kaynak gostermek de link demektir. Bu sayfanin isi o.
 *
 * Ayrica sayfa bilerek veriyi KOTULUYOR: neyin dogrulanmadigini,
 * placeholder kanitin ne oldugunu ve fiyatin neden eksik olabilecegini
 * yaziyor. Veri kumesini ciddiye alan kisi once sinirlarini okur.
 */

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";
import toolsData from "@/data/tools.json";
import type { Arac } from "@/lib/arac";
import { OG_GORSEL } from "@/lib/paylasim";
import { seffaflikOzeti } from "@/lib/seffaflik";

export const metadata: Metadata = {
  title: "Open Dataset: Verified SaaS Pricing | ToolCompare",
  description:
    "A free, CC BY 4.0 dataset of software pricing with the source URL and the date each price was read — including the records we could not verify. Public JSON endpoint, no key required.",
  alternates: { canonical: "/data" },
  openGraph: {
    title: "Open Dataset: Verified SaaS Pricing | ToolCompare",
    description:
      "Software pricing with the source URL and the date each price was read, including what we could not verify. CC BY 4.0, public JSON endpoint.",
    url: "/data",
    siteName: "ToolCompare",
    type: "article",
    images: [{ url: OG_GORSEL, width: 1200, height: 630, alt: "ToolCompare" }],
  },
};

const SURUM = "2026-09-10";

type Sayim = {
  toplam: number;
  kaynakli: number;
  somutFiyat: number;
  derin: number;
  sss: number;
  sssMadde: number;
  durumlar: [string, number][];
};

/* Sayilar veriden uretiliyor: sayfa bayatlamasin. */
function say(araclar: Arac[]): Sayim {
  const FIYAT =
    /([$€£₹]\s?\d|\d+(?:[.,]\d+)?\s?(?:USD|EUR|GBP)\b|\d[^.]{0,24}\bper (?:user|seat|month|employee|contractor)\b|\bcontact sales\b|\bcustom pricing\b|\bquote\b)/i;
  const OZ =
    /(\bfree\b|\bno price\b|\bopen source\b|\b(?:plan|tier|edition)s?\b[^.]{0,60}\d|\d[^.]{0,60}\b(?:plan|tier|edition)s?\b)/i;
  const d: Record<string, number> = {};
  let kaynakli = 0;
  let somutFiyat = 0;
  for (const t of araclar) {
    const e = t.evidence as Arac["evidence"] | undefined;
    if (!e) continue;
    kaynakli += 1;
    const durum = e.status || "unknown";
    d[durum] = (d[durum] || 0) + 1;
    const somut = (e.sources || []).some((s) => {
      const metin = (s.supports || []).join(" ");
      return FIYAT.test(metin) || OZ.test(metin);
    });
    if (somut) somutFiyat += 1;
  }
  return {
    toplam: araclar.length,
    kaynakli,
    somutFiyat,
    derin: araclar.filter((t) => t.bestFor && t.skipIf).length,
    sss: araclar.filter((t) => (t.sss || []).length > 0).length,
    sssMadde: araclar.reduce((s, t) => s + (t.sss || []).length, 0),
    durumlar: Object.entries(d).sort((a, b) => b[1] - a[1]),
  };
}

const DURUM_ANLAMI: Record<string, string> = {
  "pricing-page-verified":
    "An editor opened the vendor's own pricing page and read the plans line by line. At least one source lists a concrete price or plan limit.",
  "vendor-sourced":
    "Sourced from the vendor's own pages, but the price itself is missing or unreadable — regional currency, a client-side figure, a slider, or a vendor that does not publish one. Limits are recorded, the price is not invented.",
  "open-source-verified":
    "The vendor's own page states the software is open source and free. The price claim is zero and it is sourced.",
  observed: "Recorded from observed product behaviour rather than a pricing page.",
  tested: "Recorded from our own hands-on test of the product.",
  unknown: "Status not established.",
};

export default function DataPage() {
  const araclar = toolsData as Arac[];
  const s = say(araclar);
  /* Oran sayfaya elle yazilmasin: olcum degistiginde burasi sessizce eskir. */
  const seffaflik = seffaflikOzeti(araclar);
  const atif = `ToolCompare, Verified SaaS Pricing Dataset (version ${SURUM}). https://toolcompare.net/data — licensed CC BY 4.0.`;

  /*
    DATASET SEMASI (2026-09-12). Sayfa lisansi, atfi ve indirme adresini
    DUZ YAZIYLA soyluyordu ama makineye hic soylemiyordu: /data'da tek bir
    JSON-LD yoktu. Google'in veri kumesi aramasi (ve ayni semayi okuyan
    diger toplayicilar) schema.org/Dataset uzerinden calisir -- yani
    sitenin atif alinmak icin kurdugu asil varlik, o kanala gorunmezdi.
    Ayni sema /research/pricing-transparency'de zaten vardi; burada yoktu.

    Alanlar uydurulmuyor: sayilar sayfanin kendi olcumunden (`say`,
    `seffaflikOzeti`), lisans ve atif yukaridaki `atif` cumlesinden, iki
    dagitim adresi de canli ve dogru tipte donuyor (/api/tools JSON,
    /api/pricing-transparency CSV).
  */
  const sema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "ToolCompare Verified SaaS Pricing Dataset",
    description:
      `Pricing, plan ladders and documented capabilities for ${s.toplam} software products. ` +
      `Every price figure carries the vendor page it was read from and the date it was read.`,
    url: "https://toolcompare.net/data",
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: { "@type": "Organization", name: "ToolCompare", url: "https://toolcompare.net" },
    version: SURUM,
    isAccessibleForFree: true,
    keywords: ["software pricing", "SaaS pricing", "pricing transparency", "software comparison"],
    distribution: [
      {
        "@type": "DataDownload",
        encodingFormat: "application/json",
        contentUrl: "https://toolcompare.net/api/tools",
      },
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
        <h1>Open dataset: software pricing, with its receipts</h1>
        <p>
          Everything this site knows about {s.toplam} software products is available as a single public JSON
          document. No key, no sign-up, no rate limit to negotiate. It is free to use commercially under{" "}
          <strong>CC BY 4.0</strong> — the one condition is attribution.
        </p>
        <p>
          <a href="/api/tools" rel="nofollow">
            <code>GET https://toolcompare.net/api/tools</code>
          </a>{" "}
          — returns the full array. CORS is open and the response is cached for a day.
        </p>
        <p>
          The full document is around 1.8&nbsp;MB, so three query parameters are available to keep
          it sane:
        </p>
        <ul>
          <li>
            <code>?fields=slug,name,basePrice,fiyatModeli</code> — only the top-level fields you name
          </li>
          <li>
            <code>?format=compact</code> — identity, price and billing model, plus{" "}
            <code>evidence.status</code> and its date, without the full source list
          </li>
          <li>
            <code>?limit=50&amp;offset=100</code> — pagination; the total is returned in the{" "}
            <code>X-Total-Count</code> header
          </li>
        </ul>
        <p>
          With no parameters the response is unchanged from before, so existing callers keep working.
        </p>

        <section>
          <h2>Why this exists</h2>
          <p>
            Pricing pages are the least stable documents on the web and almost nobody writes down{" "}
            <em>when</em> they read one. A figure with no date and no source is a rumour. Every price here
            carries the URL it came from and the date an editor read it, and the records we could{" "}
            <strong>not</strong> verify say so in the data itself rather than being quietly rounded to a
            plausible number.
          </p>
          <p>
            That last part is the point. If you are citing a pricing figure, you need to know how much weight
            it carries. This dataset tells you.
          </p>
          <p>
            One finding already drawn from it:{" "}
            <Link href="/research/pricing-transparency">the pricing transparency index</Link> — of the
            products whose vendor page an editor actually reached, {seffaflik.rakamsizYuzde}% publish no
            readable price at all.
          </p>
        </section>

        <section>
          <h2>What is in it today</h2>
          <ul>
            <li>
              <strong>{s.toplam}</strong> products, of which <strong>{s.kaynakli}</strong> carry dated
              evidence metadata
            </li>
            <li>
              <strong>{s.somutFiyat}</strong> cite a concrete price or plan limit in at least one source — the
              rest are explicitly marked as unverified rather than guessed
            </li>
            <li>
              <strong>{s.derin}</strong> carry an editorial criteria layer (<code>bestFor</code> /{" "}
              <code>skipIf</code>) and <strong>{s.sss}</strong> carry hand-written Q&amp;A (
              {s.sssMadde} entries)
            </li>
          </ul>
        </section>

        <section>
          <h2>The fields that matter</h2>
          <p>
            Most fields are self-describing. These are the ones worth reading before you trust a number:
          </p>
          <ul>
            <li>
              <code>evidence.status</code> — how the price was established. Values below.
            </li>
            <li>
              <code>evidence.sources[].url</code> and <code>.checkedAt</code> — where the claim came from and
              the date it was read.
            </li>
            <li>
              <code>evidence.sources[].supports</code> — the specific plan facts that source backs. If this is
              vague, the record is weak; treat it as such.
            </li>
            <li>
              <code>evidence.limitations</code> — what we could <em>not</em> establish. Read this first.
            </li>
            <li>
              <code>basePrice</code> and <code>fiyatModeli</code> — the starting price of the cheapest paid
              plan, and its billing model. A <code>basePrice</code> of <code>0</code> means a free tier or an
              unpriceable model, never &quot;free software&quot;.
            </li>
            <li>
              <code>planlar</code> — the vendor&apos;s published plan ladder, not just its entry price: each
              step carries <code>ad</code> (plan name), <code>aylik</code> (monthly figure),{" "}
              <code>birim</code> (<code>kisi-basina</code> per seat, or <code>sabit</code> flat),{" "}
              <code>faturalama</code> (annual or monthly), and — this is the part worth citing —{" "}
              <code>kaynakSatiri</code>, the exact sentence the number was read from, with{" "}
              <code>kaynakUrl</code>. Every figure is traceable to a line an editor recorded from the
              vendor&apos;s own pricing page. Percentage cuts, per-transaction fees, hourly usage rates and
              hardware prices are deliberately excluded: they are not plan steps.
            </li>
          </ul>

          <h3>
            <code>evidence.status</code> values
          </h3>
          <ul>
            {s.durumlar.map(([durum, adet]) => (
              <li key={durum}>
                <code>{durum}</code> ({adet}) — {DURUM_ANLAMI[durum] || "Undocumented status."}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2>What this dataset is not</h2>
          <ul>
            <li>
              <strong>Not a benchmark.</strong> Nothing here is a measured performance result. It is a reading
              of vendor-published material.
            </li>
            <li>
              <strong>Not a quality ranking.</strong> There are no star ratings and no scores; see{" "}
              <Link href="/methodology">how we rank</Link>.
            </li>
            <li>
              <strong>Not current by definition.</strong> Each record is accurate as of its own{" "}
              <code>checkedAt</code> date and no later. Vendors change prices without notice.
            </li>
            <li>
              <strong>Not complete on price.</strong> {s.kaynakli - s.somutFiyat} sourced records still have no
              concrete price, usually because the vendor does not publish one. That gap is visible in the data
              on purpose.
            </li>
          </ul>
        </section>

        <section>
          <h2>Licence and attribution</h2>
          <p>
            Licensed under{" "}
            <a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener noreferrer" target="_blank">
              Creative Commons Attribution 4.0 International
            </a>
            . Use it in an article, a product, a model&apos;s training set or a spreadsheet — commercially or
            not. Credit the source and link back:
          </p>
          <blockquote>
            <code>{atif}</code>
          </blockquote>
          <p>
            Found a price that is wrong or out of date? That is the most useful thing you can send us —{" "}
            <Link href="/contact">tell us</Link> and we will re-read the vendor&apos;s page and update the{" "}
            <code>checkedAt</code> date.
          </p>
          <p>
            <small>Dataset version {SURUM}.</small>
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
