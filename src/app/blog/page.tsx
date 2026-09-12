import type { Metadata } from "next";
import { NOINDEX } from "@/lib/indeks";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import fs from 'fs';
import path from 'path';


/** Yazi listesi: dosya yoksa bos. Hem metadata hem sayfa ayni kaynagi okur. */
function yazilariOku(): { slug: string; title: string; image?: string; excerpt?: string; date?: string; readTime?: string; category?: string; author?: string }[] {
  const yol = path.join(process.cwd(), "src/data/posts.json");
  if (!fs.existsSync(yol)) return [];
  try {
    return JSON.parse(fs.readFileSync(yol, "utf8"));
  } catch {
    return [];
  }
}

/*
  BOS LISTE SAYFASI INDEKSLENMEZ (olcum, 2026-09-12).
  /blog kendi basligini hic tanimlamamisti; kok layout'tan ANASAYFANIN
  basligini ve aciklamasini miras aliyordu -- yani site, iki ayri adreste
  ayni basligi beyan ediyordu. Ustelik `posts.json` yok: sayfa hic yazi
  icermiyor ve 90 gunde 0 gosterim almis. Icerigi olmayan, basligi baska
  bir sayfadan odunc alinmis adres tam olarak tarama butcesi turunun
  (2026-09-10) temizledigi seydi.

  Kural kendi kendini duzeltiyor: ilk yazi eklendigi anda sayfa
  indekslenebilir hale geliyor, kod degismeden.
*/
export function generateMetadata(): Metadata {
  const yazilar = yazilariOku();
  return {
    title: "SaaS Insights | ToolCompare",
    description:
      "Guides and analysis on software pricing, tooling decisions and what tools actually cost to run.",
    alternates: { canonical: "/blog" },
    robots: yazilar.length > 0 ? undefined : NOINDEX,
  };
}
export default function BlogPage() {
  // Tek okuyucu: metadata ile sayfa ayni listeyi gorur, yoksa "bos ama
  // indekslenebilir" gibi ayrisma dogar.
  const posts = yazilariOku();

  return (
    <>
      <Header />
      <div className="ambient-bg">
        <div className="orb orb-1"></div>
      </div>

      <main className="doc">
        <header>
          <h1>SaaS <span>Insights</span></h1>
          <p>Expert guides, trends, and strategies for the modern software era.</p>
        </header>

        <div>
          {posts.map(post => (
            <Link key={post.slug} href={`/blog/${post.slug}`} className="hover-scale">
              <article>
                <img src={post.image} alt={post.title} />
                <div>
                  <div>
                    <span><Calendar size={14} /> {post.date}</span>
                    <span><Clock size={14} /> {post.readTime}</span>
                  </div>
                  <h2>{post.title}</h2>
                  <p>{post.excerpt}</p>
                  <div>
                    Read Article <ArrowRight size={18} />
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
