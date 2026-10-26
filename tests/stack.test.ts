import test from "node:test";
import assert from "node:assert/strict";
import toolsData from "../src/data/tools.json" with { type: "json" };
import {
  MAX_STACK_ITEMS,
  clampSeats,
  defaultPlan,
  parseStack,
  planMonthly,
  serializeStack,
  stackCsv,
  enUcuzStackPlani,
  stackAraclari,
  stackPlanlari,
  stackTotals,
  stackUrl,
  type StackTool,
} from "../src/lib/stack.ts";

const TOOLS: StackTool[] = [
  {
    slug: "alpha",
    name: "Alpha",
    category: "crm",
    plans: [
      { ad: "Free", aylik: 0, birim: "sabit", faturalama: null },
      { ad: "Pro", aylik: 10, birim: "kisi-basina", faturalama: "aylik", kontrolTarihi: "2026-09-10" },
      { ad: "Annual", aylik: 96, birim: "sabit", faturalama: "yillik", kontrolTarihi: "2026-09-11" },
    ],
  },
  {
    slug: "beta",
    name: "Beta",
    category: "analytics",
    plans: [{ ad: "Team, plan~x", aylik: 49, birim: "sabit", faturalama: null }],
  },
];

test("koltuk basina fiyat koltukla carpilir, sabit fiyat carpilmaz", () => {
  const pro = TOOLS[0].plans.find((plan) => plan.ad === "Pro")!;
  const annual = TOOLS[0].plans.find((plan) => plan.ad === "Annual")!;
  assert.equal(planMonthly(pro, 3), 30);
  assert.equal(planMonthly(annual, 9), 96);
  assert.equal(planMonthly(pro, 0), 10);
  assert.equal(clampSeats(-4), 1);
});

test("toplam aylik ve yillik maliyet dogru hesaplanir", () => {
  const totals = stackTotals(TOOLS, [
    { slug: "alpha", plan: "Pro", seats: 3 },
    { slug: "beta", plan: "Team, plan~x", seats: 1 },
  ]);
  assert.equal(totals.monthly, 79);
  assert.equal(totals.annual, 948);
  assert.equal(totals.seats, 3);
  assert.equal(totals.flatPlans, 1);
  assert.equal(totals.yearlyPlans, 0);
  assert.deepEqual(totals.lines.map((line) => line.slug), ["beta", "alpha"]);
});

test("yillik faturalanan plan sayilir", () => {
  const totals = stackTotals(TOOLS, [{ slug: "alpha", plan: "Annual", seats: 5 }]);
  assert.equal(totals.monthly, 96);
  assert.equal(totals.yearlyPlans, 1);
  assert.equal(totals.seats, 0);
  assert.equal(totals.flatPlans, 1);
});

test("ayni arac iki kez eklenirse tek satir sayilir", () => {
  const totals = stackTotals(TOOLS, [
    { slug: "alpha", plan: "Pro", seats: 2 },
    { slug: "alpha", plan: "Annual", seats: 9 },
  ]);
  assert.equal(totals.lines.length, 1);
  assert.equal(totals.monthly, 20);
});

test("paylasim URL'si plan adindaki virgul ve tilde ile bozulmaz", () => {
  const items = [
    { slug: "alpha", plan: "Pro", seats: 4 },
    { slug: "beta", plan: "Team, plan~x", seats: 1 },
  ];
  const encoded = serializeStack(items);
  assert.equal(encoded.includes(","), true);
  assert.deepEqual(parseStack(encoded, TOOLS), items);
  assert.equal(stackUrl(items), `/stack?s=${encoded}`);
  assert.equal(stackUrl([]), "/stack");
});

test("bozuk URL parcalari sessizce atilir, koltuk sinirlanir", () => {
  const value = "bilinmeyen~plan~2,alpha~olmayan-plan~2,alpha~Pro~999999,beta~Team%2C%20plan%7Ex~-3";
  const parsed = parseStack(value, TOOLS);
  assert.deepEqual(parsed, [
    { slug: "alpha", plan: "Pro", seats: 2000 },
    { slug: "beta", plan: "Team, plan~x", seats: 1 },
  ]);
});

test("yiginda en fazla yirmi arac tutulur", () => {
  const many = Array.from({ length: MAX_STACK_ITEMS + 5 }, (_, index) => ({
    slug: `tool-${index}`,
    plan: "Pro",
  }));
  assert.equal(serializeStack(many.map((m) => ({ ...m, seats: 1 }))).split(",").length, MAX_STACK_ITEMS);
});

test("varsayilan plan ucretsiz basamak degil, en ucuz ucretli basamak", () => {
  assert.equal(defaultPlan(TOOLS[0])?.ad, "Pro");
  assert.equal(defaultPlan({ ...TOOLS[0], plans: [TOOLS[0].plans[0]] })?.ad, "Free");
});

test("gercek katalogdaki planlar hesap icin gecerli", () => {
  const tools = stackAraclari(toolsData as never);
  assert.ok(tools.length >= 150, `yalnizca ${tools.length} arac hesaba giriyor`);
  for (const tool of tools) {
    assert.ok(tool.plans.length > 0);
    for (const plan of tool.plans) {
      assert.ok(plan.ad.length > 1);
      assert.ok(Number.isFinite(plan.aylik) && plan.aylik >= 0);
      assert.ok(["kisi-basina", "sabit"].includes(plan.birim));
    }
  }
});

test("CSV ciktisi basliklari, koltuk ve kacis kurallarini tasir", () => {
  const totals = stackTotals(TOOLS, [
    { slug: "alpha", plan: "Pro", seats: 3 },
    { slug: "beta", plan: "Team, plan~x", seats: 1 },
  ]);
  const csv = stackCsv(totals);
  const lines = csv.trim().split("\n");
  assert.equal(lines[0], "tool,plan,billing_unit,seats,monthly_usd,annual_usd,price_checked");
  assert.match(csv, /Alpha,Pro,per_user,3,30,360,2026-09-10/);
  assert.match(csv, /"Team, plan~x"/);
});

test("plan merdiveni olmayan dogrulanmis fiyat tek basamak olarak girer", () => {
  const tools = stackAraclari(toolsData as never);
  assert.ok(tools.length >= 270, `hesaplayici yalnizca ${tools.length} arac iceriyor`);

  const chatgpt = tools.find((tool) => tool.slug === "chatgpt");
  assert.ok(chatgpt, "chatgpt hesaplayicida yok");
  assert.equal(chatgpt.plans[0].ad, "Starting price");
  assert.equal(chatgpt.plans[0].aylik, 20);
  assert.equal(chatgpt.plans[0].birim, "sabit");

  const monday = tools.find((tool) => tool.slug === "monday");
  assert.ok(monday, "monday hesaplayicida yok");
  assert.equal(monday.plans[0].aylik, 9);
  assert.equal(monday.plans[0].birim, "kisi-basina");
});

test("enUcuzStackPlani plan merdiveni yoksa baslangic fiyatina duser", () => {
  const chatgpt = (toolsData as never[]).find((tool) => (tool as { slug: string }).slug === "chatgpt") as never;
  const notion = (toolsData as never[]).find((tool) => (tool as { slug: string }).slug === "notion") as never;
  const chatgptPlan = enUcuzStackPlani(chatgpt);
  assert.ok(chatgptPlan);
  assert.equal(chatgptPlan.ad, "Starting price");
  assert.equal(chatgptPlan.aylik, 20);
  const notionPlan = enUcuzStackPlani(notion);
  assert.ok(notionPlan);
  assert.equal(notionPlan.ad, "Business");
});
