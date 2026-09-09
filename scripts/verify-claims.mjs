import fs from "node:fs";

const tools = JSON.parse(fs.readFileSync(new URL("../src/data/tools.json", import.meta.url), "utf8"));
const forbidden = /\b(unmatched|undisputed|revolutionary|world[- ]leading|the best|number one|superior)\b/i;

/* FIYAT IDDIASI — src/lib/indeks.ts icindeki FIYAT_IDDIASI ile AYNI kalmali.
   OLCULEN HATA (2026-09-10): bu betik yalnizca BICIMI denetliyordu (durum
   gecerli mi, tarih var mi, supports bos mu). 42 kayitta supports tek satirdi:
   "the vendor's published pricing" -- icinde tek rakam yok, limitations'inda
   "An editor has not read it line by line" yaziyor. Hepsi bu betikten
   gecip `pricing-page-verified` etiketiyle alternatives/compare uretiyordu.
   Artik o etiketi tasiyan kayitta SOMUT bir fiyat ifadesi araniyor. */
const FIYAT_IDDIASI =
  /([$€£₹]\s?\d|\d+(?:[.,]\d+)?\s?(?:USD|EUR|GBP)\b|\d[^.]{0,24}\bper (?:user|seat|month|employee|contractor)\b|\bcontact sales\b|\bcustom pricing\b|\bquote\b|\bfree (?:tier|plan|forever)\b|\bno free (?:tier|plan)\b)/i;
const OZLU_PLAN_IDDIASI =
  /(\bfree\b|\bno price\b|\bopen source\b|\b(?:plan|tier|edition)s?\b[^.]{0,60}\d|\d[^.]{0,60}\b(?:plan|tier|edition)s?\b)/i;

const failures = [];
let sourced = 0;
let fiyatKanitli = 0;

for (const tool of tools) {
  if (!tool.evidence) continue;
  sourced += 1;
  const where = `tool:${tool.slug}`;
  if (!['vendor-sourced', 'pricing-page-verified', 'open-source-verified', 'observed', 'tested', 'unknown'].includes(tool.evidence.status)) {
    failures.push(`${where} has an invalid evidence status`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tool.evidence.reviewedAt || '')) {
    failures.push(`${where} needs evidence.reviewedAt in YYYY-MM-DD format`);
  }
  if (!Array.isArray(tool.evidence.sources) || tool.evidence.sources.length === 0) {
    failures.push(`${where} needs at least one source`);
  }
  for (const source of tool.evidence.sources || []) {
    if (!/^https:\/\//.test(source.url || '')) failures.push(`${where} has a non-HTTPS source`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(source.checkedAt || '')) failures.push(`${where} has an undated source`);
    if (!Array.isArray(source.supports) || source.supports.length === 0) failures.push(`${where} has a source with no claim mapping`);
  }
  /* `pricing-page-verified` BIR IDDIADIR: en az bir supports maddesi somut
     bir fiyat ifadesi icermeli. Baslik sayilmaz ("… — Pricing" her yerde var). */
  const somut = (tool.evidence.sources || []).some((source) =>
    [FIYAT_IDDIASI, OZLU_PLAN_IDDIASI].some((re) => re.test((source.supports || []).join(' '))));
  if (somut) fiyatKanitli += 1;
  if (tool.evidence.status === 'pricing-page-verified' && !somut) {
    failures.push(`${where} claims pricing-page-verified but no source supports a concrete price`);
  }

  const prose = [tool.shortDescription, tool.longDescription, tool.verdict, tool.targetAudience,
    ...(tool.pros || []), ...(tool.cons || []), ...(tool.bestFor || []), ...(tool.skipIf || [])]
    .filter(Boolean).join(' ');
  if (forbidden.test(prose)) failures.push(`${where} contains an unsupported superlative: ${prose.match(forbidden)[0]}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`claims: ${sourced}/${tools.length} records have validated evidence metadata`);
console.log(`claims: ${fiyatKanitli}/${sourced} of those cite a concrete price in a source`);
