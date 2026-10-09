// In-memory rate limiter for self-serve signup and patient registration.
//
// IMPORTANT: This is a process-local sliding window keyed by IP. It provides
// adequate protection for single-instance deployments. If the app is scaled
// horizontally (multiple instances/containers), this limiter does NOT provide
// cross-instance protection — each instance maintains its own counters. In
// that topology, swap this for a shared durable store (e.g. Vercel KV, Redis,
// or a database-backed counter). The interface (rateLimit/resetRateLimit)
// remains the same so callers need no changes.
//
// Proxy header trust: x-forwarded-for is trusted as the client IP source. This
// is correct behind Vercel, Next.js standalone, and standard reverse proxies
// that set this header. In a deployment where the proxy does not strip
// client-supplied x-forwarded-for values, an attacker could spoof IPs to
// bypass the limiter. Ensure your proxy/CDN overwrites this header.

type Hit = { count: number; resetAt: number }

const WINDOW_MS = 60 * 60 * 1000 // 1 hour
const buckets = new Map<string, Hit>()

/**
 * Record an attempt for `key` and report whether it is allowed. Returns the
 * remaining allowance so callers can surface a friendly message. `now` is
 * injectable for deterministic tests.
 */
export function rateLimit(
  key: string,
  max: number,
  now: number = Date.now(),
): { allowed: boolean; remaining: number } {
  const existing = buckets.get(key)
  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: max - 1 }
  }
  if (existing.count >= max) {
    return { allowed: false, remaining: 0 }
  }
  existing.count += 1
  return { allowed: true, remaining: max - existing.count }
}

/** Test helper — drop all recorded windows. */
export function resetRateLimit(): void {
  buckets.clear()
}
