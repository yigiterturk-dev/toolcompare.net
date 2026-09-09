import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * 🔴 OLCULEN REGRESYON (2026-09-09, ayni gun eklendi ve geri alindi):
 * denetim "19 sayfa var, hic loading.tsx yok" dedi; kok iskelet eklendi.
 * loading.tsx bir Suspense siniri kuruyor, Next yaniti erken akitiyor ve
 * HTTP durumu 200'de KILITLENIYOR. Sonra cagrilan notFound() 404 arayuzunu
 * gosteriyor ama HTTP 404 donmuyor -- "soft 404".
 *
 * Kanit (yerel `next start`, Vercel/LiteSpeed degil):
 *   loading.tsx VARKEN   /tools/olmayan-arac-12345 -> 200
 *   loading.tsx YOKKEN   /tools/olmayan-arac-12345 -> 404
 * Bes sayfa tipi birden etkileniyordu: tools, compare, alternatives,
 * categories, blog. Yanlis yazilan her adres gecerli sayfa gibi
 * indekslenebilir hale geliyordu.
 */

const kok = fileURLToPath(new URL("../src/app", import.meta.url));

const gez = (d: string): string[] =>
  readdirSync(d).flatMap((ad) => {
    const tam = `${d}/${ad}`;
    return statSync(tam).isDirectory() ? gez(tam) : [tam];
  });

const kodu = (p: string) =>
  readFileSync(p, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

test("kok seviyede loading.tsx YOK", () => {
  assert.ok(
    !existsSync(`${kok}/loading.tsx`),
    "src/app/loading.tsx geri gelmis -> notFound() cagiran tum rotalar soft 404 verir"
  );
});

test("notFound() cagiran hicbir rotada loading.tsx yok", () => {
  const suclu: string[] = [];
  for (const p of gez(kok)) {
    if (!p.endsWith("/page.tsx")) continue;
    if (!kodu(p).includes("notFound(")) continue;
    let d = p.slice(0, p.lastIndexOf("/"));
    while (d.startsWith(kok)) {
      if (existsSync(`${d}/loading.tsx`)) {
        suclu.push(`${p.slice(kok.length + 1)} <- ${d.slice(kok.length) || "/"}/loading.tsx`);
        break;
      }
      d = d.slice(0, d.lastIndexOf("/"));
    }
  }
  assert.deepEqual(suclu, [], "bu rotalar notFound() cagiriyor ama bir loading.tsx altinda -> HTTP 200");
});
