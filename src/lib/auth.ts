import crypto from 'crypto';

/**
 * Verifies an admin password against the ADMIN_PASSWORD env var.
 * Returns false (denies access) when ADMIN_PASSWORD is not configured,
 * preventing an auth-bypass when the env var is missing.
 */
export function checkAdminPassword(provided: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof provided !== 'string' || provided.length === 0) {
    return false;
  }
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
