---
status: 'accepted'
date: 2026-07-04
decision-makers: ['flyed engineering']
consulted: ['docs-architect (reverse-documented 2026-07-05)']
informed: []
---

# Astro 7 `output: 'static'` with per-route SSR opt-in

## Context and problem statement

Astro offers two rendering modes: `output: 'static'` (every page pre-rendered
at build time) and `output: 'server'` (every page rendered on demand).
flyed is a marketing site whose pages are content-driven and rarely change
between deploys, but it also has three runtime endpoints under `/api/*`
that need KV bindings and side effects. We need a build model that gives
us the performance of pre-rendered HTML for the marketing surface without
forcing us to wire every endpoint as a Pages Function or an external
service.

The decision: which Astro rendering strategy?

## Decision drivers

- Performance efficiency (Q1 in the architecture overview) — pre-rendered
  HTML is the fastest possible delivery for the marketing surface.
- Edge-resident runtime for the three endpoints, with KV bindings and
  `nodejs_compat`.
- A single config file (`astro.config.mjs`) governs the build, not
  separate Functions configs.
- One developer. Splitting build/run into two configs increases the
  surface for typos.

## Considered options

- **`output: 'static'` everywhere, no SSR endpoints.** Pure static. Would
  require an external service for `/api/*` (e.g. a separate Cloudflare
  Worker), increasing config surface.
- **`output: 'server'` everywhere, render every page on demand.** Wastes
  edge compute on content that never changes between deploys; defeats
  Lighthouse Performance goals (Q1).
- **`output: 'static'` with per-route `export const prerender = false` for
  `/api/*` and `/admin/*`.** Pre-render everything by default; opt in to
  SSR per-file. The Cloudflare adapter still handles SSR routes as Worker
  functions.

## Decision outcome

Chosen option: **"`output: 'static'` with per-route SSR opt-in"**,
because it is the only option satisfying both the performance driver
(static HTML for marketing) and the KV-bindings driver (SSR for the three
runtime endpoints) without splitting config surfaces.

### Consequences

- Good, because Lighthouse Performance CI gate (`performance` ≥ 0.95 in
  `.lighthouserc.json:19`) is achievable with pre-rendered HTML.
- Good, because KV bindings are scoped to the SSR endpoints only — the
  static surface needs zero runtime config.
- Good, because Astro's `astro:env` schema (`src/env.d.ts`) and the
  Cloudflare adapter's `imageService: 'passthrough'` (see ADR-0004) are
  configured once and apply to both modes.
- Bad, because any new SSR endpoint must remember to add
  `export const prerender = false;` at the top of the file. Forgetting
  it silently produces a static endpoint that returns whatever JSON was
  baked at build time — easy to miss in code review.
- Bad, because the `imageService: 'passthrough'` mode is the only viable
  image service under `@astrojs/cloudflare` when images are not
  ESM-imported (see ADR-0004).
- Neutral, because the 404 path under `/th/*` requires the
  `th-404-copy` Vite plugin in `astro.config.mjs:22-38` to copy the
  pre-rendered TH 404 to `dist/th/404.html`. Without it, an unknown `/th/*`
  path serves the EN 404 page via the directory-search fallback.

### Confirmation

- `astro.config.mjs:42` — `output: 'static'`.
- `astro.config.mjs:43-48` — Cloudflare adapter with `imageService: 'passthrough'`.
- `src/pages/api/enquiry.ts:6`, `src/pages/api/contact.ts:4`,
  `src/pages/api/newsletter.ts:4` — each declares `export const prerender = false;`.
- `astro.config.mjs:99` — `th404Copy()` integration registered.
- `src/content.config.ts:22-129` — all five collections are loaded at
  build time; no runtime data fetching.

## Pros and cons of the options

### `output: 'static'` everywhere

- Good, because the entire site is a static asset bundle.
- Bad, because `/api/*` would require a separate service.
- Bad, because KV bindings can't be reached from a static site without
  a parallel Worker.

### `output: 'server'` everywhere

- Good, because every page can call into KV or fetch live data.
- Bad, because every page costs edge compute — wasteful for content that
  is identical between deploys.
- Bad, because Lighthouse Performance score drops (CI gate would fail).

### Static default + per-route SSR opt-in

- Good, because marketing pages are pre-rendered HTML (Lighthouse-friendly)
  and `/api/*` has full Node-compat runtime.
- Good, because the SSR surface is opt-in — easy to audit which routes
  actually need it.
- Bad, because every new SSR endpoint must remember
  `export const prerender = false;`.

## More information

- Astro adapter: `astro.config.mjs:43-48`.
- Content collections: `src/content.config.ts`.
- 404 Vite plugin: `astro.config.mjs:22-38`.
- ADR-0004 (image service) and ADR-0001 (Cloudflare Workers) both depend
  on this decision.
