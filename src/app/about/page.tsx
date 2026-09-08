import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";
import toolsData from "@/data/tools.json";
import type { Arac } from "@/lib/arac";
import { dogrulanmamisSayisi } from "@/lib/fiyat";

export const metadata: Metadata = {
  title: "About ToolCompare | ToolCompare",
  description:
    "Who runs ToolCompare, how the catalogue is built, what we check by hand, and how the site is funded.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About ToolCompare | ToolCompare",
    description: "Who runs ToolCompare, how the catalogue is built, and how the site is funded.",
    url: "/about",
    siteName: "ToolCompare",
    type: "article",
  },
};

export default function AboutPage() {
  const araclar = toolsData as Arac[];
  const toplam = araclar.length;
  const incelenen = araclar.filter((t) => t.incelendi ?? t.verdict).length;
  const dogrulanmis = toplam - dogrulanmamisSayisi(araclar);

  return (
    <div>
      <Header />
      <main className="doc">
        <h1>About ToolCompare</h1>
        <p>
          ToolCompare is an independent buyer&apos;s guide to software tools: CRMs, editors, hosting,
          analytics, design and developer tools. It is published by Nocturn Dev, a small software
          studio, and written and maintained by its founder. There is no editorial team behind a
          curtain and no vendor on the payroll.
        </p>

        <section>
          <h2>What the site is</h2>
          <p>
            The catalogue currently covers {toplam} tools. For each one we record the starting price,
            the pricing model, what the free tier actually includes, and the practical limits that
            vendor pricing pages tend to leave out. {incelenen} tools carry a written verdict with
            pros and cons, and {dogrulanmis} have a price we checked against the vendor&apos;s own
            page. The numbers on this page are read from the same data file the rest of the site uses,
            so they are current, not marketing copy.
          </p>
          <p>
            Comparison pages put two tools side by side on the same criteria. Alternatives pages list
            what people switch to and why. Category pages rank tools inside one job. All three are built
            from the same underlying records, which is how a small team keeps hundreds of pages
            consistent.
          </p>
        </section>

        <section>
          <h2>What we check by hand</h2>
          <p>
            Prices are copied from vendor pricing pages, not from other review sites. When a price
            cannot be verified, the tool page says so instead of guessing. The rules for scores and
            ordering are written down in advance on the{" "}
            <Link href="/methodology">how we rank</Link> page, and they do not change for tools that pay
            us.
          </p>
          <p>
            We do get things wrong: vendors change plans, rename tiers and move features between them.
            If you spot an outdated price or a wrong claim, email{" "}
            <a href="mailto:hello@toolcompare.net">hello@toolcompare.net</a> and it will be corrected,
            with the page&apos;s verified date updated.
          </p>
        </section>

        <section>
          <h2>How the site is funded</h2>
          <p>
            Through affiliate links where a vendor runs a programme, and nothing else. No sponsored
            placements, no paid rankings, no vendor-written reviews. The full statement, including
            which links are compensated and how they are marked in the page source, is on the{" "}
            <Link href="/affiliate-disclosure">affiliate disclosure</Link> page.
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>
            Corrections, listing requests and partnership questions all go to{" "}
            <a href="mailto:hello@toolcompare.net">hello@toolcompare.net</a>. Vendors who want a tool
            added or a listing updated can use the <Link href="/submit">submit a tool</Link> form.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
