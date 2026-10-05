---
license: cc-by-4.0
pretty_name: SaaS Pricing Dataset (verified against vendor pages)
tags:
- saas
- pricing
- software
size_categories:
- n<1K
---

# SaaS Pricing Dataset (verified against vendor pages)

Starting prices for 518 software tools, each with the vendor source URL and the date the price was read — including the records that could not be verified.

**Source & live version:** https://toolcompare.net/data · public JSON API: `https://toolcompare.net/api/tools?format=compact`
**Snapshot:** 2026-10-05 · **License:** CC BY 4.0 — attribution required.

## Why this dataset

Most pricing lists copy each other. Every row here says *where* the price came from and *when* it was read,
and rows we could not verify are kept and labelled instead of dropped.

## Columns

| column | meaning |
|---|---|
| `slug`, `name`, `category` | tool identity |
| `website_url` | vendor site |
| `starting_price_usd` | cheapest paid monthly starting price we could read (0 = free tier / open source) |
| `pricing_model` | free, free-tier, flat, subscription, per-user, usage-based, quote, one-time… |
| `evidence_status` | how the price was established (below) |
| `price_read_on` | date the price was read from the source |
| `source_url` | the vendor page the price was read from |
| `toolcompare_url` | full record with plans, limits and notes |

## Evidence status

| status | rows |
|---|---|
| `pricing-page-verified` | 247 |
| `vendor-sourced` | 200 |
| `unverified` | 40 |
| `open-source-verified` | 31 |

`pricing-page-verified` = read from the vendor's own pricing page. `open-source-verified` = vendor page states open source / free.
`vendor-sourced` = vendor documentation, no public price table. `unverified` = not verified; do not treat as a fact.

## Citation

> ToolCompare, SaaS Pricing Dataset (snapshot 2026-10-05). https://toolcompare.net/data — CC BY 4.0.

Corrections: https://toolcompare.net/contact
