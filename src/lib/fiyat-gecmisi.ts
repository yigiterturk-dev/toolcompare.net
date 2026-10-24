import gecmisVerisi from "../data/fiyat-gecmisi.json" with { type: "json" };
import type { Arac } from "./arac.ts";
import type { Plan } from "./plan.ts";

export type PlanPoint = {
  slug: string;
  name: string;
  plan: string;
  aylik: number;
  birim: Plan["birim"];
  faturalama: Plan["faturalama"];
  checkedAt?: string;
  sourceUrl?: string | null;
};

export type FiyatDegisimiType =
  | "price-up"
  | "price-down"
  | "plan-added"
  | "plan-removed"
  | "terms-changed";

export type FiyatDegisimi = {
  at: string;
  type: FiyatDegisimiType;
  slug: string;
  name: string;
  plan: string;
  from: number | null;
  to: number | null;
  fromBirim?: Plan["birim"] | null;
  toBirim?: Plan["birim"] | null;
  fromFaturalama?: Plan["faturalama"];
  toFaturalama?: Plan["faturalama"];
  deltaPct?: number | null;
  checkedAt?: string;
  sourceUrl?: string | null;
};

export type FiyatGecmisi = {
  version: number;
  updatedAt: string;
  sonKontrol: string;
  baseline: PlanPoint[];
  changes: FiyatDegisimi[];
};

const anahtar = (slug: string, plan: string) => `${slug}\u0000${plan}`;

export function planlariTopla(tools: readonly Arac[]): PlanPoint[] {
  const harita = new Map<string, PlanPoint>();
  for (const tool of tools) {
    for (const plan of tool.planlar ?? []) {
      if (!plan.ad || !Number.isFinite(plan.aylik) || plan.aylik < 0) continue;
      const key = anahtar(tool.slug, plan.ad);
      if (harita.has(key)) continue;
      harita.set(key, {
        slug: tool.slug,
        name: tool.name,
        plan: plan.ad,
        aylik: plan.aylik,
        birim: plan.birim,
        faturalama: plan.faturalama,
        checkedAt: plan.kontrolTarihi,
        sourceUrl: plan.kaynakUrl,
      });
    }
  }
  return [...harita.values()].sort(
    (a, b) => a.slug.localeCompare(b.slug) || a.plan.localeCompare(b.plan),
  );
}

function yuzde(from: number, to: number): number | null {
  if (from <= 0) return null;
  return Math.round(((to - from) / from) * 1000) / 10;
}

