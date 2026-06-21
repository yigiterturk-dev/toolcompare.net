import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Lock, Eye, Database, Cookie } from "lucide-react";

export const metadata = {
  title: "Privacy Policy | ToolCompare",
  description: "How ToolCompare collects, uses, and protects your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main style={{ paddingTop: '12rem', paddingBottom: '8rem', maxWidth: '900px', margin: '0 auto', paddingLeft: '5%', paddingRight: '5%' }}>
        <header style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '24px', marginBottom: '2rem' }}>
            <Lock color="#10b981" size={40} />
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-2px', marginBottom: '1rem' }}>Privacy <span style={{ color: '#10b981' }}>Policy</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Last updated: May 2026</p>
        </header>

        <article style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.1rem' }}>
          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Eye color="#10b981" /> 1. Information We Collect
            </h2>
            <p>We collect information that you provide directly to us, such as when you subscribe to our newsletter or use our AI Assistant. This may include your name, email address, and any messages you send. We also automatically collect certain information when you visit our site, including your IP address, browser type, and operating system.</p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Cookie color="#10b981" /> 2. Cookies & Tracking
            </h2>
            <p>ToolCompare.net uses cookies and similar tracking technologies to track the activity on our service and hold certain information. Cookies are files with a small amount of data which may include an anonymous unique identifier. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.</p>
          </section>

          <section style={{ marginBottom: '3rem', background: 'rgba(16, 185, 129, 0.05)', padding: '2rem', borderRadius: '24px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Database color="#10b981" /> 3. How We Use Your Data
            </h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li>• To provide and maintain our Service (including tool recommendations).</li>
              <li>• To notify you about changes to our Service.</li>
              <li>• To provide customer support and newsletter updates.</li>
              <li>• To gather analysis or valuable information so that we can improve our Service.</li>
              <li>• To monitor the usage of our Service.</li>
            </ul>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
               4. Third-Party Links
            </h2>
            <p>Our website contains links to other sites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.</p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
               5. Data Security
            </h2>
            <p>The security of your data is important to us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
               6. Contact Us
            </h2>
            <p>If you have any questions about this Privacy Policy, please contact us at: support@toolcompare.net</p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
