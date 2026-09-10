import test from "node:test";
import assert from "node:assert/strict";
import { merdiven, planEtiketi, ilkUcretliBasamak, merdivenCumlesi, type Plan } from "../src/lib/plan.ts";
import toolsData from "../src/data/tools.json" with { type: "json" };

/*
  Plan merdiveni kanit metninden AYIKLANIYOR, elle yazilmiyor. Ayiklama
  sessizce bozulabilecek tek yer: bir gun kanit cumlesi degisir, rakam
  yanlis alana duser ve sayfada yanlis fiyat yayimlanir. Bu testler
  ayiklanan her basamagin kaynagina bagli kalmasini zorunlu kilar.
*/

const arr = (Array.isArray(toolsData) ? toolsData : (toolsData as { tools: unknown[] }).tools) as {
  slug: string;
  name: string;
  planlar?: Plan[];
}[];

const planli = arr.filter((t) => (t.planlar?.length ?? 0) > 0);

test("veride plan merdiveni var", () => {
  assert.ok(planli.length >= 100, `yalnizca ${planli.length} aracta plan var`);
});

test("her basamak kaynagina bagli ve rakami kaynak cumlesinde geciyor", () => {
  for (const t of planli) {
    for (const p of t.planlar!) {
      assert.ok(p.kaynakSatiri && p.kaynakSatiri.length > 5, `${t.slug}/${p.ad}: kaynak cumlesi yok`);
      assert.ok(p.ad.trim().length >= 2, `${t.slug}: plan adi bos`);
      assert.ok(Number.isFinite(p.aylik) && p.aylik >= 0, `${t.slug}/${p.ad}: gecersiz tutar`);
      assert.ok(["kisi-basina", "sabit"].includes(p.birim), `${t.slug}/${p.ad}: gecersiz birim`);

      /* $0 basamagi rakamdan degil, satirin basindaki "Free" plan
         adindan geliyor (bkz. scripts/plan-merdiveni.mjs) -- dolayisiyla
         onun kaniti rakam degil, o kelimenin kendisi. */
      if (p.aylik === 0) {
        assert.match(
          p.kaynakSatiri,
          /^Free\b|\$\s?0/,
          `${t.slug}/${p.ad}: ucretsiz basamak kaynak cumlesiyle dogrulanmiyor`
        );
        continue;
      }

      /* Rakam kaynak cumlesinde GERCEKTEN yaziyor mu? Ayiklamanin
         uydurmadigini garanti eden tek kontrol bu. */
      const yalin = String(p.aylik);
      const binlikli = p.aylik.toLocaleString("en-US");
      const ondalikli = p.aylik.toFixed(2);
      assert.ok(
        p.kaynakSatiri.includes(yalin) ||
          p.kaynakSatiri.includes(binlikli) ||
          p.kaynakSatiri.includes(ondalikli),
        `${t.slug}/${p.ad}: $${p.aylik} kaynak cumlesinde gecmiyor -> ${p.kaynakSatiri.slice(0, 90)}`
      );
    }
  }
});

test("merdiven sirali doner", () => {
  for (const t of planli) {
    const m = merdiven(t as never);
    for (let i = 1; i < m.length; i++) assert.ok(m[i].aylik >= m[i - 1].aylik, `${t.slug}: sirasiz`);
  }
});

test("ilkUcretliBasamak $0 plani atlar", () => {
  const sahte = {
    name: "X",
    slug: "x",
    planlar: [
      { ad: "Free", aylik: 0, birim: "sabit", faturalama: null, kaynakSatiri: "Free $0/mo", kaynakUrl: null },
      { ad: "Pro", aylik: 12, birim: "sabit", faturalama: null, kaynakSatiri: "Pro $12/mo", kaynakUrl: null },
    ] as Plan[],
  };
  assert.equal(ilkUcretliBasamak(sahte)?.ad, "Pro");
});

test("birimler farkliysa kiyas yapilmaz, fark soylenir", () => {
  const a = {
    name: "A", slug: "a",
    planlar: [{ ad: "Pro", aylik: 15, birim: "kisi-basina", faturalama: null, kaynakSatiri: "Pro $15/user/mo", kaynakUrl: null }] as Plan[],
  };
  const b = {
    name: "B", slug: "b",
    planlar: [{ ad: "Basic", aylik: 16, birim: "sabit", faturalama: null, kaynakSatiri: "Basic $16/mo", kaynakUrl: null }] as Plan[],
  };
  const c = merdivenCumlesi(a, b)!;
  assert.match(c, /not priced the same way/);
  assert.doesNotMatch(c, /cheaper first paid step/);
});

test("tek taraf merdivensizse cumle uretilmez", () => {
  const a = { name: "A", slug: "a", planlar: [] as Plan[] };
  const b = {
    name: "B", slug: "b",
    planlar: [{ ad: "Basic", aylik: 16, birim: "sabit", faturalama: null, kaynakSatiri: "Basic $16/mo", kaynakUrl: null }] as Plan[],
  };
  assert.equal(merdivenCumlesi(a, b), null);
});

test("planEtiketi birimi ve faturalamayi yazar", () => {
  assert.equal(
    planEtiketi({ ad: "Pro", aylik: 15, birim: "kisi-basina", faturalama: "yillik", kaynakSatiri: "", kaynakUrl: null }),
    "$15/user/mo billed annually"
  );
  assert.equal(
    planEtiketi({ ad: "Free", aylik: 0, birim: "sabit", faturalama: null, kaynakSatiri: "", kaynakUrl: null }),
    "$0/mo"
  );
});
