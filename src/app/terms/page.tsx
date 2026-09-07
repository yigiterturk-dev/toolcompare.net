import Header from "@/components/Header";
import { affiliateAktifMi, ACIKLAMA_METNI } from "@/lib/affiliate";
import Footer from "@/components/Footer";
import { Shield, Scale, FileText, ExternalLink } from "lucide-react";

import type { Metadata } from "next";

// Kendi metadata'si yoktu: kok layout'unkini miras alip
// anasayfayla AYNI baslik/aciklamayi kullaniyordu.
export const metadata: Metadata = {
  title: "Terms of Service | ToolCompare",
  description: "The terms that apply to using ToolCompare, including how our rankings work and how we make money.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Terms of Service | ToolCompare", description: "The terms that apply to using ToolCompare, including how our rankings work and how we make money.", url: "/terms", siteName: "ToolCompare", type: "website" },
};


export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="doc">
        <header>
          <div>
            <Scale color="var(--brand-primary)" size={40} />
          </div>
          <h1>Terms of <span>Service</span></h1>
          <p>Last updated: May 2026</p>
        </header>

        <article>
          <section>
            <h2>
              <FileText color="var(--brand-primary)" /> 1. Acceptance of Terms
            </h2>
            <p>By accessing and using ToolCompare.net, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use this website. We reserve the right to modify these terms at any time without prior notice.</p>
          </section>

          <section>
            <h2>
              <Shield color="var(--brand-primary)" /> 2. Affiliate Disclosure (Mandatory)
            </h2>
            {/*
              METIN TEK KAYNAKTAN. Once burada sabit "hicbir affiliate
              programina katilmiyoruz" yaziyordu; bir yere parali link
              konsa sayfa yalan soyleyecekti. Artik src/data/affiliate.json
              neyse o yaziliyor.
            */}
            {affiliateAktifMi() ? (
              <p>ToolCompare.net participates in affiliate programs: some outbound links earn us a commission if you sign up. {ACIKLAMA_METNI} Every compensated link is marked <code>rel=&quot;sponsored&quot;</code> in the page source. Our rankings are based on our own analysis and research, and no company has paid for placement or a better verdict.</p>
            ) : (
              <p>ToolCompare.net does not currently participate in any affiliate program and earns no commission from the links on this site. We may join such programs in the future; if that happens, this page will be updated before any paid link goes live and every compensated link will be marked as sponsored. Our rankings are based on our own analysis and research, and no company has paid for placement or a better verdict.</p>
            )}
          </section>

          <section>
            <h2>
               3. Accuracy of Information
            </h2>
            <p>While we strive to provide the most up-to-date pricing and feature information, software companies change their offerings frequently. ToolCompare.net does not warrant that any information on the site is accurate, complete, or current. Always verify pricing and terms on the provider&rsquo;s official website before purchasing.</p>
          </section>

          <section>
            <h2>
               4. Intellectual Property
            </h2>
            <p>All content on ToolCompare.net, including text, graphics, logos, and software, is the property of ToolCompare or its content suppliers and is protected by international copyright laws. You may not reproduce, distribute, or create derivative works without our express written consent.</p>
          </section>

          <section>
            <h2>
               5. Limitation of Liability
            </h2>
            <p>In no event shall ToolCompare.net be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website, even if we have been notified of the possibility of such damage.</p>
          </section>

          <section>
            <h2>
               6. Governing Law
            </h2>
            <p>Any claim relating to ToolCompare.net shall be governed by the laws of the jurisdiction in which our company is registered, without regard to its conflict of law provisions.</p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