/*
  Fiyat gecmisi, "son gorulen" ile "simdi" arasindaki farki uretir. Kural:
  yalnizca VERIDE olan degisiklik yazilir; plan eklenmesi/silinmesi de
  degisikliktir cunku plan merdiveni fiyat iddiasinin kendisidir.
  Ayni fiyat + ayni birim + ayni faturalama -> kayit yok.
*/
export function farklariHesapla(
  previous: readonly PlanPoint[],
  current: readonly PlanPoint[],
  at: string,
): FiyatDegisimi[] {
  const once = new Map(previous.map((point) => [anahtar(point.slug, point.plan), point]));
  const simdi = new Map(current.map((point) => [anahtar(point.slug, point.plan), point]));
  const changes: FiyatDegisimi[] = [];

  for (const [key, point] of simdi) {
    const eski = once.get(key);
    if (!eski) {
      changes.push({
        at,
        type: "plan-added",
        slug: point.slug,
        name: point.name,
        plan: point.plan,
        from: null,
        to: point.aylik,
        toBirim: point.birim,
        toFaturalama: point.faturalama,
        checkedAt: point.checkedAt,
        sourceUrl: point.sourceUrl,
      });
      continue;
    }

    if (eski.aylik !== point.aylik) {
      changes.push({
        at,
        type: point.aylik > eski.aylik ? "price-up" : "price-down",
        slug: point.slug,
        name: point.name,
        plan: point.plan,
        from: eski.aylik,
        to: point.aylik,
        fromBirim: eski.birim,
        toBirim: point.birim,
        fromFaturalama: eski.faturalama,
        toFaturalama: point.faturalama,
        deltaPct: yuzde(eski.aylik, point.aylik),
        checkedAt: point.checkedAt,
        sourceUrl: point.sourceUrl,
      });
      continue;
    }

    if (eski.birim !== point.birim || eski.faturalama !== point.faturalama) {
      changes.push({
        at,
        type: "terms-changed",
        slug: point.slug,
        name: point.name,
        plan: point.plan,
        from: eski.aylik,
        to: point.aylik,
        fromBirim: eski.birim,
        toBirim: point.birim,
        fromFaturalama: eski.faturalama,
        toFaturalama: point.faturalama,
        checkedAt: point.checkedAt,
        sourceUrl: point.sourceUrl,
      });
    }
  }

  for (const [key, eski] of once) {
    if (simdi.has(key)) continue;
    changes.push({
      at,
      type: "plan-removed",
      slug: eski.slug,
      name: eski.name,
      plan: eski.plan,
      from: eski.aylik,
      to: null,
      fromBirim: eski.birim,
      fromFaturalama: eski.faturalama,
      checkedAt: eski.checkedAt,
      sourceUrl: eski.sourceUrl,
    });
  }

  return changes.sort(
    (a, b) =>
      a.slug.localeCompare(b.slug) ||
      a.plan.localeCompare(b.plan) ||
      a.type.localeCompare(b.type),
  );
}

export function fiyatGecmisi(): FiyatGecmisi {
  return gecmisVerisi as FiyatGecmisi;
}

export function sonDegisimler(limit = 40): FiyatDegisimi[] {
  return [...fiyatGecmisi().changes]
    .sort((a, b) => b.at.localeCompare(a.at) || a.slug.localeCompare(b.slug))
    .slice(0, limit);
}

export function aracDegisimleri(slug: string): FiyatDegisimi[] {
  return fiyatGecmisi()
    .changes.filter((change) => change.slug === slug)
    .sort((a, b) => b.at.localeCompare(a.at) || a.plan.localeCompare(b.plan));
}

export function gecmisOzeti() {
  const g = fiyatGecmisi();
  const tools = new Set(g.baseline.map((point) => point.slug));
  return {
    plans: g.baseline.length,
    tools: tools.size,
    sonKontrol: g.sonKontrol,
    degisim: g.changes.length,
  };
}

const TIP_ETIKETI: Record<FiyatDegisimiType, string> = {
  "price-up": "Price increase",
  "price-down": "Price cut",
  "plan-added": "Plan added",
  "plan-removed": "Plan removed",
  "terms-changed": "Terms changed",
};

export const degisimEtiketi = (type: FiyatDegisimiType) => TIP_ETIKETI[type];

/** En son dogrulanan planlar; arac sayfasina link karari cagirana ait. */
export function enSonKontroller(limit = 20) {
  const harita = new Map<
    string,
    { slug: string; name: string; checkedAt: string; plans: number; from: number | null; sourceUrl: string }
  >();
  for (const point of fiyatGecmisi().baseline) {
    const entry = harita.get(point.slug) || {
      slug: point.slug,
      name: point.name,
      checkedAt: "",
      plans: 0,
      from: null,
      sourceUrl: "",
    };
    entry.plans += 1;
    if (point.checkedAt && point.checkedAt > entry.checkedAt) entry.checkedAt = point.checkedAt;
    if (!entry.sourceUrl && point.sourceUrl) entry.sourceUrl = point.sourceUrl;
    if (point.aylik > 0 && (entry.from === null || point.aylik < entry.from)) entry.from = point.aylik;
    harita.set(point.slug, entry);
  }
  return [...harita.values()]
    .filter((entry) => entry.checkedAt)
    .sort((a, b) => b.checkedAt.localeCompare(a.checkedAt) || a.name.localeCompare(b.name, "en"))
    .slice(0, limit);
}
