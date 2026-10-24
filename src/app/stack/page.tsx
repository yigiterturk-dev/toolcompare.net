import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StackCalculator from "@/components/StackCalculator";
import toolsData from "@/data/tools.json";
import type { Arac } from "@/lib/arac";
import { stackAraclari } from "@/lib/stack";
import { stackAlternatifleri } from "@/lib/stack-alternatives";
import { kirintiSemasi } from "@/lib/yapilandirilmis";

export const metadata: Metadata = {
  alternates: { canonical: "/stack" },
  title: "Software Stack Cost Calculator | ToolCompare",
  description:
    "Add the tools your team pays for, choose a plan and seat count, and see the real monthly and annual cost — using vendor prices we verified by hand.",
  openGraph: {
    title: "Software Stack Cost Calculator | ToolCompare",
    description:
      "Add the tools your team pays for, choose a plan and seat count, and see the real monthly and annual cost.",
    url: "/stack",
    siteName: "ToolCompare",
    type: "website",
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: "ToolCompare stack cost calculator" }],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/brand/og.png"],
  },
};

const ADIMLAR = [
  {
    baslik: "Plan-level, not “from” prices",
    metin:
      "Every option comes from the vendor’s own plan ladder. The date next to each tool is the day we last checked that page.",
  },
  {
    baslik: "Per-seat math, done once",
    metin:
      "Seat-priced plans multiply by headcount; flat plans do not. Annual figures assume twelve months at the same rate.",
  },
  {
    baslik: "A link, not a spreadsheet",
    metin:
      "The whole stack lives in the URL. Copy it into a budget doc or send it to your finance team — no account needed.",
  },
];

export default function StackPage() {
  const alternatifler = stackAlternatifleri(toolsData as Arac[]);
  const tools = stackAraclari(toolsData as Arac[]).map((tool) => ({
    ...tool,
    alternatives: alternatifler[tool.slug] ?? [],
  }));
  const sema = kirintiSemasi([
    { ad: "Tools", yol: "/tools" },
    { ad: "Stack cost calculator", yol: "/stack" },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sema) }} />
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <p className="text-sm font-medium tracking-wide text-ink-muted uppercase">Stack cost</p>
        <h1 className="mt-2 max-w-3xl font-serif text-3xl font-semibold sm:text-4xl">
          What does your software stack actually cost?
        </h1>
        <p className="mt-4 max-w-2xl text-ink-soft">
          Pick the tools your team pays for, set the plan and seat count, and the monthly and annual
          total updates as you go. Only tools with a plan-level price we verified against the
          vendor&apos;s own page are included — {tools.length} of them.
        </p>

        <StackCalculator tools={tools} />

        <section className="mt-14 grid gap-6 border-t border-line pt-8 sm:grid-cols-3">
          {ADIMLAR.map((adim) => (
            <div key={adim.baslik}>
              <h2 className="font-serif text-lg font-semibold">{adim.baslik}</h2>
              <p className="mt-2 text-sm text-ink-soft">{adim.metin}</p>
            </div>
          ))}
        </section>

        <p className="mt-8 max-w-3xl text-sm text-ink-soft">
          Prices change. If a plan looks stale,{" "}
          <Link href="/contact" className="text-accent underline underline-offset-4">
            tell us
          </Link>{" "}
          and we will re-check it. Read{" "}
          <Link href="/methodology" className="text-accent underline underline-offset-4">
            how we verify pricing
          </Link>{" "}
          or browse{" "}
          <Link href="/tools" className="text-accent underline underline-offset-4">
            every tool we track
          </Link>
          . Vendor changes land in the{" "}
          <Link href="/price-changes" className="text-accent underline underline-offset-4">
            price log
          </Link>
          .
        </p>
      </main>

      <Footer />
    </>
  );
}
