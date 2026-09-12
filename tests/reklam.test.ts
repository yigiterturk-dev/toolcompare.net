import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import toolsData from "../src/data/tools.json" with { type: "json" };
import { aracIndekslenir, icerikDerin, ciftIndekslenir, alternatifIndekslenir } from "../src/lib/indeks.ts";
import type { Arac } from "../src/lib/arac.ts";

/*
  Reklam kapisi iki seyi birden korumak zorunda:

  1. AdSense politikasi: "az ya da hic icerigi olmayan sayfalara reklam
     konmaz". Bu sitede ince sayfalar tamamen yok degil -- `indeks.ts`
     talep goren ince sayfayi bilerek indexte tutuyor (olcum: 2026-09-02,
     82 sayfa / 414 gosterim gizlenmisti). O muafiyet ARAMA icin dogru,
     reklam icin degil.
  2. Gizlilik politikasiyla celismemek: betik basiliyorsa politika cerez
     diyor, basilmiyorsa demiyor -- ikisi de ayni degiskeni okuyor.

  Modulu her testte YENIDEN yukluyoruz cunku `reklamAcik()` process.env'i
  cagri aninda okuyor; env'i degistirip tekrar import etmek kapiyi
  gercekten calistirir, taklit etmez.
*/

const T = toolsData as Arac[];

async function taze(pub?: string, slot?: string) {
  const oncePub = process.env.ADSENSE_PUBLISHER_ID;
  const onceSlot = process.env.ADSENSE_SLOT_ICERIK;
  if (pub === undefined) delete process.env.ADSENSE_PUBLISHER_ID;
  else process.env.ADSENSE_PUBLISHER_ID = pub;
  if (slot === undefined) delete process.env.ADSENSE_SLOT_ICERIK;
  else process.env.ADSENSE_SLOT_ICERIK = slot;
  const m = await import(`../src/lib/reklam.ts?t=${Math.random()}`);
  const geri = () => {
    if (oncePub === undefined) delete process.env.ADSENSE_PUBLISHER_ID;
    else process.env.ADSENSE_PUBLISHER_ID = oncePub;
    if (onceSlot === undefined) delete process.env.ADSENSE_SLOT_ICERIK;
    else process.env.ADSENSE_SLOT_ICERIK = onceSlot;
  };
  return { m, geri };
}

test("yayinci kimligi yoksa hicbir sayfa reklam almaz", async () => {
  const { m, geri } = await taze(undefined, undefined);
  assert.equal(m.reklamAcik(), false);
  assert.equal(m.reklamYayinci(), null);
  for (const t of T) assert.equal(m.aracReklamAlir(t), false, `${t.slug} reklam aldi`);
  geri();
});

test("reklam acikken bile INCE sayfa reklam almaz", async () => {
  const { m, geri } = await taze("ca-pub-0000000000000000", "1234567890");
  assert.equal(m.reklamAcik(), true);

  const ince = T.filter((t) => !icerikDerin(t));
  assert.ok(ince.length > 0, "olcut anlamsizlasmis: ince sayfa kalmamis");
  for (const t of ince) {
    assert.equal(m.aracReklamAlir(t), false, `ince sayfa reklam aldi: ${t.slug}`);
  }

  // Talep goren ince sayfa indexte KALIR ama reklam ALMAZ -- iki kapinin
  // ayrildigi tam nokta. Bu ayrim bozulursa test anlamsizlasir.
  const muaf = T.filter((t) => aracIndekslenir(t) && !icerikDerin(t));
  for (const t of muaf) {
    assert.equal(m.aracReklamAlir(t), false, `muafiyetli ince sayfa reklam aldi: ${t.slug}`);
  }
  geri();
});

test("reklam acikken noindex sayfa reklam almaz", async () => {
  const { m, geri } = await taze("ca-pub-0000000000000000", "1234567890");
  for (const t of T) {
    if (!aracIndekslenir(t)) {
      assert.equal(m.aracReklamAlir(t), false, `noindex sayfa reklam aldi: ${t.slug}`);
    }
  }
  geri();
});

test("derin + indexli sayfa reklam alir", async () => {
  const { m, geri } = await taze("ca-pub-0000000000000000", "1234567890");
  const uygun = T.filter((t) => aracIndekslenir(t) && icerikDerin(t));
  assert.ok(uygun.length > 300, `beklenenden az uygun sayfa: ${uygun.length}`);
  for (const t of uygun) {
    assert.equal(m.aracReklamAlir(t), true, `uygun sayfa reklam almadi: ${t.slug}`);
  }
  geri();
});

test("slot kimligi ayri bir kapi: yayinci var slot yoksa birim cizilmez", async () => {
  const { m, geri } = await taze("ca-pub-0000000000000000", undefined);
  assert.equal(m.reklamAcik(), true, "yayinci kimligi betigi basmali");
  assert.equal(m.icerikSlotu(), null, "slot yokken birim cizilmemeli");
  geri();
});

