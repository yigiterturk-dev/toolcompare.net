import Header from "@/components/Header";
import Footer from "@/components/Footer";
import toolsData from "@/data/tools.json";
import { gitLinki } from "@/lib/outbound";
import { kanonikSlug, aracinKarsilastirmalari } from "@/lib/compare";
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

  const title = `${tool1.name} vs ${tool2.name} Comparison 2026: Which is Better? | ToolCompare`;
  const description = `Compare ${tool1.name} and ${tool2.name} side-by-side: pricing, ease of use, features, pros, cons and who each one is for.`;

  // "a-vs-b" ve "b-vs-a" ayni sayfa. Kanonik olan alfabetik sirali olan;
  // aksi halde ayni icerik iki adreste indekslenir ve ikisi de zayiflar.
  const canonical = `/compare/${kanonikSlug(tool1.slug, tool2.slug)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, siteName: "ToolCompare", type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ComparisonPage({ params }: any) {
  const resolvedParams = await params;
  const parts = resolvedParams.slug.split("-vs-");
  if (parts.length !== 2) notFound();

  const tool1 = (toolsData as any[]).find((t) => t.slug === parts[0]);
  const tool2 = (toolsData as any[]).find((t) => t.slug === parts[1]);

  if (!tool1 || !tool2) notFound();

  // Kisa cevap icin: hangi arac hangi olcutte onde? Sadece elimizdeki
  // sayilardan turetiliyor.
  const ucuz = tool1.basePrice <= tool2.basePrice ? tool1 : tool2;
  const pahali = ucuz === tool1 ? tool2 : tool1;
  const kolay = tool1.ease >= tool2.ease ? tool1 : tool2;
  const zor = kolay === tool1 ? tool2 : tool1;
  const zengin = tool1.featuresScore >= tool2.featuresScore ? tool1 : tool2;
  const sade = zengin === tool1 ? tool2 : tool1;

  const ilgili = aracinKarsilastirmalari(tool1.slug, 5).filter((t) => t.slug !== tool2.slug).slice(0, 4);

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

        {/* Kisa cevap. Ziyaretci "hangisi?" diye geliyor; cevabi sayfanin
            dibinde degil basinda gormeli. Butun ifadeler ELDEKI VERIDEN
            turetiliyor -- uydurma bir ustunluk iddiasi yok, ve verinin
            karar veremedigi yerde bunu acikca soyluyoruz. */}
        <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '28px', padding: '2.5rem', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '1.3rem', marginBottom: '1.2rem' }}>Short answer</h2>
          <ul style={{ color: 'var(--text-secondary)', lineHeight: 1.9, paddingLeft: '1.2rem', margin: 0 }}>
            <li>
              <strong style={{ color: 'white' }}>Price:</strong>{' '}
              {tool1.basePrice === tool2.basePrice
                ? `both start at $${tool1.basePrice}/mo.`
                : `${ucuz.name} is cheaper — $${ucuz.basePrice}/mo vs $${pahali.basePrice}/mo.`}
            </li>
            <li>
              <strong style={{ color: 'white' }}>Ease of use:</strong>{' '}
              {Math.abs(tool1.ease - tool2.ease) < 5
                ? 'effectively tied in our scoring.'
                : `${kolay.name} scores higher (${kolay.ease} vs ${zor.ease}).`}
            </li>
            <li>
              <strong style={{ color: 'white' }}>Feature depth:</strong>{' '}
              {Math.abs(tool1.featuresScore - tool2.featuresScore) < 5
                ? 'effectively tied in our scoring.'
                : `${zengin.name} scores higher (${zengin.featuresScore} vs ${sade.featuresScore}).`}
            </li>
          </ul>
          <p style={{ color: '#666', fontSize: '0.85rem', marginTop: '1.5rem', marginBottom: 0 }}>
            These lines are generated from the scores and prices we track, not from a paid placement. They cannot tell you which tool fits <em>your</em> workflow — the sections below are there for that.
          </p>
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

        {/* Arti / eksi. Onceki halde bu veri tools.json'da duruyordu ama
            karsilastirma sayfasinda hic gosterilmiyordu -- sayfayi ince
            birakan asil eksik buydu. */}
        <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
          {[tool1, tool2].map((t: any) => (
            <div key={t.slug} style={{ background: 'var(--surface-color)', padding: '2.5rem', borderRadius: '32px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '1.5rem' }}>{t.name}: pros &amp; cons</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem' }}>
                {(t.pros || []).map((p: string, i: number) => (
                  <li key={i} style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: '0.2rem' }} /> {p}
                  </li>
                ))}
              </ul>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {(t.cons || []).map((c: string, i: number) => (
                  <li key={i} style={{ display: 'flex', gap: '0.7rem', marginBottom: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <X size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '0.2rem' }} /> {c}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Tam degerlendirme. Tabloda ortasindan kesilip "..." ile
            biten metin hem kullaniciya hem arama motoruna degersizdi. */}
        <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
          {[tool1, tool2].map((t: any) => (
            <div key={t.slug} style={{ background: 'var(--surface-color)', padding: '2.5rem', borderRadius: '32px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '1.2rem' }}>Our verdict on {t.name}</h3>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{t.verdict}</p>
            </div>
          ))}
        </div>

        {/* Ilgili karsilastirmalar: bu sayfalar aksi halde oksuz kalir --
            sitemap'te olup siteden hic link almamak Google'a "onemsiz"
            sinyali verir. */}
        {ilgili.length > 0 && (
          <div style={{ marginTop: '4rem' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Other {tool1.name} comparisons</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
              {ilgili.map((t: any) => (
                <Link
                  key={t.slug}
                  href={`/compare/${kanonikSlug(tool1.slug, t.slug)}`}
                  style={{ padding: '0.8rem 1.4rem', borderRadius: '14px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}
                >
                  {tool1.name} vs {t.name}
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
