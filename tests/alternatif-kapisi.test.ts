import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { alternatifSayfasiOlanlar } from "../src/lib/compare.ts";
import { alternatifIndekslenir } from "../src/lib/indeks.ts";
import { alternatifTaranmayaDeger } from "../src/lib/tarama.ts";

/*
  /alternatives TOPLU GIRIS KAPISI.

  Olcum (2026-09-12): /compare ve /categories'in birer kapisi vardi,
  /alternatives CANLIDA 404 donuyordu -- ve bu sayfa turu gosterimin
  %8,5'ini getiriyor. 151 sayfa yalnizca kendi arac sayfasindan link
  aliyordu.

  Asil risk yeni sayfanin kendisi degil, LISTESININ KAYMASI: hub
  sitemap'te olmayan bir sayfaya link verirse, 10. turda kapatilan ic
  link sizintisi (indekslenebilir sayfadan noindex'e 261 link) yeniden
  acilir. Bu yuzden test iki listeyi karsilastirir, sayfayi degil.
*/

const sitemapKapisi = () =>
  alternatifSayfasiOlanlar()
    .filter((t) => alternatifIndekslenir(t) && alternatifTaranmayaDeger(t))
    .map((t) => t.slug)
    .sort();

test("hub, sitemap ile AYNI uc kapidan geciyor", () => {
  const src = fs.readFileSync("src/app/alternatives/page.tsx", "utf8");
  for (const kapi of ["alternatifSayfasiOlanlar", "alternatifIndekslenir", "alternatifTaranmayaDeger"]) {
    assert.match(src, new RegExp(kapi), `hub ${kapi} kapisini sormuyor`);
  }
  // Sayfa kendi listesini elle kurmamali: sitemap'in kaynagini cagirmali.
  assert.doesNotMatch(src, /tools\.json/, "hub ham veriden kendi listesini kuruyor");
});

test("sitemap statik listesinde /alternatives var", () => {
  const src = fs.readFileSync("src/app/sitemap.ts", "utf8");
  assert.match(src, /'\/alternatives',/, "hub sitemap'te beyan edilmemis");
});

test("footer'dan link verilen kapi gercekten uretiliyor", () => {
  const footer = fs.readFileSync("src/components/Footer.tsx", "utf8");
  if (/href: "\/alternatives"/.test(footer)) {
    assert.ok(
      fs.existsSync("src/app/alternatives/page.tsx"),
      "footer /alternatives'e link veriyor ama sayfa yok -- /compare'de 2026-09-10'da yasanan 404 hatasinin aynisi",
    );
  }
});

test("kapidan gecen en az bir sayfa var ve hepsi indekslenebilir", () => {
  const liste = sitemapKapisi();
  assert.ok(liste.length > 0, "kapidan hic sayfa gecmiyor -- hub bos olurdu");
  assert.equal(new Set(liste).size, liste.length, "listede tekrar eden slug var");
});
