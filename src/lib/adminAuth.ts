/**
 * Yonetici dogrulamasi -- YALNIZCA sunucuda.
 *
 * Onceki hali: parola sabit bir metin olarak hem panel bileseninde (istemci
 * tarafi, yani tarayiciya inen JS paketinin icinde) hem de API route'larinda
 * sabit yaziliydi. Siteyi acan herkes paketten parolayi okuyup
 * /api/tools/generate ve /api/blog/generate uclarini cagirabilirdi. O iki
 * uc OpenAI cagiriyor, yani fatura bize yaziliyordu.
 *
 * Yeni hali: parola sadece ortam degiskeninde. Istemci ne yazildiysa
 * gonderir, karari sunucu verir.
 */

import { timingSafeEqual } from "crypto";

/** Parola tanimli degilse KAPALI kalir. Tanimsiz env "herkese acik" olmamali. */
export function yoneticiParolasiTanimliMi(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD);
}

/** Uzunluk sizdirmayan karsilastirma. */
export function yoneticiMi(gonderilen: unknown): boolean {
  const beklenen = process.env.ADMIN_PASSWORD;
  if (!beklenen) return false;
  if (typeof gonderilen !== "string" || gonderilen.length === 0) return false;

  const a = Buffer.from(gonderilen);
  const b = Buffer.from(beklenen);
  if (a.length !== b.length) {
    // Yine de sabit surede bir karsilastirma yap, erken donusle
    // uzunluk bilgisi sizmasin.
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

// ── Basit hiz freni ───────────────────────────────────────────────────
// Amac: parola deneme bombardimanini ve pahali OpenAI uclarinin
// suistimalini yavaslatmak. Tek surec bellekte tutuluyor; kusursuz degil
// ama "hic yok"tan cok daha iyi ve bagimlilik gerektirmiyor.

const pencereMs = 60_000;
const sayaclar = new Map<string, { adet: number; sifirlanma: number }>();

export function hizFreni(anahtar: string, limit: number): boolean {
  const simdi = Date.now();
  const kayit = sayaclar.get(anahtar);

  if (!kayit || simdi > kayit.sifirlanma) {
    sayaclar.set(anahtar, { adet: 1, sifirlanma: simdi + pencereMs });
    return true;
  }
  if (kayit.adet >= limit) return false;
  kayit.adet += 1;
  return true;
}

/**
 * Istegin kaynagi. Proxy arkasindayiz, ama X-Forwarded-For taklit
 * edilebilir -- bu yuzden hiz freni disinda hicbir yerde guvenilmez.
 */
export function istekKaynagi(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  return xff ? xff.split(",")[0].trim() : "bilinmiyor";
}
