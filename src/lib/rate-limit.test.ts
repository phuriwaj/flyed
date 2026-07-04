import { describe, it, expect, vi } from 'vitest';
import { rateLimited } from './rate-limit';

describe('rateLimited', () => {
  it('rejects after the threshold', async () => {
    // Bucket already full: 3 timestamps inside the window means the next
    // request must be rejected without being recorded.
    const now = Date.now();
    const fakeKV = {
      get: vi.fn(async () => JSON.stringify([now, now, now])),
      put: vi.fn(async () => undefined),
    };
    const result = await rateLimited({
      ip: '1.1.1.1',
      kv: fakeKV as any,
      max: 3,
      windowMs: 60_000,
    });
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSec).toBeGreaterThan(0);
    expect(fakeKV.put).not.toHaveBeenCalled();
  });

  it('allows requests when the bucket is empty', async () => {
    const fakeKV = {
      get: vi.fn(async () => null),
      put: vi.fn(async () => undefined),
    };
    const result = await rateLimited({
      ip: '2.2.2.2',
      kv: fakeKV as any,
      max: 3,
      windowMs: 60_000,
    });
    expect(result.allowed).toBe(true);
    expect(result.retryAfterSec).toBe(0);
    expect(fakeKV.put).toHaveBeenCalledOnce();
  });

  it('fails open when the KV binding is missing', async () => {
    const result = await rateLimited({
      ip: '3.3.3.3',
      kv: undefined,
      max: 1,
      windowMs: 60_000,
    });
    expect(result.allowed).toBe(true);
    expect(result.retryAfterSec).toBe(0);
  });
});