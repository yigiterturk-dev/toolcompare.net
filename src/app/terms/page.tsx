import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Shield, Scale, FileText, ExternalLink } from "lucide-react";

export default function TermsPage() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: '12rem', paddingBottom: '8rem', maxWidth: '900px', margin: '0 auto', paddingLeft: '5%', paddingRight: '5%' }}>
        <header style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '24px', marginBottom: '2rem' }}>
            <Scale color="var(--brand-primary)" size={40} />
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-2px', marginBottom: '1rem' }}>Terms of <span style={{ color: 'var(--brand-primary)' }}>Service</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Last updated: May 2026</p>
        </header>

        <article style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.1rem' }}>
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <FileText color="var(--brand-primary)" /> 1. Acceptance of Terms
            </h2>
            <p>By accessing and using ToolCompare.net, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use this website. We reserve the right to modify these terms at any time without prior notice.</p>
          </section>

          <section style={{ marginBottom: '3rem', background: 'rgba(99, 102, 241, 0.05)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Shield color="var(--brand-primary)" /> 2. Affiliate Disclosure (Mandatory)
            </h2>
            <p>ToolCompare.net does not currently participate in any affiliate program and earns no commission from the links on this site. We may join such programs in the future; if that happens, this page will be updated before any paid link goes live and every compensated link will be marked as sponsored. Our rankings are based on our own analysis and research, and no company has paid for placement or a better verdict.</p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
               3. Accuracy of Information
            </h2>
            <p>While we strive to provide the most up-to-date pricing and feature information, software companies change their offerings frequently. ToolCompare.net does not warrant that any information on the site is accurate, complete, or current. Always verify pricing and terms on the provider's official website before purchasing.</p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
               4. Intellectual Property
            </h2>
            <p>All content on ToolCompare.net, including text, graphics, logos, and software, is the property of ToolCompare or its content suppliers and is protected by international copyright laws. You may not reproduce, distribute, or create derivative works without our express written consent.</p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
               5. Limitation of Liability
            </h2>
            <p>In no event shall ToolCompare.net be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website, even if we have been notified of the possibility of such damage.</p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
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
