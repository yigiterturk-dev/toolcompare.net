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

const LINKLER = [
  { href: "/tools", label: "All tools" },
  { href: "/categories", label: "Categories" },
  { href: "/top-picks", label: "Cheapest tools" },
  { href: "/compare", label: "Comparisons" },
  { href: "/alternatives", label: "Alternatives" },
  { href: "/methodology", label: "How we rank" },
  { href: "/data", label: "Open dataset" },
  { href: "/research/pricing-transparency", label: "Pricing transparency index" },
  { href: "/about", label: "About" },
  { href: "/affiliate-disclosure", label: "Affiliate disclosure" },
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
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

  /*
    Tek yatay serit -- sutun yok.

    Onceki hali DORT sutunluk bir izgaraydi ve icerigi cok azdi: yedi link
    icin 1280px'e yayilmis dort kolon. Sonuc, dordunun de farkli
    yukseklikte bitmesi ve altlarinin paramparca gorunmesiydi; ustune
    kolonlarin altinda ~65px olu bant kaliyordu. Olculebilir seyleri
    (yukseklik, hizalama) duzeltmek bunu cozmedi cunku sorun yapinin
    kendisiydi: az icerik, cok kolon.

    Simdi iki satir: ustte marka ile bulten karsilikli, altta butun
    linkler tek sirada. Ragged kenar kalmiyor.
  */
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/mark.svg" alt="" aria-hidden="true" width="28" height="28" className="size-6" />
              <span className="font-serif text-base font-semibold">ToolCompare</span>
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Software compared on what it actually costs to start — pricing model spelled out, no
              invented quality scores.
            </p>
          </div>

          <form onSubmit={abone} className="w-full max-w-sm md:w-auto">
            <label htmlFor="footer-email" className="text-sm font-medium">
              New reviews by email
            </label>
            <div className="mt-2 flex gap-2">
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
                className="min-w-0 flex-1 rounded-[--radius-control] border border-line bg-surface px-3 py-2 text-sm placeholder:text-ink-muted focus:border-line-strong focus:outline-none md:w-56"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                data-tap
                className="shrink-0 rounded-[--radius-control] bg-brand px-3.5 py-2 text-sm font-medium whitespace-nowrap text-brand-ink transition-opacity duration-150 hover:opacity-90 disabled:opacity-50"
              >
                {status === "loading" ? "…" : "Subscribe"}
              </button>
            </div>
            <p aria-live="polite" className="mt-1.5 text-sm">
              {status === "success" && (
                <span className="text-verified">Confirmed — you are on the list.</span>
              )}
              {status === "error" && (
                <span className="text-danger">That did not go through. Please try again.</span>
              )}
              {status !== "success" && status !== "error" && (
                <span className="text-ink-muted">No tracking pixels, no sharing your address.</span>
              )}
            </p>
          </form>
        </div>

        {/* Butun linkler tek sirada: yedi link icin dort kolon gereksizdi. */}
        <nav aria-label="Footer" className="mt-8 border-t border-line pt-5">
          <ul className="flex list-none flex-wrap gap-x-5 gap-y-2 p-0 text-sm">
            {LINKLER.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-ink-soft no-underline transition-colors duration-150 hover:text-accent"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="mt-5 text-xs text-ink-muted">
          © 2026 ToolCompare · We are in no affiliate programme and earn no commission from the
          links on this site. If that changes, it will say so here first.
        </p>
      </div>
    </footer>
  );
}
