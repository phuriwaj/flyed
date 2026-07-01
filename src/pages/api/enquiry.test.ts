import { describe, it, expect, vi } from 'vitest';
import { POST } from './enquiry';

global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));

describe('POST /api/enquiry', () => {
  it('rejects invalid payload with 422', async () => {
    const req = new Request('http://localhost/api/enquiry', {
      method: 'POST',
      body: JSON.stringify({ schoolName: 'X' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST({ request: req } as any);
    expect(res.status).toBe(422);
  });

  it('accepts valid payload and returns enquiryId', async () => {
    const req = new Request('http://localhost/api/enquiry', {
      method: 'POST',
      body: JSON.stringify({
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
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST({ request: req } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.enquiryId).toBeDefined();
  });
});
