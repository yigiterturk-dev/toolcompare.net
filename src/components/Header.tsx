import Link from "next/link";
import { Layers } from "lucide-react";

export default function Header() {
  return (
    <header style={{ position: 'fixed', top: 0, width: '100%', padding: '1.2rem 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, background: 'rgba(5,5,5,0.7)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-color)' }}>
      <Link href="/" style={{ textDecoration: 'none' }}>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers style={{ color: 'var(--brand-primary)' }} /> ToolCompare
        </div>
      </Link>
      <nav style={{ display: 'flex', gap: '2.5rem' }}>
        <Link href="/categories" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }} className="hover:text-white">Categories</Link>
        <Link href="/top-picks" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }} className="hover:text-white">Top Picks 2026</Link>
        <Link href="/management-hq-2026" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, opacity: 0.5 }}>Admin</Link>
      </nav>
    </header>
  );
}
