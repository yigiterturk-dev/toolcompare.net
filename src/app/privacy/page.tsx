import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Lock, Eye, Database, Cookie } from "lucide-react";

import type { Metadata } from "next";

// Kendi metadata'si yoktu: kok layout'unkini miras alip
// anasayfayla AYNI baslik/aciklamayi kullaniyordu.
export const metadata: Metadata = {
  title: "Privacy Policy | ToolCompare",
  description: "What ToolCompare collects, what it does not collect, and how visitor data is handled.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Privacy Policy | ToolCompare", description: "What ToolCompare collects, what it does not collect, and how visitor data is handled.", url: "/privacy", siteName: "ToolCompare", type: "website" },
};


export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="doc">
        <header>
          <div>
            <Lock color="#10b981" size={40} />
          </div>
          <h1>Privacy <span>Policy</span></h1>
          <p>Last updated: August 2026</p>
        </header>

        <article>
          <section>
            <p>
              <strong>The short version:</strong> this site sets no cookies, runs no
              analytics, and has no advertising trackers. We store an email address only if you type one into
              the newsletter box. Everything below describes exactly what does happen — nothing more.
            </p>
          </section>

          <section>
            <h2>
              <Cookie color="#10b981" /> 1. Cookies and analytics
            </h2>
            <p>
              We set no cookies. We run no analytics package — no Google Analytics, no tag manager, no
              third-party advertising or behavioural trackers — and we do not write anything to your browser&apos;s
              local storage. There is no cookie banner on this site because there is nothing to consent to.
            </p>
          </section>

          <section>
            <h2>
              <Eye color="#10b981" /> 2. What we record when you click through to a tool
            </h2>
            <p>
              Links to a tool&apos;s own website go through <code>/go/&lt;tool&gt;</code>{' '}
              before forwarding you on. When that happens we record three things: which tool was clicked, which
              page of ours you clicked it from, and the time.
            </p>
            <p>
              We do <strong>not</strong> record your IP address, your browser or device,
              or any identifier that could link one click to another or to you. The purpose is to know which
              tools readers are interested in, not who our readers are.
            </p>
          </section>

          <section>
            <h2>
              <Database color="#10b981" /> 3. Newsletter and the AI assistant
            </h2>
            <p>
              <strong>Newsletter:</strong> if you enter an email address we store that
              address, and nothing else. No name, no other field. Ask us and we will delete it.
            </p>
            <p>
              <strong>AI assistant:</strong> the message you type is sent to OpenAI to
              generate the reply, and is covered by their handling of it while that happens. We do not store your
              messages. Do not type anything confidential into it — that is true of every AI chat box, including ours.
            </p>
          </section>

          <section>
            <h2>
              <Lock color="#10b981" /> 4. IP addresses
            </h2>
            <p>
              Your IP address is used momentarily, in memory, to limit how many requests a single source can make
              — the ordinary protection that stops one visitor from flooding the newsletter form or the AI
              assistant. It is not written to our database and not tied to anything you do. Our hosting provider
              keeps its own server access logs, as every web host does.
            </p>
          </section>

          <section>
            <h2>5. Links to other sites</h2>
            <p>
              Once you reach a tool&apos;s own website you are on their site under their privacy policy, not ours.
              We have no control over what they collect.
            </p>
          </section>

          <section>
            <h2>6. Affiliate links</h2>
            <p>
              Where a vendor runs an affiliate programme we are enrolled in, the outbound link carries a
              partner identifier so the vendor can attribute a sign-up to us. That identifier tells the
              vendor a visitor came from ToolCompare; it does not tell us who you are, and we receive no
              personal data back. Which links are compensated, and how they are marked, is explained on
              the <a href="/affiliate-disclosure">affiliate disclosure</a> page.
            </p>
          </section>

          <section>
            <h2>7. Changes</h2>
            <p>
              If we ever start collecting something not listed above, this page will say so before it happens.
              Questions or a deletion request: <a href="mailto:support@toolcompare.net">support@toolcompare.net</a>.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
