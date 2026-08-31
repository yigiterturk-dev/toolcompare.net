import type { NextConfig } from "next";
import { cspOlustur } from "./src/lib/guvenlik";

// Guvenlik basliklari CDN/sunucu katmaninda hic tanimli degildi. Denetimde
// dordu birden eksik cikti; hem koruma hem de tarayici/arama motoru guven
// sinyali.
// CSP: Sayfalar inline style (Tailwind v4 degiskenleri dahil) ve inline
// JSON-LD script kullandigi icin ilk asamada 'unsafe-inline' ile baslatildi.
// Ileride hash/nonce'a gecilecek; simdiki hali yine XSS riskini onemli olcude
// dusurur ve inline kaynak disinda hicbir yere izin vermez.
const guvenlikBasliklari = [
  // Bir kez HTTPS goren tarayici bir daha http denemesin (downgrade/MITM).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Tarayici MIME tipini "tahmin" etmesin; yuklenen dosyanin script gibi
  // yorumlanmasi yolunu kapatir.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Clickjacking: siteyi baska bir sayfa iframe icine alip tiklama calamasin.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Baska siteye giderken tam URL sizmasin, yalnizca origin gitsin.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Kullanilmayan guclu API'ler kapali.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

// CSP artik src/lib/guvenlik.ts'te; ayni politika <meta> ile de basiliyor
// cunku onde duran Hostinger/LiteSpeed katmani bu basligi eziyor (olcum
// ve ayrinti o dosyada).
const csp = cspOlustur({
  gelistirme: process.env.NODE_ENV === "development",
  adsense: Boolean(process.env.ADSENSE_PUBLISHER_ID?.trim()),
});

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [...guvenlikBasliklari, { key: "Content-Security-Policy", value: csp }],
      },
      {
        source: "/management-hq-2026/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      },
    ];
  },
};

export default nextConfig;
