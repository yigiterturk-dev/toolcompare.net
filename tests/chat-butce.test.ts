import test from "node:test";
import assert from "node:assert/strict";
import { baglamSec, butceAyir, butceSifirla, GUNLUK_TAVAN } from "../src/lib/chat-butce.ts";

const arac = (name: string, category: string, shortDescription: string) => ({ name, category, shortDescription, basePrice: 0 });

const katalog = [
  arac("Xero", "Accounting", "Cloud accounting for small business."),
  arac("QuickBooks", "Accounting", "Bookkeeping and invoicing."),
  arac("Figma", "Design", "Collaborative interface design."),
  arac("Linear", "Project Management", "Issue tracking for software teams."),
  arac("Notion", "Notes", "Docs, wikis and databases."),
];

test("mesajla eslesen araclar one gelir, katalogun tamami gonderilmez", () => {
  const secim = baglamSec(katalog, "I need an accounting tool for invoicing", 3);
  const adlar = secim.map((t) => t.name);
  assert.ok(adlar.includes("Xero"));
  assert.ok(adlar.includes("QuickBooks"));
  assert.ok(!adlar.includes("Figma"));
});

test("ad/kategori eslesmesi aciklama eslesmesinden agir basar", () => {
  const secim = baglamSec(katalog, "figma", 5);
  assert.equal(secim[0].name, "Figma");
});

test("hicbir sey eslesmezse kategori temsili doner, bos degil", () => {
  const secim = baglamSec(katalog, "zzzz qqqq", 10);
  assert.ok(secim.length > 0);
  // Her kategoriden bir temsilci: 4 ayri kategori var.
  assert.equal(new Set(secim.map((t) => t.category)).size, secim.length);
});

test("tavan asilmaz", () => {
  assert.ok(baglamSec(katalog, "accounting design notes tracking", 2).length <= 2);
});

test("gunluk butce tavani cagriyi kesiyor", () => {
  butceSifirla();
  for (let i = 0; i < GUNLUK_TAVAN; i++) assert.equal(butceAyir(), true, `cagri ${i} gecmeliydi`);
  assert.equal(butceAyir(), false);
  butceSifirla();
  assert.equal(butceAyir(), true);
});
