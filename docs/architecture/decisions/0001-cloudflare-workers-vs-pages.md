---
status: 'accepted'
date: 2026-07-04
decision-makers: ['flyed engineering']
consulted: ['docs-architect (reverse-documented 2026-07-05)']
informed: []
---

# Run on Cloudflare Workers (not Cloudflare Pages)

## Context and problem statement

flyed is a marketing site with three runtime endpoints (`/api/enquiry`,
`/api/contact`, `/api/newsletter`) that need persistent counters (rate
limiting) and a durable store (lead capture). The project started on
Cloudflare Pages with Functions. By Wave 7, we needed native KV bindings,
Tail Workers, and observability that Pages did not expose directly, and we
wanted to consolidate runtime configuration in one place (`wrangler.jsonc`)
rather than split between Pages Functions and a separate Worker.

The decision: stay on Cloudflare Pages (with Functions) or migrate to
Cloudflare Workers (with the `@astrojs/cloudflare` adapter and a single
`wrangler.jsonc`)?

## Decision drivers

- Need edge-resident KV bindings bound at request time, without a separate
  Pages Function worker (Q3 in the architecture overview — reliability).
- One config file (`wrangler.jsonc`) to declare compatibility date, KV
  bindings, asset binding, and observability — reduces drift between
  dashboard UI and code.
- Cloudflare Workers Observability (`head_sampling_rate: 1`) for traces
  and logs — Pages Functions have a separate, lighter observability surface.
- Single-developer workflow (audit B.1) — minimizing the number of
  configuration surfaces matters.

## Considered options

- **Stay on Cloudflare Pages with Functions.** Familiar, no migration cost;
  KV bindings require a separate Worker or a `_routes.json` workaround; no
  native observability beyond `wrangler tail`.
- **Migrate to Cloudflare Workers via `@astrojs/cloudflare`.** KV bindings
  declared in `wrangler.jsonc`; observability enabled with one line;
  pre-rendered static assets still served via the ASSETS binding; per-route
  SSR endpoints still deploy as Workers functions. Migration cost: ~half a
  day plus doc updates.
- **Move off Cloudflare entirely** (e.g. Vercel, Netlify, self-hosted).
  Out of scope: existing Cloudflare DNS, free-tier budget, and a
  one-developer team all point away from a multi-vendor migration.

## Decision outcome

Chosen option: **"Migrate to Cloudflare Workers via `@astrojs/cloudflare`"**,
because it is the only option satisfying the KV-bindings-at-runtime driver
without inventing a parallel Worker, and because the migration cost is small
relative to the configuration-surface consolidation.

### Consequences

- Good, because all runtime config lives in `wrangler.jsonc` — KV bindings,
  compatibility date, observability, and ASSETS binding in one file.
- Good, because per-route SSR endpoints deploy as Worker functions with
  full Node-API polyfills via `nodejs_compat`.
- Bad, because Pages-only documentation (`docs/operations/runbooks/RB-decap-cms.md`,
  `public/admin/README.md`) is now stale — preview URL format and rollback
  paths changed. Document updates are tracked as audit findings B.3 and B.5.
- Bad, because the Cloudflare Workers image service has limitations — only
  `passthrough` is viable with the current `public/images/` setup (see
  ADR-0004).
- Neutral, because migration was committed to `wave-7-improvements`
  (merge commit `dec75bc`) and the migration-design spec at
  `docs/superpowers/specs/2026-07-04-cloudflare-workers-migration-design.md`
  is the canonical pre-merge context.

### Confirmation

Compliance check: every Cloudflare-named artifact in this repo is now a
Workers construct, not a Pages construct. Verified via:

- `wrangler.jsonc` declares `main: "@astrojs/cloudflare/entrypoints/server"`
  (`wrangler.jsonc:5`).
- `astro.config.mjs:43` imports `cloudflare` from `@astrojs/cloudflare`.
- `package.json:26` pins `@astrojs/cloudflare@^14.0.2`.
- KV bindings (`RATE_LIMIT_KV`, `LEADS_KV`) declared in `wrangler.jsonc:16-27`.
- `DEPLOY.md` references "Cloudflare Workers" and "Workers Builds"
  throughout (post-Wave-7 rewrite; audit B.2 confirms).

## Pros and cons of the options

### Cloudflare Pages (status quo pre-Wave 7)

- Good, because zero migration cost and the project was already running there.
- Bad, because KV bindings require a parallel Worker or a Pages Function
  workaround — defeats the "one config file" driver.
- Bad, because Pages Functions observability is lighter than Workers
  Observability (`head_sampling_rate` is a Workers-only knob).

### Cloudflare Workers via `@astrojs/cloudflare`

- Good, because one `wrangler.jsonc` owns runtime config.
- Good, because KV bindings are native to Workers and bind at request time.
- Good, because observability ships out of the box.
- Bad, because the migration touched ~half a dozen docs and a config file
  rewrite (now landed).
- Bad, because image processing constraints are stricter (see ADR-0004).

### Move off Cloudflare

- Good, because escape vendor lock-in.
- Bad, because DNS is already on Cloudflare, the free tier fits a one-person
  marketing site, and a multi-vendor migration is out of scope for a
  one-developer team.

## More information

- Migration design spec: `docs/superpowers/specs/2026-07-04-cloudflare-workers-migration-design.md`.
- Astro adapter docs: `astro.config.mjs:43-48`.
- Migration commit sequence (excerpt): `16e3acf docs(deploy): update for Workers + KV namespaces` —
  matches `wrangler.jsonc` adoption.
