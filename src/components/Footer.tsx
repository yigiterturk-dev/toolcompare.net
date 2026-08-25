"use client";

import Link from "next/link";
import { useState } from "react";

/*
  Footer.

  DENETIMDE BULUNAN (2026-08-25): buradaki bulten formu SAHTEYDI. Hicbir
  yere istek atmiyordu; `setTimeout(1200)` sonrasi "Welcome to the elite
  list!" yaziyordu. Yani kullanici abone oldugunu saniyor, hicbir yere
  kaydedilmiyordu. Bu, ayni depoda daha once "topluluk puanlamasi"
  kaldirilirken tespit edilen hatanin aynisi: olmayan bir seyi olmus gibi
  gostermek.

  Anasayfada IKINCI bir bulten formu vardi ve O gercekten /api/subscribe'a
  POST ediyordu. Iki form, biri calisan biri sahte. Tek forma indirildi ve
  calisani buraya tasindi.

  Basari mesaji da artik sunucunun cevabina bagli; istek duserse durum
  "error" oluyor ve kullaniciya soyleniyor.
*/

const KESIF = [
  { href: "/categories", label: "Categories" },
  { href: "/top-picks", label: "Cheapest tools" },
  { href: "/compare", label: "Comparisons" },
];

const SAYDAMLIK = [
  { href: "/methodology", label: "How we rank tools" },
  { href: "/terms", label: "Terms of service" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/contact", label: "Contact" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const abone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <footer className="mt-20 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-serif text-lg font-semibold">ToolCompare</p>
          <p className="mt-3 max-w-sm text-sm text-ink-soft">
            Software compared on what it actually costs to start — with the pricing model spelled
            out, and no invented quality scores.
          </p>
        </div>

        <nav aria-labelledby="footer-explore">
          <h2 id="footer-explore" className="font-sans text-xs font-medium tracking-wide text-ink-muted uppercase">
            Explore
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {KESIF.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-ink-soft no-underline transition-colors duration-150 hover:text-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-labelledby="footer-transparency">
          <h2 id="footer-transparency" className="font-sans text-xs font-medium tracking-wide text-ink-muted uppercase">
            Transparency
          </h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {SAYDAMLIK.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-ink-soft no-underline transition-colors duration-150 hover:text-accent">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <form onSubmit={abone} className="max-w-md">
            <label htmlFor="footer-email" className="font-serif text-base font-semibold">
              Get new reviews by email
            </label>
            <p className="mt-1 text-sm text-ink-soft">
              Occasional. No tracking pixels, no sharing your address.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                id="footer-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === "error") setStatus("idle");
                }}
                className="min-w-0 flex-1 rounded-[--radius-control] border border-line bg-surface px-3 py-2.5 text-sm placeholder:text-ink-muted focus:border-line-strong focus:outline-none"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                data-tap
                className="shrink-0 rounded-[--radius-control] bg-brand px-4 py-2.5 text-sm font-medium whitespace-nowrap text-brand-ink transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
              >
                {status === "loading" ? "Sending…" : "Subscribe"}
              </button>
            </div>
            {/* Durum mesaji ekran okuyucuya da bildiriliyor */}
            <p aria-live="polite" className="mt-2 min-h-5 text-sm">
              {status === "success" && <span className="text-verified">Confirmed — you are on the list.</span>}
              {status === "error" && (
                <span className="text-danger">That did not go through. Please try again.</span>
              )}
            </p>
          </form>
        </div>
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-ink-muted sm:px-6">
          © 2026 ToolCompare. We are in no affiliate programme and earn no commission from the
          links on this site. If that changes, it will say so here first.
        </p>
      </div>
    </footer>
  );
}
