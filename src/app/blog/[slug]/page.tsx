import Header from "@/components/Header";
import Footer from "@/components/Footer";
import fs from 'fs';
import path from 'path';
import { Calendar, Clock, User, ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

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

export default async function BlogPost({ params }: SayfaParametresi) {
  /*
    Next 16'da `params` bir Promise. Onceki hali `{ params }: any` idi ve
    `const { slug } = params` diyordu -- yani slug her zaman undefined
    olurdu ve sayfa yaziyi HIC bulamazdi. Tip yazilinca ortaya cikti.
  */
  const { slug } = await params;
  const postsPath = path.join(process.cwd(), 'src/data/posts.json');
  let posts = [];
  if (fs.existsSync(postsPath)) {
    posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
  }

  const post = (posts as Yazi[]).find((p) => p.slug === slug);

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
