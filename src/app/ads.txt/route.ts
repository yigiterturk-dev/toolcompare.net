/**
 * ads.txt — AdSense'in ZORUNLU dosyasi.
 *
 * Yoksa Google reklam envanterini "yetkisiz" sayar ve programatik talep
 * ya cok duser ya hic gelmez. Elle public/ads.txt koymak yerine env'den
 * uretiliyor: yayinci kimligi tek yerde durur, yanlisliksa depoya
 * girmez ve kimlik degisirse kod degismez.
 *
 * ADSENSE_PUBLISHER_ID tanimli degilse dosya 404 verir -- bos ya da
 * yanlis bir ads.txt yayinlamaktansa hic yayinlamamak dogru.
 */

import { adsTxtKimlik } from "@/lib/reklam";

export const dynamic = "force-static";

export function GET() {
  const pub = adsTxtKimlik();
  if (!pub) return new Response("Not found", { status: 404 });

  // Bicim Google'in sartnamesine gore: <alan>, <yayinci kimligi>, DIRECT, <sertifika>
  const satir = `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`;
  return new Response(satir, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=86400",
    },
  });
}
