import type { Arac } from "./arac.ts";
import type { Plan } from "./plan.ts";
import { aracIndekslenir } from "./indeks.ts";
import { islevi } from "./islev.ts";
import type { StackAlternative } from "./stack.ts";

type Entry = { tool: Arac; plan: Plan };

/*
  "Bu stack'te daha ucuz secenek" onerisi. Iki sart:
  1) ayni isi gormek (islevi) -- aksi halde oneri karsilastirma degil,
     rastgele bir arac olur;
  2) hedef sayfa indekslenebilir olmak -- noindex bir araca link/tik
     vermek, link sizintisi kuralinin tersi.

  Fiyatlar yalnizca ayni birimde kiyaslanir: koltuk basina bir rakamla
  sabit bir rakam, tek koltukta kiyaslanabilir ama 50 kiside degil.
*/
export function stackAlternatifleri(tools: readonly Arac[]): Record<string, StackAlternative[]> {
  const gruplar = new Map<string, Entry[]>();

  for (const tool of tools) {
    if (!aracIndekslenir(tool)) continue;
    /* stackAraclari ile ayni tekillestirme: ayni plan adi iki kez gelirse
       ILK kayit gecer. Aksi halde onerideki plan adi, hedef aracin
       sayfasinda baska bir fiyata cozulur. */
    const planlar = new Map<string, Plan>();
    for (const entry of tool.planlar ?? []) {
      if (!entry.ad || !Number.isFinite(entry.aylik) || entry.aylik < 0) continue;
      if (!planlar.has(entry.ad)) planlar.set(entry.ad, entry);
    }
    const plan = [...planlar.values()]
      .filter((entry) => entry.aylik > 0)
      .sort((a, b) => a.aylik - b.aylik)[0];
    if (!plan) continue;
    const islev = islevi(tool.slug);
    if (!islev) continue;
    const liste = gruplar.get(islev) ?? [];
    liste.push({ tool, plan });
    gruplar.set(islev, liste);
  }

  const sonuc: Record<string, StackAlternative[]> = {};
  for (const liste of gruplar.values()) {
    for (const { tool, plan } of liste) {
      const alternatifler = liste
        .filter(
          (entry) =>
            entry.tool.slug !== tool.slug &&
            entry.plan.birim === plan.birim &&
            entry.plan.aylik < plan.aylik,
        )
        .sort((a, b) => a.plan.aylik - b.plan.aylik || a.tool.name.localeCompare(b.tool.name, "en"))
        .slice(0, 3)
        .map((entry) => ({
          slug: entry.tool.slug,
          name: entry.tool.name,
          plan: entry.plan.ad,
          aylik: entry.plan.aylik,
          birim: entry.plan.birim,
        }));
      if (alternatifler.length) sonuc[tool.slug] = alternatifler;
    }
  }

  return sonuc;
}
