import toolsData from "@/data/tools.json";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Award, Target, MessageSquareQuote } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  const tool = (toolsData as any[]).find((t) => t.slug === resolvedParams.slug);
  
  if (!tool) return { title: "Tool Not Found" };

  return {
    title: `${tool.name} Review 2026: Features, Pricing & Verdict | ToolCompare`,
    description: tool.shortDescription || `Comprehensive review of ${tool.name}. Analysis of features, pros, cons, and expert verdict.`,
  };
}

export function generateStaticParams() {
  return toolsData.map((tool: any) => ({ slug: tool.slug }));
}

export default async function ToolPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const tool = (toolsData as any[]).find((t) => t.slug === resolvedParams.slug);

  if (!tool) notFound();

  return (
    <>
      <div className="ambient-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2" style={{ top: '60%', right: '-10%' }}></div>
      </div>
      
      <main style={{ paddingTop: '8rem', paddingBottom: '8rem', maxWidth: '1100px', margin: '0 auto', paddingLeft: '5%', paddingRight: '5%' }}>
        <Link href="/" style={{ color: 'var(--brand-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '3rem', fontWeight: 600 }}>
          <ArrowLeft size={18} /> Back to Software Directory
        </Link>

        <article>
          {/* Header Section */}
          <div style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2rem' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '24px', background: `linear-gradient(135deg, ${tool.color1}, ${tool.color2})`, display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
                 <h1 style={{ color: 'white', fontSize: '2.5rem', margin: 0 }}>{tool.name.charAt(0)}</h1>
              </div>
              <div>
                <span style={{ color: 'var(--brand-primary)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.9rem', letterSpacing: '2px' }}>{tool.category} Review</span>
                <h1 style={{ fontSize: '4rem', margin: 0, letterSpacing: '-2px', lineHeight: 1 }}>{tool.name}</h1>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '4rem' }}>
            
            {/* Left Column: Deep Content */}
            <div style={{ display: 'flex', flexArray: 'column', gap: '3rem' }}>
              
              <section>
                <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Deep Dive Analysis</h2>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {tool.longDescription}
                </div>
              </section>

              <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '2.5rem' }}>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <Award color="var(--brand-primary)" /> Key Features
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {(tool.keyFeatures || []).map((f: any, i: number) => (
                    <div key={i}>
                      <h4 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '0.5rem' }}>{f.title}</h4>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                 <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                   <Target color="var(--brand-secondary)" /> Target Audience
                 </h2>
                 <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tool.targetAudience}</p>
              </section>

              <section style={{ borderLeft: '4px solid var(--brand-tertiary)', paddingLeft: '2rem', margin: '2rem 0' }}>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <MessageSquareQuote color="var(--brand-tertiary)" /> The Final Verdict
                </h2>
                <p style={{ fontSize: '1.3rem', color: 'white', fontWeight: 500, fontStyle: 'italic' }}>"{tool.verdict}"</p>
              </section>

            </div>

            {/* Right Column: Sticky Sidebar Info */}
            <aside>
              <div style={{ position: 'sticky', top: '8rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Score Card */}
                <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '2rem', textAlign: 'center' }}>
                   <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Ease of Use</span>
                   <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'var(--font-outfit)' }}>{tool.ease}%</div>
                   <div style={{ height: '6px', background: 'var(--surface-light)', borderRadius: '10px', marginTop: '1rem', overflow: 'hidden' }}>
                      <div style={{ width: `${tool.ease}%`, height: '100%', background: 'var(--brand-primary)' }}></div>
                   </div>
                </div>

                {/* Pros/Cons Box */}
                <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '2rem' }}>
                  <h4 style={{ marginBottom: '1.5rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle2 size={18} /> Pros</h4>
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem' }}>
                    {(tool.pros || []).map((pro: string, i: number) => (
                      <li key={i} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>• {pro}</li>
                    ))}
                  </ul>
                  <h4 style={{ marginBottom: '1.5rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><XCircle size={18} /> Cons</h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {(tool.cons || []).map((con: string, i: number) => (
                      <li key={i} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.8rem' }}>• {con}</li>
                    ))}
                  </ul>
                </div>

                {/* Pricing Box */}
                <div style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))', borderRadius: '24px', padding: '2rem', color: 'white' }}>
                   <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.5rem' }}>Pricing starts at</p>
                   <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-outfit)', marginBottom: '1.5rem' }}>
                     ${tool.basePrice}<span style={{ fontSize: '1rem', fontWeight: 400, opacity: 0.8 }}>{tool.isFlat ? '/mo' : '/user/mo'}</span>
                   </div>
                   <button style={{ width: '100%', background: 'white', color: 'black', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: 700, cursor: 'pointer', transition: 'transform 0.2s' }}>
                     Visit Website
                   </button>
                </div>

              </div>
            </aside>

          </div>
        </article>
      </main>
    </>
  );
}
