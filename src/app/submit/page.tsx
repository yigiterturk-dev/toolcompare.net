import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Send, Rocket, Shield, Zap, Globe } from "lucide-react";

export const metadata = {
  title: "Submit Your SaaS Tool | ToolCompare",
  description: "List your software tool on ToolCompare and reach thousands of monthly decision-makers.",
  alternates: { canonical: "/submit" },
};

export default function SubmitToolPage() {
  return (
    <>
      <Header />
      <div className="ambient-bg">
        <div className="orb orb-1"></div>
      </div>

      <main style={{ paddingTop: '8rem', paddingBottom: '8rem', maxWidth: '800px', margin: '0 auto', paddingLeft: '5%', paddingRight: '5%' }}>
        <header style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '24px', marginBottom: '2rem' }}>
            <Rocket color="var(--brand-primary)" size={40} />
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-2px', marginBottom: '1rem' }}>Submit Your <span style={{ color: 'var(--brand-primary)' }}>SaaS</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
            Get your tool featured in front of 50,000+ monthly decision-makers. Standard listings are free, verified reviews are priority.
          </p>
        </header>

        <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '32px', padding: '3rem' }}>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#666', marginBottom: '0.8rem', textTransform: 'uppercase' }}>Tool Name</label>
                <input aria-label="Tool name" type="text" placeholder="e.g. Notion" style={{ width: '100%', padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#666', marginBottom: '0.8rem', textTransform: 'uppercase' }}>Website URL</label>
                <input aria-label="Tool website" type="url" placeholder="https://..." style={{ width: '100%', padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#666', marginBottom: '0.8rem', textTransform: 'uppercase' }}>Your Email</label>
              <input aria-label="Contact email" type="email" placeholder="you@company.com" style={{ width: '100%', padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#666', marginBottom: '0.8rem', textTransform: 'uppercase' }}>Short Description</label>
              <textarea aria-label="Tool description" placeholder="Tell us what makes your tool unique..." style={{ width: '100%', padding: '1rem', borderRadius: '14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', minHeight: '120px' }}></textarea>
            </div>

            <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '2rem', borderRadius: '24px' }}>
               <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'white' }}><Shield size={18} color="var(--brand-primary)" /> Why list with us?</h4>
               <ul style={{ listStyle: 'none', padding: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Zap size={14} color="var(--brand-primary)" /> High-authority backlink for your SEO.</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Zap size={14} color="var(--brand-primary)" /> Targeted traffic from software decision-makers.</li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}><Zap size={14} color="var(--brand-primary)" /> Expert review badges for your own site.</li>
               </ul>
            </div>

            <button type="submit" style={{ width: '100%', padding: '1.2rem', borderRadius: '16px', background: 'var(--brand-primary)', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.7rem', fontSize: '1.1rem', boxShadow: '0 15px 30px rgba(99, 102, 241, 0.3)' }}>
              <Send size={20} /> Submit for Review
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
