import Link from "next/link";

export default function Header() {
  return (
    <header style={{ position: 'fixed', top: 0, width: '100%', padding: '0 5%', height: '100px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100, background: 'rgba(5,5,5,0.9)', backdropFilter: 'blur(30px)', borderBottom: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', height: '100%' }}>
        <div style={{ width: '220px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <img 
            src="/logo.png" 
            alt="ToolCompare Logo" 
            style={{ 
              height: '350px', 
              width: 'auto', 
              objectFit: 'contain',
              transform: 'scale(1.2)',
              marginTop: '5px'
            }} 
          />
        </div>
      </Link>
      <nav style={{ display: 'flex', gap: '3rem', alignItems: 'center' }}>
        <Link href="/categories" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s', fontSize: '0.95rem' }} className="hover:text-white">Categories</Link>
        <Link href="/top-picks" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s', fontSize: '0.95rem' }} className="hover:text-white">Top Picks 2026</Link>
      </nav>
    </header>
  );
}
