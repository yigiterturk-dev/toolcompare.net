/**
 * CSP: TEK KAYNAK — hem HTTP basligi hem <meta> icin.
 *
 * NEDEN META DE GEREKIYOR (olcum, 2026-08-31):
 * next.config.ts dogru ve tam bir CSP uretiyor (routes-manifest.json'da
 * gorunuyor), AMA canlida basliga bakildiginda yalnizca
 * "upgrade-insecure-requests" donuyor:
 *
 *   $ curl -sI https://toolcompare.net/
 *   content-security-policy: upgrade-insecure-requests
 *   server: LiteSpeed
 *   platform: hostinger
 *
 * Yani onde duran Hostinger/LiteSpeed katmani bizim basligimizin uzerine
 * kendi CSP'sini yaziyor. Digerleri (HSTS, nosniff, X-Frame-Options,
 * Referrer-Policy, Permissions-Policy) geciyor; sadece CSP eziliyor.
 * Sonuc: sitenin XSS'e karsi fiili bir politikasi yok.
 *
 * Cozum iki katmanli:
 *   1. Baslik kalir (Hostinger'dan cikilinca kendiliginden devreye girer),
 *   2. Ayni politika <meta http-equiv> ile HTML'e de basilir; proxy ne
 *      yaparsa yapsin tarayici bunu uygular.
 *
 * meta'da CALISMAYAN tek yon `frame-ancestors`; onun karsiligi olan
 * X-Frame-Options: SAMEORIGIN basligi zaten geciyor (yukaridaki ciktida
 * gorunuyor), yani clickjacking korumasi acikta kalmiyor.
 */

/** AdSense acikken izin verilmesi gereken alanlar. Kapaliyken hicbiri yok. */
const ADSENSE_SCRIPT = [
  "https://pagead2.googlesyndication.com",
  "https://partner.googleadservices.com",
  "https://tpc.googlesyndication.com",
  "https://www.googletagservices.com",
];
const ADSENSE_FRAME = ["https://googleads.g.doubleclick.net", "https://tpc.googlesyndication.com"];
const ADSENSE_IMG = ["https://pagead2.googlesyndication.com", "https://www.google.com"];

export type CspSecenek = {
  /** Gelistirmede Next'in HMR'i eval kullanir. */
  gelistirme?: boolean;
  /** AdSense yayinci kimligi tanimliysa reklam alanlari acilir. */
  adsense?: boolean;
  /** meta etiketi icin: frame-ancestors meta'da yok sayilir, hic yazmayalim. */
  meta?: boolean;
};

export function cspOlustur({ gelistirme = false, adsense = false, meta = false }: CspSecenek = {}): string {
  const script = ["'self'", "'unsafe-inline'"];
  if (gelistirme) script.push("'unsafe-eval'");
  if (adsense) script.push(...ADSENSE_SCRIPT);

  const yonergeler = [
    "default-src 'self'",
    `script-src ${script.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: https:${adsense ? " " + ADSENSE_IMG.join(" ") : ""}`,
    "font-src 'self' data:",
    `connect-src 'self' https://api.openai.com${adsense ? " " + ADSENSE_SCRIPT.join(" ") : ""}`,
    `frame-src ${adsense ? ADSENSE_FRAME.join(" ") : "'none'"}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ];

  // frame-ancestors meta etiketinde yok sayilir; oraya yazmak sadece
  // konsolda uyari uretir. Baslikta ise kalmasi sart.
  if (!meta) yonergeler.splice(yonergeler.length - 1, 0, "frame-ancestors 'self'");

  return yonergeler.join("; ");
}
