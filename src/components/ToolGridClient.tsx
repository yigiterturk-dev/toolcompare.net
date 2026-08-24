"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Layers, Zap, Shield, BarChart3, Cloud, Database, Activity, CheckCircle, Layout, Mail,
  CheckCircle2, Check, X, Loader2, Users, ArrowRight, Search, Scale, Palette, ShoppingBag, Video, Star
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AIAssistant from "@/components/AIAssistant";
import AIWizard from "@/components/AIWizard";
import { oneCikanCiftler } from "@/lib/compare";
import { fiyatDurumu } from "@/lib/fiyat";

const IconMap: Record<string, any> = {
  Zap, Cloud, BarChart3, Database, Activity, CheckCircle, Layout, Mail, Scale, Users, Palette, ShoppingBag, Video
};

function ToolGrid({ initialTools }: { initialTools: any[] }) {
  const router = useRouter();

  // useSearchParams() statik uretimde BAILOUT_TO_CLIENT_SIDE_RENDERING'e yol
  // aciyordu: sunucudan gelen HTML yalnizca "Loading..." oluyor, ne H1 ne de
  // tek bir link iceriyordu. Ayni bilgiyi hidrasyondan sonra okumak sayfayi
  // sunucuda render edilebilir birakiyor; ilk render filtresiz liste gosterir.
  const [catFilter, setCatFilter] = useState<string | null>(null);
  useEffect(() => {
    setCatFilter(new URLSearchParams(window.location.search).get('category'));
  }, []);

  // Veri artik sunucudan prop ile geliyor; tarayicidan fetch edilince urun
  // linkleri HTML'e hic girmiyordu (121 sayfa orphan kaliyordu).
  const [tools, setTools] = useState<any[]>(initialTools);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const pageSize = 12;

  const style = `
    .tool-card-hover:hover {
      transform: translateY(-10px) scale(1.02);
      border-color: var(--brand-primary) !important;
      box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 25px rgba(99, 102, 241, 0.4) !important;
    }
    .star-hover:hover {
      transform: scale(1.3);
      filter: drop-shadow(0 0 5px #fbbf24);
    }
  `;

  // Reset to page 1 when search or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, catFilter]);

  const filteredTools = useMemo(() => {
    return tools
      .filter((t: any) => !catFilter || t.category === catFilter)
      .filter((t: any) => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [tools, catFilter, searchTerm]);

  const selectedToolsData = tools.filter((t: any) => selectedTools.includes(t.name));

  const handleCompareChange = (toolName: string) => {
    setSelectedTools(prev => 
      prev.includes(toolName) ? prev.filter(t => t !== toolName) : [...prev, toolName]
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: style }} />
      <Header />
      <div className="ambient-bg">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      <main style={{ paddingTop: '40rem', maxWidth: '1400px', margin: '0 auto', padding: '0 5%' }}>
        <section style={{ textAlign: 'center', maxWidth: '1000px', margin: '0 auto 5rem', position: 'relative', zIndex: 9999, marginTop: '5rem' }}>
          <h1 style={{ fontSize: 'clamp(3.5rem, 6vw, 5rem)', lineHeight: 1.1, marginBottom: '2rem', letterSpacing: '-2px', fontWeight: 900 }}>
            {catFilter ? `Best ${catFilter} ` : "Find The Perfect "}
            <span style={{ background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SaaS Tool</span>
          </h1>
          <p style={{ fontSize: '1.4rem', color: 'rgba(255,255,255,0.6)', maxWidth: '800px', margin: '0 auto 4rem', lineHeight: 1.6 }}>
            Unbiased reviews, side-by-side comparisons, and real-time pricing for the world's top software tools.
          </p>

          <div style={{ position: 'relative', maxWidth: '850px', margin: '0 auto 4rem', width: '100%', zIndex: 100 }}>
            <div style={{ 
              position: 'absolute', 
              inset: '-2px', 
              background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))', 
              borderRadius: '24px', 
              filter: 'blur(10px)', 
              opacity: 0.3,
              zIndex: -1 
            }}></div>
            <input 
              type="text" 
              aria-label="Search tools" placeholder="Search across 100+ AI tools, CRMs, and more..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '1.8rem 2rem 1.8rem 4.5rem', 
                borderRadius: '22px', 
                background: 'rgba(15, 15, 20, 0.8)', 
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                color: 'white', 
                fontSize: '1.4rem', 
                fontWeight: '500',
                outline: 'none',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}
            />
            <Search size={32} style={{ 
              position: 'absolute', 
              left: '1.5rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: 'var(--brand-primary)',
              opacity: 0.8
            }} />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {[
              { name: 'CRM', icon: Users },
              { name: 'Marketing', icon: Zap },
              { name: 'Project Management', icon: Layout },
              { name: 'Design', icon: Palette },
              { name: 'Communication', icon: Mail },
              { name: 'Developer Tools', icon: Database },
              { name: 'E-commerce', icon: ShoppingBag }
            ].map((cat) => (
              <Link 
                key={cat.name} 
                href={`/?category=${cat.name}`}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.8rem 1.5rem', 
                  borderRadius: '100px', 
                  background: catFilter === cat.name ? 'var(--brand-primary)' : 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: catFilter === cat.name ? 'white' : 'var(--text-secondary)',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.2s'
                }}
                className="hover-scale"
              >
                <cat.icon size={18} />
                {cat.name}
              </Link>
            ))}
          </div>
          
          {/* Trending VS Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap', opacity: 0.8 }}>
            <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Trending VS:</span>
            {oneCikanCiftler().map((vs) => (
              <Link 
                key={vs.slug}
                href={`/compare/${vs.slug}`}
                style={{ 
                  fontSize: '0.85rem', 
                  color: 'white', 
                  textDecoration: 'none', 
                  background: 'rgba(255,255,255,0.03)', 
                  padding: '0.4rem 1rem', 
                  borderRadius: '50px', 
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'all 0.2s'
                }}
                className="hover-glow"
              >
                {vs.label}
              </Link>
            ))}
          </div>
        </section>

        <section style={{ maxWidth: '1000px', margin: '4rem auto 8rem', position: 'relative', zIndex: 10 }}>
           <AIWizard tools={tools} />
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
          {loading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '5rem' }}>
              <Loader2 className="animate-spin" size={48} style={{ color: 'var(--brand-primary)', margin: '0 auto' }} />
              <p style={{ marginTop: '1rem', color: '#666' }}>Connecting to Database...</p>
            </div>
          ) : (
            filteredTools.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((tool: any) => {
              const Icon = IconMap[tool.iconName] || Zap;
              const isSelected = selectedTools.includes(tool.name);
              
              return (
                <div 
                  key={tool.slug} 
                  id={`card-${tool.slug}`} 
                  style={{ 
                    background: 'var(--surface-color)', 
                    border: `1px solid ${isSelected ? 'var(--brand-primary)' : 'rgba(255,255,255,0.06)'}`, 
                    borderRadius: '28px', 
                    padding: '2.5rem', 
                    position: 'relative', 
                    overflow: 'visible', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    transition: 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)',
                    boxShadow: isSelected ? '0 20px 40px rgba(99, 102, 241, 0.2)' : '0 10px 30px rgba(0,0,0,0.2)',
                    cursor: 'pointer'
                  }}
                  className="tool-card-hover"
                >
                  <div style={{ position: 'absolute', top: '-15px', left: '2rem', display: 'flex', gap: '0.8rem', zIndex: 10 }}>
                    {(() => {
                      const badges = [];
                      if (tool.basePrice <= 15 && tool.basePrice > 0) badges.push({ text: 'Budget Pick', color: '#10b981' });
                      // "Editor's Choice" ve "Top Rated" rozetleri uydurma
                      // puanlardan uretiliyordu; kaldirildi. Yerine
                      // DOGRULANABILIR bilgi: nasil baslanabiliyor.
                      const fd = fiyatDurumu(tool);
                      if (tool.fiyatModeli === 'bedava') badges.push({ text: 'Free', color: '#22c55e' });
                      else if (tool.fiyatModeli === 'ucretsiz-katman') badges.push({ text: 'Free tier', color: '#22c55e' });
                      else if (tool.fiyatModeli === 'kullanima-gore') badges.push({ text: 'Usage-based', color: '#f59e0b' });
                      
                      return badges.map((b, i) => (
                        <div key={i} style={{ 
                          background: b.color, 
                          color: 'white', 
                          padding: '0.4rem 1rem', 
                          fontSize: '0.65rem', 
                          fontWeight: 900, 
                          textTransform: 'uppercase', 
                          borderRadius: '12px',
                          boxShadow: `0 8px 16px ${b.color}44`,
                          letterSpacing: '1px'
                        }}>
                          {b.text}
                        </div>
                      ));
                    })()}
                  </div>

                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCompareChange(tool.name); }}
                      style={{ 
                        position: 'absolute', 
                        top: '0', 
                        right: '0', 
                        padding: '0.5rem 1rem', 
                        borderRadius: '14px', 
                        background: isSelected ? 'var(--brand-primary)' : 'rgba(255,255,255,0.03)', 
                        border: `1px solid ${isSelected ? 'white' : 'rgba(255,255,255,0.1)'}`, 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.6rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 800, 
                        zIndex: 20,
                        transition: 'all 0.3s', 
                        color: 'white',
                      }}
                    >
                      <div style={{ 
                        width: '16px', 
                        height: '16px', 
                        borderRadius: '4px', 
                        border: '2px solid white', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        background: isSelected ? 'white' : 'transparent',
                        transition: 'all 0.2s'
                      }}>
                        {isSelected && <Check size={12} color="var(--brand-primary)" strokeWidth={4} />}
                      </div>
                      COMPARE
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                      <div style={{ 
                        width: '72px', 
                        height: '72px', 
                        borderRadius: '20px', 
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center', 
                        background: `linear-gradient(135deg, ${tool.color1}, ${tool.color2})`, 
                        boxShadow: `0 12px 24px ${tool.color1}44` 
                      }}>
                        <Icon size={36} color="#fff" />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.4rem', paddingRight: '7rem', letterSpacing: '-0.5px' }}>
                          <Link href={`/tools/${tool.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>{tool.name}</Link>
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>{tool.category}</span>
                          {/* YILDIZLAR KALDIRILDI: uydurma ease/featuresScore
                              puanindan hesaplaniyordu, ustune oy yoksa
                              `|| 4.1` diye sabit bir "kullanici puani"
                              uyduruluyordu. Ikisi de gercek degildi. */}
                        </div>
                      </div>
                    </div>
                    {/* Ease of Use / Features kutulari kaldirildi: iki puan da
                        uydurmaydi ve ayrim yapamiyordu. Yerine DOGRULANABILIR
                        bilgi: bu araca nasil baslanabiliyor. */}
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                       <div style={{ flex: 1, padding: '0.8rem', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                         <div style={{ fontSize: '0.6rem', color: '#666', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.2rem' }}>How to start</div>
                         <div style={{ fontSize: '1rem', fontWeight: 900, color: 'white' }}>{fiyatDurumu(tool).kisa}</div>
                       </div>
                    </div>
                    {/* TOPLULUK PUANLAMASI KALDIRILDI. Oy useState'te
                        tutuluyordu: hicbir yere gonderilmiyor, sayfa
                        yenilenince kayboluyor, baska kimse gormuyor -- ama
                        ekranda "Thanks for your vote!" yaziyordu. Olmayan bir
                        puanlama sistemi ima ediyordu.
                        Gercek oylama isteniyorsa tik olcumu gibi bir depo
                        gerekir (bkz. src/lib/clicks.ts); o zamana kadar
                        gostermemek dogru. */}

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
                          {fiyatDurumu(tool).karsilastirilabilir
                            ? <>${tool.basePrice}<span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{tool.isFlat ? '/mo' : '/user'}</span></>
                            : <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{fiyatDurumu(tool).kisa}</span>}
                        </div>
                      </div>
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
            })
          )}
        </section>

        {/* Pagination Controls */}
        {!loading && filteredTools.length > pageSize && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '5rem' }}>
            <button 
              onClick={() => {
                setCurrentPage(prev => Math.max(1, prev - 1));
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              disabled={currentPage === 1}
              style={{ padding: '0.8rem 1.2rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.3 : 1 }}
            >
              Previous
            </button>
            
            {Array.from({ length: Math.ceil(filteredTools.length / pageSize) }).map((_, i) => (
              <button 
                key={i}
                onClick={() => {
                  setCurrentPage(i + 1);
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }}
                style={{ 
                  width: '45px', 
                  height: '45px', 
                  borderRadius: '12px', 
                  background: currentPage === i + 1 ? 'var(--brand-primary)' : 'rgba(255,255,255,0.05)', 
                  border: '1px solid rgba(255,255,255,0.1)', 
                  color: 'white', 
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {i + 1}
              </button>
            )).slice(Math.max(0, currentPage - 3), Math.min(Math.ceil(filteredTools.length / pageSize), currentPage + 2))}

            <button 
              onClick={() => {
                setCurrentPage(prev => Math.min(Math.ceil(filteredTools.length / pageSize), prev + 1));
                window.scrollTo({ top: 400, behavior: 'smooth' });
              }}
              disabled={currentPage === Math.ceil(filteredTools.length / pageSize)}
              style={{ padding: '0.8rem 1.2rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: currentPage === Math.ceil(filteredTools.length / pageSize) ? 'not-allowed' : 'pointer', opacity: currentPage === Math.ceil(filteredTools.length / pageSize) ? 0.3 : 1 }}
            >
              Next
            </button>
          </div>
        )}

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
                aria-label="Work email" placeholder="Enter your work email" 
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

      {/* Comparison Drawer */}
      <div style={{ position: 'fixed', bottom: selectedTools.length > 0 ? '40px' : '-100px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(15, 15, 20, 0.85)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50px', padding: '0.8rem 1rem 0.8rem 2rem', display: 'flex', alignItems: 'center', gap: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.8)', transition: 'bottom 0.5s', zIndex: 1000 }}>
        <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ background: 'var(--brand-primary)', color: 'white', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800 }}>{selectedTools.length}</div>
          <span style={{ fontSize: '1rem' }}>Tools Ready to Compare</span>
        </div>
        <button 
          onClick={() => {
            const selectedSlugs = tools.filter((t: any) => selectedTools.includes(t.name)).map((t: any) => t.slug).join('-vs-');
            router.push(`/compare/${selectedSlugs}`);
          }} 
          style={{ background: 'white', color: 'black', border: 'none', padding: '0.9rem 2rem', borderRadius: '50px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', boxShadow: '0 10px 30px rgba(255,255,255,0.2)' }}
        >
          Compare <ArrowRight size={20} />
        </button>
      </div>

      <AIAssistant tools={tools} />
      <Footer />
    </>
  );
}

export default function ToolGridClient({ initialTools }: { initialTools: any[] }) {
  return <ToolGrid initialTools={initialTools} />;
}
