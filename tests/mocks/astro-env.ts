/**
 * Mock for `astro:env/server`, `astro:env/client`, and `astro:env` in
 * Vitest context. Astro builds these at build time; in unit tests we
 * provide static surrogates shaped like the schema declared in
 * `src/env.d.ts`. Values are deliberately plausible-looking fixtures —
 * NOT secrets — so that consumers which log or surface them in error
 * messages don't blow up on `undefined`.
 */

const PLACEHOLDER = 'test-environment-value';

export const RESEND_API_KEY: string = PLACEHOLDER;
export const CRM_WEBHOOK_URL: string = PLACEHOLDER;
export const ENQUIRY_TO_EMAIL: string = 'sales@flyed.dev';
export const PUBLIC_ANALYTICS_HOST: string = 'analytics.flyed.dev';
