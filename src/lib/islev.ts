/**
 * ISLEV KATMANI: bir aracin ne ise yaradigi.
 *
 * NEDEN VAR (GSC olcumu, 2026-09-03):
 * Akran secimi `category` alanina bakiyordu. O alan cok kaba: "Developer
 * Tools" tek basina 115 araci -- bir cache (Redis), bir hata izleyici
 * (Sentry), bir is takipcisi (Jira) ve bir BaaS'i (Appwrite) -- ayni
 * kovaya atiyor. Sonuc "Redis vs Sentry" ve "Appwrite alternatifi: Jira"
 * gibi kimsenin aramadigi sayfalardi.
 *
 * Olcum: sitemap'teki 1.163 karsilastirma adresinin buyuk cogunlugu
 * Search Console'da "URL is unknown to Google" ya da "Discovered -
 * currently not indexed" durumundaydi. Google bu sayfalari tarayip
 * indekslemeye degmez buluyordu -- hakliydi.
 *
 * Metinden benzerlik cikarmayi denedim (TF-IDF), ise yaramadi: pazarlama
 * metinleri ayni isi farkli kelimelerle anlatiyor (hotjar <-> google
 * analytics benzerligi 0.000 cikiyor). Bu yuzden islev ELLE, tek bir veri
 * dosyasinda tutuluyor: src/data/islev.json.
 *
 * KURAL: islevi `null` olan arac TEKILDIR -- akrani yoktur, karsilastirma
 * ya da alternatif sayfasi uretmez. "Bu araca benzeyen bir sey yok" demek,
 * uydurma bir akran gostermekten iyidir.
 *
 * Islev kategoriden bagimsizdir ve ondan usttundur: Jira verisinde
 * "Developer Tools" yaziyor ama islevi project-management, dolayisiyla
 * akranlari Asana ve Linear.
 */

import islevData from "../data/islev.json" with { type: "json" };

export const ISLEV_HARITASI = islevData as Record<string, string | null>;

/** Aracin islevi; siniflandirilmamis ya da tekil ise null. */
export function islevi(slug: string): string | null {
  return ISLEV_HARITASI[slug] ?? null;
}

/** Iki arac ayni islevi mi goruyor? Tekil (null) araclar hicbir seye esit degildir. */
export function ayniIslev(a: string, b: string): boolean {
  const i = islevi(a);
  return i !== null && i === islevi(b);
}

/** Bir islev grubundaki butun sluglar. */
export function islevGrubu(islev: string): string[] {
  return Object.keys(ISLEV_HARITASI).filter((s) => ISLEV_HARITASI[s] === islev);
}
