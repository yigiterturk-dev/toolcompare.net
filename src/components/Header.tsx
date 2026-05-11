import Link from "next/link";

export default function Header() {
  return (
    <header style={{ position: 'fixed', top: 0, width: '100%', padding: '1.2rem 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, background: 'rgba(5,5,5,0.7)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border-color)' }}>
      <Link href="/" style={{ fontSize: '1.6rem', fontWeight: 900, color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.8rem', letterSpacing: '-1.5px' }}>
        <img src="/logo.png" alt="ToolCompare Logo" style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
        <span>ToolCompare</span>
      </Link>
      <nav style={{ display: 'flex', gap: '2.5rem' }}>
        <Link href="/categories" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }} className="hover:text-white">Categories</Link>
        <Link href="/top-picks" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }} className="hover:text-white">Top Picks 2026</Link>
        <Link href="/management-hq-2026" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, opacity: 0.5 }}>Admin</Link>
      </nav>
    </header>
  );
}
