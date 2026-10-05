import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ToolLogo from "@/components/ToolLogo";
import toolsData from "@/data/tools.json";
import type { Arac } from "@/lib/arac";
import { rozetUygun } from "@/lib/rozet";
import { OG_GORSEL } from "@/lib/paylasim";
import Link from "next/link";
import type { Metadata } from "next";

/*
  Satici sayfasi: rozet programini anlatir. Indekslenebilir -- "pricing
  verified badge" arayan satici buraya inmeli. Rozet kodu arac sayfasinda
  (/tools/[slug]#badge); ayri ince sayfa yok.
*/

export const metadata: Metadata = {
  title: "For Vendors: Verified-Pricing Badge | ToolCompare",
  description:
    "If ToolCompare has verified your pricing against your own pricing page, you can embed a free badge that says so — with the date it was read. No rating, no payment.",
  alternates: { canonical: "/badge" },
  openGraph: {
    title: "For Vendors: Verified-Pricing Badge | ToolCompare",
    description: "A free badge for vendors whose pricing we verified against their own pricing page.",
    url: "/badge",
    siteName: "ToolCompare",
    type: "article",
    images: [{ url: OG_GORSEL, width: 1200, height: 630, alt: "ToolCompare" }],
  },
};

const ARACLAR = toolsData as Arac[];
const ORNEKLER = ["notion", "obsidian", "postman", "dbeaver", "photopea", "sublime-text"];

export default function SaticiSayfasi() {
  const uygun = ARACLAR.filter((t) => rozetUygun(t));
  const ornekler = ORNEKLER.map((s) => uygun.find((t) => t.slug === s)).filter((t): t is Arac => Boolean(t));

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">For vendors</p>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">A badge that says your pricing is real</h1>
        <p className="mt-4 text-ink-soft">
          We read each vendor&rsquo;s pricing from its own pricing page, record the date, and link the source. For{" "}
          <strong className="text-ink">{uygun.length} tools</strong> that check passed. If yours is one of them, you
          can show it on your site with a free badge.
        </p>

        <div className="mt-8 rounded-[--radius-card] border border-line bg-surface p-6">
          <p className="text-xs font-medium tracking-wide text-ink-muted uppercase">Example</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/badge/${ornekler[0]?.slug ?? uygun[0]?.slug}`} alt="Example verified-pricing badge" height={28} className="mt-3 h-7 w-auto" />
          <p className="mt-4 text-sm text-ink-soft">
            The badge shows the month we last read your pricing. It is not a score or an endorsement, and it is never
            sold.
          </p>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">How to get yours</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-ink-soft">
            <li>
              Find your tool in <Link href="/tools" className="text-accent underline underline-offset-4">the full list</Link>.
            </li>
            <li>At the bottom of its page, open &ldquo;Embed the verified-pricing badge&rdquo;.</li>
            <li>Copy the HTML or Markdown snippet onto your pricing page, footer or README.</li>
          </ol>
          <p className="mt-4 text-sm text-ink-soft">
            No link at the bottom of your page? We could not verify your pricing yet — usually because it is behind a
            sales form or rendered only in JavaScript.{" "}
            <Link href="/contact" className="text-accent underline underline-offset-4">Send us the pricing URL</Link>{" "}
            and we will read it.
          </p>
        </section>

        {ornekler.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-semibold">For example</h2>
            <ul className="mt-3 grid list-none gap-2 p-0 sm:grid-cols-2">
              {ornekler.map((t) => (
                <li key={t.slug}>
                  <Link
                    href={`/tools/${t.slug}#badge`}
                    className="flex items-center gap-3 rounded-[--radius-card] border border-line bg-surface p-3 no-underline hover:border-line-strong"
                  >
                    <ToolLogo slug={t.slug} name={t.name} size={28} />
                    <span className="font-medium">{t.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 space-y-3 text-sm text-ink-soft">
          <h2 className="text-xl font-semibold text-ink">Rules</h2>
          <p>Only pricing read from the vendor&rsquo;s own page qualifies. Third-party listings do not.</p>
          <p>
            If we can no longer verify a price, the image switches to a neutral &ldquo;Listed&rdquo; badge rather than
            breaking. See <Link href="/methodology" className="text-accent underline underline-offset-4">how we check prices</Link>.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
