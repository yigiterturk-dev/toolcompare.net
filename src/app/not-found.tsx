import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{ 
      backgroundColor: '#050505', 
      color: '#fff', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{
        position: 'absolute',
        width: '300px',
        height: '300px',
        background: 'var(--brand-primary)',
        filter: 'blur(150px)',
        opacity: 0.1,
        zIndex: 0
      }}></div>

      <h1 style={{ fontSize: '10rem', fontWeight: '900', margin: 0, lineHeight: 1, opacity: 0.1 }}>404</h1>
      
      <div style={{ zIndex: 1 }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Looks like you're lost.</h2>
        <p style={{ color: '#888', marginBottom: '2rem', maxWidth: '500px' }}>
          The tool or page you're looking for doesn't exist or has been moved to a new galaxy.
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <Link href="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '1rem 2rem',
            backgroundColor: 'var(--brand-primary)',
            color: 'white',
            borderRadius: '12px',
            textDecoration: 'none',
            fontWeight: '600'
          }}>
            <Home size={20} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
