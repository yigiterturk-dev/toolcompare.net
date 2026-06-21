import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import fs from 'fs';
import path from 'path';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SaaS Insights | ToolCompare Blog",
  description: "Expert guides, trends, and strategies for choosing the best software tools.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  const postsPath = path.join(process.cwd(), 'src/data/posts.json');
  let posts: any[] = [];
  if (fs.existsSync(postsPath)) {
    try {
      posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
    } catch {
      posts = [];
    }
  }

  return (
    <>
      <Header />
      <div className="ambient-bg">
        <div className="orb orb-1"></div>
      </div>

      <main style={{ paddingTop: '8rem', paddingBottom: '8rem', maxWidth: '1200px', margin: '0 auto', paddingLeft: '5%', paddingRight: '5%' }}>
        <header style={{ marginBottom: '5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '4rem', fontWeight: 900, letterSpacing: '-2px', marginBottom: '1rem' }}>SaaS <span style={{ color: 'var(--brand-primary)' }}>Insights</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Expert guides, trends, and strategies for the modern software era.</p>
        </header>

        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
            <p style={{ fontSize: '1.1rem' }}>No articles published yet. Check back soon for expert SaaS insights.</p>
          </div>
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '3rem' }}>
          {posts.map((post: any) => (
            <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }} className="hover-scale">
              <article style={{ background: 'var(--surface-color)', border: '1px solid var(--border-color)', borderRadius: '32px', overflow: 'hidden' }}>
                <img src={post.image} alt={post.title} style={{ width: '100%', height: '240px', objectFit: 'cover' }} />
                <div style={{ padding: '2rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Calendar size={14} /> {post.date}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={14} /> {post.readTime}</span>
                  </div>
                  <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 800, lineHeight: 1.3 }}>{post.title}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>{post.excerpt}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-primary)', fontWeight: 700 }}>
                    Read Article <ArrowRight size={18} />
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
        )}
      </main>
      <Footer />
    </>
  );
}
