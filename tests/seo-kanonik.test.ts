import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * OLCULEN HATA (2026-09-09): kok layout `alternates: { canonical: "/" }`
 * yaziyordu ve Next bunu alt sayfalara MIRAS birakiyor. Kendi kanonigini
 * yazmayan her sayfa Google'a "ben anasayfayim" diyordu. Canlida dogrulandi:
 * /top-picks, /categories, /blog, /tools/udf-reader (hepsi 200) kanonik
 * olarak anasayfayi gosteriyordu; ilk ikisi ayni zamanda sitemap'teydi.
 * Sitemap "beni indeksle", kanonik "ben baskasiyim" -> sayfa indekslenmez.
 *
 * IKINCI HATA (ayni gun): sayfa kendi `openGraph` nesnesini yazinca kok
 * layout'un `/brand/og.png` gorseli TAMAMEN dusuyordu. Orneklem olcumu:
 * 57 sayfanin 42'sinde og:image yoktu -> compare (581) + alternatives (289)
 * + categories (15) = 885 sayfa paylasildiginda gorselsiz cikiyordu.
 * Ayni hata layout'ta bir kez duzeltilmisti, alt sayfalarda yeniden dogdu.
 */

const kok = fileURLToPath(new URL("../src/app", import.meta.url));

const sayfalar = (d: string): string[] =>
  readdirSync(d).flatMap((ad) => {
    const tam = `${d}/${ad}`;
    return statSync(tam).isDirectory() ? sayfalar(tam) : ad === "page.tsx" ? [tam] : [];
  });

const kodu = (p: string) =>
  readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

test("kok layout kanonigi MIRAS BIRAKMIYOR", () => {
  assert.ok(
    !/alternates:\s*\{\s*canonical/.test(kodu(`${kok}/layout.tsx`)),
    "layout'ta canonical var -> kendi kanonigini yazmayan her sayfa onu miras alir"
  );
});

test("her sayfa kendi kanonigini yaziyor", () => {
  const eksik = sayfalar(kok)
    .filter((p) => !kodu(p).includes("alternates"))
    .filter((p) => !p.includes("management-hq")) // noindex panel
    .map((p) => p.slice(kok.length + 1));
  assert.deepEqual(eksik, [], "bu sayfalarin kanonigi yok -> Google icin belirsiz");
});

test("openGraph'i elle kurup gorsel koymayan sayfa yok", () => {
  // ⚠️ ISTISNA: sayfanin KENDI klasorunde `opengraph-image.tsx` varsa Next
  // gorseli oradan uretiyor ve sayfa openGraph yazsa bile dusmuyor. Canlida
  // dogrulandi: /tools/hetzner'in og:image'i var (tools/[slug]/opengraph-image.tsx).
  // Kok seviyedeki ayni dosya ise ALT segmentlere ayni sekilde uygulanmiyor --
  // gelecekfinans'ta bu fark 8 sayfayi gorselsiz birakmisti.
  const suclu = sayfalar(kok)
    .filter((p) => {
      const klasor = p.slice(0, p.lastIndexOf("/"));
      if (readdirSync(klasor).some((f) => f.startsWith("opengraph-image"))) return false;
      const blok = kodu(p).match(/openGraph:\s*\{[\s\S]*?\},/);
      return blok ? !/images\s*:/.test(blok[0]) : false;
    })
    .map((p) => p.slice(kok.length + 1));
  assert.deepEqual(suclu, [], "bu sayfalar openGraph yazip images koymamis -> paylasimda gorsel cikmaz");
});
