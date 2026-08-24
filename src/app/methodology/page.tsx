/**
 * Metodoloji sayfasi.
 *
 * NEDEN VAR: site her sayfada araclari siraliyor ve "en iyi", "en ucuz",
 * "daha kolay" diyor -- ama bu sayilarin NEREDEN geldigini hicbir yerde
 * soylemiyordu. Bir karsilastirma sitesinin tek sermayesi guvenilir
 * olmasi; olcutunu gizleyen site guvenilir degildir.
 *
 * Sayfa bilerek RAHATSIZ EDICI derecede acik: puanlarin sinirlarini,
 * fiyatlarin dogrulanmamis olabilecegini ve paranin nasil kazanildigini
 * (su an: hic) oldugu gibi yaziyor. Zayif noktalari saklamak yerine
 * yazmak, uzun vadede hem Google hem okuyucu icin daha degerli.
 */

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";
import toolsData from "@/data/tools.json";
import { dogrulanmamisSayisi } from "@/lib/fiyat";
import { kategoriler } from "@/lib/categories";

export const metadata: Metadata = {
  title: "How We Score and Rank Tools | ToolCompare",
  description:
    "Where our scores come from, what our prices mean, what we could not verify, and how ToolCompare makes money. Written plainly, including the weak spots.",
  alternates: { canonical: "/methodology" },
  openGraph: {
    title: "How We Score and Rank Tools | ToolCompare",
    description:
      "Where our scores come from, what our prices mean, what we could not verify, and how ToolCompare makes money.",
    url: "/methodology",
    siteName: "ToolCompare",
    type: "article",
  },
};

export default function MethodologyPage() {
  const araclar = toolsData as any[];
  const toplam = araclar.length;
  const dogrulanmamis = dogrulanmamisSayisi(araclar);
  const dogrulanmis = toplam - dogrulanmamis;

  const ozellikPuanlari = araclar.map((t) => t.featuresScore).filter((n) => typeof n === "number");
  const ozellikAlt = Math.min(...ozellikPuanlari);
  const ozellikUst = Math.max(...ozellikPuanlari);
  const kolaylikPuanlari = araclar.map((t) => t.ease).filter((n) => typeof n === "number");
  const kolaylikAlt = Math.min(...kolaylikPuanlari);
  const kolaylikUst = Math.max(...kolaylikPuanlari);

  const B = ({ children }: { children: React.ReactNode }) => (
    <section style={{ marginBottom: '3.5rem' }}>{children}</section>
  );

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: 'white' }}>
      <Header />
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
          How we score and rank tools
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: 1.75 }}>
          Every page on this site puts tools in an order and uses words like &quot;best&quot;, &quot;cheapest&quot; and
          &quot;easier&quot;. This page explains where those judgements come from — including the places where
          our data is weak. If a comparison site will not tell you its method, the ranking is worth nothing.
        </p>

        <B>
          <h2 style={{ fontSize: '1.6rem', margin: '3rem 0 1rem' }}>The two scores</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
            Each tool carries two numbers: <strong style={{ color: 'white' }}>ease of use</strong> and{' '}
            <strong style={{ color: 'white' }}>feature depth</strong>. Their sum is what orders every category
            page, every alternatives list, and which tools we treat as each other&apos;s closest peers.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
            These are <strong style={{ color: 'white' }}>our own editorial scores</strong>. They are not supplied
            by vendors, not bought, and not independently audited.
          </p>
          <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '20px', padding: '1.8rem', marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem' }}>Where this is weak</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0 }}>
              Across all {toplam} tools, feature depth only spans {ozellikAlt}–{ozellikUst} and ease of use
              spans {kolaylikAlt}–{kolaylikUst}. A range that narrow separates tools far less than the
              precise-looking numbers suggest. Treat a gap of a few points as noise, not as a verdict — we do
              the same: on comparison pages, any difference under 5 points is reported as
              &quot;effectively tied&quot; rather than as a winner.
            </p>
          </div>
        </B>

        <B>
          <h2 style={{ fontSize: '1.6rem', margin: '3rem 0 1rem' }}>What our prices mean</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
            A price on this site is the published starting price of the cheapest paid plan, where we could
            establish one. Right now that is <strong style={{ color: 'white' }}>{dogrulanmis} of {toplam}</strong> tools.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
            The remaining {dogrulanmamis} are shown as <em>not verified</em>, <em>usage-based</em> or{' '}
            <em>free tier</em>, and they are deliberately left out of every &quot;cheapest&quot; claim and every
            price comparison. Showing a usage-based tool such as Stripe or AWS as &quot;$0/mo&quot; would be
            cheaper to write and simply untrue.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
            Software pricing changes often. We do not yet stamp each tool with the date its price was last
            checked, so treat every figure as a starting point and confirm on the vendor&apos;s own page before
            you buy.
          </p>
        </B>

        <B>
          <h2 style={{ fontSize: '1.6rem', margin: '3rem 0 1rem' }}>What we do not publish</h2>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.9, paddingLeft: '1.2rem' }}>
            <li>No star ratings and no review counts — we do not collect them, so we do not show them.</li>
            <li>No sponsored placements, and no &quot;partner&quot; tiers that move a tool up the page.</li>
            <li>No invented complaints. The drawbacks on an alternatives page are the ones from our own review of that tool.</li>
          </ul>
        </B>

        <B>
          <h2 style={{ fontSize: '1.6rem', margin: '3rem 0 1rem' }}>How we make money</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
            At the moment: we do not. ToolCompare is in no affiliate programme and earns no commission from
            any link on this site.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
            That is likely to change. If it does, this page and our{' '}
            <Link href="/terms" style={{ color: 'var(--brand-primary)' }}>terms</Link> will be updated before a
            single paid link goes live, every compensated link will be marked as sponsored, and the ranking
            rules above will not change to favour tools that pay us. Ranking by who pays is the failure mode
            of this entire category of website; the whole point of the rules on this page is that they are
            written down in advance.
          </p>
        </B>

        <B>
          <h2 style={{ fontSize: '1.6rem', margin: '3rem 0 1rem' }}>Coverage</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
            We track {toplam} tools across {kategoriler().length} categories. That is a fraction of the market,
            so &quot;best&quot; on this site means best of what we track — not best in existence. Missing something?{' '}
            <Link href="/submit" style={{ color: 'var(--brand-primary)' }}>Send it in</Link>.
          </p>
        </B>
      </main>
      <Footer />
    </div>
  );
}
