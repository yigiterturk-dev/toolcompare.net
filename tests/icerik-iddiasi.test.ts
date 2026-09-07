import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

/**
 * DENETIMDE BULUNAN (2026-09-07): scripts/verify-claims.mjs 54 dayanaksiz
 * ustunluk iddiasi buluyordu ("The best", "unmatched", "undisputed",
 * "revolutionary", "number one", "superior") ve exit 1 veriyordu -- ama
 * betik `npm run check`'e BAGLI DEGILDI, yani kimse gormuyordu.
 * Karsilastirma sitesinin tek sermayesi guven; olculmemis "en iyi"
 * iddiasi tam da satmaya calistigi seyi cururutuyor.
 *
 * Ayrica Ingilizce katalogda Turkce kalintilar vardi (premiere-pro'da
 * "kurgu", firebase'de "Comert", miro'da "Free Sınırı").
 */
type Metinli = {
  slug: string;
  shortDescription?: string;
  longDescription?: string;
  targetAudience?: string | { text?: string };
  verdict?: string | { text?: string };
  pros?: string[]; cons?: string[]; bestFor?: string[]; skipIf?: string[];
};
const araclar = JSON.parse(readFileSync("src/data/tools.json", "utf8")) as Metinli[];

const YASAK = /\b(unmatched|undisputed|revolutionary|world[- ]leading|the best|number one|superior)\b/i;

function duz(x: string | { text?: string } | undefined): string | undefined {
  return typeof x === "string" ? x : x?.text;
}

function metinler(t: Metinli): string[] {
  const tekil = [t.shortDescription, t.longDescription, duz(t.targetAudience), duz(t.verdict)];
  const dizi = [...(t.pros ?? []), ...(t.cons ?? []), ...(t.bestFor ?? []), ...(t.skipIf ?? [])];
  return [...tekil, ...dizi].filter((x): x is string => typeof x === "string");
}

test("hicbir sayfa dayanaksiz ustunluk iddia etmiyor", () => {
  const suclu: string[] = [];
  for (const t of araclar) {
    for (const m of metinler(t)) {
      const e = m.match(YASAK);
      if (e) suclu.push(`${t.slug}: "${e[0]}"`);
    }
  }
  assert.deepEqual(suclu, [], `dayanaksiz ustunluk: ${suclu.slice(0, 5).join(" | ")}`);
});

test("Ingilizce katalogda Turkce metin yok", () => {
  const suclu: string[] = [];
  for (const t of araclar) {
    for (const m of metinler(t)) {
      if (/[şğıçöüŞĞİÇÖÜ]/.test(m)) suclu.push(`${t.slug}: ${m.slice(0, 50)}`);
    }
  }
  assert.deepEqual(suclu, [], `Turkce kalinti: ${suclu.slice(0, 3).join(" | ")}`);
});
