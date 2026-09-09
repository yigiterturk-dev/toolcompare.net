import Header from "@/components/Header";
import Footer from "@/components/Footer";
import fs from 'fs';
import path from 'path';
import { Calendar, Clock, User, ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { paylasimMeta } from "@/lib/paylasim";

type Yazi = {
  slug: string;
  title?: string;
  date?: string;
  content?: string;
  excerpt?: string;
  author?: string;
  readTime?: string;
  image?: string;
};
type SayfaParametresi = { params: Promise<{ slug: string }> };

/** Yazilari diskten okur. generateMetadata ve sayfa AYNI kaynagi kullansin. */
function yazilar(): Yazi[] {
  const postsPath = path.join(process.cwd(), "src/data/posts.json");
  if (!fs.existsSync(postsPath)) return [];
  return JSON.parse(fs.readFileSync(postsPath, "utf8")) as Yazi[];
}

/**
 * Kanonik SAYFA BASINA yazilir. 2026-09-09'a kadar bu sayfanin metadata'si
 * hic yoktu ve kok layout'un `canonical: "/"` degerini MIRAS aliyordu --
 * yani her blog yazisi Google'a "ben anasayfayim" diyordu.
 */
export async function generateMetadata({ params }: SayfaParametresi): Promise<Metadata> {
  const { slug } = await params;
  const post = yazilar().find((p) => p.slug === slug);
  if (!post) return { alternates: { canonical: `/blog/${slug}` } };
  const title = post.title ? `${post.title} | ToolCompare` : "ToolCompare";
  const description = post.excerpt ?? "";
  const url = `/blog/${slug}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    ...paylasimMeta({ url, title, description, type: "article" }),
  };
}

export default async function BlogPost({ params }: SayfaParametresi) {
  /*
    Next 16'da `params` bir Promise. Onceki hali `{ params }: any` idi ve
    `const { slug } = params` diyordu -- yani slug her zaman undefined
    olurdu ve sayfa yaziyi HIC bulamazdi. Tip yazilinca ortaya cikti.
  */
  const { slug } = await params;
  const post = yazilar().find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Header />
      <main className="doc">
        <Link href="/blog">
          <ArrowLeft size={18} /> Back to Insights
        </Link>

        <header>
          <div>
            <span><Calendar size={16} /> {post.date}</span>
            <span><Clock size={16} /> {post.readTime}</span>
            <span><User size={16} /> {post.author}</span>
          </div>
          <h1>{post.title}</h1>
          <p>
            {post.excerpt}
          </p>
        </header>

        <img src={post.image} alt={post.title} />

        <div
          dangerouslySetInnerHTML={{ __html: post.content ?? "" }}
        />

        <footer>
          <div>
            <div>TC</div>
            <div>
              <div>ToolCompare Editorial</div>
              <div>Expert SaaS Analysts</div>
            </div>
          </div>
          <button>
            <Share2 size={18} /> Share
          </button>
        </footer>
      </main>
      <Footer />
    </>
  );
}
