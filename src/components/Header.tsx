"use client";

import Link from "next/link";
import { Plus, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="site-header" style={{
      position: 'fixed', 
      top: 0, 
      width: '100%', 
      padding: '0 5%', 
      height: '80px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      zIndex: 1000, 
      background: 'rgba(5, 5, 5, 0.8)', 
      backdropFilter: 'blur(20px)', 
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)' 
    }}>
      {/* LOGO AREA */}
      <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: '0.8rem' }}>
        <img 
          src="/logo.png" 
          alt="ToolCompare Logo" 
          style={{ height: '32px', width: 'auto', objectFit: 'contain' }} 
        />
        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>
          ToolCompare
        </span>
      </Link>

      {/* NAVIGATION & ACTIONS */}
      <button
        type="button"
        className="mobile-menu-button"
        aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isMenuOpen}
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
      <nav className={isMenuOpen ? "site-nav is-open" : "site-nav"} aria-label="Primary navigation">
        <div className="site-nav-links" style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginRight: '1rem' }}>
          <Link href="/categories" style={{ color: '#888', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem', transition: 'color 0.2s' }}>Categories</Link>
          <Link href="/top-picks" style={{ color: '#888', textDecoration: 'none', fontWeight: 500, fontSize: '0.9rem', transition: 'color 0.2s' }}>Top Picks 2026</Link>
        </div>


        {/* CTA BUTTON */}
        <Link 
          href="/contact" 
          style={{ 
            background: 'white', 
            color: 'black', 
            padding: '0.6rem 1.2rem', 
            borderRadius: '12px', 
            fontWeight: 800, 
            fontSize: '0.85rem', 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 15px rgba(255,255,255,0.1)',
            transition: 'transform 0.2s ease'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={16} />
          Submit Tool
        </Link>
      </nav>
    </header>
  );
}
