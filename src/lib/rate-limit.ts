/**
 * Basit bellek-icinde sabit pencere hiz freni.
 *
 * Tek instance deploylari icin temel spam/istismar korumasi. Cok instance
 * veya serverless olcek icin Redis/Upstash gibi dis depoya gecirilebilir.
 */
type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "bilinmiyor";
}

/**
 * Istek izinliyse true, limit asildiysa false dondurur.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}
