"use client";

/**
 * Tek bir AdSense reklam birimi.
 *
 * Sunucu tarafi kapiyi (reklamAcik + aracReklamAlir) zaten gecmisse
 * cizilir; burada yalnizca Google'in betigine "bu kutuyu doldur" denir.
 * `useEffect` icinde push ediliyor cunku adsbygoogle dizisi ancak
 * tarayicida var; sunucuda cagrilirsa yapim (build) kirilir.
 *
 * Etiket ZORUNLU ve gorunur: AdSense politikasi reklamin icerikten
 * ayirt edilebilmesini sart kosuyor, ve okur da neyin satin alindigini
 * bilmeli -- bu sitenin affiliate aciklamasiyla ayni durusu.
 */

import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export default function ReklamBirimi({
  yayinci,
  slot,
}: {
  yayinci: string;
  slot: string;
}) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Betik engellenmisse (reklam engelleyici) sessizce gecilir:
      // sayfanin geri kalani bundan etkilenmemeli.
    }
  }, []);

  return (
    <aside
      aria-label="Advertisement"
      style={{ margin: "2.5rem 0", textAlign: "center" }}
    >
      <span
        style={{
          display: "block",
          fontSize: "0.6875rem",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          opacity: 0.55,
          marginBottom: "0.4rem",
        }}
      >
        Advertisement
      </span>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={yayinci}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
