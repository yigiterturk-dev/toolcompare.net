import Header from "@/components/Header";
import Footer from "@/components/Footer";
import toolsData from "@/data/tools.json";
import Link from "next/link";
import { Award, Star, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Top Software Picks 2026 | ToolCompare",
  description: "Our hand-picked selection of the best SaaS tools for 2026 based on performance and features.",
  alternates: { canonical: "/top-picks" },
};

export default function TopPicksPage() {
  // Sort tools by combined score and take top 5
  const topPicks = [...toolsData]
    .sort((a: any, b: any) => (b.ease + b.featuresScore) - (a.ease + a.featuresScore))
    .slice(0, 5);

  return (
    <>
      <Header />
      <div className="ambient-bg">
        <div className="orb orb-2"></div>
      </div>
      
      <main style={{ paddingTop: '10rem', maxWidth: '1000px', margin: '0 auto', paddingLeft: '5%', paddingRight: '5%' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span style={{ background: 'rgba(236, 72, 153, 0.1)', color: 'var(--brand-tertiary)', padding: '0.5rem 1.2rem', borderRadius: '50px', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Editor's Choice</span>
          <h1 style={{ fontSize: '4rem', marginTop: '1rem', marginBottom: '1.5rem' }}>Top Picks <span style={{ color: 'var(--brand-tertiary)' }}>2026</span></h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto' }}>
            We've analyzed over 500+ data points to find the absolute best software solutions for your business this year.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginBottom: '5rem' }}>
          {topPicks.map((tool: any, index) => (
            <div key={tool.slug} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', fontSize: '4rem', fontWeight: 900, opacity: 0.05, color: 'white' }}>#{index + 1}</div>
              
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '20px', background: `linear-gradient(135deg, ${tool.color1}, ${tool.color2})`, display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '2rem', color: 'white', fontWeight: 800 }}>
                  {tool.name.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{tool.name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--brand-primary)', fontWeight: 600 }}>
                    <span style={{ fontSize: '0.9rem' }}>{tool.category}</span>
                    <div style={{ display: 'flex', gap: '2px' }}><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div>
                  </div>
                </div>
              </div>

              <Link href={`/tools/${tool.slug}`} style={{ background: 'white', color: 'black', padding: '1rem 2rem', borderRadius: '14px', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                Read Why <ArrowRight size={18} />
              </Link>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
