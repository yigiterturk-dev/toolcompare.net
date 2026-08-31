import { createSign } from "node:crypto";

/**
 * Google Search Console adaptoru — sifir bagimlilik.
 *
 * googleapis paketi bu is icin ~50MB bagimlilik getiriyor; ihtiyacimiz olan
 * sey tek bir imzali JWT ve iki REST cagrisi. Bu yuzden token uretimi
 * node:crypto ile elde yapiliyor, istekler fetch ile gidiyor. Next uygulamasi
 * bu dosyaya calisma aninda dokunmuyor: veri toplama scriptlerde olur,
 * uygulama yalnizca uretilen JSON'i okur.
 *
 * Kimlik bilgisi yoksa sistem cokmez: isGscConfigured() false doner ve
 * cagiran taraf ne yapacagini kendi bilir.
 */

/**
 * Yazma yetkisi de isteniyor: sitemap gondermek readonly kapsamda calismaz.
 * Servis hesabinin yapabildigi tek yazma islemi sitemap bildirimi; sıralama
 * veya icerik tarafinda hicbir sey degistiremez.
 */
const SCOPE = "https://www.googleapis.com/auth/webmasters";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://searchconsole.googleapis.com/webmasters/v3";

export function isGscConfigured(): boolean {
  return Boolean(
    process.env.GSC_CLIENT_EMAIL && process.env.GSC_PRIVATE_KEY && process.env.GSC_SITE_URL,
  );
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64")
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Servis hesabi anahtariyla imzalanmis JWT uretir ve access token'a cevirir.
 * Anahtar ortam degiskeninde tek satir olarak durur; satir sonlari \n olarak
 * tasindigi icin geri acilmasi sart, aksi halde imza gecersiz olur.
 */
export async function getAccessToken(): Promise<string> {
  const email = process.env.GSC_CLIENT_EMAIL;
  const key = (process.env.GSC_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  if (!email || !key) throw new Error("GSC kimlik bilgileri tanimli degil");

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(JSON.stringify({
    iss: email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600,
  }));
  const signature = base64url(
    createSign("RSA-SHA256").update(`${header}.${claim}`).sign(key),
  );

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claim}.${signature}`,
    }),
  });
  if (!res.ok) throw new Error(`Token alinamadi: ${res.status} ${await res.text()}`);
  return (await res.json() as { access_token: string }).access_token;
}

/**
 * Servis hesabinin erisebildigi mulkler.
 *
 * Kurulumdaki tek gercek belirsizlik bu: kod dogru olsa bile Search Console
 * panelinden servis hesabina yetki verilmediyse liste bos doner. Hatayi
 * kodda aramamak icin once buna bakilir.
 */
export async function listSites(): Promise<Array<{ siteUrl: string; permissionLevel: string }>> {
  const token = await getAccessToken();
  const res = await fetch(`${API}/sites`, { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Mulk listesi alinamadi: ${res.status} ${await res.text()}`);
  return (await res.json() as { siteEntry?: Array<{ siteUrl: string; permissionLevel: string }> }).siteEntry ?? [];
}

export interface SearchRow {
  date: string;
  page: string;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

/** GSC verisi 2-3 gun gecikmeli gelir; bitis tarihi bu yuzden bugunden 2 gun geri. */
export function isoDay(offsetDays: number, from = new Date()): string {
  const d = new Date(from);
  d.setUTCDate(d.getUTCDate() - offsetDays);
  return d.toISOString().slice(0, 10);
}

export async function fetchSearchRows(days = 90, rowLimit = 25_000): Promise<SearchRow[]> {
  if (!isGscConfigured()) return [];
  const token = await getAccessToken();
  const site = encodeURIComponent(process.env.GSC_SITE_URL!);
  const res = await fetch(`${API}/sites/${site}/searchAnalytics/query`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      startDate: isoDay(days + 2),
      endDate: isoDay(2),
      dimensions: ["date", "page", "query"],
      rowLimit,
      type: "web",
    }),
  });
  if (!res.ok) throw new Error(`Arama verisi alinamadi: ${res.status} ${await res.text()}`);

  const data = await res.json() as { rows?: Array<{ keys?: string[]; clicks?: number; impressions?: number; ctr?: number; position?: number }> };
  return (data.rows ?? []).flatMap((row) => {
    const [date, page, query] = row.keys ?? [];
    if (!date || !page || !query) return [];
    return [{
      date, page, query,
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0,
    }];
  });
}

export interface Opportunity {
  query: string;
  page: string;
  impressions: number;
  clicks: number;
  position: number;
}

