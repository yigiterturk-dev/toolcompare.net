/**
 * Haftalik GSC ozeti: son 28 gun vs onceki 28 gun, en iyi sayfalar ve
 * firsat sayaci. Telegram'a gonderir, JSON'u /opt/toolcompare-data'ya yazar.
 * Servis hesabi ve Telegram bilgileri root-only dosyalarda durur; script
 * hicbir sirri stdout'a basmaz.
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";

const KEY_PATH = process.env.GSC_KEY_FILE || "/etc/toolcompare-gsc/service-account.json";
const PROPERTY = process.env.GSC_SITE_URL || "sc-domain:toolcompare.net";
const OUT_DIR = process.env.TOOLCOMPARE_DATA_DIR || "/opt/toolcompare-data";

const key = JSON.parse(await readFile(KEY_PATH, "utf8")) as {
  client_email: string;
  private_key: string;
};
process.env.GSC_CLIENT_EMAIL = key.client_email;
process.env.GSC_PRIVATE_KEY = key.private_key;
process.env.GSC_SITE_URL = PROPERTY;

const { getAccessToken } = await import("../src/lib/gsc.ts");
const token = await getAccessToken();

const gun = 86400000;
const end = new Date(Date.now() - 2 * gun);
const start = new Date(end.getTime() - 55 * gun);
const last28Start = new Date(end.getTime() - 27 * gun);
const prev28End = new Date(last28Start.getTime() - gun);
const iso = (date: Date) => date.toISOString().slice(0, 10);

async function query(dimensions: string[], startDate: string, endDate: string, rowLimit = 200) {
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(PROPERTY)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ startDate, endDate, dimensions, rowLimit }),
      signal: AbortSignal.timeout(30000),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`GSC ${res.status}: ${(data as { error?: { message?: string } }).error?.message || "?"}`);
  return ((data as { rows?: { keys: string[]; clicks?: number; impressions?: number; position?: number }[] }).rows || []);
}

const daily = await query(["date"], iso(start), iso(end), 100);
const pages = await query(["page"], iso(last28Start), iso(end), 200);

const toplam = (from: string, to: string) =>
  daily
    .filter((row) => row.keys[0] >= from && row.keys[0] <= to)
    .reduce((acc, row) => ({ i: acc.i + (row.impressions || 0), c: acc.c + (row.clicks || 0) }), { i: 0, c: 0 });

const son = toplam(iso(last28Start), iso(end));
const onceki = toplam(iso(start), iso(prev28End));
const yuzde = onceki.i > 0 ? Math.round(((son.i - onceki.i) / onceki.i) * 1000) / 10 : null;

const sirali = [...pages].sort((a, b) => (b.impressions || 0) - (a.impressions || 0));
const firsat = pages.filter(
  (row) => (row.position || 0) >= 4 && (row.position || 0) <= 20 && (row.impressions || 0) >= 20 && (row.clicks || 0) === 0,
);
const nf = new Intl.NumberFormat("tr-TR");
const kisa = (url: string) => url.replace(/^https?:\/\/[^/]+/, "") || "/";
const satirlar = [
  "ToolCompare haftalik GSC",
  `Son 28 gun: ${nf.format(son.i)} gosterim / ${nf.format(son.c)} tik`,
  `Onceki 28: ${nf.format(onceki.i)} gosterim / ${nf.format(onceki.c)} tik`,
  yuzde === null ? "Karsilastirma yok" : `Gosterim degisimi: ${yuzde > 0 ? "+" : ""}${yuzde}%`,
  "",
  "En cok gosterim alan sayfalar:",
  ...sirali.slice(0, 5).map((row) => `${kisa(row.keys[0])} — ${nf.format(row.impressions || 0)} gosterim / ${nf.format(row.clicks || 0)} tik`),
  "",
  `Firsat (4-20. sira, tik yok): ${firsat.length} sayfa`,
];

const rapor = {
  fetchedAt: new Date().toISOString(),
  range: { start: iso(start), end: iso(end) },
  last28: son,
  previous28: onceki,
  impressionsDeltaPct: yuzde,
  topPages: sirali.slice(0, 10).map((row) => ({
    page: kisa(row.keys[0]),
    impressions: row.impressions || 0,
    clicks: row.clicks || 0,
    position: row.position || 0,
  })),
  opportunities: firsat.map((row) => ({
    page: kisa(row.keys[0]),
    impressions: row.impressions || 0,
    position: row.position || 0,
  })),
};

await mkdir(OUT_DIR, { recursive: true });
await writeFile(`${OUT_DIR}/gsc-haftalik.json`, `${JSON.stringify(rapor, null, 2)}\n`, "utf8");

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
if (botToken && chatId) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ chat_id: chatId, text: satirlar.join("\n") }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) console.error(`Telegram gonderilemedi: HTTP ${res.status}`);
} else {
  console.log("Telegram env yok; rapor dosyaya yazildi.");
}

console.log(satirlar.join("\n"));
