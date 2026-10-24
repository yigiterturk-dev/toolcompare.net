import type { Arac } from "./arac.ts";
import type { Plan } from "./plan.ts";

export const MAX_STACK_ITEMS = 20;
export const MAX_SEATS = 2000;

export type StackPlan = Pick<Plan, "ad" | "aylik" | "birim" | "faturalama" | "kontrolTarihi">;

export type StackTool = {
  slug: string;
  name: string;
  category: string;
  plans: StackPlan[];
};

export type StackItem = {
  slug: string;
  plan: string;
  seats: number;
};

export type StackLine = StackItem & {
  name: string;
  unit: Plan["birim"];
  billing: Plan["faturalama"];
  planLabel: string;
  monthly: number;
  annual: number;
  checkedAt?: string;
};

export type StackTotals = {
  monthly: number;
  annual: number;
  seats: number;
  flatPlans: number;
  yearlyPlans: number;
  lines: StackLine[];
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function clampSeats(value: number | string): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return 1;
  return Math.min(MAX_SEATS, Math.max(1, Math.trunc(number)));
}

export function stackPlanLabel(plan: StackPlan): string {
  const amount = plan.aylik === 0 ? "$0" : `$${plan.aylik.toLocaleString("en-US")}`;
  const unit = plan.birim === "kisi-basina" ? "/user/mo" : "/mo";
  const billing =
    plan.faturalama === "yillik" ? " billed annually" : plan.faturalama === "aylik" ? " billed monthly" : "";
  return `${plan.ad} — ${amount}${unit}${billing}`;
}

/*
  Hesaplayiciya yalnizca plan merdiveni OLAN araclar girer. 300'den fazla
  kayitta plan verisi yok; oraya tahmini fiyat koymak sitenin "uydurma
  fiyat yayinlamiyoruz" sozunu bozardi. Plan varsa rakam da kaynak
  cumlesiyle birlikte geliyor (bkz. plan.ts).
*/
export function stackAraclari(tools: readonly Arac[]): StackTool[] {
  return tools
    .map((tool) => {
      const plans = new Map<string, StackPlan>();
      for (const plan of tool.planlar ?? []) {
        if (!plan.ad || !Number.isFinite(plan.aylik) || plan.aylik < 0) continue;
        if (!plans.has(plan.ad)) plans.set(plan.ad, plan);
      }
      const sorted = [...plans.values()].sort((a, b) => a.aylik - b.aylik || a.ad.localeCompare(b.ad));
      return { slug: tool.slug, name: tool.name, category: tool.category, plans: sorted };
    })
    .filter((tool) => tool.plans.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "en"));
}

/** Yeni eklenen aracin varsayilani: en ucuz UCRETLI basamak, yoksa ilk basamak. */
export function defaultPlan(tool: StackTool): StackPlan | null {
  return tool.plans.find((plan) => plan.aylik > 0) ?? tool.plans[0] ?? null;
}

export function planMonthly(plan: StackPlan, seats: number | string = 1): number {
  const count = plan.birim === "kisi-basina" ? clampSeats(seats) : 1;
  return round2(plan.aylik * count);
}

export function stackTotals(tools: readonly StackTool[], items: readonly StackItem[]): StackTotals {
  const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
  const seen = new Set<string>();
  const lines: StackLine[] = [];
  let seats = 0;
  let flatPlans = 0;
  let yearlyPlans = 0;

  for (const item of items) {
    if (seen.has(item.slug)) continue;
    seen.add(item.slug);

    const tool = bySlug.get(item.slug);
    if (!tool) continue;
    const plan = tool.plans.find((entry) => entry.ad === item.plan);
    if (!plan) continue;

    const seatCount = plan.birim === "kisi-basina" ? clampSeats(item.seats) : 1;
    const monthly = planMonthly(plan, seatCount);
    if (plan.birim === "kisi-basina") seats += seatCount;
    else flatPlans += 1;
    if (plan.faturalama === "yillik") yearlyPlans += 1;

    lines.push({
      slug: item.slug,
      plan: item.plan,
      seats: seatCount,
      name: tool.name,
      unit: plan.birim,
      billing: plan.faturalama,
      planLabel: stackPlanLabel(plan),
      monthly,
      annual: round2(monthly * 12),
      checkedAt: plan.kontrolTarihi,
    });
  }

  lines.sort((a, b) => b.monthly - a.monthly || a.name.localeCompare(b.name, "en"));
  const monthly = round2(lines.reduce((total, line) => total + line.monthly, 0));

  return { monthly, annual: round2(monthly * 12), seats, flatPlans, yearlyPlans, lines };
}

/*
  Paylasilabilir URL bicimi: `slug~plan~seats` ucluleri, virgulle ayrilmis.
  Parcalar encodeURIComponent ile kaciriliyor; aksi halde plan adindaki
  virgul veya tilde ayiriciyi bozuyordu. Cozucu bilinmeyen araci/plani
  sessizce atar, URL elle kurcalanmissa hesaplayici cokmez.
*/
export function serializeStack(items: readonly StackItem[]): string {
  return items
    .slice(0, MAX_STACK_ITEMS)
    .map((item) =>
      [item.slug, item.plan, String(clampSeats(item.seats))]
        .map((part) => encodeURIComponent(part).replace(/~/g, "%7E"))
        .join("~"),
    )
    .join(",");
}

export function parseStack(value: string | null | undefined, tools: readonly StackTool[]): StackItem[] {
  if (!value) return [];
  const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
  const out: StackItem[] = [];
  const seen = new Set<string>();

  for (const part of String(value).split(",")) {
    if (out.length >= MAX_STACK_ITEMS) break;
    const [slugRaw, planRaw, seatsRaw] = part.split("~");
    if (!slugRaw || !planRaw) continue;

    let slug: string;
    let plan: string;
    try {
      slug = decodeURIComponent(slugRaw);
      plan = decodeURIComponent(planRaw);
    } catch {
      continue;
    }

    const tool = bySlug.get(slug);
    if (!tool || !tool.plans.some((entry) => entry.ad === plan)) continue;
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push({ slug, plan, seats: clampSeats(seatsRaw ?? 1) });
  }

  return out;
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Stack'i finans ekibine verilecek CSV'ye cevirir; para birimi USD. */
export function stackCsv(totals: StackTotals): string {
  const rows: (string | number)[][] = [
    ["tool", "plan", "billing_unit", "seats", "monthly_usd", "annual_usd", "price_checked"],
    ...totals.lines.map((line) => [
      line.name,
      line.plan,
      line.unit === "kisi-basina" ? "per_user" : "flat",
      line.seats,
      line.monthly,
      line.annual,
      line.checkedAt ?? "",
    ]),
  ];
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\n")}\n`;
}

export function stackUrl(items: readonly StackItem[]): string {
  const encoded = serializeStack(items);
  return encoded ? `/stack?s=${encoded}` : "/stack";
}
