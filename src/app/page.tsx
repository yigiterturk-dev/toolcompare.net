"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Layers, Zap, Shield, BarChart3, Cloud, Database, Activity, CheckCircle, Layout, Mail,
  CheckCircle2, Check, X, Loader2, Users, ArrowRight
} from "lucide-react";
import toolsData from "@/data/tools.json";

// Map string icons to actual Lucide components
const IconMap: Record<string, any> = {
  Zap, Cloud, BarChart3, Database, Activity, CheckCircle, Layout, Mail
};

import Header from "@/components/Header";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ToolGrid({ toolsData }: { toolsData: any[] }) {
  const searchParams = useSearchParams();
  const catFilter = searchParams.get('category');
  
  const [teamSize, setTeamSize] = useState(10);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [matchLoading, setMatchLoading] = useState(false);
  const [highlightedTool, setHighlightedTool] = useState<string | null>(null);

  const filteredTools = catFilter 
    ? toolsData.filter((t: any) => t.category === catFilter)
    : toolsData;

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
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
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto 2rem' }}>
            Interactive pricing, AI-powered matchmaking, and unbiased feature comparisons.
          </p>
        </section>

        {/* Matchmaker */}
        {!catFilter && (
          <section style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(168,85,247,0.05))', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '3rem', margin: '0 auto 4rem', maxWidth: '800px', textAlign: 'center', position: 'relative' }}>
            <span style={{ display: 'inline-block', padding: '0.4rem 1rem', borderRadius: '50px', background: 'rgba(255,255,255,0.1)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem' }}>AI Assistant</span>
            <h3 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>What is your primary goal today?</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Select your priority, and our algorithm will highlight the best tool instantly.</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => handleMatch('hubspot-crm')} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1rem 1.5rem', borderRadius: '16px', color: 'var(--text-primary)', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Database /> Manage Customers (CRM)</button>
              <button onClick={() => handleMatch('asana')} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1rem 1.5rem', borderRadius: '16px', color: 'var(--text-primary)', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CheckCircle /> Track Projects</button>
              <button onClick={() => handleMatch('activecampaign')} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', padding: '1rem 1.5rem', borderRadius: '16px', color: 'var(--text-primary)', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail /> Automate Emails</button>
            </div>
            {matchLoading && (
              <div style={{ marginTop: '2rem', color: 'var(--brand-primary)', fontWeight: 600, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                <Loader2 className="animate-spin" /> Analyzing 10,000+ data points...
              </div>
            )}
          </section>
        )}

        {/* Slider */}
        <section style={{ maxWidth: '600px', margin: '0 auto 3rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '2rem', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Users /> Team Size</div>
            <div style={{ fontFamily: 'var(--font-outfit)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--brand-primary)' }}>{teamSize} Users</div>
          </div>
          <input type="range" min="1" max="100" value={teamSize} onChange={(e) => setTeamSize(parseInt(e.target.value))} />
        </section>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem' }}>{catFilter ? `${catFilter} Tools` : "Software Directory"}</h2>
        </div>

        {/* Grid generated from JSON */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem', marginBottom: '5rem' }}>
          {filteredTools.map((tool: any) => {
            const Icon = IconMap[tool.iconName] || Zap;
            const total = tool.isFlat ? tool.basePrice : tool.basePrice * teamSize;
            
            return (
              <div 
                key={tool.slug} 
                id={`card-${tool.slug}`}
                onMouseMove={handleMouseMove}
                style={{
                  background: 'var(--surface-color)', border: `1px solid ${highlightedTool === tool.slug ? 'var(--brand-primary)' : 'var(--border-color)'}`,
                  borderRadius: '20px', padding: '2rem', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  boxShadow: highlightedTool === tool.slug ? '0 0 30px rgba(99,102,241,0.2)' : 'none'
                }}
              >
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', background: 'radial-gradient(circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(255,255,255,0.06) 0%, transparent 400px)', zIndex: 0, opacity: 0, transition: 'opacity 0.3s' }} className="hover:opacity-100" />
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <label style={{ position: 'absolute', top: 0, right: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.4)', padding: '0.4rem 0.8rem', borderRadius: '50px', border: '1px solid var(--border-color)' }}>
                    <input type="checkbox" checked={selectedTools.includes(tool.name)} onChange={() => handleCompareChange(tool.name)} style={{ accentColor: 'var(--brand-primary)' }} /> Compare
                  </label>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.5rem', marginTop: '1rem' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: `linear-gradient(135deg, ${tool.color1}, ${tool.color2})` }}>
                      <Icon size={32} color="#fff" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.4rem' }}>
                        <Link href={`/tools/${tool.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{tool.name}</Link>
                      </h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--brand-primary)' }}>{tool.category}</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ease of Use</span>
                      <div style={{ height: '4px', background: 'var(--surface-light)', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: `${tool.ease}%`, height: '100%', background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))' }} /></div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Features</span>
                      <div style={{ height: '4px', background: 'var(--surface-light)', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: `${tool.featuresScore}%`, height: '100%', background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))' }} /></div>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', minHeight: '3rem' }}>{tool.shortDescription || tool.description}</p>

                  <ul style={{ listStyle: 'none', marginBottom: '2rem', flexGrow: 1, padding: 0 }}>
                    {(tool.keyFeatures || (tool.features || []).map((f:any)=>({title:f}))).slice(0, 3).map((f: any, i: number) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', marginBottom: '0.8rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        <CheckCircle2 color="var(--success)" size={18} style={{ flexShrink: 0, marginTop: '2px' }} /> {f.title || f}
                      </li>
                    ))}
                  </ul>

                  <div style={{ marginBottom: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-outfit)', display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                        ${tool.basePrice} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 400, fontFamily: 'var(--font-inter)' }}>{tool.isFlat ? '/flat rate' : '/user/mo'}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--brand-primary)', marginTop: '0.2rem', display: 'block', fontWeight: 600 }}>Total: ${total}/mo {tool.isFlat && "(No user fee)"}</span>
                    </div>
                    <Link href={`/tools/${tool.slug}`} style={{ background: 'var(--text-primary)', color: 'var(--bg-color)', padding: '0.6rem 1.2rem', borderRadius: '10px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>Review</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {/* Compare Dock */}
      <div style={{ position: 'fixed', bottom: selectedTools.length > 0 ? '40px' : '-100px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15, 15, 20, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50px', padding: '0.8rem 1rem 0.8rem 2rem', display: 'flex', alignItems: 'center', gap: '2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.8)', transition: 'bottom 0.5s', zIndex: 1000 }}>
        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ background: 'var(--brand-primary)', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>{selectedTools.length}</div>
          <span>Tools Selected</span>
        </div>
        <button onClick={() => setIsModalOpen(true)} style={{ background: 'white', color: 'black', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '50px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>Compare Now <ArrowRight size={18} /></button>
      </div>

      {/* Modal */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(15px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: isModalOpen ? 1 : 0, pointerEvents: isModalOpen ? 'auto' : 'none', transition: 'opacity 0.3s' }}>
        <div style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '24px', width: '90%', maxWidth: '1000px', padding: '3rem', position: 'relative', transform: isModalOpen ? 'translateY(0)' : 'translateY(30px)', transition: 'transform 0.4s' }}>
          <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'rgba(255,255,255,0.1)', color: 'var(--text-secondary)', border: 'none', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer' }}><X /></button>
          <h2>Head-to-Head Comparison</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '2rem' }}>
            <thead>
              <tr>
                <th style={{ padding: '1.5rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', fontFamily: 'var(--font-outfit)', fontSize: '1.2rem', width: '33%' }}>Feature / Tool</th>
                <th style={{ padding: '1.5rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', fontFamily: 'var(--font-outfit)', fontSize: '1.2rem', width: '33%' }}>{selectedTools[0] || '---'}</th>
                <th style={{ padding: '1.5rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)', fontFamily: 'var(--font-outfit)', fontSize: '1.2rem', width: '33%' }}>{selectedTools[1] || '---'}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}><strong>API Access</strong></td>
                <td style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}><Check color="var(--success)" style={{ verticalAlign: 'middle' }} /> Included</td>
                <td style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}><Check color="var(--success)" style={{ verticalAlign: 'middle' }} /> Included</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
