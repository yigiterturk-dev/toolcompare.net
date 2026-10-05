import type { Arac } from "./arac.ts";
import { incelenmis, fiyatiDogrulanmis } from "./indeks.ts";

/*
  Saticiya verilen gomulebilir rozet ("Pricing verified by ToolCompare").

  NEDEN (2026-10-05): on-page bitti, GSC'de gosterimlerin %97'si 21. siranin
  altinda; eksik olan dis baglanti. Tanidik yok, Show HN tutmadi. Elimizdeki
  tek hazir iliski 512 saticinin kendisi: fiyatini dogruladigimiz saticiya
  sitesine koyabilecegi bir rozet veriyoruz, rozet bize link veriyor.

  DURUSTLUK KURALI: rozet yalnizca sayfamizda gercekten dogruladigimiz bir
  fiyat varsa verilir (incelenmis + fiyatiDogrulanmis + okuma tarihi) ve
  uzerinde fiyatin OKUNDUGU AY yazar. "Best tool" ya da puan yazmaz --
  site "uydurma puan yok" diyor, rozet de demiyor.

  Rozet bir kez gomulduktan sonra kosul bozulursa (satici fiyati kaldirdi,
  kanit dustu) endpoint 404 donmez: saticinin sitesinde kirik gorsel
  birakmak yerine notr "Listed on ToolCompare" rozetine duser.
*/

const SITE = "https://toolcompare.net";
const AYLAR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Fiyatin okundugu en son tarih: kaynaklarin checkedAt'i, yoksa reviewedAt. */
export function okumaTarihi(t: Arac): string | null {
  const tarihler = [
    ...(t.evidence?.sources ?? []).map((s) => s.checkedAt),
    t.evidence?.reviewedAt,
  ].filter((d): d is string => typeof d === "string" && /^\d{4}-\d{2}-\d{2}/.test(d));
  if (!tarihler.length) return null;
  return tarihler.sort().at(-1)!.slice(0, 10);
}

export function rozetUygun(t?: Arac): t is Arac {
  return Boolean(t) && incelenmis(t) && fiyatiDogrulanmis(t) && okumaTarihi(t!) !== null;
}

function ayEtiketi(iso: string): string {
  const [y, m] = iso.split("-");
  return `${AYLAR[Number(m) - 1]} ${y}`;
}

function kacis(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* Verdana 11px icin yaklasik karakter genisligi; shields.io ile ayni yaklasim. */
const genislik = (s: string) => Math.round(s.length * 6.6) + 20;

export const ROZET_YUKSEKLIK = 28;

export function rozetMetni(t: Arac): { sol: string; sag: string } {
  if (!rozetUygun(t)) return { sol: "ToolCompare", sag: "Listed" };
  return { sol: "ToolCompare", sag: `Pricing verified · ${ayEtiketi(okumaTarihi(t)!)}` };
}

export function rozetGenisligi(t: Arac): number {
  const { sol, sag } = rozetMetni(t);
  return genislik(sol) + genislik(sag);
}

export function rozetSvg(t: Arac): string {
  const { sol, sag } = rozetMetni(t);
  const a = genislik(sol);
  const b = genislik(sag);
  const w = a + b;
  const h = ROZET_YUKSEKLIK;
  const etiket = kacis(`${t.name}: ${sol} — ${sag}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${etiket}"><title>${etiket}</title><clipPath id="r"><rect width="${w}" height="${h}" rx="5"/></clipPath><g clip-path="url(#r)"><rect width="${a}" height="${h}" fill="#1B2633"/><rect x="${a}" width="${b}" height="${h}" fill="${rozetUygun(t) ? "#0A63E6" : "#5B6675"}"/></g><g fill="#fff" font-family="Verdana,DejaVu Sans,Geneva,sans-serif" font-size="11" text-anchor="middle"><text x="${a / 2}" y="18" font-weight="bold">${kacis(sol)}</text><text x="${a + b / 2}" y="18">${kacis(sag)}</text></g></svg>`;
}

/** Saticinin sitesine yapistiracagi HTML. Link aracin kendi sayfasina gider. */
export function rozetKodu(t: Arac): string {
  const alt = kacis(`${t.name} pricing verified by ToolCompare`);
  return `<a href="${SITE}/tools/${t.slug}" title="${kacis(`${t.name} pricing on ToolCompare`)}"><img src="${SITE}/api/badge/${t.slug}" alt="${alt}" width="${rozetGenisligi(t)}" height="${ROZET_YUKSEKLIK}"></a>`;
}

/** Markdown (README, GitHub) icin. */
export function rozetMarkdown(t: Arac): string {
  return `[![${t.name} pricing verified by ToolCompare](${SITE}/api/badge/${t.slug})](${SITE}/tools/${t.slug})`;
}
