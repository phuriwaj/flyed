# flyed Production Launch Runbook

This is the deployment + manual verification checklist for the flyed marketing
site. The site is a Cloudflare Workers project (Workers Builds) backed by an
Astro 7 static-output build with per-route SSR for the `/api/*` and `/admin/*`
endpoints. The site contents are pre-rendered at build time; only the
runtime endpoints run on the edge.

## Pre-launch checklist

### 1. Cloudflare account setup (one-time)

- [ ] Create Cloudflare account at https://dash.cloudflare.com/sign-up
- [ ] Add domain `flyed.dev` to Cloudflare (free tier OK)
- [ ] Update nameservers at registrar to Cloudflare's nameservers
- [ ] Get Account ID from Cloudflare dashboard (right sidebar)
- [ ] Create API token: My Profile → API Tokens → Create Token → Edit Cloudflare Workers template
  - Account: <your account>
  - Zone Resources: Include → Specific zone → flyed.dev
  - Account Resources: Include → Specific account → <your account>
- [ ] In GitHub repo: Settings → Secrets and variables → Actions
  - Add `CLOUDFLARE_API_TOKEN` (the token above)
  - Add `CLOUDFLARE_ACCOUNT_ID` (the account ID)
  - Optional: add `LHCI_TOKEN` for Lighthouse CI public storage upload

### 2. Cloudflare Workers project

- [ ] Connect GitHub repo `flyed-dev/flyed` to Cloudflare Workers (Workers Builds)
- [ ] Build settings:
  - Build command: `npm run build`
  - Build output directory: `dist`
  - Root directory: `/`
  - Node version: 22
  - Compatibility date: `2026-06-01` (matches `wrangler.jsonc`)
  - Compatibility flags: `nodejs_compat`
- [ ] Environment variables (Production):
  - `RESEND_API_KEY` — set via `wrangler secret put RESEND_API_KEY`
  - `CRM_WEBHOOK_URL` — set via `wrangler secret put CRM_WEBHOOK_URL`
  - `PUBLIC_ANALYTICS_HOST` — set if using Plausible (or similar); host where the analytics script is served. Optional.
  - `SITE_URL` — `https://flyed.dev`
  - `NODE_ENV` — `production`

### 2.5. KV namespaces

The `enquiry` API handler depends on two KV namespaces (one for sliding-window
rate limiting, one for lead capture). They are declared in `wrangler.jsonc`
with placeholder ids (`0000…01`, `0000…02`). Before the first deploy you must
create them in Cloudflare and patch the real ids back into `wrangler.jsonc`:

```bash
# Production namespaces
npx wrangler kv namespace create RATE_LIMIT_KV
npx wrangler kv namespace create LEADS_KV

# Preview namespaces (used by `wrangler dev` and PR previews)
npx wrangler kv namespace create RATE_LIMIT_KV --preview
npx wrangler kv namespace create LEADS_KV --preview
```

Each command prints an `id` (production) and a `--preview` run prints a
`preview_id`. Paste both strings into the matching `kv_namespaces` entries in
`wrangler.jsonc` — `id` for `id`, `preview_id` for `preview_id`. Until this is
done, the build itself succeeds but the runtime handler will skip durable lead
capture and the rate limiter will fall open.

### 3. DNS records (Cloudflare)

- [ ] A record: `@` → Workers route (auto-managed once the custom domain is bound)
- [ ] CNAME: `www` → `flyed.workers.dev` (or the project workers.dev subdomain)
- [ ] Verify with `dig flyed.dev +short`

### 4. Domain

- [ ] Custom domain `flyed.dev` added to the Workers project (Triggers → Custom Domains)
- [ ] Custom domain `www.flyed.dev` added to the Workers project
- [ ] SSL/TLS: Full (strict)
- [ ] Always Use HTTPS: ON
- [ ] Minimum TLS Version: 1.2
- [ ] www → apex redirect: Cloudflare Dashboard → Rules → Redirect Rules
      (static `_redirects` file does NOT support absolute URLs — must be configured in dashboard)
  - Name: `www to apex`
  - If: hostname eq `www.flyed.dev`
  - Then: Static redirect → `https://flyed.dev/${uri}` status 301

## Deploy

```bash
# From main branch, after all CI passes
git push origin main

# Cloudflare Workers Builds auto-deploys via the GitHub Actions workflow
# or via the Cloudflare GitHub App integration.
```

## Post-deploy verification

### 1. Smoke test (manual)

