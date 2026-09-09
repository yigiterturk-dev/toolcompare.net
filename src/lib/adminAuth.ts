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
  // 1. Proxy tarafindan dogrulanmis ve ezilemeyen gercek IP (Vercel, Nginx vs.)
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.split(",")[0].trim();

  // 2. Fallback olarak x-forwarded-for (taklit edilebilir)
  const xff = request.headers.get("x-forwarded-for");
  return xff ? xff.split(",")[0].trim() : "bilinmiyor";
}

/*
  KAYNAKTAN BAGIMSIZ GIRIS TAVANI.

  OLCULDU (2026-08-31): `istekKaynagi` once `x-real-ip` bakiyor, yoksa
  `x-forwarded-for`a dusuyor -- ve XFF ISTEMCI TARAFINDAN TAKLIT EDILEBILIR.
  Canli sunucu LiteSpeed; `x-real-ip` gonderdigini disaridan dogrulayamadik.
  Gondermiyorsa IP basina 10/dk freni hicbir sey yapmiyor: saldirgan her
  istekte baska bir sahte IP yazip parolayi SINIRSIZ deneyebilir.

  Cozum, /api/chat'te kurulan tavanin aynisi: kaynaktan BAGIMSIZ bir gunluk
  toplam. Sahte IP bunu asamaz cunku sayac kimin denedigine bakmiyor.
  Basarili girisde sifirlanir -- yani gercek yonetici kendi tavanini yemez.
*/
const GUNLUK_GIRIS_TAVANI = Number(process.env.ADMIN_LOGIN_DAILY_LIMIT ?? 100);
let girisGunu = "";
let basarisizGiris = 0;

function bugunTarih(): string {
  // UTC gunu KASITLI: bu bir sayac penceresi, okura gosterilen bir tarih degil.
  // Sunucu saat dilimi degisse bile pencere sinirinin ayni kalmasi, yerel gun
  // sinirina uymasindan daha onemli. (Okura gosterilen tarihler icin
  // scripts/_tarih.mjs -> yerelTarih kullaniliyor.)
  return new Date().toISOString().slice(0, 10);
}

/** Bugun kac basarisiz giris denendi. */
export function basarisizGirisSayisi(): number {
  return bugunTarih() === girisGunu ? basarisizGiris : 0;
}

/** Gunluk toplam deneme hakki kaldi mi? */
export function girisDenemesiKaldiMi(): boolean {
  return basarisizGirisSayisi() < GUNLUK_GIRIS_TAVANI;
}

/** Basarisiz denemeyi say. */
export function basarisizGirisiSay(): void {
  const g = bugunTarih();
  if (g !== girisGunu) {
    girisGunu = g;
    basarisizGiris = 0;
  }
  basarisizGiris += 1;
}

/** Dogru parola geldi: sayac sifirlanir. */
export function girisSayaciniSifirla(): void {
  girisGunu = bugunTarih();
  basarisizGiris = 0;
}
