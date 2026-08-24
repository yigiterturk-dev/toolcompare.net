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
      <main style={{ paddingTop: '12rem', paddingBottom: '8rem', maxWidth: '900px', margin: '0 auto', paddingLeft: '5%', paddingRight: '5%' }}>
        <header style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '24px', marginBottom: '2rem' }}>
            <Lock color="#10b981" size={40} />
          </div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-2px', marginBottom: '1rem' }}>Privacy <span style={{ color: '#10b981' }}>Policy</span></h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Last updated: August 2026</p>
        </header>

        <article style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.1rem' }}>
          <section style={{ marginBottom: '3rem' }}>
            <p style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', padding: '1.8rem' }}>
              <strong style={{ color: 'white' }}>The short version:</strong> this site sets no cookies, runs no
              analytics, and has no advertising trackers. We store an email address only if you type one into
              the newsletter box. Everything below describes exactly what does happen — nothing more.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Cookie color="#10b981" /> 1. Cookies and analytics
            </h2>
            <p>
              We set no cookies. We run no analytics package — no Google Analytics, no tag manager, no
              third-party advertising or behavioural trackers — and we do not write anything to your browser&apos;s
              local storage. There is no cookie banner on this site because there is nothing to consent to.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Eye color="#10b981" /> 2. What we record when you click through to a tool
            </h2>
            <p>
              Links to a tool&apos;s own website go through <code style={{ color: 'var(--brand-primary)' }}>/go/&lt;tool&gt;</code>{' '}
              before forwarding you on. When that happens we record three things: which tool was clicked, which
              page of ours you clicked it from, and the time.
            </p>
            <p>
              We do <strong style={{ color: 'white' }}>not</strong> record your IP address, your browser or device,
              or any identifier that could link one click to another or to you. The purpose is to know which
              tools readers are interested in, not who our readers are.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Database color="#10b981" /> 3. Newsletter and the AI assistant
            </h2>
            <p>
              <strong style={{ color: 'white' }}>Newsletter:</strong> if you enter an email address we store that
              address, and nothing else. No name, no other field. Ask us and we will delete it.
            </p>
            <p>
              <strong style={{ color: 'white' }}>AI assistant:</strong> the message you type is sent to OpenAI to
              generate the reply, and is covered by their handling of it while that happens. We do not store your
              messages. Do not type anything confidential into it — that is true of every AI chat box, including ours.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <Lock color="#10b981" /> 4. IP addresses
            </h2>
            <p>
              Your IP address is used momentarily, in memory, to limit how many requests a single source can make
              — the ordinary protection that stops one visitor from flooding the newsletter form or the AI
              assistant. It is not written to our database and not tied to anything you do. Our hosting provider
              keeps its own server access logs, as every web host does.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '1.5rem' }}>5. Links to other sites</h2>
            <p>
              Once you reach a tool&apos;s own website you are on their site under their privacy policy, not ours.
              We have no control over what they collect.
            </p>
          </section>

          <section style={{ marginBottom: '3rem' }}>
            <h2 style={{ color: 'white', fontSize: '1.8rem', marginBottom: '1.5rem' }}>6. Changes</h2>
            <p>
              If we ever start collecting something not listed above, this page will say so before it happens.
              Questions or a deletion request: <a href="mailto:support@toolcompare.net" style={{ color: 'var(--brand-primary)' }}>support@toolcompare.net</a>.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
