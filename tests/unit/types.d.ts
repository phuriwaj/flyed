// Ambient declarations for Astro virtual modules referenced only from
// unit tests (not part of the runtime source). The real `astro:env`
// declarations are emitted by `astro sync` into `.astro/env.d.ts`.

declare module 'virtual:astro:env/schema' {
  export const RESEND_API_KEY: string | undefined;
  export const CRM_WEBHOOK_URL: string | undefined;
  export const ENQUIRY_TO_EMAIL: string;
  export const PUBLIC_ANALYTICS_HOST: string | undefined;
}
