import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Send, Rocket, Shield, Zap, Globe } from "lucide-react";

import type { Metadata } from "next";

// Kendi metadata'si yoktu: kok layout'unkini miras alip
// anasayfayla AYNI baslik/aciklamayi kullaniyordu.
export const metadata: Metadata = {
  title: "Submit a Tool | ToolCompare",
  description: "Think a tool belongs in the ToolCompare directory? Send it in and we will review it.",
  alternates: { canonical: "/submit" },
  openGraph: { title: "Submit a Tool | ToolCompare", description: "Think a tool belongs in the ToolCompare directory? Send it in and we will review it.", url: "/submit", siteName: "ToolCompare", type: "website" },
};


export default function SubmitToolPage() {
  return (
    <>
      <Header />
      <div className="ambient-bg">
        <div className="orb orb-1"></div>
      </div>

      <main className="doc">
        <header>
          <div>
            <Rocket color="var(--brand-primary)" size={40} />
          </div>
          <h1>Submit Your <span>SaaS</span></h1>
          <p>
            Get your tool featured in front of 50,000+ monthly decision-makers. Standard listings are free, verified reviews are priority.
          </p>
        </header>

        <div>
          <form>
            <div>
              <div>
                <label>Tool Name</label>
                <input type="text" placeholder="e.g. Notion" />
              </div>
              <div>
                <label>Website URL</label>
                <input type="url" placeholder="https://..." />
              </div>
            </div>

            <div>
              <label>Your Email</label>
              <input type="email" placeholder="you@company.com" />
            </div>

            <div>
              <label>Short Description</label>
              <textarea placeholder="Tell us what makes your tool unique..."></textarea>
            </div>

            <div>
               <h2><Shield size={18} color="var(--brand-primary)" /> Why list with us?</h2>
               <ul>
                  <li><Zap size={14} color="var(--brand-primary)" /> High-authority backlink for your SEO.</li>
                  <li><Zap size={14} color="var(--brand-primary)" /> Targeted traffic from software decision-makers.</li>
                  <li><Zap size={14} color="var(--brand-primary)" /> Expert review badges for your own site.</li>
               </ul>
            </div>

            <button type="submit">
              <Send size={20} /> Submit for Review
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
