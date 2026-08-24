import Header from "@/components/Header";
import toolsData from "@/data/tools.json";
import Link from "next/link";
import { Award, Star, ArrowRight } from "lucide-react";
import { listeSemasi } from "@/lib/yapilandirilmis";

export const metadata = {
  title: "The Cheapest Tools We Track (2026) | ToolCompare",
  description: "The lowest starting prices across our whole directory. Price is not quality — this is a price list, not a recommendation.",
};

export default function TopPicksPage() {
  // Sort tools by combined score and take top 5
  const topPicks = [...toolsData]
    .sort((a: any, b: any) => (a.basePrice ?? 0) - (b.basePrice ?? 0))
    .slice(0, 5);

  const sema = listeSemasi("The Cheapest Tools We Track (2026)", "/top-picks", topPicks);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(sema) }} />
      <Header />
      <div className="ambient-bg">
        <div className="orb orb-2"></div>
      </div>
      
      <main style={{ paddingTop: '10rem', maxWidth: '1000px', margin: '0 auto', paddingLeft: '5%', paddingRight: '5%' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <span style={{ background: 'rgba(236, 72, 153, 0.1)', color: 'var(--brand-tertiary)', padding: '0.5rem 1.2rem', borderRadius: '50px', fontSize: '0.9rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>Ranked by price</span>
          <h1 style={{ fontSize: '4rem', marginTop: '1rem', marginBottom: '1.5rem' }}>Cheapest Tools <span style={{ color: 'var(--brand-tertiary)' }}>2026</span></h1>
          {/* ONCEKI METIN: "We've analyzed over 500+ data points" -- boyle bir
              olcum YOK. Sayfa araclari kolaylik + ozellik puanina gore
              siraliyor, o kadar. Uydurma rakam kaldirildi ve yontem
              oldugu gibi yazildi. */}
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto' }}>
            These are the {topPicks.length} lowest starting prices across our whole directory of {toolsData.length}.
            No one paid to be here. Cheapest is not best: this is a price list, not a recommendation, and it
            says nothing about whether any of these fit your team.{' '}
            <Link href="/methodology" style={{ color: 'var(--brand-tertiary)' }}>How we score tools</Link>.
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
                  <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{tool.name}</h2>
                  {tool.shortDescription && (
                    <p style={{ color: 'var(--text-secondary)', margin: '0 0 0.6rem', lineHeight: 1.6, maxWidth: '55ch' }}>
                      {tool.shortDescription}
                    </p>
                  )}
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
    </>
  );
}
