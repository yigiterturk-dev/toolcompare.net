import Link from "next/link";
import { Layers, Code, MessageSquare, Globe, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer style={{ background: '#0a0a0a', borderTop: '1px solid var(--border-color)', padding: '5rem 5% 2rem', marginTop: '5rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '4rem', marginBottom: '4rem' }}>
        
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
            <img src="/logo.png" alt="ToolCompare Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} /> ToolCompare
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Find and compare the world's best software tools with deep-dive reviews and real-time pricing analysis.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="#" style={{ color: 'var(--text-secondary)' }}><MessageSquare size={20} /></a>
            <a href="#" style={{ color: 'var(--text-secondary)' }}><Code size={20} /></a>
            <a href="#" style={{ color: 'var(--text-secondary)' }}><Globe size={20} /></a>
          </div>
        </div>

        <div>
          <h4 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Explore</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <li><Link href="/categories" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>All Categories</Link></li>
            <li><Link href="/top-picks" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Top Picks 2026</Link></li>
            <li><Link href="/" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Software Directory</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Support</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Terms of Service</a></li>
            <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Privacy Policy</a></li>
            <li><a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Contact Us</a></li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Newsletter</h4>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>Get the latest SaaS insights weekly.</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="email" placeholder="Email address" style={{ flex: 1, background: '#111', border: '1px solid #333', padding: '0.8rem', borderRadius: '10px', color: 'white' }} />
            <button style={{ background: 'white', color: 'black', border: 'none', padding: '0.8rem 1.2rem', borderRadius: '10px', fontWeight: 700 }}>Join</button>
          </div>
        </div>

      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', borderTop: '1px solid #1a1a1a', paddingTop: '2rem', textAlign: 'center' }}>
        <p style={{ color: '#444', fontSize: '0.85rem' }}>
          &copy; 2026 ToolCompare. All rights reserved. Disclosure: We may earn a commission from tools listed on this site.
        </p>
      </div>
    </footer>
  );
}
