/*
  Rozet outreach hedef listesi: rozete uygun araclar x satici-listesi.csv,
  GSC gosterimine gore sirali. Cikti: docs/outreach/rozet-hedefleri.csv
  Calistir: npm run rozet:hedef
*/
import { readFileSync, writeFileSync } from "node:fs";
import toolsData from "../src/data/tools.json" with { type: "json" };
import gsc from "../src/data/gsc/latest.json" with { type: "json" };
import { rozetUygun, okumaTarihi } from "../src/lib/rozet.ts";
import type { Arac } from "../src/lib/arac.ts";

function csvSatir(satir: string): string[] {
  const out: string[] = [];
  let cur = "", q = false;
  for (let i = 0; i < satir.length; i++) {
    const c = satir[i];
    if (q) {
      if (c === '"' && satir[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') q = false;
      else cur += c;
    } else if (c === '"') q = true;
    else if (c === ",") { out.push(cur); cur = ""; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

const satirlar = readFileSync("docs/outreach/satici-listesi.csv", "utf8").trim().split("\n");
const baslik = csvSatir(satirlar[0]);
const satici = new Map<string, Record<string, string>>();
for (const s of satirlar.slice(1)) {
  const r = Object.fromEntries(csvSatir(s).map((v, i) => [baslik[i], v]));
  const slug = r.bizim_sayfa?.split("/tools/")[1];
  if (slug) satici.set(slug, r);
}

const gosterim = new Map<string, number>();
for (const r of (gsc as { rows: { page: string; impressions: number }[] }).rows) {
  const slug = r.page.split("/tools/")[1];
  if (slug) gosterim.set(slug, (gosterim.get(slug) ?? 0) + r.impressions);
}

const kac = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const hedefler = (toolsData as Arac[])
  .filter((t) => rozetUygun(t))
  .map((t) => {
    const s = satici.get(t.slug) ?? {};
    const mail = s.DOGRULANMIS_MAIL || "";
    const form = s.DOGRULANMIS_ILETISIM_SAYFASI || "";
    return {
      arac: t.name,
      slug: t.slug,
      gosterim: gosterim.get(t.slug) ?? 0,
      okuma: okumaTarihi(t)!,
      kanal: mail ? "mail" : form ? "form" : "teyit-gerek",
      mail,
      form,
      tahmini_mail: mail || form ? "" : s.tahmini_mail || "",
      rozet_linki: `https://toolcompare.net/tools/${t.slug}#badge`,
    };
  })
  .sort((a, b) => b.gosterim - a.gosterim || a.arac.localeCompare(b.arac));

const kolonlar = ["oncelik", "arac", "gosterim_90g", "fiyat_okuma", "kanal", "DOGRULANMIS_MAIL", "DOGRULANMIS_ILETISIM_SAYFASI", "tahmini_mail_TEYIT_ET", "rozet_linki", "durum", "not"];
const csv = [kolonlar.join(",")]
  .concat(hedefler.map((h, i) => [i + 1, h.arac, h.gosterim, h.okuma, h.kanal, h.mail, h.form, h.tahmini_mail, h.rozet_linki, "", ""].map((v) => kac(String(v))).join(",")))
  .join("\n");
writeFileSync("docs/outreach/rozet-hedefleri.csv", csv + "\n");

const say = (k: string) => hedefler.filter((h) => h.kanal === k).length;
console.log(`${hedefler.length} uygun arac · mail ${say("mail")} · form ${say("form")} · teyit-gerek ${say("teyit-gerek")}`);
console.log("ilk 30:", hedefler.slice(0, 30).map((h) => `${h.arac}(${h.gosterim},${h.kanal})`).join(", "));
