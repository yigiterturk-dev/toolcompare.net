/**
 * REKLAMIN TEK KAYNAGI.
 *
 * Yayinci kimligi ve "reklam acik mi" sorusu tek yerde duruyor: layout
 * betigi basiyor, /ads.txt dosyayi uretiyor, gizlilik politikasi cerez
 * bolumunu gosteriyor, reklam birimi kendini ciziyor -- dordu de burayi
 * okuyor. Daginik `process.env` okumasi, sitenin bir yerde "reklam var"
 * bir yerde "cerez yok" demesine yol acardi; bu sitede ayni hata fiyat
 * tarafinda iki kez cikti (bkz. lib/fiyat.ts).
 */

import { icerikDerin, aracIndekslenir } from "./indeks.ts";
import type { Arac } from "./arac";

/**
 * ⚠️ GOOGLE AYNI KIMLIGI IKI AYRI BICIMDE ISTIYOR:
 *   ads.txt satiri      -> "pub-0000000000000000"      (ca- ONEKSIZ)
 *   betik ?client=      -> "ca-pub-0000000000000000"   (ca- ONEKLI)
 *   <ins data-ad-client -> "ca-pub-0000000000000000"   (ca- ONEKLI)
 *
 * Tek ham degeri her iki yere basmak, env hangi bicimde yazilirsa
 * yazilsin BIR tarafi bozar: "pub-..." yazilirsa betik calismaz,
 * "ca-pub-..." yazilirsa ads.txt'yi Google gecersiz sayar ve reklam
 * envanteri "yetkisiz" olur. Ikisi de sessiz basarisizlik -- sayfa
 * duzgun gorunur, para gelmez.
 *
 * Bu yuzden env'den hangi bicim gelirse gelsin, iki bicim de BURADA
 * turetiliyor. Cagiran taraf hangisini istedigini soyluyor.
 */
function hamKimlik(): string | null {
  return process.env.ADSENSE_PUBLISHER_ID?.trim() || null;
}

/** ads.txt satirinda gecen bicim: ca- oneki OLMADAN. */
export function adsTxtKimlik(): string | null {
  const h = hamKimlik();
  return h ? h.replace(/^ca-/i, "") : null;
}

/** Betik ve <ins> icin gecen bicim: ca- oneki ILE. */
export function reklamYayinci(): string | null {
  const h = hamKimlik();
  if (!h) return null;
  return /^ca-/i.test(h) ? h : `ca-${h}`;
}

export function reklamAcik(): boolean {
  return reklamYayinci() !== null;
}

/** Icerik icine gomulen reklam biriminin kimligi. Yoksa birim cizilmez. */
export function icerikSlotu(): string | null {
  return process.env.ADSENSE_SLOT_ICERIK?.trim() || null;
}

/**
 * AdSense politikasi: "az ya da hic icerigi olmayan sayfalara reklam
 * konmaz." Bu kapi o kurali KODA baglar -- panelden elle url disliyerek
 * degil. Ince ya da noindex bir sayfa reklam almaz; ayni olcut
 * (`icerikDerin`) hem Google'a hem reklama ayni cevabi verir.
 *
 * Dikkat: `aracIndekslenir` talep goren ince sayfayi kurtariyor (bkz.
 * indeks.ts) -- o muafiyet ARAMA icin dogru, REKLAM icin degil. Bu
 * yuzden burada iki kosul da ayri ayri soruluyor.
 */
export function aracReklamAlir(t?: Arac): boolean {
  if (!reklamAcik()) return false;
  return aracIndekslenir(t) && icerikDerin(t);
}
