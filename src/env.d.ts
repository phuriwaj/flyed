/// <reference path="../.astro/types.d.ts" />

import { defineEnv, envField } from 'astro:env';

export default defineEnv({
  server: {
    RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    CRM_WEBHOOK_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
    ENQUIRY_TO_EMAIL: envField.string({
      context: 'server',
      access: 'public',
      default: 'sales@flyed.dev',
    }),
  },
  client: {
    PUBLIC_ANALYTICS_HOST: envField.string({
      context: 'client',
      access: 'public',
      optional: true,
    }),
  },
});
