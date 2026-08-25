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

  // `mt` yok: sayfalarin kendi alt dolgusu zaten var; ikisi ust uste
  // binince footer'in ustunde ~112px olu bosluk kaliyordu.
  return (
    <footer className="border-t border-line bg-surface">
      {/*
        Tek serit. Onceki hali UC ayri yatay bant idi (marka+linkler,
        bulten, telif) ve her birinin arasinda cizgi vardi: footer 500px
        yuksekligindeydi, icinde bir avuc icerik icin. Marka sutunu da
        dort kolonun ikisini yiyip ortasini bos birakiyordu.
      */}
      {/*
          Mobilde IKI sutun: iki link listesi yan yana geliyor. Once hepsi
          alt alta yigiliyordu ve footer telefonda 754px'e cikiyordu --
          icinde yedi link ve bir form olan bir bolum icin.
        */}
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:px-6 md:grid-cols-3 md:py-12 lg:grid-cols-4">
        <div className="col-span-2 md:col-span-1">
          <p className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" aria-hidden="true" className="size-6 object-contain" />
            <span className="font-serif text-base font-semibold">ToolCompare</span>
          </p>
          <p className="mt-3 text-sm text-ink-soft">
            Software compared on what it actually costs to start — pricing model spelled out, no
            invented quality scores.
          </p>
        </div>

        <nav aria-labelledby="footer-explore">
          <h2 id="footer-explore" className="font-sans text-sm font-medium">
            Explore
          </h2>
          <ul className="mt-3 list-none space-y-2 p-0 text-sm">
            {KESIF.map((l) => (
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

        <nav aria-labelledby="footer-transparency">
          <h2 id="footer-transparency" className="font-sans text-sm font-medium">
            Transparency
          </h2>
          <ul className="mt-3 list-none space-y-2 p-0 text-sm">
            {SAYDAMLIK.map((l) => (
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

        {/* Bulten artik ayri bir bant degil, seridin son sutunu. */}
        <form onSubmit={abone} className="col-span-2 md:col-span-3 lg:col-span-1">
          <label htmlFor="footer-email" className="font-sans text-sm font-medium">
            New reviews by email
          </label>
          <p className="mt-1 text-sm text-ink-soft">
            Occasional. No tracking pixels, no sharing your address.
          </p>
          <div className="mt-3 flex gap-2">
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
              className="min-w-0 flex-1 rounded-[--radius-control] border border-line bg-surface px-3 py-2 text-sm placeholder:text-ink-muted focus:border-line-strong focus:outline-none"
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
          <p aria-live="polite" className="mt-2 min-h-5 text-sm">
            {status === "success" && (
              <span className="text-verified">Confirmed — you are on the list.</span>
            )}
            {status === "error" && (
              <span className="text-danger">That did not go through. Please try again.</span>
            )}
          </p>
        </form>
      </div>

      <div className="border-t border-line">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-ink-muted sm:px-6">
          © 2026 ToolCompare · We are in no affiliate programme and earn no commission from the
          links on this site. If that changes, it will say so here first.
        </p>
      </div>
    </footer>
  );
}
