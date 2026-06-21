import Header from "@/components/Header";
import Footer from "@/components/Footer";
import fs from 'fs';
import path from 'path';
import { Calendar, Clock, User, ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

function loadPosts(): any[] {
  const postsPath = path.join(process.cwd(), 'src/data/posts.json');
  if (fs.existsSync(postsPath)) {
    try {
      return JSON.parse(fs.readFileSync(postsPath, 'utf8'));
    } catch {
      return [];
    }
  }
  return [];
}

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const { slug } = await params;
  const post = loadPosts().find((p: any) => p.slug === slug);
  if (!post) return { title: "Article Not Found", robots: { index: false, follow: false } };

  return {
    title: post.title,
    description: post.excerpt || `Read ${post.title} on the ToolCompare blog.`,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: `/blog/${slug}`,
      images: post.image ? [{ url: post.image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.image ? [post.image] : undefined,
    },
  };
}

export default async function BlogPost({ params }: any) {
  const { slug } = await params;
  const post = loadPosts().find((p: any) => p.slug === slug);

  if (!post) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://toolcompare.net";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.image,
    author: { "@type": "Organization", name: post.author || "ToolCompare Editorial" },
    publisher: {
      "@type": "Organization",
      name: "ToolCompare",
      logo: { "@type": "ImageObject", url: `${siteUrl}/logo.png` },
    },
    mainEntityOfPage: `${siteUrl}/blog/${slug}`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main style={{ paddingTop: '10rem', paddingBottom: '10rem', maxWidth: '800px', margin: '0 auto', paddingLeft: '5%', paddingRight: '5%' }}>
        <Link href="/blog" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand-primary)', textDecoration: 'none', fontWeight: 700, marginBottom: '3rem' }}>
          <ArrowLeft size={18} /> Back to Insights
        </Link>

        <header style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Calendar size={16} /> {post.date}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={16} /> {post.readTime}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><User size={16} /> {post.author}</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, lineHeight: 1.1, marginBottom: '2rem', letterSpacing: '-2px' }}>{post.title}</h1>
          <p style={{ fontSize: '1.3rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, fontStyle: 'italic', borderLeft: '4px solid var(--brand-primary)', paddingLeft: '1.5rem' }}>
            {post.excerpt}
          </p>
        </header>

        <img src={post.image} alt={post.title} style={{ width: '100%', borderRadius: '32px', marginBottom: '4rem', boxShadow: '0 30px 60px rgba(0,0,0,0.5)' }} />

        <div 
          style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.15rem', lineHeight: 1.9 }}
          dangerouslySetInnerHTML={{ __html: post.content }} 
        />

        <footer style={{ marginTop: '6rem', paddingTop: '3rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--brand-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 900 }}>TC</div>
            <div>
              <div style={{ fontWeight: 800 }}>ToolCompare Editorial</div>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>Expert SaaS Analysts</div>
            </div>
          </div>
          <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '0.8rem 1.5rem', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700 }}>
            <Share2 size={18} /> Share
          </button>
        </footer>
      </main>
      <Footer />
    </>
  );
}
