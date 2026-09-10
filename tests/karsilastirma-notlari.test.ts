import test from "node:test";
import assert from "node:assert/strict";
import { elleYazilmisSorular, notluCiftler } from "../src/lib/karsilastirma-notlari.ts";
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
    assert.ok(sorular.length > 0, `${anahtar}: soru uretmiyor`);
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
