/**
 * Cloudflare KV-backed sliding-window rate limiter.
 *
 * Stores per-IP request timestamps as a JSON array under `rl:<ip>` and counts
 * requests inside a rolling window. Fails OPEN: if `kv` is undefined (e.g.
 * local `astro dev` without a binding), the helper returns `{ allowed: true }`
 * so unit tests and unbound environments continue to work without KV.
 */

interface FakeKV {
  get: (k: string) => Promise<string | null>;
  put: (k: string, v: string, opts?: { expirationTtl?: number }) => Promise<void>;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until the earliest in-window request expires; 0 when allowed. */
  retryAfterSec: number;
}

export interface RateLimitOptions {
  ip: string;
  kv: FakeKV | undefined;
  /** Maximum requests permitted inside `windowMs`. */
  max: number;
  /** Sliding window size in milliseconds. */
  windowMs: number;
}

export async function rateLimited(opts: RateLimitOptions): Promise<RateLimitResult> {
  // Fail open when the binding is missing (local dev, unit tests).
  if (!opts.kv) {
    return { allowed: true, retryAfterSec: 0 };
  }

  const key = `rl:${opts.ip}`;
  const now = Date.now();
  const raw = await opts.kv.get(key);
  const list = raw ? (JSON.parse(raw) as number[]).filter((t) => now - t < opts.windowMs) : [];

  if (list.length >= opts.max) {
    const oldest = list[0];
    const retryAfterSec = Math.max(1, Math.ceil((opts.windowMs - (now - oldest)) / 1000));
    return { allowed: false, retryAfterSec };
  }

  list.push(now);
  await opts.kv.put(key, JSON.stringify(list), {
    expirationTtl: Math.ceil(opts.windowMs / 1000),
  });
  return { allowed: true, retryAfterSec: 0 };
}
