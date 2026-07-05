/**
 * Mock for the `virtual:astro:env/schema` module loaded by
 * tests/unit/env-schema.test.ts. The schema exposes the env-var names
 * declared in `src/env.d.ts` — types are not surfaced at runtime, so
 * `string` placeholders mirror what `astro check` would emit.
 */

export const RESEND_API_KEY = 'string';
export const CRM_WEBHOOK_URL = 'string';
export const ENQUIRY_TO_EMAIL = 'string';
export const PUBLIC_ANALYTICS_HOST = 'string';
