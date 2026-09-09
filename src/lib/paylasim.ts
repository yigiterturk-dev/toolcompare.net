/**
 * Paylasim (Open Graph / Twitter) meta verisinin tek kaynagi.
 *
 * OLCULEN HATA (2026-09-09): sitemap'ten 57 sayfalik orneklem tarandi.
 * `/tools/*` sayfalarinin kendi uretilen gorseli var, ama `/compare/*` (581),
 * `/alternatives/*` (289) ve `/categories/*` (15) sayfalarinda **og:image
 * HIC YOKTU** -- yani 885 sayfa paylasildiginda gorselsiz, ciplak baglanti
 * olarak cikiyordu.
 *
 * 🔑 SEBEP: kok layout `/brand/og.png` tanimliyor, ama sayfa kendi
 * `openGraph` nesnesini yazinca layout'un nesnesi TAMAMEN degisiyor ve
 * gorsel dusuyor. Sessiz kayip: hicbir test, hicbir derleme uyarisi
 * soylemiyor -- yalnizca paylasinca goruluyor. Ayni hata layout'ta bir kez
 * duzeltilmis ("kart summary_large_image diyordu ama gorsel tanimli
 * degildi"), ama alt sayfalarda tekrar dogmus.
 *
 * Bu yuzden openGraph elle yazilmiyor; buradan uretiliyor.
 */
export const OG_GORSEL = "/brand/og.png";

export function paylasimMeta({
  url,
  title,
  description,
  type = "website",
  gorsel = OG_GORSEL,
}: {
  url: string;
  title: string;
  description: string;
  type?: "website" | "article";
  /** Sayfaya ozel uretilmis gorsel varsa (orn. /tools/[slug]) onu gec. */
  gorsel?: string;
}) {
  return {
    openGraph: {
      title,
      description,
      url,
      siteName: "ToolCompare",
      type,
      images: [{ url: gorsel, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: [gorsel],
    },
  };
}
