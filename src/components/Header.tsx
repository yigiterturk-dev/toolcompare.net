import Link from "next/link";

export default function Header() {
  return (
    <header style={{ position: 'fixed', top: 0, width: '100%', padding: '0.8rem 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, background: 'rgba(5,5,5,0.85)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <img src="/logo.png" alt="ToolCompare Logo" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
      </Link>
      <nav style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
        <Link href="/categories" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s', fontSize: '0.95rem' }} className="hover:text-white">Categories</Link>
        <Link href="/top-picks" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s', fontSize: '0.95rem' }} className="hover:text-white">Top Picks 2026</Link>
      </nav>
    </header>
  );
}
