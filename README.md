# ToolCompare

Live: https://toolcompare.net

A software-tool comparison site built on one rule: **no invented numbers.** Every price, limit and
claim on a page is traceable to a dated source, and the build fails when it is not.

Next.js 16 · React 19 · TypeScript · Node test runner

## What is in it

- **Comparison engine** — side-by-side spec tables, filters, pricing models and alternatives pages,
  generated from a structured catalogue (`src/data`, `tools/`).
- **Claim verification** — `npm run verify:claims` checks that statements on the pages are backed by
  catalogue data; contradicting prices, unit claims and unsourced figures are caught by tests
  (`tests/fiyat-celiski`, `tests/birim-iddiasi`, `tests/kanit-rakam`, …).
- **Quality gates as tests** — duplicate meta descriptions, broken internal links, comparison
  symmetry, index/canonical rules, thin pages and 404 behaviour are all asserted in `tests/`.
- **Search Console tooling** — `gsc:*` scripts pull query and page data to decide what to expand
  and what to prune.
- **Affiliate ordering and data packs** — `affiliate:sira`, `veri:paket`.

## Run it

```bash
npm ci
npm run dev        # local server
npm run check      # lint + tests + audit + build, the full release gate
```

Individual gates: `npm test`, `npm run verify:claims`, `npm run check:fiyat`, `npm run check:izgara`.

## Layout

```
src/app, src/components   Next.js app
src/data, src/lib         catalogue and comparison logic
tools/, scripts/          data ingestion, verification, Search Console helpers
tests/                    content, SEO and integrity tests
```

## Why it is built this way

Comparison sites rot quietly: prices drift, pages multiply, claims outlive their sources. The site
was cut back from a larger page set to a smaller core once thin pages started to hurt more than
they helped, and the tests exist so that kind of drift is caught at build time instead of in
search results.

See `SECURITY.md` for reporting issues. License: see `LICENSE`.
