/**
 * Simple in-memory fixed-window rate limiter.
 * Suitable for a single-instance deployment as basic spam/abuse protection.
 * For multi-instance/serverless scale, swap the store for Redis/Upstash.
 */
type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

export function getClientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'unknown';
}

/**
 * Returns true if the request is allowed, false if the limit is exceeded.
 */
export function rateLimit(key: string, limit = 5, windowMs = 60_000): boolean {
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