- [ ] Visit https://flyed.dev — home page hero loads, "5 steps" CTA visible
- [ ] Click "Enquire" → form step 1 renders
- [ ] Fill and submit form → success message appears
- [ ] Check Resend dashboard: email delivered to hello@flyed.dev
- [ ] Check CRM webhook: payload received
- [ ] Visit /th — Thai home page renders
- [ ] Visit /th/about — Thai about page renders
- [ ] Click language switcher → URL changes prefix
- [ ] View page source: JSON-LD Organization present
- [ ] View page source: hreflang alternates present
- [ ] Open /blog/01-why-thailand-service-learning — article renders
- [ ] Open /itineraries/andaman-sailing-week — itinerary renders
- [ ] Click a destination card → /destinations/[city] loads
- [ ] Open RSS feed at /rss.xml — 20 items present
- [ ] Open sitemap at /sitemap-index.xml — valid XML

### 2. Lighthouse audit

- [ ] Open https://pagespeed.web.dev/ → enter https://flyed.dev
- [ ] Performance ≥ 90 (target), 85 (warning floor)
- [ ] Accessibility ≥ 95 (error floor)
- [ ] Best Practices ≥ 90
- [ ] SEO ≥ 95
- [ ] Repeat for /blog/01-why-thailand-service-learning
- [ ] Repeat for /enquire

### 3. Cross-browser smoke

- [ ] Chrome (desktop + mobile emulation)
- [ ] Safari (iOS Safari 17+)
- [ ] Firefox
- [ ] Edge

### 4. Mobile responsive

- [ ] 375px width: hero text readable, no horizontal scroll
- [ ] 768px width: tablet layout correct
- [ ] 1440px width: desktop layout correct
- [ ] Touch targets ≥ 44x44px
- [ ] Form inputs don't trigger zoom on iOS (16px+ font size)

### 5. SEO validation

- [ ] Google Search Console: add property https://flyed.dev
- [ ] Submit sitemap: https://flyed.dev/sitemap-index.xml
- [ ] Request indexing: home, /about, /itineraries/andaman-sailing-week
- [ ] Check hreflang with: `curl -s https://flyed.dev/ | grep hreflang`
- [ ] Verify Open Graph: `curl -s https://flyed.dev/ | grep og:image`

### 6. Performance checks

- [ ] First Contentful Paint < 1.5s on 3G
- [ ] Largest Contentful Paint < 2.5s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Time to Interactive < 3.5s
- [ ] Total page size < 1MB (excluding images)

## Monitoring

### Cloudflare Analytics

- [ ] Enable Web Analytics on the Workers project (Workers Analytics → Enable)
- [ ] Set up email alerts for: error rate > 1%, bandwidth > 50GB/month

### Error tracking

- [ ] Set up Sentry or similar for /api endpoints
- [ ] Monitor: 4xx rate, 5xx rate, P95 response time

### Form submission monitoring

- [ ] Resend dashboard: 100% delivery rate
- [ ] CRM webhook: success rate
- [ ] Set up Slack/email alerts for failed submissions

## Rollback

If a deploy breaks production:

```bash
# Cloudflare Dashboard → Workers & Pages → flyed → Deployments → click previous successful deploy → "Rollback to this deploy"
```

Or via CLI:

```bash
wrangler deployments list --name=flyed
wrangler deployments rollback <deployment-id> --name=flyed
```

## Known post-launch items

- **Legal pages are placeholders** — replace with reviewed-and-approved legal text from counsel
  (Priority: HIGH, before any paid traffic)
- **Testimonials are hardcoded inline** on home page — replace with real customer quotes
  (Priority: MEDIUM, after first 5 customer trips complete)
- **Real blog post images** are Unsplash CDN-hosted — consider moving to flyed-owned CDN
  (Priority: LOW, after 6 months of traffic data)
- **Newsletter provider not wired** — endpoint accepts email, no provider integration
  (Priority: HIGH, before any newsletter CTA drives traffic)
- **Lead durability = LEADS_KV** — the `enquiry` handler returns `durable: true`
  only when the lead has been written to the `LEADS_KV` namespace. If the
  binding is missing or `put()` throws, the response still returns 200 but
  `durable: false` and the only record is in the request log. Confirm the
  namespace exists and ids are patched in `wrangler.jsonc` before going live
  (see "KV namespaces" above).
- **Image srcset for mobile** could be tuned further based on real-user metrics
  (Priority: LOW, ongoing)
- **Zod v3→v5 migration** when Zod 5 ships
  (Priority: LOW, when stable)
