import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * ATIF ALINMAK ICIN KURULMUS VARLIK, MAKINEYE GORUNMUYORDU.
 *
 * /data sayfasi lisansi (CC BY 4.0), atif cumlesini ve indirme adresini
 * DUZ YAZIYLA soyluyordu ama tek bir JSON-LD tasimiyordu. Google'in veri
 * kumesi aramasi ve ayni semayi okuyan toplayicilar schema.org/Dataset
 * uzerinden calisir; yani sitenin dis baglanti stratejisinin merkezindeki
 * sayfa o kanala gorunmezdi. Ayni sema /research/pricing-transparency'de
 * zaten vardi -- eksik olan yalnizca /data'ydi.
 *
 * Dagitim adresleri gercek olmali: uydurma bir contentUrl, veri kumesini
 * dogrulamaya gelen toplayiciyi 404'e gonderir.
 */

test("/data sayfasi Dataset semasi basiyor", () => {
  const s = readFileSync("src/app/data/page.tsx", "utf8");
  assert.match(s, /"@type": "Dataset"/, "Dataset semasi yok");
  assert.match(s, /application\/ld\+json/, "sema sayfaya basilmiyor");
  assert.match(s, /creativecommons\.org\/licenses\/by\/4\.0/, "lisans makineye soylenmiyor");
  assert.match(s, /"@type": "DataDownload"/, "indirme adresi beyan edilmiyor");
});

test("beyan edilen indirme adresleri gercek rotalara isaret ediyor", () => {
  const s = readFileSync("src/app/data/page.tsx", "utf8");
  const adresler = [...s.matchAll(/contentUrl: "https:\/\/toolcompare\.net(\/api\/[^"]+)"/g)].map((m) => m[1]);
  assert.ok(adresler.length >= 1, "hic dagitim adresi yok");
  for (const a of adresler) {
    const rota = a.replace(/^\/api\//, "");
    // Rota dosyasi gercekten var mi: uydurma contentUrl toplayiciyi 404'e gonderir.
    assert.doesNotThrow(
      () => readFileSync(`src/app/api/${rota}/route.ts`, "utf8"),
      `${a} icin rota dosyasi yok`,
    );
  }
});

test("iki veri sayfasi da ayni lisansi beyan ediyor", () => {
  for (const p of ["src/app/data/page.tsx", "src/app/research/pricing-transparency/page.tsx"]) {
    const s = readFileSync(p, "utf8");
    assert.match(s, /CC BY 4\.0/, `${p}: atif cumlesinde lisans yok`);
    assert.match(s, /licenses\/by\/4\.0/, `${p}: semada lisans yok`);
  }
});
