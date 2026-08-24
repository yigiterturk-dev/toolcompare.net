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
  title: "How We Rank Tools | ToolCompare",
  description:
    "Where our scores come from, what our prices mean, what we could not verify, and how ToolCompare makes money. Written plainly, including the weak spots.",
  alternates: { canonical: "/methodology" },
  openGraph: {
    title: "How We Rank Tools | ToolCompare",
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
  const incelenen = araclar.filter((t) => t.incelendi ?? t.verdict).length;
  const dogrulanmamis = dogrulanmamisSayisi(araclar);
  const dogrulanmis = toplam - dogrulanmamis;


  const B = ({ children }: { children: React.ReactNode }) => (
    <section style={{ marginBottom: '3.5rem' }}>{children}</section>
  );

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: 'white' }}>
      <Header />
      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '4rem 2rem 6rem' }}>
        <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.2rem)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
          How we rank tools
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.15rem', lineHeight: 1.75 }}>
          Every page on this site puts tools in an order. This page explains what decides that order, what
          our prices do and do not mean, and which claims we deliberately refuse to make. If a comparison
          site will not tell you its method, its ranking is worth nothing.
        </p>

        <B>
          <h2 style={{ fontSize: '1.6rem', margin: '3rem 0 1rem' }}>Why there is no quality score</h2>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
            Until recently every tool here carried two numbers — &quot;ease of use&quot; and &quot;feature depth&quot; —
            and their sum decided the order of every category page, every alternatives list, and which tools
            we treated as each other&apos;s closest peers.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
            We removed them. Across all {toplam} tools those scores sat in a band so narrow that they could not
            actually separate anything, and we could not show you where a single one of them came from. A
            precise-looking number with no method behind it is worse than no number: it looks like evidence.
          </p>
          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', padding: '1.8rem', marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem' }}>What orders the lists now</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75, margin: 0 }}>
              Starting price, cheapest first — the one number on this site that can be checked against the
              vendor&apos;s own page. Tools that cannot go on that scale (usage-based pricing, a free tier, or a
              price we could not verify) are listed after them and say which case they are.
              <br /><br />
              <strong style={{ color: 'white' }}>Cheapest is not best.</strong> Price ordering is not a quality
              ranking and we do not present it as one. It is simply the only ordering we can justify today.
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
            We list {toplam} tools across {kategoriler().length} categories, and{' '}
            <strong style={{ color: 'white' }}>{incelenen} of them have a written review</strong> — a verdict,
            pros and cons. The other {toplam - incelenen} are directory entries: we can tell you what they are,
            what they cost to start and what the closest alternatives are, and their pages say plainly that we
            have not reviewed them. We would rather list a tool honestly than pad it with a verdict we did not
            write.
          </p>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>
            Every tool here was checked by machine before it was added: we fetch the vendor&apos;s own website and
            confirm the page really belongs to that tool. That check exists because six entries on this site
            once turned out to be products that did not exist at all. They have been removed, and nothing gets
            in now without passing it. Missing something?{' '}
            <Link href="/submit" style={{ color: 'var(--brand-primary)' }}>Send it in</Link>.
          </p>
        </B>
      </main>
      <Footer />
    </div>
  );
}
