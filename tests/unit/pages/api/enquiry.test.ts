import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/pages/api/enquiry';

global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));

const validPayload = {
  schoolName: 'Test School',
  role: 'Teacher',
  email: 't@school.com',
  phone: '123456',
  country: 'UK',
  groupSize: 20,
  ages: '14-16',
  departureMonth: 'Feb 2027',
  duration: 7,
  subjects: ['service-learning'],
};

describe('POST /api/enquiry', () => {
  const logger = { info: () => {}, warn: () => {}, error: () => {} };

  it('rejects invalid payload with 422', async () => {
    const req = new Request('http://localhost/api/enquiry', {
      method: 'POST',
      body: JSON.stringify({ schoolName: 'X' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST({ request: req, logger } as any);
    expect(res.status).toBe(422);
  });

  it('accepts valid payload and returns enquiryId (durable=false without LEADS_KV)', async () => {
    const req = new Request('http://localhost/api/enquiry', {
      method: 'POST',
      body: JSON.stringify(validPayload),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST({ request: req, logger } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.enquiryId).toBeDefined();
    // No LEADS_KV binding in unit tests, so `durable` correctly reports false.
    expect(body.durable).toBe(false);
  });

  it('returns 429 when the rate limiter denies the request', async () => {
    const now = Date.now();
    const fakeRateLimitKv = {
      // 5 timestamps within the 60s window → at the threshold of 5.
      get: async () => JSON.stringify(Array.from({ length: 5 }, () => now - 1000)),
      put: async () => undefined,
    };
    const req = new Request('http://localhost/api/enquiry', {
      method: 'POST',
      body: JSON.stringify(validPayload),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST({
      request: req,
      locals: { runtime: { env: { RATE_LIMIT_KV: fakeRateLimitKv } } },
      logger,
    } as any);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBeDefined();
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe('Rate limit exceeded');
  });
});
