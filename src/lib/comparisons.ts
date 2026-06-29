import toolsData from '@/data/tools.json';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Tool = any;

const tools = toolsData as Tool[];

/**
 * A tool only qualifies for a programmatic "X vs Y" page if it has enough
 * substance to fill a meaningful side-by-side table. This is the thin-content
 * guard: stubs without pros/cons or a description are excluded so we never
 * publish empty comparison pages (index-bloat / quality risk).
 */
function isComparable(t: Tool): boolean {
  return Boolean(
    t &&
      t.slug &&
      t.name &&
      t.category &&
      (t.shortDescription || t.longDescription) &&
      Array.isArray(t.pros) &&
      t.pros.length > 0 &&
      Array.isArray(t.cons) &&
      t.cons.length > 0
  );
}

// Caps to prevent index bloat from the full N^2 pair explosion.
const MAX_PEERS_PER_TOOL = 3;
const MAX_PAIRS_PER_CATEGORY = 12;

function score(t: Tool): number {
  return (Number(t.featuresScore) || 0) + (Number(t.ease) || 0);
}

/** Canonical key so "a-vs-b" and "b-vs-a" never both get generated. */
function pairKey(a: string, b: string): string {
  return [a, b].sort().join('-vs-');
}

/**
 * Curated set of comparison slugs ("toolA-vs-toolB") used for static
 * pre-rendering and the sitemap. Only same-category, comparable tools are
 * paired, capped per category.
 */
export function getComparisonSlugs(): string[] {
  const byCategory = new Map<string, Tool[]>();
  for (const t of tools) {
    if (!isComparable(t)) continue;
    const list = byCategory.get(t.category) || [];
    list.push(t);
    byCategory.set(t.category, list);
  }

  const pairs = new Set<string>();
  for (const list of byCategory.values()) {
    const sorted = [...list].sort((a, b) => score(b) - score(a));
    let perCat = 0;
    for (let i = 0; i < sorted.length && perCat < MAX_PAIRS_PER_CATEGORY; i++) {
      for (
        let j = i + 1;
        j <= i + MAX_PEERS_PER_TOOL && j < sorted.length && perCat < MAX_PAIRS_PER_CATEGORY;
        j++
      ) {
        const key = pairKey(sorted[i].slug, sorted[j].slug);
        if (!pairs.has(key)) {
          pairs.add(key);
          perCat++;
        }
      }
    }
  }
  return Array.from(pairs);
}

/**
 * Related "compare with" links for a single tool page: the strongest
 * same-category peers. Computed directly (not limited to the curated set) so
 * every comparable tool gets internal links; those pages render on demand if
 * not pre-rendered.
 */
export function getRelatedComparisons(
  slug: string,
  limit = 3
): { pairSlug: string; name: string }[] {
  const current = tools.find((t) => t.slug === slug);
  if (!current || !isComparable(current)) return [];

  return tools
    .filter((t) => t.slug !== slug && t.category === current.category && isComparable(t))
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit)
    .map((p) => ({ pairSlug: pairKey(current.slug, p.slug), name: p.name }));
}