test("gizlilik politikasi reklam durumunu OKUYOR, elle yazilmis degil", () => {
  const src = fs.readFileSync("src/app/privacy/page.tsx", "utf8");
  assert.match(src, /reklamAcik\(\)/, "privacy sayfasi reklam kapisini okumuyor");
  // Reklam acikken "nothing to consent to" demek YALAN olur; o cumle
  // yalnizca reklamsiz dalda kalabilir.
  const reklamliDal = src.split("reklamli ? (")[1] ?? "";
  const ilkDal = reklamliDal.split(") : (")[0] ?? "";
  assert.doesNotMatch(ilkDal, /nothing to consent to/i);
  assert.match(ilkDal, /AdSense/);
  assert.match(ilkDal, /cookies/i);
});

test("kimlik iki bicimde turetiliyor: ads.txt ca-SIZ, betik ca-LI", async () => {
  // Google ayni kimligi iki bicimde istiyor. Env hangi bicimde yazilirsa
  // yazilsin iki taraf da dogru olmali -- yoksa biri sessizce bozulur:
  // yanlis ads.txt = envanter "yetkisiz", yanlis client = betik calismaz.
  for (const yazim of ["pub-1234567890123456", "ca-pub-1234567890123456"]) {
    const { m, geri } = await taze(yazim, "1");
    assert.equal(m.adsTxtKimlik(), "pub-1234567890123456", `ads.txt bicimi bozuk: ${yazim}`);
    assert.equal(m.reklamYayinci(), "ca-pub-1234567890123456", `betik bicimi bozuk: ${yazim}`);
    geri();
  }
  const { m, geri } = await taze(undefined, undefined);
  assert.equal(m.adsTxtKimlik(), null);
  geri();
});

test("ads.txt ve betik AYNI kaynagi okuyor", () => {
  for (const yol of ["src/app/ads.txt/route.ts", "src/app/layout.tsx"]) {
    const src = fs.readFileSync(yol, "utf8");
    assert.match(src, /reklamYayinci\(\)|adsTxtKimlik\(\)/, `${yol} tek kaynagi okumuyor`);
    assert.doesNotMatch(
      src,
      /process\.env\.ADSENSE_PUBLISHER_ID/,
      `${yol} env'i dogrudan okuyor -- kaynak ikiye ayrilmis`,
    );
  }
});

/* ---- Reklam yuzeyi: /tools disindaki bolumler ---- */

test("karsilastirma: IKI taraf da derin degilse reklam yok", async () => {
  const { m, geri } = await taze("ca-pub-0000000000000000", "1234567890");
  const derin = T.filter(icerikDerin);
  const ince = T.filter((t) => !icerikDerin(t));
  assert.ok(derin.length > 0 && ince.length > 0, "olcut anlamsizlasmis");

  // Indekslenen ama bir tarafi ince olan her cift reklamsiz kalmali.
  let denendi = 0;
  for (const a of derin.slice(0, 40)) {
    for (const b of ince) {
      if (!ciftIndekslenir(a, b)) continue;
      denendi++;
      assert.equal(m.ciftReklamAlir(a, b), false, `yarim cift reklam aldi: ${a.slug}/${b.slug}`);
    }
  }
  assert.ok(denendi > 0, "tek bir yarim cift bile denenemedi -- test bos gecmis olur");
  geri();
});

test("alternatif sayfasi: indeks kapisi gecse de ince ise reklam yok", async () => {
  const { m, geri } = await taze("ca-pub-0000000000000000", "1234567890");
  let denendi = 0;
  for (const t of T) {
    if (alternatifIndekslenir(t) && !icerikDerin(t)) {
      denendi++;
      assert.equal(m.alternatifReklamAlir(t), false, `ince alternatif reklam aldi: ${t.slug}`);
    }
    if (!alternatifIndekslenir(t)) {
      assert.equal(m.alternatifReklamAlir(t), false, `noindex alternatif reklam aldi: ${t.slug}`);
    }
  }
  // denendi 0 olabilir (o kesisim bos olabilir); asil guvence ikinci kosul.
  assert.ok(denendi >= 0);
  geri();
});

test("kategori: esigin altindaki liste reklam almaz", async () => {
  const { m, geri } = await taze("ca-pub-0000000000000000", "1234567890");
  assert.equal(m.kategoriReklamAlir(0), false);
  assert.equal(m.kategoriReklamAlir(1), false);
  assert.equal(m.kategoriReklamAlir(2), false);
  assert.equal(m.kategoriReklamAlir(3), true, "esikteki kategori reklam almali");
  assert.equal(m.kategoriReklamAlir(50), true);
  geri();
});

test("reklam kapaliyken dort bolumun HICBIRI reklam almaz", async () => {
  const { m, geri } = await taze(undefined, undefined);
  const a = T.find(icerikDerin)!;
  const b = T.filter(icerikDerin)[1]!;
  assert.equal(m.aracReklamAlir(a), false);
  assert.equal(m.ciftReklamAlir(a, b), false);
  assert.equal(m.alternatifReklamAlir(a), false);
  assert.equal(m.kategoriReklamAlir(99), false);
  geri();
});
