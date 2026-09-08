import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";
import { affiliateAktifMi, ACIKLAMA_METNI } from "@/lib/affiliate";

export const metadata: Metadata = {
  title: "Affiliate Disclosure | ToolCompare",
  description:
    "Which links on ToolCompare earn a commission, how they are marked, and what they do not change: prices, verdicts or ranking order.",
  alternates: { canonical: "/affiliate-disclosure" },
  openGraph: {
    title: "Affiliate Disclosure | ToolCompare",
    description: "Which links earn a commission, how they are marked, and what they never change.",
    url: "/affiliate-disclosure",
    siteName: "ToolCompare",
    type: "article",
  },
};

export default function AffiliateDisclosurePage() {
  const aktif = affiliateAktifMi();
  return (
    <div>
      <Header />
      <main className="doc">
        <h1>Affiliate disclosure</h1>
        <p>
          This page exists so that the money side of ToolCompare is stated in one place, in plain
          words, before you click anything. It is written to meet the FTC&apos;s endorsement guidance and
          the equivalent rules in the UK and EU.
        </p>

        <section>
          <h2>Current status</h2>
          {aktif ? (
            <>
              <p>
                ToolCompare takes part in affiliate programmes. {ACIKLAMA_METNI}
              </p>
              <p>
                When you follow a compensated link and later buy a subscription, the vendor pays us a
                commission. You pay the vendor&apos;s normal price. Some vendors offer a discount through
                partner links; when that is the case the page says so next to the link.
              </p>
            </>
          ) : (
            <>
              <p>
                ToolCompare is not yet enrolled in any affiliate programme and earns no commission from
                any link on this site. We are applying to programmes run by vendors we already cover, and
                this page will be updated before the first compensated link goes live.
              </p>
              <p>
                Until then every outbound link is a plain link to the vendor&apos;s website, added because
                the tool is in our catalogue, not because anyone paid for it.
              </p>
            </>
          )}
        </section>

        <section>
          <h2>How compensated links are marked</h2>
          <p>
            Every link that can earn us money carries <code>rel=&quot;sponsored&quot;</code> in the page
            source, as search engines require. Links to vendors that pay us nothing do not. You can
            verify this on any page by viewing the source rather than taking our word for it.
          </p>
        </section>

        <section>
          <h2>What commissions do not change</h2>
          <ul>
            <li>The price shown. Prices are copied from the vendor&apos;s own pricing page.</li>
            <li>The verdict, pros and cons. These are written before any programme is joined.</li>
            <li>The order tools appear in. Ranking rules are published on the{" "}
              <Link href="/methodology">how we rank</Link> page and apply to paying and non-paying vendors alike.</li>
            <li>Whether a tool is listed at all. Free and open-source tools that can never pay a commission
              are covered on the same terms as paid ones.</li>
          </ul>
        </section>

        <section>
          <h2>What we do not do</h2>
          <p>
            No sponsored placements, no paid &quot;best of&quot; positions, no vendor-written or
            vendor-approved reviews, no removal of negative points in exchange for a partnership. If a
            vendor asks for any of these, the answer is no and the listing stays as it is.
          </p>
        </section>

        <section>
          <h2>Questions</h2>
          <p>
            Ask at <a href="mailto:hello@toolcompare.net">hello@toolcompare.net</a>. Our{" "}
            <Link href="/privacy">privacy policy</Link> explains what an outbound click records.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
}
