import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, MessageSquare, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <main style={{ background: '#050505', minHeight: '100vh', color: 'white' }}>
      <Header />
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10rem 5% 5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h1 style={{ fontSize: '4rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
            Get in <span style={{ color: '#444' }}>Touch</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
            Have a tool you want us to review? Or just want to say hi? We'd love to hear from you.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '3rem', borderRadius: '24px' }}>
            <Mail size={32} style={{ color: 'white', marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Email Us</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>Our team is ready to assist you with any inquiries.</p>
            <a href="mailto:hello@toolcompare.net" style={{ color: 'white', fontWeight: 700, textDecoration: 'none', fontSize: '1.1rem' }}>hello@toolcompare.net</a>
          </div>

          <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '3rem', borderRadius: '24px' }}>
            <MessageSquare size={32} style={{ color: 'white', marginBottom: '1.5rem' }} />
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Live Chat</h2>
            <p style={{ color: '#666', marginBottom: '1.5rem' }}>Available for our premium partners and tool vendors.</p>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>Available 9 AM - 6 PM EST</span>
          </div>
        </div>

        <div style={{ marginTop: '4rem', background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '4rem', borderRadius: '24px' }}>
          <form style={{ display: 'grid', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <input type="text" placeholder="Name" style={{ background: '#111', border: '1px solid #222', padding: '1.2rem', borderRadius: '12px', color: 'white' }} />
              <input type="email" placeholder="Email" style={{ background: '#111', border: '1px solid #222', padding: '1.2rem', borderRadius: '12px', color: 'white' }} />
            </div>
            <input type="text" placeholder="Subject" style={{ background: '#111', border: '1px solid #222', padding: '1.2rem', borderRadius: '12px', color: 'white' }} />
            <textarea placeholder="Message" rows={6} style={{ background: '#111', border: '1px solid #222', padding: '1.2rem', borderRadius: '12px', color: 'white' }}></textarea>
            <button style={{ background: 'white', color: 'black', padding: '1.2rem', borderRadius: '12px', fontWeight: 800, fontSize: '1.1rem', cursor: 'pointer', border: 'none' }}>
              Send Message
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </main>
  );
}
