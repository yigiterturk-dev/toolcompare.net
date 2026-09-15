import test from "node:test";
import assert from "node:assert/strict";
import { elleYazilmisSorular, notluCiftler, elleYazilmisKisaCevap, kisaCevapliCiftler } from "../src/lib/karsilastirma-notlari.ts";
import { gercekFarkVar } from "../src/lib/indeks.ts";
import { kanonikSlug } from "../src/lib/compare.ts";
import toolsData from "../src/data/tools.json" with { type: "json" };

/*
  Elle yazilan karsilastirma sorulari sessizce kaybolabilir: anahtar
  kanonik slug degilse (alfabetik sira yanlissa) ya da bir tarafin slug'i
  katalogda yoksa sayfa hicbir sey basmaz, hata da vermez. Bu testler o
  sessiz kaybi hataya cevirir -- yazilan icerigin yayinda oldugunu bilmek
  icin canliya bakmak gerekmesin.
*/

const araclar = (Array.isArray(toolsData) ? toolsData : (toolsData as { tools: unknown[] }).tools) as {
  slug: string;
}[];
const slugVar = new Set(araclar.map((t) => t.slug));

test("her not anahtari kanonik cift slug'idir ve iki araci da katalogda vardir", () => {
  for (const anahtar of notluCiftler()) {
    const parcalar = anahtar.split("-vs-");
    assert.equal(parcalar.length, 2, `${anahtar}: "-vs-" ile ikiye ayrilmiyor`);
    const [a, b] = parcalar;
    assert.ok(slugVar.has(a), `${anahtar}: "${a}" katalogda yok`);
    assert.ok(slugVar.has(b), `${anahtar}: "${b}" katalogda yok`);
    assert.equal(kanonikSlug(a, b), anahtar, `${anahtar}: kanonik sira degil`);
  }
});

test("her elle yazilmis maddenin kaynagi ve govdesi var", () => {
  for (const anahtar of notluCiftler()) {
    const sorular = elleYazilmisSorular(anahtar);
    // Yalnizca kisa cevap yazilmis kayit soru uretmeyebilir (2026-09-15).
    if (sorular.length === 0 && elleYazilmisKisaCevap(anahtar)) continue;
    assert.ok(sorular.length > 0, `${anahtar}: soru uretmiyor ve kisa cevabi da yok`);
    for (const s of sorular) {
      assert.ok(s.soru.endsWith("?"), `${anahtar}: "${s.soru}" soru isareti ile bitmiyor`);
      assert.ok(s.cevap.length >= 120, `${anahtar}: "${s.soru}" cevabi cok kisa`);
      assert.ok(s.kaynak?.url.startsWith("https://"), `${anahtar}: "${s.soru}" kaynaksiz`);
    }
  }
});

test("bilinmeyen cift bos donuyor, patlamiyor", () => {
  assert.deepEqual(elleYazilmisSorular("olmayan-vs-arac"), []);
  assert.deepEqual(elleYazilmisSorular("_aciklama"), []);
});

/* ---- Elle yazilmis kisa cevap (2026-09-15) ---- */

test("kisa cevap: sec anahtarlari ciftin iki slug'idir, ozet dolu, rakam ve para isareti yok", () => {
  const ciftler = kisaCevapliCiftler();
  assert.ok(ciftler.length > 0, "hic kisa cevap yok");
  for (const anahtar of ciftler) {
    const k = elleYazilmisKisaCevap(anahtar)!;
    const [a, b] = anahtar.split("-vs-");
    assert.deepEqual(Object.keys(k.sec).sort(), [a, b].sort(), `${anahtar}: sec anahtarlari cift slug'lari degil`);
    assert.ok(k.ozet.split(/\s+/).length >= 40, `${anahtar}: ozet 40 kelimeden kisa`);
    assert.ok(!/[$€£]|\d+(\.\d+)?\s*\/\s*(mo|month|user)/i.test(k.ozet), `${anahtar}: ozette fiyat var -- fiyat izlenen veriden basilir`);
    for (const slug of [a, b]) assert.ok(k.sec[slug].length >= 2, `${anahtar}: ${slug} icin en az iki 'sec' maddesi gerekir`);
    assert.ok(k.kaynaklar.length >= 1, `${anahtar}: kaynak yok`);
  }
});

test("kisa cevap yazilmis cift, kriter tablosu ayni olsa da gercek fark sayilir (noindex kapisi acilir)", () => {
  const harita = new Map((araclar as { slug: string }[]).map((t) => [t.slug, t]));
  for (const anahtar of ["semrush-vs-similarweb", "amplitude-vs-hotjar", "firebase-vs-keycloak"]) {
    const [a, b] = anahtar.split("-vs-");
    assert.ok(gercekFarkVar(harita.get(a) as never, harita.get(b) as never), `${anahtar}: kapi hala kapali`);
  }
});
