"use client";

import Link from "next/link";
import { useState } from "react";
import { Layers, Code, MessageSquare, Globe, Mail, Check } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubscribe = async () => {
    if (!email || !email.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Subscription failed");
      setStatus("success");
      setEmail("");
      setTimeout(() => setStatus("idle"), 3000);
    } catch {
      setStatus("idle");
    }
  };

  return (
    <footer style={{ background: '#0a0a0a', borderTop: '1px solid #1a1a1a', padding: '5rem 5% 2rem', marginTop: '5rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '4rem', marginBottom: '4rem' }}>
        
        <div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1.5rem' }}>
            <img src="/logo.png" alt="ToolCompare Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} /> ToolCompare
          </div>
          <p style={{ color: '#888', lineHeight: 1.6, marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Find and compare the world's best software tools with deep-dive reviews and real-time pricing analysis.
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <a aria-label="ToolCompare on X" href="https://twitter.com" target="_blank" rel="noopener noreferrer" style={{ color: '#444', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'white'} onMouseOut={(e) => e.currentTarget.style.color = '#444'}><MessageSquare size={20} /></a>
            <a aria-label="ToolCompare on GitHub" href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ color: '#444', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'white'} onMouseOut={(e) => e.currentTarget.style.color = '#444'}><Code size={20} /></a>
            <a aria-label="ToolCompare homepage" href="https://toolcompare.net" style={{ color: '#444', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'white'} onMouseOut={(e) => e.currentTarget.style.color = '#444'}><Globe size={20} /></a>
          </div>
        </div>

        <div>
          <h4 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Explore</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <li><Link href="/categories" style={{ color: '#888', textDecoration: 'none', fontSize: '0.95rem' }}>All Categories</Link></li>
            <li><Link href="/top-picks" style={{ color: '#888', textDecoration: 'none', fontSize: '0.95rem' }}>Top Picks 2026</Link></li>
            <li><Link href="/" style={{ color: '#888', textDecoration: 'none', fontSize: '0.95rem' }}>Software Directory</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Support</h4>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <li><Link href="/terms" style={{ color: '#888', textDecoration: 'none', fontSize: '0.95rem' }}>Terms of Service</Link></li>
            <li><Link href="/privacy" style={{ color: '#888', textDecoration: 'none', fontSize: '0.95rem' }}>Privacy Policy</Link></li>
            <li><Link href="/contact" style={{ color: '#888', textDecoration: 'none', fontSize: '0.95rem' }}>Contact Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Newsletter</h4>
          <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '1rem' }}>Get the latest SaaS insights weekly.</p>
          <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
            <input 
              type="email" 
              aria-label="Newsletter email address"
              placeholder="Email address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ flex: 1, background: '#111', border: '1px solid #222', padding: '0.8rem', borderRadius: '10px', color: 'white', outline: 'none' }} 
            />
            <button 
              onClick={handleSubscribe}
              disabled={status !== "idle"}
              style={{ 
                background: status === "success" ? "#10b981" : "white", 
                color: status === "success" ? "white" : "black", 
                border: 'none', 
                padding: '0.8rem 1.2rem', 
                borderRadius: '10px', 
                fontWeight: 700, 
                cursor: status === "idle" ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {status === "loading" ? "..." : status === "success" ? <><Check size={16} /> Joined</> : "Join"}
            </button>
          </div>
          {status === "success" && (
            <p style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '0.8rem', fontWeight: 600 }}>Welcome to the elite list!</p>
          )}
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