/**
 * "Az itmeyle kazanilacak" sorgular.
 *
 * Olcut bilincli olarak dar: 8-25. sirada VE gosterim alan sorgular. 3.
 * siradakine dokunmaya gerek yok, 60. siradaki ise sayfa iyilestirmesiyle
 * kurtulmaz — arada duran, yani birinci sayfanin dibinde veya ikinci sayfada
 * takilmis olanlar tek gercek hizli kazanc. Talep zaten kanitli (gosterim
 * var), eksik olan yalnizca sira.
 */
export function findOpportunities(
  rows: SearchRow[],
  { minImpressions = 20, minPosition = 8, maxPosition = 25, limit = 40 } = {},
): Opportunity[] {
  const grouped = new Map<string, Opportunity & { positionWeight: number }>();

  for (const row of rows) {
    const key = `${row.query}|${row.page}`;
    const current = grouped.get(key) ?? {
      query: row.query, page: row.page, impressions: 0, clicks: 0, position: 0, positionWeight: 0,
    };
    current.impressions += row.impressions;
    current.clicks += row.clicks;
    // Sira, gosterim agirlikli ortalanir: 1 gosterimde gorulen 3. sira ile
    // 500 gosterimde gorulen 14. sirayi esit saymak yaniltici olurdu.
    current.positionWeight += row.position * row.impressions;
    grouped.set(key, current);
  }

  return [...grouped.values()]
    .map((item) => ({
      query: item.query, page: item.page,
      impressions: item.impressions, clicks: item.clicks,
      position: item.impressions ? item.positionWeight / item.impressions : 0,
    }))
    .filter((item) =>
      item.impressions >= minImpressions
      && item.position >= minPosition
      && item.position <= maxPosition)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit);
}

export interface PageSummary {
  page: string;
  impressions: number;
  clicks: number;
  queries: number;
}

export function summarizeByPage(rows: SearchRow[], limit = 50): PageSummary[] {
  const grouped = new Map<string, PageSummary & { queryKeys: Set<string> }>();
  for (const row of rows) {
    const current = grouped.get(row.page) ?? {
      page: row.page, impressions: 0, clicks: 0, queries: 0, queryKeys: new Set<string>(),
    };
    current.impressions += row.impressions;
    current.clicks += row.clicks;
    current.queryKeys.add(row.query);
    grouped.set(row.page, current);
  }
  return [...grouped.values()]
    .map(({ queryKeys, ...rest }) => ({ ...rest, queries: queryKeys.size }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, limit);
}

export interface InspectionResult {
  url: string;
  verdict: string;
  coverageState: string;
  robotsTxtState?: string;
  indexingState?: string;
  lastCrawlTime?: string;
}

/**
 * Tek bir adresin indeks durumunu sorar.
 *
 * Arama verisi mulk dogrulandiktan gunler sonra dolar; bu uc ise ANINDA
 * cevap verir. "Sayfalarim Google'da var mi" sorusunun beklemeden alinabilen
 * tek dogru cevabi budur — site: aramasi tahminidir, bu degil.
 */
export async function inspectUrl(url: string): Promise<InspectionResult> {
  const token = await getAccessToken();
  const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      inspectionUrl: url,
      siteUrl: process.env.GSC_SITE_URL,
    }),
  });
  if (!res.ok) throw new Error(`Inceleme basarisiz (${res.status}): ${await res.text()}`);
  const data = await res.json() as {
    inspectionResult?: { indexStatusResult?: Record<string, string> };
  };
  const durum = data.inspectionResult?.indexStatusResult ?? {};
  return {
    url,
    verdict: durum.verdict ?? "BILINMIYOR",
    coverageState: durum.coverageState ?? "-",
    robotsTxtState: durum.robotsTxtState,
    indexingState: durum.indexingState,
    lastCrawlTime: durum.lastCrawlTime,
  };
}

/** Sitemap bildirir. Zaten bildirilmisse Google yeniden okur, zarari yok. */
export async function submitSitemap(sitemapUrl: string): Promise<void> {
  const token = await getAccessToken();
  const site = encodeURIComponent(process.env.GSC_SITE_URL!);
  const res = await fetch(`${API}/sites/${site}/sitemaps/${encodeURIComponent(sitemapUrl)}`, {
    method: "PUT",
    headers: { authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Sitemap bildirilemedi (${res.status}): ${await res.text()}`);
}

export async function listSitemaps(): Promise<Array<{ path: string; lastSubmitted?: string; warnings?: string; errors?: string; isPending?: boolean }>> {
  const token = await getAccessToken();
  const site = encodeURIComponent(process.env.GSC_SITE_URL!);
  const res = await fetch(`${API}/sites/${site}/sitemaps`, { headers: { authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Sitemap listesi alinamadi (${res.status})`);
  return (await res.json() as { sitemap?: Array<{ path: string }> }).sitemap ?? [];
}
