import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * INDEKSLENEBILIR SAYFADAN NOINDEX SAYFAYA LINK.
 *
 * Olcum (2026-09-12, uretim ciktisi): indekslenebilir sayfalardan noindex
 * sayfalara **261 ic link** gidiyordu, 108 ayri hedefe. En cok linkleneni
 * /compare/betterstack-vs-datadog'du (15 sayfadan). Noindex bir sayfaya
 * link vermek Googlebot'u oraya gonderip bos dondurur; tarama butcesi
 * sitenin asil sayfalarindan calinir.
 *
 * Sebep her yerde ayniydi: link uretenler TARAMA kapisini soruyordu ama
 * sitemap KANIT kapisini DA istiyor. Kosul artik paylasilan yerlerde
 * (lib/tarama.ts linklenebilirAkranlar, lib/compare.ts
 * alternatifSayfasiOlan) duruyor.
 *
 * 261 -> 0. Bu test geri dusmesini engelliyor.
 */

const KOK = ".next/server/app";

function htmlDosyalari(dizin: string, biriken: string[] = []): string[] {
  let girisler;
  try {
    girisler = readdirSync(dizin);
  } catch {
    return biriken;
  }
  for (const g of girisler) {
    const tam = join(dizin, g);
    if (statSync(tam).isDirectory()) htmlDosyalari(tam, biriken);
    else if (g.endsWith(".html")) biriken.push(tam);
  }
  return biriken;
}

const dosyalar = htmlDosyalari(KOK);
const yolAdi = (f: string) => {
  const u = f.slice(KOK.length, -".html".length);
  return u === "/index" ? "/" : u;
};

test("indekslenebilir sayfa noindex sayfaya link vermiyor", { skip: dosyalar.length === 0 && "build yok" }, () => {
  const noindex = new Set<string>();
  for (const f of dosyalar) {
    const s = readFileSync(f, "utf8");
    const m = /<meta name="robots" content="([^"]*)"/.exec(s);
    if (m && m[1].includes("noindex")) noindex.add(yolAdi(f));
  }
  const sizinti: string[] = [];
  for (const f of dosyalar) {
    const u = yolAdi(f);
    if (noindex.has(u)) continue; // noindex sayfadan cikan link tarama butcesi yemez
    const s = readFileSync(f, "utf8");
    for (const href of new Set(s.match(/href="\/[^"#?]*"/g) ?? [])) {
      const v = href.slice(6, -1).replace(/\/$/, "") || "/";
      // /go/ disari yonlendirme, robots.txt'te zaten kapali; /_ Next ici.
      if (v.startsWith("/go/") || v.startsWith("/_")) continue;
      if (noindex.has(v)) sizinti.push(`${u} → ${v}`);
    }
  }
  assert.deepEqual(sizinti.slice(0, 20), [],
    `${sizinti.length} link noindex sayfaya gidiyor:\n${sizinti.slice(0, 20).join("\n")}`);
});
