import type { NextConfig } from "next";

// Guvenlik basliklari CDN/sunucu katmaninda hic tanimli degildi. Denetimde
// dordu birden eksik cikti; hem koruma hem de tarayici/arama motoru guven
// sinyali. CSP bilerek YOK: sayfalar inline style ve inline script (JSON-LD)
// kullaniyor, sikilastirilmis bir CSP once siteyi kirar; ayri is olarak
// planlanmali.
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

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: guvenlikBasliklari }];
  },
};

export default nextConfig;
