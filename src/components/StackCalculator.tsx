"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import { Plus, Search, Share2, Trash2 } from "lucide-react";
import {
  MAX_SEATS,
  MAX_STACK_ITEMS,
  clampSeats,
  defaultPlan,
  parseStack,
  serializeStack,
  stackCsv,
  stackPlanLabel,
  stackTotals,
  type StackItem,
  type StackTool,
} from "@/lib/stack";

const STORAGE_KEY = "toolcompare.stack.v1";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

function checkedLabel(value?: string) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function StackCalculator({ tools }: { tools: StackTool[] }) {
  const [items, setItems] = useState<StackItem[]>([]);
  const [query, setQuery] = useState("");
  const [ready, setReady] = useState(false);
  const [copied, setCopied] = useState(false);

  /*
    Paylasilan URL her zaman kazanir; yoksa bu tarayicida kaldigi yerden
    devam edilir. Ikisi de ayni cozucuden gecer: elle kurcalanmis bir `?s=`
    degeri hesaplayiciyi cokertmez, bilinmeyen arac/plan sessizce duser.
  */
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("s");
    let initial = parseStack(param, tools);
    if (!initial.length) {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) initial = parseStack(stored, tools);
      } catch {
        initial = [];
      }
    }
    startTransition(() => {
      setItems(initial);
      setReady(true);
    });
  }, [tools]);

  useEffect(() => {
    if (!ready) return;
    const encoded = serializeStack(items);
    window.history.replaceState(null, "", encoded ? `/stack?s=${encoded}` : "/stack");
    try {
      window.localStorage.setItem(STORAGE_KEY, encoded);
    } catch {
      return;
    }
  }, [items, ready]);

  const selected = useMemo(() => new Set(items.map((item) => item.slug)), [items]);
  const bySlug = useMemo(() => new Map(tools.map((tool) => [tool.slug, tool])), [tools]);
  const totals = useMemo(() => stackTotals(tools, items), [items, tools]);
  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return [];
    return tools
      .filter((tool) => !selected.has(tool.slug) && tool.name.toLowerCase().includes(term))
      .slice(0, 8);
  }, [query, selected, tools]);

  function addTool(tool: StackTool) {
    if (items.length >= MAX_STACK_ITEMS || selected.has(tool.slug)) return;
    const plan = defaultPlan(tool);
    if (!plan) return;
    setItems((current) => [...current, { slug: tool.slug, plan: plan.ad, seats: 1 }]);
    setQuery("");
  }

  function updateItem(slug: string, patch: Partial<StackItem>) {
    setItems((current) => current.map((item) => (item.slug === slug ? { ...item, ...patch } : item)));
  }

  function removeItem(slug: string) {
    setItems((current) => current.filter((item) => item.slug !== slug));
  }

  function downloadCsv() {
    if (!totals.lines.length) return;
    const blob = new Blob([stackCsv(totals)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "toolcompare-stack.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function copyLink() {
    const encoded = serializeStack(items);
    const url = `${window.location.origin}${encoded ? `/stack?s=${encoded}` : "/stack"}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <div className="mt-10 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <div className="rounded-[--radius-card] border border-line bg-surface p-4 sm:p-5">
          <label htmlFor="stack-search" className="text-sm font-medium">
            Add a tool
          </label>
          <div className="relative mt-2">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
            />
            <input
              id="stack-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search 200+ tools with a published plan price"
              autoComplete="off"
              className="w-full rounded-[--radius-control] border border-line bg-surface py-2.5 pr-3 pl-9 text-sm text-ink placeholder:text-ink-muted focus:border-line-strong focus:outline-none"
            />
          </div>

          {query.trim() && (
            <ul className="mt-2 list-none divide-y divide-line border-t border-line p-0">
              {results.length === 0 ? (
                <li className="py-3 text-sm text-ink-soft">
                  No tool matches “{query.trim()}”. Only tools with a published plan are listed.
                </li>
              ) : (
                results.map((tool) => (
                  <li key={tool.slug}>
                    <button
                      type="button"
                      onClick={() => addTool(tool)}
                      className="flex w-full items-center justify-between gap-3 py-2.5 text-left text-sm transition-colors duration-150 hover:text-accent"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink">{tool.name}</span>
                        <span className="block text-xs text-ink-muted">
                          {tool.plans.length} plans · {tool.category.replace(/-/g, " ")}
                        </span>
                      </span>
                      <Plus aria-hidden="true" className="size-4 shrink-0 text-ink-muted" />
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}

          <p className="mt-3 text-xs text-ink-muted">
            {tools.length} tools have a plan-level price we checked against the vendor&apos;s own page.
            Usage-based and unverified prices are deliberately excluded.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="mt-6 rounded-[--radius-card] border border-dashed border-line p-8 text-center">
            <p className="font-serif text-xl font-semibold">Your stack is empty</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">
              Add the tools your team pays for. Set the plan and seat count, and the monthly and annual
              total updates as you go.
            </p>
          </div>
        ) : (
          <ul className="mt-6 list-none space-y-3 p-0">
            {totals.lines.map((line) => {
              const tool = bySlug.get(line.slug);
              const item = items.find((entry) => entry.slug === line.slug);
              if (!tool || !item) return null;
              const checked = checkedLabel(line.checkedAt);
              return (
                <li
                  key={line.slug}
                  className="rounded-[--radius-card] border border-line bg-surface p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-medium text-ink">{line.name}</h3>
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {checked ? `Price checked ${checked}` : "Price check date not recorded"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(line.slug)}
                      aria-label={`Remove ${line.name}`}
                      className="shrink-0 rounded-[--radius-control] p-1.5 text-ink-muted transition-colors duration-150 hover:text-ink"
                    >
                      <Trash2 aria-hidden="true" className="size-4" />
                    </button>
                  </div>

                  <div className="mt-4 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                    <div>
                      <label htmlFor={`plan-${line.slug}`} className="block text-xs font-medium text-ink-soft">
                        Plan
                      </label>
                      <select
                        id={`plan-${line.slug}`}
                        value={item.plan}
                        onChange={(event) => updateItem(line.slug, { plan: event.target.value })}
                        className="mt-1 w-full rounded-[--radius-control] border border-line bg-surface px-2.5 py-2 text-sm text-ink focus:border-line-strong focus:outline-none"
                      >
                        {tool.plans.map((plan) => (
                          <option key={plan.ad} value={plan.ad}>
                            {stackPlanLabel(plan)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {line.unit === "kisi-basina" && (
                      <div>
                        <label htmlFor={`seats-${line.slug}`} className="block text-xs font-medium text-ink-soft">
                          Seats
                        </label>
                        <input
                          id={`seats-${line.slug}`}
                          type="number"
                          min={1}
                          max={MAX_SEATS}
                          value={item.seats}
                          onChange={(event) => updateItem(line.slug, { seats: clampSeats(event.target.value) })}
                          className="mt-1 w-24 rounded-[--radius-control] border border-line bg-surface px-2.5 py-2 text-sm text-ink tabular-nums focus:border-line-strong focus:outline-none"
                        />
                      </div>
                    )}

                    <div className="text-right">
                      <p className="text-xs text-ink-soft">Monthly</p>
                      <p className="font-serif text-xl font-semibold tabular-nums">{money.format(line.monthly)}</p>
                      <p className="text-xs text-ink-muted tabular-nums">{money.format(line.annual)}/yr</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <aside className="rounded-[--radius-card] border border-line bg-surface p-5 lg:sticky lg:top-24">
        <p className="text-sm font-medium tracking-wide text-ink-muted uppercase">Stack total</p>
        <p className="mt-2 font-serif text-4xl font-semibold tabular-nums">{money.format(totals.monthly)}</p>
        <p className="text-sm text-ink-soft">per month</p>

        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-ink-soft">Billed over a year</dt>
            <dd className="font-medium tabular-nums">{money.format(totals.annual)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-ink-soft">Tools</dt>
            <dd className="font-medium tabular-nums">{totals.lines.length}</dd>
          </div>
          {totals.seats > 0 && (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-soft">Per-seat seats</dt>
              <dd className="font-medium tabular-nums">{totals.seats}</dd>
            </div>
          )}
          {totals.yearlyPlans > 0 && (
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-soft">Annual-billed plans</dt>
              <dd className="font-medium tabular-nums">{totals.yearlyPlans}</dd>
            </div>
          )}
        </dl>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={copyLink}
            disabled={items.length === 0}
            data-tap
            className="inline-flex items-center justify-center gap-2 rounded-[--radius-control] bg-brand px-4 py-2.5 text-sm font-medium text-brand-ink transition-opacity duration-150 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Share2 aria-hidden="true" className="size-4" />
            {copied ? "Link copied" : "Copy share link"}
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={items.length === 0}
            className="rounded-[--radius-control] border border-line px-4 py-2 text-sm text-ink-soft transition-colors duration-150 hover:border-line-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            Download CSV
          </button>
          <button
            type="button"
            onClick={() => setItems([])}
            disabled={items.length === 0}
            className="rounded-[--radius-control] border border-line px-4 py-2 text-sm text-ink-soft transition-colors duration-150 hover:border-line-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear stack
          </button>
        </div>

        <p className="mt-4 text-xs text-ink-muted">
          Monthly figures are the vendor&apos;s monthly equivalent. Plans billed annually are marked in
          the plan name; the yearly total assumes twelve months at that rate. Taxes and usage-based
          charges are not included.
        </p>
        <p className="mt-2 text-xs text-ink-muted" aria-live="polite">
          Up to {MAX_STACK_ITEMS} tools. Nothing leaves your browser.
        </p>
      </aside>
    </div>
  );
}
