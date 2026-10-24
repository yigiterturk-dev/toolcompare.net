import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import toolsData from "@/data/tools.json";
import type { Arac } from "@/lib/arac";
import { aracIndekslenir } from "@/lib/indeks";
import { kirintiSemasi } from "@/lib/yapilandirilmis";
import {
  degisimEtiketi,
  enSonKontroller,
  fiyatGecmisi,
  gecmisOzeti,
  sonDegisimler,
  type FiyatDegisimi,
} from "@/lib/fiyat-gecmisi";

export const metadata: Metadata = {
  alternates: { canonical: "/price-changes" },
  title: "Price Changes & Verification Log | ToolCompare",
  description:
    "Every plan price we verify, with the date we checked it. When a vendor changes a price, the difference is recorded here — no estimates, no scraped guesses.",
  openGraph: {
    title: "Price Changes & Verification Log | ToolCompare",
    description: "Verified plan prices with their check dates, and every price change we catch.",
    url: "/price-changes",
    siteName: "ToolCompare",
    type: "website",
    images: [{ url: "/brand/og.png", width: 1200, height: 630, alt: "ToolCompare price verification log" }],
  },
  twitter: { card: "summary_large_image", images: ["/brand/og.png"] },
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const tarih = (value: string) =>
  new Date(`${value}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

function fiyat(value: number | null) {
  return value === null ? "—" : money.format(value);
}

function sartlar(change: FiyatDegisimi) {
  const birim = (value: FiyatDegisimi["fromBirim"]) =>
    value === "kisi-basina" ? "per user" : value === "sabit" ? "flat" : "unit not stated";
  const fatura = (value: FiyatDegisimi["fromFaturalama"]) =>
    value === "yillik" ? "billed annually" : value === "aylik" ? "billed monthly" : "billing not stated";
  return `${birim(change.fromBirim)}, ${fatura(change.fromFaturalama)} → ${birim(change.toBirim)}, ${fatura(change.toFaturalama)}`;
}

const ARACLAR = toolsData as Arac[];
const ARAC_HARITASI = new Map(ARACLAR.map((tool) => [tool.slug, tool]));

export default function PriceChangesPage() {
  const ozet = gecmisOzeti();
  const degisimler = sonDegisimler(60);
  const tumKontroller = enSonKontroller(500);
  const kontroller = tumKontroller.slice(0, 24);
  const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const eskiler = tumKontroller
    .filter((entry) => entry.checkedAt < cutoff)
    .sort((a, b) => a.checkedAt.localeCompare(b.checkedAt) || a.name.localeCompare(b.name, "en"));
  const ilkKayit = fiyatGecmisi().sonKontrol;
  const sema = kirintiSemasi([
    { ad: "Tools", yol: "/tools" },
    { ad: "Price changes", yol: "/price-changes" },
  ]);

  const gruplar = new Map<string, FiyatDegisimi[]>();
  for (const change of degisimler) {
    const liste = gruplar.get(change.at) ?? [];
    liste.push(change);
    gruplar.set(change.at, liste);
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sema) }} />
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <p className="text-sm font-medium tracking-wide text-ink-muted uppercase">Price log</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
          What we verified, when we verified it
        </h1>
        <p className="mt-4 max-w-2xl text-ink-soft">
          Every figure below comes from the vendor&apos;s own pricing page. We snapshot the plan
          ladder, compare it with the previous check, and record real differences — a new plan, a
          removed plan, a price move, or a change in billing terms.
        </p>

        <dl className="mt-8 grid grid-cols-2 gap-4 rounded-[--radius-card] border border-line bg-surface p-5 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-ink-muted uppercase">Tools</dt>
            <dd className="mt-1 font-serif text-2xl font-semibold tabular-nums">{ozet.tools}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted uppercase">Plans tracked</dt>
            <dd className="mt-1 font-serif text-2xl font-semibold tabular-nums">{ozet.plans}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted uppercase">Last snapshot</dt>
            <dd className="mt-1 font-serif text-2xl font-semibold">{tarih(ozet.sonKontrol)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-muted uppercase">Changes recorded</dt>
            <dd className="mt-1 font-serif text-2xl font-semibold tabular-nums">{ozet.degisim}</dd>
          </div>
        </dl>

        <section className="mt-12">
          <h2 className="font-serif text-2xl font-semibold">Price changes</h2>
          {degisimler.length === 0 ? (
            <div className="mt-4 rounded-[--radius-card] border border-line bg-surface p-5">
              <p className="text-sm text-ink-soft">
                No changes recorded yet. Tracking started on <strong>{tarih(ilkKayit)}</strong>;
                this section fills when a vendor price actually moves between two checks. We do not
                backfill a change we cannot date.
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                Current prices are in the{" "}
                <Link href="/stack" className="text-accent underline underline-offset-4">
                  stack cost calculator
                </Link>{" "}
                and on each{" "}
                <Link href="/tools" className="text-accent underline underline-offset-4">
                  tool page
                </Link>
                .
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-8">
              {[...gruplar.entries()].map(([at, liste]) => (
                <section key={at}>
                  <h3 className="text-sm font-medium tracking-wide text-ink-muted uppercase">
                    {tarih(at)} · {liste.length} change{liste.length === 1 ? "" : "s"}
                  </h3>
                  <ul className="mt-3 list-none divide-y divide-line border-y border-line p-0">
                    {liste.map((change) => {
                      const tool = ARAC_HARITASI.get(change.slug);
                      const link = tool && aracIndekslenir(tool) ? `/tools/${change.slug}` : null;
                      const up = change.type === "price-up";
                      const down = change.type === "price-down";
                      return (
                        <li key={`${change.slug}-${change.plan}-${change.type}`} className="py-3">
                          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                            <p className="font-medium text-ink">
                              {link ? (
                                <Link href={link} className="hover:text-accent">
                                  {change.name}
                                </Link>
                              ) : (
                                change.name
                              )}{" "}
                              <span className="text-ink-soft">/ {change.plan}</span>
                            </p>
                            <span
                              className={`rounded-[--radius-pill] px-2 py-0.5 text-xs font-medium ${
                                up
                                  ? "bg-[#FEF3F2] text-[#B42318]"
                                  : down
                                    ? "bg-[#ECFDF3] text-[#067647]"
                                    : "bg-[#F2F4F7] text-[#344054]"
                              }`}
                            >
                              {degisimEtiketi(change.type)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-ink-soft tabular-nums">
                            {change.type === "plan-added"
                              ? `New plan at ${fiyat(change.to)}`
                              : change.type === "plan-removed"
                                ? `Plan removed; was ${fiyat(change.from)}`
                                : `${fiyat(change.from)} → ${fiyat(change.to)}`}
                            {typeof change.deltaPct === "number" && (
                              <span className={`ml-2 ${up ? "text-[#B42318]" : "text-[#067647]"}`}>
                                {change.deltaPct > 0 ? "+" : ""}
                                {change.deltaPct}%
                              </span>
                            )}
                          </p>
                          {change.type === "terms-changed" && (
                            <p className="mt-1 text-xs text-ink-muted">{sartlar(change)}</p>
                          )}
                          {change.sourceUrl && (
                            <a
                              href={change.sourceUrl}
                              rel="noopener noreferrer"
                              className="mt-1 inline-block text-xs text-accent underline underline-offset-4"
                            >
                              Vendor pricing page
                            </a>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </section>

        <section className="mt-14 border-t border-line pt-8">
          <h2 className="font-serif text-2xl font-semibold">Latest verifications</h2>
          <p className="mt-2 text-sm text-ink-soft">
            The most recently checked plan ladders. A date here means a human opened the vendor page;
            it is not the date a price last changed.
          </p>
          <ul className="mt-4 list-none divide-y divide-line border-y border-line p-0">
            {kontroller.map((entry) => {
              const tool = ARAC_HARITASI.get(entry.slug);
              const link = tool && aracIndekslenir(tool) ? `/tools/${entry.slug}` : null;
              return (
                <li key={entry.slug} className="flex flex-wrap items-baseline justify-between gap-3 py-2.5">
                  <span className="text-sm font-medium text-ink">
                    {link ? (
                      <Link href={link} className="hover:text-accent">
                        {entry.name}
                      </Link>
                    ) : (
                      entry.name
                    )}
                  </span>
                  <span className="text-xs text-ink-muted tabular-nums">
                    {entry.plans} plan{entry.plans === 1 ? "" : "s"} · from{" "}
                    {entry.from === null ? "—" : money.format(entry.from)} · checked {tarih(entry.checkedAt)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="mt-14 border-t border-line pt-8">
          <h2 className="font-serif text-2xl font-semibold">Re-verification queue</h2>
          <p className="mt-2 text-sm text-ink-soft">
            {eskiler.length > 0
              ? `${eskiler.length} tools were last checked before ${tarih(cutoff)}. Oldest first — this is the queue, not a claim that the price is wrong.`
              : "Every tracked tool has been checked in the last 30 days."}
          </p>
          {eskiler.length > 0 && (
            <ul className="mt-4 list-none divide-y divide-line border-y border-line p-0">
              {eskiler.slice(0, 10).map((entry) => {
                const tool = ARAC_HARITASI.get(entry.slug);
                const link = tool && aracIndekslenir(tool) ? `/tools/${entry.slug}` : null;
                return (
                  <li key={entry.slug} className="flex flex-wrap items-baseline justify-between gap-3 py-2.5">
                    <span className="text-sm font-medium text-ink">
                      {link ? (
                        <Link href={link} className="hover:text-accent">
                          {entry.name}
                        </Link>
                      ) : (
                        entry.name
                      )}
                    </span>
                    <span className="flex items-baseline gap-3 text-xs text-ink-muted tabular-nums">
                      <span>checked {tarih(entry.checkedAt)}</span>
                      {entry.sourceUrl ? (
                        <a href={entry.sourceUrl} rel="noopener noreferrer" className="text-accent underline underline-offset-4">
                          source
                        </a>
                      ) : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <p className="mt-8 max-w-3xl text-sm text-ink-soft">
          How the check works: we read the plan names and monthly figures from the vendor&apos;s own
          page, store the sentence each number came from, and only record a change when the stored
          number moves. Read the{" "}
          <Link href="/methodology" className="text-accent underline underline-offset-4">
            methodology
          </Link>{" "}
          or add these prices to a{" "}
          <Link href="/stack" className="text-accent underline underline-offset-4">
            stack calculation
          </Link>
          .
        </p>
      </main>

      <Footer />
    </>
  );
}
