import { describe, it, expect } from 'vitest';

describe('astro:env schema', () => {
  it('declares the runtime env vars we depend on', async () => {
    const env = await import('virtual:astro:env/schema');
    // Public client var
    expect(env.PUBLIC_ANALYTICS_HOST).toBeDefined();
    // Server-only secrets/strings
    expect(env.RESEND_API_KEY).toBeDefined();
    expect(env.CRM_WEBHOOK_URL).toBeDefined();
    expect(env.ENQUIRY_TO_EMAIL).toBeDefined();
  });
});
