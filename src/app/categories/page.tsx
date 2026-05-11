import Header from "@/components/Header";
import toolsData from "@/data/tools.json";
import Link from "next/link";
import { Grid2X2, ArrowRight } from "lucide-react";

export const metadata = {
  title: "Software Categories | ToolCompare",
  description: "Browse SaaS tools by category: CRM, AI, Project Management, and more.",
};

export default function CategoriesPage() {
  const categories = Array.from(new Set(toolsData.map((t: any) => t.category)));

  return (
    <>
      <Header />
      <div className="ambient-bg">
        <div className="orb orb-1"></div>
      </div>
      
      <main style={{ paddingTop: '10rem', maxWidth: '1200px', margin: '0 auto', paddingLeft: '5%', paddingRight: '5%' }}>
        <h1 style={{ fontSize: '3.5rem', marginBottom: '3rem', textAlign: 'center' }}>Software Categories</h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem', marginBottom: '5rem' }}>
          {categories.map((cat) => {
            const count = toolsData.filter((t: any) => t.category === cat).length;
            return (
              <div key={cat} style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '2.5rem', transition: 'transform 0.3s' }}>
                <Grid2X2 size={40} color="var(--brand-primary)" style={{ marginBottom: '1.5rem' }} />
                <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>{cat}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{count} tools reviewed in this category.</p>
                <Link href={`/?category=${cat}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', textDecoration: 'none', fontWeight: 600 }}>
                  Explore Category <ArrowRight size={18} />
                </Link>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
