// Mock for astro:env virtual modules in vitest context.
// Astro builds these at build time; in unit tests we provide a static
// surrogate shaped like the schema defined in src/env.d.ts.

// Module shape consumed by code under test:
//   import { X } from 'astro:env/server'
//   import { X } from 'astro:env/client'
export const RESEND_API_KEY: string | undefined = undefined;
export const CRM_WEBHOOK_URL: string | undefined = undefined;
export const ENQUIRY_TO_EMAIL: string = 'sales@flyed.dev';
export const PUBLIC_ANALYTICS_HOST: string | undefined = undefined;
