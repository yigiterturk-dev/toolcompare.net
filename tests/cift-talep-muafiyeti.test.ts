import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { ciftIndekslenir } from "../src/lib/indeks.ts";
import { ayniIslev } from "../src/lib/islev.ts";
import { entegrasyonVar, tumEntegrasyonlar } from "../src/lib/entegrasyon.ts";
import type { Arac } from "../src/lib/arac.ts";

/**
 * SITE, GOOGLE'IN SIRADA GOSTERDIGI SAYFAYA "BENI INDEKSLEME" DIYORDU.
 *
 * Olcum (2026-09-12, GSC 90 gun): gosterim alan 106 karsilastirma
 * sayfasinin yalnizca 21'i indekslenebiliyordu. 85'i `noindex, follow`
 * aliyordu -- icinde 13. sirada duran /compare/getresponse-vs-typeform
 * ve 20. siradaki /compare/teachable-vs-woocommerce vardi.
 *
 * Ayni kural arac sayfalarina cok once konulmustu
 * (aracIndekslenir: `icerikDerin || talepGormus`), ciftlere hic
 * uygulanmamisti. talep.ts'in kendi basligindaki kural: TALEP SAYFA
 * ELEMEZ, YALNIZCA KURTARIR.
 *
 * Bu testler muafiyetin geri dusmesini ve -- ayni onemde -- islev
 * kapisinin talep yuzunden acilmasini engeller.
 */

const araclar = JSON.parse(readFileSync("src/data/tools.json", "utf8")) as Arac[];
const harita = new Map(araclar.map((t) => [t.slug, t]));
const gsc = JSON.parse(readFileSync("src/data/gsc/latest.json", "utf8")) as {
  rows?: { page?: string; impressions?: number }[];
};

/** GSC'de gosterim almis /compare yollari -> gosterim sayisi. */
function talepliCiftler(): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of gsc.rows ?? []) {
    const e = (r.page || "").match(/\/compare\/([^/?#]+)/);
    if (e) m.set(e[1], (m.get(e[1]) || 0) + (r.impressions || 0));
  }
  return m;
}

test("kapi kaynaginda talep muafiyeti duruyor", () => {
  const s = readFileSync("src/lib/indeks.ts", "utf8");
  assert.match(s, /ciftTalebi\(a, b\)/, "cift talebi sorulmuyor");
  assert.match(s, /yolTalepGormus\(`\/compare\//, "yol bazli talep okunmuyor");
});

/**
 * ISLEV KAPISI MUTLAK. Talep bile anlamsiz cifti acmamali: "typeform vs
 * kajabi" 24 gosterim aliyor ama bu bir KARSILASTIRMA talebi degil,
 * entegrasyon sorgusu. Yanlis soruyu cevaplayan sayfayi indekslemek
 * talebi karsilamaz, yalnizca tarama butcesi yer.
 */
test("talep, islev kapisini acmiyor -- yalnizca dogrulanmis entegrasyon acar", () => {
  let bakilan = 0;
  for (const [cift] of talepliCiftler()) {
    const [x, y] = cift.split("-vs-");
    const a = harita.get(x), b = harita.get(y);
    if (!a || !b || ayniIslev(a.slug, b.slug)) continue;
    // Entegrasyon kaydi olan cift bilerek aciliyor: sayfa artik gercek bir
    // soruyu cevapliyor ve cevabin arkasinda satici kaynagi var.
    if (entegrasyonVar(a.slug, b.slug)) continue;
    bakilan++;
    assert.equal(ciftIndekslenir(a, b), false,
      `${cift}: farkli isi goren cift, entegrasyon kaydi OLMADAN indekslenebilir olmus`);
  }
  assert.ok(bakilan > 0, "test anlamsiz olurdu: kayitsiz farkli islevli talepli cift yok");
});

/** Kaydi olan farkli-islevli cift indekslenebilir OLMALI: sayfanin soylecek sozu var. */
test("dogrulanmis entegrasyon kaydi islev kapisini aciyor", () => {
  let acilan = 0;
  for (const [cift] of tumEntegrasyonlar()) {
    const [x, y] = cift.split("-vs-");
    const a = harita.get(x), b = harita.get(y);
    assert.ok(a && b, `${cift}: kayittaki araclardan biri katalogda yok`);
    if (ayniIslev(a.slug, b.slug)) continue;
    acilan++;
    assert.equal(ciftIndekslenir(a, b), true,
      `${cift}: entegrasyon kaydi var ama sayfa hala noindex`);
  }
  assert.ok(acilan > 0, "test anlamsiz olurdu: farkli islevli kayit yok");
});

/**
 * Ayni isi goren ve Google'in FIILEN gosterdigi cift indekslenebilir
 * olmali -- kanit zinciri eksik olsa bile. Gosterim almis olmak olumlu
 * kanittir.
 */
test("ayni islevli, talepli cift artik noindex degil", () => {
  const dusukler: string[] = [];
  let bakilan = 0;
  for (const [cift, gosterim] of talepliCiftler()) {
    const [x, y] = cift.split("-vs-");
    const a = harita.get(x), b = harita.get(y);
    if (!a || !b || !ayniIslev(a.slug, b.slug)) continue;
    bakilan++;
    if (!ciftIndekslenir(a, b)) dusukler.push(`${cift} (g${gosterim})`);
  }
  assert.ok(bakilan >= 20, `ayni islevli talepli cift sayisi beklenenden az: ${bakilan}`);
  assert.deepEqual(dusukler, [],
    `Google gosteriyor ama site noindex diyor:\n${dusukler.join("\n")}`);
});

/** Somut capa: olcumde bulunan en yuksek gosterimli ornek. */
test("discord-vs-slack ornegi indekslenebilir", () => {
  const a = harita.get("discord"), b = harita.get("slack");
  assert.ok(a && b, "ornek araclar katalogda yok");
  assert.equal(ayniIslev("discord", "slack"), true, "ayni islev bekleniyordu");
  assert.equal(ciftIndekslenir(a, b), true, "62 gosterim alan sayfa hala noindex");
});
