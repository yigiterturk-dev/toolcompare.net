import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

type Source = { url: string; title?: string; type?: string };

function isPrivateIp(address: string) {
  if (address === "::1" || address === "0.0.0.0") return true;
  if (address.startsWith("10.") || address.startsWith("127.") || address.startsWith("192.168.")) return true;
  const second = Number(address.split(".")[1]);
  if (address.startsWith("172.") && second >= 16 && second <= 31) return true;
  if (address.startsWith("169.254.") || address.toLowerCase().startsWith("fe80:")) return true;
  if (address.toLowerCase().startsWith("fc") || address.toLowerCase().startsWith("fd")) return true;
  return false;
}

export function isBlockedSourceUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return true;
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    if (hostname === "localhost" || hostname.endsWith(".local") || hostname.endsWith(".internal")) return true;
    return isIP(hostname) > 0 && isPrivateIp(hostname);
  } catch {
    return true;
  }
}

async function safePublicUrl(value: string) {
  if (isBlockedSourceUrl(value)) return null;
  const url = new URL(value);
  try {
    const addresses = await lookup(url.hostname, { all: true });
    if (addresses.length === 0 || addresses.some((item) => isPrivateIp(item.address))) return null;
    return url;
  } catch {
    return null;
  }
}

async function checkSource(source: Source): Promise<Source | null> {
  let current = await safePublicUrl(source.url);
  if (!current) return null;
  for (let redirects = 0; redirects <= 2; redirects += 1) {
    const response = await fetch(current, {
      method: "GET",
      redirect: "manual",
      headers: {
        "user-agent": "ToolCompareResearchBot/1.0 (+https://toolcompare.net)",
        range: "bytes=0-4095",
        accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(7_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) return null;
      current = await safePublicUrl(new URL(location, current).toString());
      if (!current) return null;
      continue;
    }
    if (!response.ok && response.status !== 206) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) return null;
    await response.body?.cancel();
    return { ...source, url: current.toString() };
  }
  return null;
}

export async function verifySources(sources: Source[] = []) {
  const unique = [...new Map(sources.map((source) => [source.url, source])).values()].slice(0, 6);
  const verified = await Promise.all(unique.map(async (source) => {
    try { return await checkSource(source); } catch { return null; }
  }));
  return verified.filter((source): source is Source => source !== null);
}
