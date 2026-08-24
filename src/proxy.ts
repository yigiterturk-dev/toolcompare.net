/**
 * www -> koksuz adres yonlendirmesi.
 *
 * DENETIMDE OLCULDU (2026-08-24): https://www.toolcompare.net 200
 * donuyordu, yonlendirmiyordu. Yani site IKI ayri adreste birden tam
 * calisiyordu ve Google icin bu "ayni icerik iki sitede" demek --
 * hangisini sayacagini kendi seciyor, ikisi de zayifliyor.
 * (http -> https 301 ve egik cizgi 308 zaten dogruydu; eksik olan buydu.)
 *
 * Kalici (308) yonlendirme: adres degisikligi gecici degil.
 *
 * NOT: Next 16'da bu dosyanin adi middleware.ts DEGIL proxy.ts.
 */

import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const host = request.headers.get("host") || "";

  if (host.toLowerCase().startsWith("www.")) {
    const url = request.nextUrl.clone();
    url.host = host.slice(4);
    url.protocol = "https";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  // Statik dosyalar ve derleme ciktilari bu kontrolden gecmesin.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml|woff2?)$).*)"],
};
