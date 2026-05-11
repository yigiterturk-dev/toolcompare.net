"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  Layers, Zap, Shield, BarChart3, Cloud, Database, Activity, CheckCircle, Layout, Mail,
  CheckCircle2, Check, X, Loader2, Users, ArrowRight, Search
} from "lucide-react";
import toolsData from "@/data/tools.json";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const IconMap: Record<string, any> = {
  Zap, Cloud, BarChart3, Database, Activity, CheckCircle, Layout, Mail
};

function ToolGrid({ toolsData }: { toolsData: any[] }) {
  const searchParams = useSearchParams();
  const catFilter = searchParams.get('category');
  
  const [teamSize, setTeamSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [highlightedTool, setHighlightedTool] = useState<string | null>(null);

  const filteredTools = toolsData
    .filter((t: any) => !catFilter || t.category === catFilter)
    .filter((t: any) => t.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const selectedToolsData = toolsData.filter((t: any) => selectedTools.includes(t.name));

  const handleCompareChange = (toolName: string) => {
    setSelectedTools(prev => 
      prev.includes(toolName) ? prev.filter(t => t !== toolName) : [...prev, toolName]
    );
  };

  const handleMatch = (toolSlug: string) => {
    setMatchLoading(true);
    setHighlightedTool(null);
    setTimeout(() => {
      setMatchLoading(false);
      setHighlightedTool(toolSlug);
      const el = document.getElementById(`card-${toolSlug}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 800);
  };

  return (
    <>
      <Header />
      <div className="ambient-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      <main style={{ paddingTop: '8rem', maxWidth: '1400px', margin: '0 auto', padding: '0 5%' }}>
        <section style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto 3rem' }}>
          <h1 style={{ fontSize: 'clamp(3rem, 5vw, 4.5rem)', lineHeight: 1.1, marginBottom: '1.5rem', letterSpacing: '-1px' }}>
            {catFilter ? `Best ${catFilter} ` : "Find The Perfect "}
            <span style={{ background: 'linear-gradient(to right, var(--brand-primary), var(--brand-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SaaS Tool</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto 3rem' }}>
            Unbiased reviews, side-by-side comparisons, and real-time pricing for the world's top software tools.
          </p>

          <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto 4rem' }}>
             <Search style={{ position: 'absolute', left: '1.5rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--brand-primary)' }} />
             <input 
               type="text" 
               placeholder="Search software tools..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               style={{ width: '100%', padding: '1.5rem 1.5rem 1.5rem 4rem', borderRadius: '100px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', color: 'white', fontSize: '1.1rem', outline: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
             />
          </div>
        </section>

        <section style={{ maxWidth: '600px', margin: '0 auto 3rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '2rem', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users /> Team Size</div>
            <div style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-primary)' }}>{teamSize} Users</div>
          </div>
          <input type="range" min="1" max="100" value={teamSize} onChange={(e) => setTeamSize(parseInt(e.target.value))} />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem', marginBottom: '5rem' }}>
          {filteredTools.map((tool: any) => {
            const Icon = IconMap[tool.iconName] || Zap;
            const isSelected = selectedTools.includes(tool.name);
            
            return (
              <div key={tool.slug} id={`card-${tool.slug}`} style={{ background: 'var(--surface-color)', border: `1px solid ${highlightedTool === tool.slug ? 'var(--brand-primary)' : 'var(--border-color)'}`, borderRadius: '24px', padding: '2rem', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: isSelected ? '0 0 0 2px var(--brand-primary)' : 'none' }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  
                  {/* Premium Compare Toggle */}
                  <div 
                    onClick={() => handleCompareChange(tool.name)}
                    style={{ position: 'absolute', top: 0, right: 0, padding: '0.5rem 1rem', borderRadius: '50px', background: isSelected ? 'var(--brand-primary)' : 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.2s', color: isSelected ? 'white' : 'var(--text-secondary)' }}
                  >
                    {isSelected ? <Check size={14} /> : <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid currentColor' }} />}
                    Compare
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.5rem', marginTop: '1rem' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: `linear-gradient(135deg, ${tool.color1}, ${tool.color2})`, boxShadow: `0 10px 20px ${tool.color1}44` }}>
                      <Icon size={32} color="#fff" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                        <Link href={`/tools/${tool.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{tool.name}</Link>
                      </h3>
                      <span style={{ fontSize: '0.85rem', color: 'var(--brand-primary)', fontWeight: 600 }}>{tool.category}</span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', minHeight: '3rem', lineHeight: 1.5 }}>{tool.shortDescription}</p>

                  <ul style={{ listStyle: 'none', marginBottom: '2.5rem', flexGrow: 1, padding: 0 }}>
                    {(() => {
                      const allFeatures = tool.keyFeatures || tool.features || [];
                      return allFeatures.slice(0, 3).map((f: any, i: number) => {
                        const title = typeof f === 'string' ? f : (f.title || "");
                        return (
                          <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', marginBottom: '0.8rem', color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 500 }}>
                            <CheckCircle2 color="var(--success)" size={18} style={{ flexShrink: 0, marginTop: '2px' }} /> {title}
                          </li>
                        );
                      });
                    })()}
                  </ul>

                  <div style={{ paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'var(--font-outfit)', letterSpacing: '-1px' }}>
                        ${tool.basePrice}<span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{tool.isFlat ? '/mo' : '/user'}</span>
                      </div>
                    </div>
                    
                    {/* Premium Review Button */}
                    <Link 
                      href={`/tools/${tool.slug}`} 
                      style={{ 
                        background: `linear-gradient(135deg, ${tool.color1}, ${tool.color2})`,
                        color: 'white', padding: '0.8rem 1.8rem', borderRadius: '12px', textDecoration: 'none', 
                        fontWeight: 700, fontSize: '0.95rem', boxShadow: `0 10px 20px ${tool.color1}33`,
                        transition: 'transform 0.2s, box-shadow 0.2s'
                      }}
                      className="hover-scale"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Newsletter Section */}
        <section style={{ margin: '6rem 0', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))', border: '1px solid var(--border-color)', borderRadius: '40px', padding: '4rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', background: 'var(--brand-primary)', filter: 'blur(100px)', opacity: 0.2 }}></div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 800 }}>Join the SaaS Elite</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '2.5rem', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
              Get the weekly "Tool Report" featuring deep-dives into new software, exclusive discounts, and scaling tips.
            </p>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const email = (e.target as any).email.value;
                const res = await fetch('/api/subscribe', {
                  method: 'POST',
                  body: JSON.stringify({ email }),
                  headers: { 'Content-Type': 'application/json' }
                });
                if (res.ok) {
                  alert("You're in! Welcome to the inner circle.");
                  (e.target as any).reset();
                }
              }}
              style={{ display: 'flex', gap: '1rem', maxWidth: '500px', margin: '0 auto', background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '100px', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <input 
                name="email"
                type="email" 
                placeholder="Enter your work email" 
                required
                style={{ flexGrow: 1, background: 'transparent', border: 'none', color: 'white', padding: '0 1.5rem', outline: 'none', fontSize: '1rem' }}
              />
              <button type="submit" style={{ background: 'white', color: 'black', border: 'none', padding: '1rem 2rem', borderRadius: '100px', fontWeight: 800, cursor: 'pointer', transition: 'transform 0.2s' }} className="hover-scale">
                Subscribe
              </button>
            </form>
          </div>
        </section>
      </main>

      <div style={{ position: 'fixed', bottom: selectedTools.length > 0 ? '40px' : '-100px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15, 15, 20, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50px', padding: '0.8rem 1rem 0.8rem 2rem', display: 'flex', alignItems: 'center', gap: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', transition: 'bottom 0.5s', zIndex: 1000 }}>
        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ background: 'var(--brand-primary)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800 }}>{selectedTools.length}</div>
          <span style={{ fontSize: '1rem' }}>Tools Ready to Compare</span>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{ background: 'white', color: 'black', border: 'none', padding: '0.9rem 2rem', borderRadius: '50px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 10px 30px rgba(255,255,255,0.2)' }}>Compare <ArrowRight size={20} /></button>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(20px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ position: 'relative', background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '32px', padding: '3rem', width: '95%', maxWidth: '1100px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 50px 100px -20px rgba(0,0,0,1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1.5px' }}>Side-by-Side <span style={{ background: 'linear-gradient(to right, var(--brand-primary), var(--brand-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Analysis</span></h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', cursor: 'pointer', padding: '0.8rem', borderRadius: '50%' }}><X size={28} /></button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 1.5rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontSize: '1rem' }}>Comparison Points</th>
                  {selectedToolsData.map((t: any) => (
                    <th key={t.slug} style={{ textAlign: 'center', padding: '1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                        <div style={{ width: '50px', height: '50px', borderRadius: '14px', background: `linear-gradient(135deg, ${t.color1}, ${t.color2})`, display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 800, fontSize: '1.2rem' }}>{t.name.charAt(0)}</div>
                        <span style={{ fontSize: '1.3rem', fontWeight: 700 }}>{t.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '20px' }}>
                  <td style={{ padding: '2rem', fontWeight: 700, fontSize: '1.1rem' }}>Ease of Use</td>
                  {selectedToolsData.map((t: any) => (
                    <td key={t.slug} style={{ textAlign: 'center', padding: '2rem', color: 'var(--brand-primary)', fontSize: '1.8rem', fontWeight: 900 }}>{t.ease}%</td>
                  ))}
                </tr>
                <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '2rem', fontWeight: 700, fontSize: '1.1rem' }}>Starting Price</td>
                  {selectedToolsData.map((t: any) => (
                    <td key={t.slug} style={{ textAlign: 'center', padding: '2rem', fontSize: '1.4rem', fontWeight: 800 }}>${t.basePrice}<span style={{ fontSize: '0.9rem', opacity: 0.5, fontWeight: 400 }}>{t.isFlat ? '/mo' : '/user'}</span></td>
                  ))}
                </tr>
                {Array.from(new Set(selectedToolsData.flatMap((t: any) => {
                   const fts = t.keyFeatures || t.key_features || t.features || [];
                   return fts.map((f: any) => typeof f === 'string' ? f : (f.title || ""));
                }))).slice(0, 8).map((title: any) => (
                  <tr key={title} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '1.2rem', color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 500 }}>{title}</td>
                    {selectedToolsData.map((t: any) => {
                      const fts = t.keyFeatures || t.key_features || t.features || [];
                      const has = fts.some((f: any) => (typeof f === 'string' ? f : (f.title || "")) === title);
                      return <td key={t.slug} style={{ textAlign: 'center', padding: '1.2rem' }}>{has ? <CheckCircle2 color="var(--success)" size={24} /> : <X color="rgba(255,255,255,0.1)" size={24} />}</td>
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ToolGrid toolsData={toolsData} />
    </Suspense>
  );
}
