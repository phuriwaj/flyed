# Migrate flyed from Cloudflare Pages to Cloudflare Workers

**Date:** 2026-07-04
**Status:** Approved (pending user review of written spec)
**Owner:** flyed-dev

## Context

`flyed.pages.dev` returns HTTP 404 even though the GitHub repo is linked to a Cloudflare Pages project. Investigation showed that `@astrojs/cloudflare@14` (used with Astro 7) **no longer supports Cloudflare Pages** — it targets Cloudflare Workers only. Pages support was removed in adapter v13 (Astro 6 upgrade).

The current build emits:
- `dist/server/` — Worker entry (`entry.mjs`, ~935KB unminified)
- `dist/client/` — prerendered static assets

Cloudflare Pages expects a `_worker.js` at the root of the build output directory. The Astro Cloudflare adapter does not emit one there — it expects to be deployed via `wrangler pages deploy dist/client` (which knows where to find the worker) or now, as a Worker. Pages Git integration cannot locate a deployable artifact and the deploy silently fails.

## Goal

Deploy `flyed` to Cloudflare Workers with **no source-code changes inside `src/`**. Reuse the existing `@astrojs/cloudflare` adapter, which already emits a valid Worker.

## Decisions (user-approved during brainstorm)

1. **Hostname:** Deploy to `flyed.<account-subdomain>.workers.dev` now; add custom `flyed.dev` domain later as a separate change.
2. **SSR strategy:** Keep current `output: 'server'` with the Cloudflare adapter. Worker handles both prerendered static assets and SSR routes (`/api/*`, `/rss.xml`, `/admin/[...path]`).
3. **Deploy trigger:** Cloudflare dashboard Git integration ("Workers Builds"). GitHub Actions `deploy` job will be deleted.
4. **Secrets:** Set via `wrangler secret put` after first deploy. Not blocking the deploy itself.

## Non-Goals

- Fixing Lighthouse quality regressions (heading-order, label-content-name-mismatch, LCP prioritization). These are non-blocking in CI and orthogonal to this migration.
- Adding the `flyed.dev` custom domain (requires the domain to be on Cloudflare DNS; tracked separately).
- Migrating form providers or RSS feed implementation.

## Changes

### 1. Rename `wrangler.toml` → `wrangler.jsonc`

The new preferred format is `wrangler.jsonc`. Move:

```jsonc
{
  "name": "flyed",
  "compatibility_date": "2026-06-01",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@astrojs/cloudflare/entrypoints/server",
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist"
  },
  "vars": {
    "NODE_ENV": "production"
  }
}
```

Delete `wrangler.toml` after the rename.

The `main` and `assets` fields tell Workers where to find the entry point and the static asset directory. The Astro Cloudflare adapter builds `dist/_worker.js/index.js` when Workers Builds runs `npm run build`.

### 2. Delete the GitHub Actions `deploy` job

Remove the `deploy:` job (lines 115-150 in `.github/workflows/ci.yml`) and its `lighthouse` dependency from `deploy.needs`. Workers Builds in the Cloudflare dashboard replaces this. Keep `lint-build-test`, `e2e`, and `lighthouse` jobs untouched.

After deletion, `deploy.needs` only references `lint-build-test` and `e2e`.

### 3. No source-code changes

- `astro.config.mjs` — unchanged. `output: 'server'`, `adapter: cloudflare({})`, `th-404-copy` Vite plugin all keep working.
- `src/pages/api/{contact,enquiry,newsletter}.ts` — unchanged. Read `import.meta.env.RESEND_API_KEY` and `import.meta.env.CRM_WEBHOOK_URL` at runtime; works the same on Workers.
- `src/pages/rss.xml.ts` — unchanged.
- `src/pages/admin/[...path].astro` — unchanged. It's a plain HTML shell loading Decap CMS from CDN; Workers serves it identically to Pages.
- All prerendered pages (`export const prerender = true`) — unchanged. Workers serves them from the `ASSETS` binding with the same cache headers.

### 4. Dashboard configuration (manual steps)

User performs these via the Cloudflare dashboard after the repo changes are committed:

