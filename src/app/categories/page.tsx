import Header from "@/components/Header";
import toolsData from "@/data/tools.json";
import Link from "next/link";
import { 
  Scale, 
  Users, 
  Briefcase, 
  MessageSquare, 
  Zap, 
  Code, 
  Layout, 
  Shield, 
  Database, 
  Cloud,
  CheckCircle,
  ArrowRight,
  Globe
} from "lucide-react";

const categoryIcons: Record<string, any> = {
  "Legal Tools": Scale,
  "CRM": Users,
  "Project Management": Briefcase,
  "Communication": MessageSquare,
  "Marketing": Zap,
  "Developer Tools": Code,
  "Design": Layout,
  "E-commerce": Shield,
  "Productivity": CheckCircle,
  "Customer Service": Globe,
  "Hosting": Cloud,
};

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
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, marginBottom: '3rem', textAlign: 'center', letterSpacing: '-0.03em' }}>
          Software <span style={{ color: '#444' }}>Categories</span>
        </h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem', marginBottom: '5rem' }}>
          {categories.map((cat) => {
            const IconComponent = categoryIcons[cat as string] || Globe;
            const count = toolsData.filter((t: any) => t.category === cat).length;
            return (
              <div key={cat} style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '24px', padding: '2.5rem', transition: 'all 0.3s ease' }} className="category-card">
                <IconComponent size={32} color="white" style={{ marginBottom: '1.5rem' }} />
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.5rem' }}>{cat}</h2>
                <p style={{ color: '#666', marginBottom: '2rem', fontSize: '0.95rem' }}>{count} tools reviewed in this category.</p>
                <Link href={`/?category=${cat}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem' }}>
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
