import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

/**
 * DENETIMDE BULUNAN (2026-09-07): package.json'da tsx ile calisan 10
 * script tanimliydi ama tsx BAGIMLILIKLARDA YOKTU. Temiz kurulumda
 * hepsi "sh: tsx: command not found" veriyordu -- yani depoyu yeni
 * klonlayan (veya node_modules'u silen) icin measure:*, fix:links,
 * content:legacy:* ve gsc betikleri calismiyordu. Testler etkilenmemisti
 * cunku "test" betigi node --test kullaniyor; bu yuzden kimse fark
 * etmemis.
 */
const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const betikler: Record<string, string> = pkg.scripts ?? {};

test("tsx kullanan her betik icin tsx bagimlilik olarak tanimli", () => {
  const tsxli = Object.entries(betikler).filter(([, k]) => /(^|\s|&&\s*)(npx\s+)?tsx\s/.test(k));
  if (tsxli.length === 0) return;
  const tanimli = pkg.devDependencies?.tsx ?? pkg.dependencies?.tsx;
  assert.ok(tanimli,
    `${tsxli.length} betik tsx kullaniyor (${tsxli.map(([a]) => a).join(", ")}) ama tsx bagimlilik degil`);
});

test("betiklerin isaret ettigi dosyalar var", () => {
  for (const [ad, komut] of Object.entries(betikler)) {
    for (const m of komut.matchAll(/(?:^|\s)((?:scripts|src)\/[\w./-]+\.ts)/g)) {
      assert.ok(existsSync(m[1]), `${ad}: ${m[1]} yok`);
    }
  }
});
