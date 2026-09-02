/**
 * Dis linklerin TEK kaynagi.
 *
 * Neden var: 121 aracin hepsinde dis link ham `websiteUrl` olarak
 * sayfaya gomuluydu. Sonucu iki tane:
 *   1. Hicbir tik olculmuyordu -- hangi aracin ilgi cektigi bilinmiyordu.
 *   2. Affiliate etiketi eklemek 121 kaydi tek tek duzenlemek demekti.
 *
 * Artik her dis link /go/<slug> uzerinden gecer. Affiliate anlasmasi
 * yapildiginda tek yapilacak sey tools.json'a `affiliateUrl` yazmak;
 * sayfa kodlarina bir daha dokunulmaz.
 */

import toolsData from "@/data/tools.json";
import { affiliateKaydi, paraliMi } from "@/lib/affiliate";
import { kanitRelHesapla } from "./kanit-rel.ts";

export type OutboundTool = {
  slug: string;
  name: string;
  websiteUrl?: string;
  /** Anlasma yapildiginda doldurulur; varsa websiteUrl'in yerine gecer. */
  affiliateUrl?: string;
};

const araclar = toolsData as OutboundTool[];

export function araciBul(slug: string): OutboundTool | undefined {
  return araclar.find((t) => t.slug === slug);
}

/**
 * Kullanicinin gercekten gidecegi adres.
 *
 * Sira: affiliate.json > affiliateUrl > websiteUrl > Google aramasi.
 * affiliate.json one geciyor cunku aciklama serdi, rel="sponsored" ve
 * /terms metni de ORAYA bakiyor; hedef baska yerden gelirse site parali
 * bir linki paraliymis gibi isaretlemeden acar.
 * Son secenek bilerek duruyor: linki olmayan aracta kullaniciyi
 * cikmaza dusurmek yerine aramaya birakiyoruz (mevcut davranis).
 */
export function hedefUrl(tool: OutboundTool): string {
  const kayit = affiliateKaydi(tool.slug);
  if (kayit) return kayit.url;
  if (tool.affiliateUrl) return tool.affiliateUrl;
  if (tool.websiteUrl) return tool.websiteUrl;
  return `https://www.google.com/search?q=${encodeURIComponent(tool.name + " official website")}`;
}

/** Sayfalarin kullandigi ic link. Tik burada olculur. */
export function gitLinki(slug: string): string {
  return `/go/${slug}`;
}

/** Kanit kaynagi rel degeri; saf mantik `kanit-rel.ts` icinde. */
export function kanitRel(slug: string, kaynakUrl: string): string {
  return kanitRelHesapla(paraliMi(slug), araciBul(slug)?.websiteUrl, kaynakUrl);
}