1. **Create Workers project.** In Cloudflare dashboard, go to `Compute > Workers & Pages > Create application > Import a repository`. Select the `flyed` repo on the `phuriwaj` GitHub account.
2. **Configure build:**
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - Compatibility date: `2026-06-01`
   - Compatibility flags: `nodejs_compat`
3. **First deploy happens automatically** after the project is saved. The site will be live at `flyed.<account-subdomain>.workers.dev`.
4. **Delete the old Pages project** at `flyed.pages.dev` to avoid confusion. This is irreversible from the Cloudflare side (Pages project is gone), but the source repo is untouched.

### 5. Secrets (after first deploy succeeds)

From the repo root, with the user authenticated to Cloudflare via `wrangler login`:

```bash
wrangler secret put RESEND_API_KEY         # prompted interactively
wrangler secret put CRM_WEBHOOK_URL        # prompted interactively
wrangler secret put PUBLIC_PLAUSIBLE_DOMAIN # prompted interactively
```

These are bound to the Worker at runtime. The forms in `src/pages/api/enquiry.ts` already handle missing secrets gracefully (logs `console.warn` and skips the operation), so the deploy itself does not block on these.

## Risks & Mitigations

| Risk | Mitigation |
| --- | --- |
| Worker size limit (1MB compressed, 10MB uncompressed). Current `entry.mjs` is 935KB unminified — wrangler tree-shakes/minifies, but worth checking. | After first deploy, check the deployed Worker size in the dashboard. If over limit, investigate bundle (likely MDX or RSS dependencies). |
| `nodejs_compat` flag is required because API endpoints use `node:fs`, `node:crypto` etc. | Already set in the new `wrangler.jsonc`. Same as the current `wrangler.toml`. |
| GitHub Actions `deploy` job deletion is irreversible from the workflow file (easy to re-add, but the user might forget). | Leave a comment in `ci.yml` noting the dashboard integration replaces it. |
| Old Pages project deletion is irreversible from the Cloudflare side. | User is explicitly approving this. The source repo is untouched. |
| Custom domain `flyed.dev` is not yet wired up; only the Workers subdomain works. | Explicitly called out in the user's decision. Tracked as a follow-up. |

## Testing Plan

After the dashboard deploy finishes, verify:

1. **Home page loads:** `curl -I https://flyed.<sub>.workers.dev/` returns `200`.
2. **Thai locale works:** `curl -I https://flyed.<sub>.workers.dev/th` returns `200`.
3. **Blog post works:** `curl -I https://flyed.<sub>.workers.dev/blog/01-why-thailand-service-learning` returns `200`.
4. **API endpoint responds:** `curl -X OPTIONS https://flyed.<sub>.workers.dev/api/newsletter -i` returns `200` with CORS headers (proves SSR route execution).
5. **Admin shell loads:** `curl -I https://flyed.<sub>.workers.dev/admin/` returns `200`.
6. **Decap CMS script loads:** View-source on `/admin/` shows the unpkg.com decap-cms@^3.7.0 script tag.
7. **404 fallback:** `curl -I https://flyed.<sub>.workers.dev/this-page-does-not-exist` returns `404` (Workers does not search upward for `404.html` like Pages did — but the `th-404-copy` Vite plugin ensures `/404.html` and `/th/404.html` exist at the root, so the layout's catch-all handles this).

After verification, the local Playwright suite (`npm run test:e2e`) can be re-run against the live URL by overriding `PLAYWRIGHT_BASE_URL` to confirm no regressions.

## Rollback

If the Workers deployment fails or behaves incorrectly:

1. The Pages project still exists until the user explicitly deletes it (step 4.4 above).
2. If Pages was already deleted and the Workers site is broken, restore Pages by:
   - Reverting the GitHub commit that deleted the `deploy` job and renamed `wrangler.toml`.
   - Recreating the Pages project in the dashboard with the same Git repo.
   - The source code is unchanged, so Pages would deploy identically to before.

This means the migration can be reverted with a single `git revert` + dashboard recreation.

## Open Questions

None. All design decisions are user-approved.

## Next Step

Hand off to writing-plans skill to produce a step-by-step implementation plan.

> **Status (2026-07-05):** Migration is complete and live. See [docs/operations/deployment.md](../../operations/deployment.md) for current operational state.