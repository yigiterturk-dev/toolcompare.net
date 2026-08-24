import fs from "node:fs";

const tools = JSON.parse(fs.readFileSync(new URL("../src/data/tools.json", import.meta.url), "utf8"));
const forbidden = /\b(unmatched|undisputed|revolutionary|world[- ]leading|the best|number one|superior)\b/i;
const failures = [];
let sourced = 0;

for (const tool of tools) {
  if (!tool.evidence) continue;
  sourced += 1;
  const where = `tool:${tool.slug}`;
  if (!['vendor-sourced', 'observed', 'tested', 'unknown'].includes(tool.evidence.status)) {
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
