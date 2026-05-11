import Link from "next/link";

export default function Header() {
  return (
    <header style={{ position: 'fixed', top: 0, width: '100%', padding: '1rem 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, background: 'rgba(5,5,5,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
        <img src="/logo.png" alt="ToolCompare Logo" style={{ height: '50px', width: 'auto', objectFit: 'contain' }} />
        <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'white', letterSpacing: '-1px' }}>ToolCompare</span>
      </Link>
      <nav style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
        <Link href="/categories" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s', fontSize: '0.95rem' }} className="hover:text-white">Categories</Link>
        <Link href="/top-picks" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s', fontSize: '0.95rem' }} className="hover:text-white">Top Picks 2026</Link>
      </nav>
    </header>
  );
}
