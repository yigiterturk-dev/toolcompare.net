import Header from "@/components/Header";
import Footer from "@/components/Footer";
import toolsData from "@/data/tools.json";
import { gitLinki } from "@/lib/outbound";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, X, Zap, Star, ArrowRight, ArrowLeft, Check } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const resolvedParams = await params;
  const parts = resolvedParams.slug.split("-vs-");
  if (parts.length !== 2) return { title: "Comparison" };
  
  const tool1 = (toolsData as any[]).find((t) => t.slug === parts[0]);
  const tool2 = (toolsData as any[]).find((t) => t.slug === parts[1]);
  
  if (!tool1 || !tool2) return { title: "Comparison" };

  return {
    title: `${tool1.name} vs ${tool2.name} Comparison 2026: Which is Better? | ToolCompare`,
    description: `Compare ${tool1.name} and ${tool2.name} side-by-side. Pricing, features, pros, cons, and expert verdict.`,
  };
}

export default async function ComparisonPage({ params }: any) {
  const resolvedParams = await params;
  const parts = resolvedParams.slug.split("-vs-");
  if (parts.length !== 2) notFound();

  const tool1 = (toolsData as any[]).find((t) => t.slug === parts[0]);
  const tool2 = (toolsData as any[]).find((t) => t.slug === parts[1]);

  if (!tool1 || !tool2) notFound();

  const ComparisonRow = ({ label, val1, val2, type = "text" }: any) => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '1.5rem 0', alignItems: 'center' }}>
      <div style={{ color: '#666', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 600 }}>
        {type === "score" ? <span style={{ color: 'white' }}>{val1}%</span> : val1}
      </div>
      <div style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 600 }}>
        {type === "score" ? <span style={{ color: 'white' }}>{val2}%</span> : val2}
      </div>
    </div>
  );

  return (
    <div style={{ background: '#050505', minHeight: '100vh', color: 'white' }}>
      <Header />
      
      <main style={{ paddingTop: '12rem', maxWidth: '1200px', margin: '0 auto', paddingLeft: '5%', paddingRight: '5%', paddingBottom: '10rem' }}>
        
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#666', textDecoration: 'none', marginBottom: '2rem' }}>
          <ArrowLeft size={16} /> Back to Directory
        </Link>

        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-2px' }}>
            {tool1.name} <span style={{ color: 'var(--brand-primary)' }}>vs</span> {tool2.name}
          </h1>
          <p style={{ color: '#888', fontSize: '1.25rem' }}>The ultimate side-by-side head-to-head analysis for 2026.</p>
        </div>

        {/* Head-to-Head Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', marginBottom: '4rem' }}>
          <div></div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: `linear-gradient(135deg, ${tool1.color1}, ${tool1.color2})`, margin: '0 auto 1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: `0 20px 40px ${tool1.color1}44` }}>
              <Zap size={40} color="white" />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{tool1.name}</h2>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: `linear-gradient(135deg, ${tool2.color1}, ${tool2.color2})`, margin: '0 auto 1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: `0 20px 40px ${tool2.color1}44` }}>
              <Zap size={40} color="white" />
            </div>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{tool2.name}</h2>
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '40px', padding: '4rem' }}>
          <ComparisonRow label="Category" val1={tool1.category} val2={tool2.category} />
          <ComparisonRow label="Ease of Use" val1={tool1.ease} val2={tool2.ease} type="score" />
          <ComparisonRow label="Features" val1={tool1.featuresScore} val2={tool2.featuresScore} type="score" />
          <ComparisonRow label="Base Price" val1={`$${tool1.basePrice}/mo`} val2={`$${tool2.basePrice}/mo`} />
          <ComparisonRow label="Verdict" val1={tool1.verdict.substring(0, 50) + "..."} val2={tool2.verdict.substring(0, 50) + "..."} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', padding: '3rem 0 0' }}>
            <div></div>
            <div style={{ textAlign: 'center' }}>
              <a 
                href={gitLinki(tool1.slug)} 
                target="_blank" 
                rel="noopener noreferrer nofollow sponsored" 
                style={{ background: 'var(--brand-primary)', color: 'white', padding: '1rem 2rem', borderRadius: '14px', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem', display: 'inline-block' }}
              >
                Visit {tool1.name}
              </a>
            </div>
            <div style={{ textAlign: 'center' }}>
              <a 
                href={gitLinki(tool2.slug)} 
                target="_blank" 
                rel="noopener noreferrer nofollow sponsored" 
                style={{ background: 'white', color: 'black', padding: '1rem 2rem', borderRadius: '14px', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem', display: 'inline-block' }}
              >
                Visit {tool2.name}
              </a>
            </div>
          </div>
        </div>

        {/* Expert Verdict Section */}
        <div style={{ marginTop: '6rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
           <div style={{ background: 'var(--surface-color)', padding: '3rem', borderRadius: '32px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle2 color="var(--success)" /> Choose {tool1.name} if:</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tool1.targetAudience}</p>
           </div>
           <div style={{ background: 'var(--surface-color)', padding: '3rem', borderRadius: '32px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}><CheckCircle2 color="var(--success)" /> Choose {tool2.name} if:</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tool2.targetAudience}</p>
           </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
