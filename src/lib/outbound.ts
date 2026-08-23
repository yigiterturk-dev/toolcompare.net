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
 * Sira: affiliateUrl > websiteUrl > Google aramasi.
 * Son secenek bilerek duruyor: linki olmayan aracta kullaniciyi
 * cikmaza dusurmek yerine aramaya birakiyoruz (mevcut davranis).
 */
export function hedefUrl(tool: OutboundTool): string {
  if (tool.affiliateUrl) return tool.affiliateUrl;
  if (tool.websiteUrl) return tool.websiteUrl;
  return `https://www.google.com/search?q=${encodeURIComponent(tool.name + " official website")}`;
}

/** Sayfalarin kullandigi ic link. Tik burada olculur. */
export function gitLinki(slug: string): string {
  return `/go/${slug}`;
}
