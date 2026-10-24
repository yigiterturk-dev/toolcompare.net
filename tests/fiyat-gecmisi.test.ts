import test from "node:test";
import assert from "node:assert/strict";
import toolsData from "../src/data/tools.json" with { type: "json" };
import {
  enSonKontroller,
  farklariHesapla,
  fiyatGecmisi,
  gecmisOzeti,
  planlariTopla,
  type PlanPoint,
} from "../src/lib/fiyat-gecmisi.ts";

const point = (over: Partial<PlanPoint> = {}): PlanPoint => ({
  slug: "alpha",
  name: "Alpha",
  plan: "Pro",
  aylik: 10,
  birim: "kisi-basina",
  faturalama: "aylik",
  checkedAt: "2026-09-16",
  sourceUrl: "https://alpha.example/pricing",
  ...over,
});

test("fiyat artisi, indirimi, plan ekleme/silme ve sart degisikligi ayri ayri kaydedilir", () => {
  const previous = [
    point(),
    point({ slug: "beta", name: "Beta", plan: "Flat", aylik: 49, birim: "sabit", faturalama: null }),
    point({ slug: "gamma", name: "Gamma", plan: "Old", aylik: 5, birim: "sabit", faturalama: null }),
    point({ slug: "delta", name: "Delta", plan: "Terms", aylik: 20, birim: "sabit", faturalama: "aylik" }),
  ];
  const current = [
    point({ aylik: 12 }),
    point({ slug: "beta", name: "Beta", plan: "Flat", aylik: 39, birim: "sabit", faturalama: null }),
    point({ slug: "delta", name: "Delta", plan: "Terms", aylik: 20, birim: "kisi-basina", faturalama: "yillik" }),
    point({ slug: "epsilon", name: "Epsilon", plan: "New", aylik: 7, birim: "sabit", faturalama: null }),
  ];

  const changes = farklariHesapla(previous, current, "2026-10-24");
  const byType = (type: string) => changes.filter((change) => change.type === type);

  assert.equal(byType("price-up").length, 1);
  assert.equal(byType("price-down").length, 1);
  assert.equal(byType("plan-removed").length, 1);
  assert.equal(byType("plan-added").length, 1);
  assert.equal(byType("terms-changed").length, 1);

  const up = byType("price-up")[0];
  assert.equal(up.from, 10);
  assert.equal(up.to, 12);
  assert.equal(up.deltaPct, 20);
  assert.equal(up.at, "2026-10-24");

  const down = byType("price-down")[0];
  assert.equal(down.deltaPct, -20.4);
  assert.equal(down.name, "Beta");

  const removed = byType("plan-removed")[0];
  assert.equal(removed.slug, "gamma");
  assert.equal(removed.to, null);

  const added = byType("plan-added")[0];
  assert.equal(added.slug, "epsilon");
  assert.equal(added.from, null);

  const terms = byType("terms-changed")[0];
  assert.equal(terms.fromBirim, "sabit");
  assert.equal(terms.toBirim, "kisi-basina");
  assert.equal(terms.toFaturalama, "yillik");
});

test("degisiklik yoksa kayit uretilmez", () => {
  const points = [point(), point({ slug: "beta", plan: "Flat", aylik: 49, birim: "sabit" })];
  assert.deepEqual(farklariHesapla(points, points, "2026-10-24"), []);
});

test("planlariTopla gecersiz planlari atar, tekillestirir ve siralar", () => {
  const tools = [
    {
      slug: "beta",
      name: "Beta",
      planlar: [
        { ad: "B", aylik: 5, birim: "sabit", faturalama: null },
        { ad: "A", aylik: 3, birim: "sabit", faturalama: null },
      ],
    },
    {
      slug: "alpha",
      name: "Alpha",
      planlar: [
        { ad: "Pro", aylik: 10, birim: "kisi-basina", faturalama: "aylik" },
        { ad: "Pro", aylik: 999, birim: "kisi-basina", faturalama: "aylik" },
        { ad: "Bad", aylik: Number.NaN, birim: "sabit", faturalama: null },
        { ad: "Negative", aylik: -1, birim: "sabit", faturalama: null },
      ],
    },
  ];
  const points = planlariTopla(tools as never);
  assert.deepEqual(
    points.map((entry) => `${entry.slug}/${entry.plan}`),
    ["alpha/Pro", "beta/A", "beta/B"],
  );
  assert.equal(points[0].aylik, 10, "ayni plan adinin ilk kaydi korunmali");
});

test("veri dosyasi tutarli: plan anahtarlari tekil, sayilar gecerli", () => {
  const gecmis = fiyatGecmisi();
  assert.equal(gecmis.version, 1);
  assert.ok(gecmis.sonKontrol);

  const keys = new Set<string>();
  for (const point of gecmis.baseline) {
    const key = `${point.slug}\u0000${point.plan}`;
    assert.equal(keys.has(key), false, `tekrarlanan plan: ${key}`);
    keys.add(key);
    assert.ok(point.name && point.plan);
    assert.ok(Number.isFinite(point.aylik) && point.aylik >= 0);
    assert.ok(["kisi-basina", "sabit"].includes(point.birim));
  }

  for (const change of gecmis.changes) {
    assert.ok(["price-up", "price-down", "plan-added", "plan-removed", "terms-changed"].includes(change.type));
    assert.match(change.at, /^\d{4}-\d{2}-\d{2}$/);
  }
});

test("ozet ve son kontroller baseline ile uyumlu", () => {
  const gecmis = fiyatGecmisi();
  const ozet = gecmisOzeti();
  assert.equal(ozet.plans, gecmis.baseline.length);
  assert.equal(ozet.tools, new Set(gecmis.baseline.map((point) => point.slug)).size);
  assert.ok(ozet.tools >= 150);

  const kontroller = enSonKontroller(10);
  assert.ok(kontroller.length > 0 && kontroller.length <= 10);
  for (let i = 1; i < kontroller.length; i += 1) {
    assert.ok(kontroller[i - 1].checkedAt >= kontroller[i].checkedAt, "kontroller tarihe gore sirali degil");
  }
});

test("baseline tools.json ile senkron; fiyat degistiyse snapshot calistirilmali", () => {
  const expected = planlariTopla(toolsData as never);
  assert.deepEqual(
    fiyatGecmisi().baseline,
    expected,
    "tools.json degisti -> npm run fiyat:gecmis ile gecmisi guncelle",
  );
});
