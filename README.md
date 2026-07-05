---
title: flyed — project overview
doc_type: readme
status: draft
version: 0.1.0
date: 2026-07-05
authors: ['docs-architect (AI-generated, pending human review)']
reviewers: []
system: flyed marketing site
source_commit: bc0995c
related:
  - docs/index.md
  - docs/development/setup.md
  - docs/operations/deployment.md
---

# flyed

Inbound educational travel to Thailand. A bilingual (EN + TH) marketing site for UK and US educators and parents researching school trips.

The site serves three jobs: explain who flyed is and what trips it sells, capture qualified leads via an enquiry form, and provide a content surface (blog, destinations, itineraries, team) that ranks in search and reassures school decision-makers.

**Current status:** Wave 7 shipped on branch `wave-7-improvements` (commit `bc0995c` at audit time). Production runs on Cloudflare Workers with KV-backed rate-limit and lead capture; the marketing surface is pre-rendered Astro static output with per-route SSR for `/api/*` and `/admin/*`.

## Stack

Astro 7 (static + per-route SSR) · React 19 islands · Tailwind 4 · MDX · Cloudflare Workers (`compatibility_date: 2026-06-01`, `nodejs_compat`) · Cloudflare KV (`LEADS_KV`, `RATE_LIMIT_KV`) · Resend (transactional email) · Decap CMS (git-backed editorial UI at `/admin`) · i18n (EN + TH) · Playwright (e2e) · Vitest (unit) · Lighthouse CI.

## Develop

```bash
npm install
npm run dev          # http://localhost:4321
```

The dev server runs in background mode — see [`CLAUDE.md`](./CLAUDE.md) for the `astro dev --background` workflow.

## Build

```bash
npm run check        # typecheck (runs before every build in CI)
npm run build        # outputs dist/
npm run preview      # preview the production build
```

## Test

```bash
npm test                       # Vitest unit
npx playwright test            # Playwright e2e (server lifecycle handled by config)
npx lhci autorun               # Lighthouse CI (asserts perf/a11y/BP/SEO)
```

## Documentation

Project docs live under [`docs/`](./docs/index.md). Start at [`docs/index.md`](./docs/index.md) for the doc map and role-based reading paths.

Useful entry points:

- New contributor → [`docs/development/setup.md`](./docs/development/setup.md) then [`docs/development/onboarding.md`](./docs/development/onboarding.md)
- Operator → [`docs/operations/deployment.md`](./docs/operations/deployment.md) and [`docs/operations/runbooks/`](./docs/operations/runbooks/)
- Deploy → [`DEPLOY.md`](./DEPLOY.md) (root project doc) and [`docs/operations/deployment.md`](./docs/operations/deployment.md) (detailed)

## Legacy pointers

The original marketing-site design and implementation plans are kept under `docs/superpowers/specs/` and `docs/superpowers/plans/` as historical artifacts. Several are materially stale on persistence (Astro DB → LEADS_KV) and on the blog content model (two collections → single locale-aware collection); for the current architecture, use the docs under `docs/architecture/`, `docs/api/`, and `docs/data/`.

- Design spec (historical, partly stale): `docs/superpowers/specs/2026-06-30-flyed-marketing-site-design.md`
- Image prompts: `docs/image-prompts.md`
- Editor guide (served at `/admin/README.md`): `public/admin/README.md`
