"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, Target, DollarSign, Zap, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function AIWizard({ tools }: { tools: any[] }) {
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState({ category: "", budget: "", focus: "" });
  const [results, setResults] = useState<any[]>([]);
  const router = useRouter();

  const categories = Array.from(new Set(tools.map(t => t.category)));

  const handleNext = (key: string, value: string) => {
    const newSelections = { ...selections, [key]: value };
    setSelections(newSelections);
    
    if (step < 2) {
      setStep(step + 1);
    } else {
      // Calculate Results
      const filtered = tools.filter(t => t.category === newSelections.category);
      
      const scored = filtered.map(t => {
        let score = 0;
        // Budget match
        if (newSelections.budget === "free" && t.trial) score += 20;
        if (newSelections.budget === "low" && t.basePrice < 30) score += 20;
        if (newSelections.budget === "pro" && t.basePrice >= 30) score += 20;
        
        // Focus match
        if (newSelections.focus === "ease") score += t.ease;
        if (newSelections.focus === "features") score += t.featuresScore;
        
        return { ...t, aiScore: score };
      }).sort((a, b) => b.aiScore - a.aiScore);

      setResults(scored.slice(0, 3));
      setStep(3);
    }
  };

  if (step === 3) {
    return (
      <div style={{ background: 'rgba(99, 102, 241, 0.05)', border: '1px solid var(--brand-primary)', borderRadius: '40px', padding: '4rem', textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '2rem' }}>Our AI Recommendations <Sparkles color="var(--brand-primary)" style={{ display: 'inline' }} /></h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '2rem' }}>
          {results.map((t, i) => (
            <div key={t.slug} style={{ background: 'var(--surface-color)', padding: '2rem', borderRadius: '32px', border: '1px solid var(--border-color)', position: 'relative', overflow: 'hidden' }}>
              {i === 0 && <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'var(--brand-primary)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 900 }}>BEST MATCH</div>}
              <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: `linear-gradient(135deg, ${t.color1}, ${t.color2})`, margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>{t.name.charAt(0)}</div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '1rem' }}>{t.name}</h3>
              <button onClick={() => router.push(`/tools/${t.slug}`)} style={{ width: '100%', padding: '0.8rem', borderRadius: '12px', background: 'white', color: 'black', border: 'none', fontWeight: 800, cursor: 'pointer' }}>View Details</button>
            </div>
          ))}
        </div>
        <button onClick={() => setStep(0)} style={{ marginTop: '3rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#666', padding: '0.8rem 2rem', borderRadius: '12px', cursor: 'pointer' }}>Start Over</button>
      </div>
    );
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '40px', padding: '4rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '2rem', right: '4rem', fontSize: '0.8rem', color: '#444', fontWeight: 800 }}>STEP {step + 1} OF 3</div>
      
      {step === 0 && (
        <div style={{ animation: 'slideIn 0.4s ease' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>What are you <span style={{ color: 'var(--brand-primary)' }}>building?</span></h2>
          <p style={{ color: '#666', marginBottom: '3rem' }}>Select the category you need help with.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1rem' }}>
            {categories.map(cat => (
              <button key={cat} onClick={() => handleNext("category", cat)} style={{ padding: '1rem 2rem', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s' }} className="hover-scale">{cat}</button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div style={{ animation: 'slideIn 0.4s ease' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>What's your <span style={{ color: 'var(--brand-primary)' }}>budget?</span></h2>
          <p style={{ color: '#666', marginBottom: '3rem' }}>We'll find tools that fit your wallet.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
            <button onClick={() => handleNext("budget", "free")} style={{ padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'center' }} className="hover-scale">
               <div style={{ marginBottom: '1rem' }}><CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto' }}/></div>
               <div style={{ fontWeight: 800, color: 'white' }}>Free / Trials</div>
            </button>
            <button onClick={() => handleNext("budget", "low")} style={{ padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'center' }} className="hover-scale">
               <div style={{ marginBottom: '1rem' }}><DollarSign size={32} color="var(--brand-primary)" style={{ margin: '0 auto' }}/></div>
               <div style={{ fontWeight: 800, color: 'white' }}>Startup ($1 - $30)</div>
            </button>
            <button onClick={() => handleNext("budget", "pro")} style={{ padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'center' }} className="hover-scale">
               <div style={{ marginBottom: '1rem' }}><Zap size={32} color="#f59e0b" style={{ margin: '0 auto' }}/></div>
               <div style={{ fontWeight: 800, color: 'white' }}>Enterprise (High-End)</div>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ animation: 'slideIn 0.4s ease' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1rem' }}>Your primary <span style={{ color: 'var(--brand-primary)' }}>focus?</span></h2>
          <p style={{ color: '#666', marginBottom: '3rem' }}>Do you want simplicity or raw power?</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem', maxWidth: '600px', margin: '0 auto' }}>
            <button onClick={() => handleNext("focus", "ease")} style={{ padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'center' }} className="hover-scale">
               <div style={{ fontWeight: 800, color: 'white', fontSize: '1.2rem' }}>Simplicity First</div>
               <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>Easy to learn, fast to deploy</div>
            </button>
            <button onClick={() => handleNext("focus", "features")} style={{ padding: '2rem', borderRadius: '24px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', textAlign: 'center' }} className="hover-scale">
               <div style={{ fontWeight: 800, color: 'white', fontSize: '1.2rem' }}>Feature Rich</div>
               <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>Maximum tools and advanced options</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
