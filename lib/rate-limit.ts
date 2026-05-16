// Simple in-memory token-bucket rate limiter for public API routes.
//
// Per-warm-instance only — on Vercel serverless, the limit is per-instance
// rather than global. That's intentional for v1: it's cheap, dependency-free,
// and stops the common abuse cases (one user firing 1000 requests in a loop).
// Promote to Redis/Supabase-backed counters in Phase 2 if needed.

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

// Periodic cleanup so the Map doesn't grow forever on long-running instances.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let lastCleanup = Date.now()

function maybeCleanup(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key)
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  retryAfterSeconds: number
}

/**
 * Increment the bucket for `key` and check against `max` per `windowMs`.
 * Returns whether the request is allowed.
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  maybeCleanup(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs, retryAfterSeconds: 0 }
  }

  if (bucket.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
    }
  }

  bucket.count += 1
  return {
    allowed: true,
    remaining: max - bucket.count,
    resetAt: bucket.resetAt,
    retryAfterSeconds: 0,
  }
}

/**
 * Extract a stable per-client key from a Next.js request. Falls back to
 * "anonymous" when no headers are present (e.g. in tests).
 */
export function clientKeyFromRequest(req: Request): string {
  const headers = req.headers
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for is a comma-separated list; first entry is the originating client.
    return forwarded.split(',')[0].trim()
  }
  const real = headers.get('x-real-ip')
  if (real) return real.trim()
  return 'anonymous'
}
