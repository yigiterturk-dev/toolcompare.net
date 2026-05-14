import Header from "@/components/Header";
import Footer from "@/components/Footer";
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

  // Smart Data Normalization (Handle camelCase, snake_case, and nested objects)
  const longDesc = tool.longDescription || tool.description || (tool.review?.text || tool.review?.body || tool.review?.introduction || "");
  const features = tool.keyFeatures || tool.key_features || tool.features || [];
  const targetAud = typeof tool.targetAudience === 'string' ? tool.targetAudience : (tool.targetAudience?.description || tool.targetAudience?.text || tool.target_audience?.description || tool.target_audience?.text || tool.target_audience?.small_businesses || "");
  const verdictText = typeof tool.verdict === 'string' ? tool.verdict : (tool.expertVerdict?.conclusion || tool.expertVerdict?.summary || tool.expert_verdict?.conclusion || tool.expert_verdict?.summary || tool.expertVerdict?.text || tool.expert_verdict || tool.verdict?.text || tool.verdict || "");

  return (
    <>
      <Header />
      <div className="ambient-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2" style={{ top: '60%', right: '-10%' }}></div>
      </div>
      
      <main style={{ paddingTop: '8rem', paddingBottom: '8rem', maxWidth: '1100px', margin: '0 auto', paddingLeft: '5%', paddingRight: '5%' }}>
        <Link href="/" style={{ color: 'var(--brand-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '3rem', fontWeight: 600 }}>
          <ArrowLeft size={18} /> Back to Software Directory
        </Link>

        <article>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
              <section>
                <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Deep Dive Analysis</h2>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {longDesc}
                </div>
              </section>

              <section style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '2.5rem' }}>
                <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <Award color="var(--brand-primary)" /> Key Features
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {features.map((f: any, i: number) => {
                    const title = typeof f === 'string' ? f : (f.title || f.name || f.text || "");
                    const description = typeof f === 'object' ? (f.description || f.text || "") : "";
                    return (
                      <div key={i}>
                        <h4 style={{ fontSize: '1.1rem', color: 'white', marginBottom: '0.5rem' }}>{title}</h4>
                        {description && <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{description}</p>}
                      </div>
                    );
                  })}
                </div>
              </section>

              {targetAud && (
                <section>
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <Target color="var(--brand-secondary)" /> Target Audience
                  </h2>
                  <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{targetAud}</p>
                </section>
              )}

              {verdictText && (
                <section style={{ borderLeft: '4px solid var(--brand-tertiary)', paddingLeft: '2rem', margin: '2rem 0' }}>
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <MessageSquareQuote color="var(--brand-tertiary)" /> The Final Verdict
                  </h2>
                  <p style={{ fontSize: '1.3rem', color: 'white', fontWeight: 500, fontStyle: 'italic' }}>"{typeof verdictText === 'string' ? verdictText : (verdictText.text || "")}"</p>
                </section>
              )}

              {/* Smart Alternatives Section */}
              <section style={{ marginTop: '4rem', borderTop: '1px solid var(--border-color)', paddingTop: '4rem' }}>
                <h2 style={{ fontSize: '2rem', marginBottom: '2rem', letterSpacing: '-1px' }}>
                  Best Alternatives to <span style={{ color: 'var(--brand-primary)' }}>{tool.name}</span>
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  {(toolsData as any[])
                    .filter(t => t.category === tool.category && t.slug !== tool.slug)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 3)
                    .map(alt => (
                      <Link 
                        key={alt.slug} 
                        href={`/tools/${alt.slug}`}
                        style={{ 
                          background: 'rgba(255,255,255,0.03)', 
                          border: '1px solid var(--border-color)', 
                          borderRadius: '20px', 
                          padding: '1.5rem', 
                          textDecoration: 'none',
                          transition: 'all 0.3s'
                        }}
                        className="hover-scale"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `linear-gradient(135deg, ${alt.color1}, ${alt.color2})`, display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 800 }}>
                            {alt.name.charAt(0)}
                          </div>
                          <div style={{ fontWeight: 700, color: 'white' }}>{alt.name}</div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{alt.shortDescription}</p>
                      </Link>
                    ))
                  }
                </div>
              </section>
            </div>

            <aside>
              <div style={{ position: 'sticky', top: '8rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '2rem', textAlign: 'center' }}>
                   <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Ease of Use</span>
                   <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'var(--font-outfit)' }}>{tool.ease}%</div>
                </div>

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

                <div style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))', borderRadius: '24px', padding: '2rem', color: 'white' }}>
                   <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.5rem' }}>Pricing starts at</p>
                   <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-outfit)', marginBottom: '1.5rem' }}>
                     ${tool.basePrice}<span style={{ fontSize: '1rem', fontWeight: 400, opacity: 0.8 }}>{tool.isFlat ? '/mo' : '/user/mo'}</span>
                   </div>
                   <a 
                    href={tool.websiteUrl || `https://www.google.com/search?q=${tool.name}+official+website`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'block',
                      textAlign: 'center',
                      width: '100%', 
                      background: 'white', 
                      color: 'black', 
                      border: 'none', 
                      padding: '1rem', 
                      borderRadius: '12px', 
                      fontWeight: 700, 
                      cursor: 'pointer',
                      textDecoration: 'none',
                      transition: 'transform 0.2s'
                    }}
                    className="hover-scale"
                   >
                     Visit Official Website
                   </a>
                </div>
              </div>
            </aside>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
