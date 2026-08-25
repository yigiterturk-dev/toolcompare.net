import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, User } from "lucide-react";
import fs from 'fs';
import path from 'path';

export default function BlogPage() {
  const postsPath = path.join(process.cwd(), 'src/data/posts.json');
  let posts = [];
  if (fs.existsSync(postsPath)) {
    posts = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
  }

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
