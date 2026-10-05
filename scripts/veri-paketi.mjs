/*
  Acik veri setini Kaggle / Hugging Face / data.world'e yuklenecek pakete cevirir.
  Cikti: docs/dataset/ (CSV + JSON + README dataset card + Kaggle metadata).
  Calistir: npm run veri:paket
  Amac dis baglanti: her platformda kaynak satiri toolcompare.net/data'ya gider.
*/
import { readFileSync, writeFileSync } from "node:fs";

const araclar = JSON.parse(readFileSync("src/data/tools.json", "utf8"));
const bugun = new Date().toISOString().slice(0, 10);
const DIZ = "docs/dataset";

/* tools.json'daki model adlari Turkce; disari Ingilizce cikiyor. */
const MODEL = {
  bedava: "free", ucretsiz: "free", "ucretsiz-katman": "free-tier", flat: "flat", aylik: "flat",
  abonelik: "subscription", "abonelik-arti-islem": "subscription-plus-transaction",
  "kullanima-gore": "usage-based", "kullanim-bazli": "usage-based", "kullanici-basina": "per-user",
  teklif: "quote", "ucretsiz-kredi": "free-credits", "tek-seferlik": "one-time",
  "urun-bazli": "per-product", degisken: "variable",
};

const kayitlar = araclar.map((t) => {
  const kaynaklar = t.evidence?.sources ?? [];
  const tarihler = kaynaklar.map((s) => s.checkedAt).filter(Boolean).sort();
  return {
    slug: t.slug,
    name: t.name,
    category: t.category ?? "",
    website_url: t.websiteUrl ?? "",
    starting_price_usd: typeof t.basePrice === "number" ? t.basePrice : "",
    pricing_model: MODEL[t.fiyatModeli] ?? t.fiyatModeli ?? (t.isFlat ? "flat" : ""),
    evidence_status: t.evidence?.status ?? "unverified",
    price_read_on: tarihler.at(-1) ?? t.evidence?.reviewedAt ?? "",
    source_url: kaynaklar[0]?.url ?? "",
    toolcompare_url: `https://toolcompare.net/tools/${t.slug}`,
  };
});

const kolonlar = Object.keys(kayitlar[0]);
const kac = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
writeFileSync(`${DIZ}/toolcompare-saas-pricing.csv`, [kolonlar.join(","), ...kayitlar.map((r) => kolonlar.map((k) => kac(r[k])).join(","))].join("\n") + "\n");
writeFileSync(`${DIZ}/toolcompare-saas-pricing.json`, JSON.stringify(kayitlar, null, 1) + "\n");

const durum = {};
for (const r of kayitlar) durum[r.evidence_status] = (durum[r.evidence_status] ?? 0) + 1;
const durumTablo = Object.entries(durum).sort((a, b) => b[1] - a[1]).map(([k, v]) => `| \`${k}\` | ${v} |`).join("\n");

const BASLIK = "SaaS Pricing Dataset (verified against vendor pages)";
const OZET = `Starting prices for ${kayitlar.length} software tools, each with the vendor source URL and the date the price was read — including the records that could not be verified.`;

writeFileSync(`${DIZ}/README.md`, `---
license: cc-by-4.0
pretty_name: ${BASLIK}
tags:
- saas
- pricing
- software
size_categories:
- n<1K
---

# ${BASLIK}

${OZET}

**Source & live version:** https://toolcompare.net/data · public JSON API: \`https://toolcompare.net/api/tools?format=compact\`
**Snapshot:** ${bugun} · **License:** CC BY 4.0 — attribution required.

## Why this dataset

Most pricing lists copy each other. Every row here says *where* the price came from and *when* it was read,
and rows we could not verify are kept and labelled instead of dropped.

## Columns

| column | meaning |
|---|---|
| \`slug\`, \`name\`, \`category\` | tool identity |
| \`website_url\` | vendor site |
| \`starting_price_usd\` | cheapest paid monthly starting price we could read (0 = free tier / open source) |
| \`pricing_model\` | free, free-tier, flat, subscription, per-user, usage-based, quote, one-time… |
| \`evidence_status\` | how the price was established (below) |
| \`price_read_on\` | date the price was read from the source |
| \`source_url\` | the vendor page the price was read from |
| \`toolcompare_url\` | full record with plans, limits and notes |

## Evidence status

| status | rows |
|---|---|
${durumTablo}

\`pricing-page-verified\` = read from the vendor's own pricing page. \`open-source-verified\` = vendor page states open source / free.
\`vendor-sourced\` = vendor documentation, no public price table. \`unverified\` = not verified; do not treat as a fact.

## Citation

> ToolCompare, SaaS Pricing Dataset (snapshot ${bugun}). https://toolcompare.net/data — CC BY 4.0.

Corrections: https://toolcompare.net/contact
`);

writeFileSync(`${DIZ}/dataset-metadata.json`, JSON.stringify({
  title: "SaaS Pricing Dataset - Verified Against Vendors",
  id: "REPLACE_WITH_KAGGLE_USERNAME/saas-pricing-verified",
  subtitle: `Starting prices for ${kayitlar.length} software tools with source URL and read date`,
  description: readFileSync(`${DIZ}/README.md`, "utf8").replace(/^---[\s\S]*?---\n\n/, ""),
  licenses: [{ name: "CC-BY-4.0" }],
  keywords: ["business", "software", "pricing"],
  resources: [{ path: "toolcompare-saas-pricing.csv", description: "One row per tool" }],
}, null, 2) + "\n");

console.log(`${kayitlar.length} kayit ·`, durum);
