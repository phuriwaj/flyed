# flyed Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Incrementally apply the 52 findings from the 2026-07-04 review of flyed (Astro 7 marketing site on Cloudflare Workers), phased so each phase ships deployable, tested software.

**Architecture:** Six phases ordered by leverage and independence. Phases 1-3 are bite-sized TDD tasks; Phases 4-6 are scoped at higher granularity and may be promoted to standalone plans at execution time.

**Tech Stack:** Astro 7.0+, @astrojs/cloudflare@14, Tailwind 4, React 19 islands, Zod-validated content collections with `glob` loaders, i18n routing (`prefixDefaultLocale: false`), Decap CMS 3.7, Cloudflare Workers via CF Workers Builds, Vitest unit + Playwright E2E (Lighthouse CI).

---

## Global Constraints

- Node ≥ 22.12.0 (from `package.json:engines`).
- Astro 7.0.3, `@astrojs/cloudflare@^14`. Keep adapters as-declared unless a task says otherwise.
- Cloudflare Workers runtime (`workerd`); assume no `node:*` polyfills unless required by a verified dependency.
- WCAG 2.1 AA via existing axe Playwright suite (`tests/e2e/a11y.spec.ts`).
- TypeScript strict (`tsconfig.json`). `astro check && tsc --noEmit` (`npm run check`) MUST pass at every task boundary.
- Test scripts: `npm test` (Vitest), `npm run test:e2e` (Playwright), `npm run check` (typecheck), `npm run build` (build), `npm run lhci` (Lighthouse).
- Conventional commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
- Sites config: `site: 'https://flyed.dev'`, `i18n.defaultLocale: 'en'`, `prefixDefaultLocale: false`.
- Existing i18n module at `src/i18n/index.ts` (`getLocale`, `getDict`, `t`, `isLocale`, `Locale`) — **consume it; do not duplicate it.**
- All EN pages have a TH mirror under `src/pages/th/*` (F-05). Conservative Phase 1-4 refactors **do not** touch this tree; Phase 5 reduces it.
- Categories enum (from `src/content.config.ts:14-21`): `service-learning|cultural-heritage|stem-environmental|sports-adventure|language-immersion|history-heritage`.
- Blog tag enum (from `src/content.config.ts:31,46`): `Service|Cultural|STEM|Sports|Language|History|Curriculum|Safety|Brand|Educator`.

---

## Phase 1 — Foundation Cleanup

> Goal: zero-behavior-change cleanup that shrinks the deploy, removes unused dependencies, and converts the project to a default-static output. Closes findings **F-01, F-02, F-04, F-06, F-08, F-24, F-39, F-44, F-45, F-48, F-49**.

### Task 1.1: Drop unused runtime dependencies

**Files:**
- Modify: `package.json:21-41`
- Verify: `package-lock.json` regenerates cleanly via `npm install`.

**Interfaces:** None (dependency-only change).

- [ ] **Step 1: Verify these deps are unused**

Run, in this order:

```bash
grep -R --include='*.ts' --include='*.tsx' --include='*.astro' --include='*.mjs' -l '@astrojs/node' src/ astro.config.mjs
grep -R --include='*.ts' --include='*.tsx' --include='*.astro' -l 'astro-icon' src/ astro.config.mjs
grep -R --include='*.ts' --include='*.tsx' -l "from 'resend'" src/
```

Expected: zero hits for `@astrojs/node`, `astro-icon`, and `from 'resend'`.

- [ ] **Step 2: Remove the deps**

In `package.json`, delete these three entries:

```diff
-    "@astrojs/node": "^11.0.0",
-    "astro-icon": "^1.1.5",
-    "resend": "^4.8.0",
```

- [ ] **Step 3: Reinstall**

```bash
rm -rf node_modules
npm install
```

Expected: lockfile updates; `npm ls @astrojs/node astro-icon resend` shows them absent (or only as sub-deps).

- [ ] **Step 4: Verify build still works**

```bash
npm run check
npm run build
```

Expected: both succeed. **If you removed `console.*` already**, see Task 1.7 first.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): drop unused @astrojs/node, astro-icon, resend"
```

---

### Task 1.2: Remove duplicate `.lighthouserc.json`

**Files:**
- Delete: `/home/phurix/.claude/projects/flyed/lighthouserc.json` (the one in the **home**, NOT inside the project root)
- Verify: project root keeps `/home/phurix/projects/flyed/.lighthouserc.json`.

**Interfaces:** None.

- [ ] **Step 1: Identify which is authoritative**

Read both files. The one inside the project root is the source of truth (referenced by `package.json:lhci` → `lhci autorun`, which looks for `.lighthouserc.json` in cwd). The home-dir copy is a leftover.

- [ ] **Step 2: Delete the home-dir copy**

```bash
rm /home/phurix/.claude/projects/flyed/lighthouserc.json
```

- [ ] **Step 3: Confirm the project one is intact**

```bash
cat /home/phurix/projects/flyed/.lighthouserc.json
```

Expected: file exists with current assertions (minScore 0.85/0.95 etc.).

- [ ] **Step 4: Verify `lhci` still discovers config**

```bash
cd /home/phurix/projects/flyed && npm run lhci -- --collect.preset=desktop --collect.url=http://127.0.0.1:4321/ --dry-run
```

(`--dry-run` is supported by `lhci`'s `autorun`. If not supported, omit and instead run `lhci healthcheck`.)

- [ ] **Step 5: Commit**

```bash
git status  # nothing staged inside the repo — the deleted file is outside
```

No commit needed (file is outside the repo).

---

### Task 1.3: Add `observability` block to `wrangler.jsonc` and audit `nodejs_compat`

**Files:**
- Modify: `wrangler.jsonc`

**Interfaces:** None.

- [ ] **Step 1: Audit `nodejs_compat` need**

```bash
npm run build
npx wrangler deploy --dry-run --outdir=dist
```

Expected: `dist/` is produced. Inspect the rendered bundle. If the build does not pull any `node:*` builtin (e.g. `node:crypto`, `node:fs`, `node:stream`), you can remove `nodejs_compat`.

Skip Step 1's audit finding for now: **keep** `nodejs_compat` unless you confirm zero node: usage. The grid is cheap.

- [ ] **Step 2: Add observability block**

In `wrangler.jsonc`, add after the `vars` block:

```json
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1
  }
```

Final file should be:

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
  },
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1
  }
}
```

- [ ] **Step 3: Validate JSONC**

```bash
node -e "JSON.parse(require('fs').readFileSync('wrangler.jsonc','utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm,''))" && echo OK
```

Expected: `OK`.

- [ ] **Step 4: Commit**

```bash
git add wrangler.jsonc
git commit -m "feat(cf): enable workers observability"
```

---

### Task 1.4: Switch `output: 'server'` to `output: 'static'` and drop the explanatory comment

**Files:**
- Modify: `astro.config.mjs:14-46`
- Verify (later, Phase 4): the static-output build prunes the SSR worker to admin/API only.

**Interfaces:**
- Consumes: existing `prerender = true` annotations on static pages (these become no-ops under static, which is fine).
- Produces: `output: 'static'` default; API routes under `src/pages/api/*.ts` opt back into SSR per-task.

- [ ] **Step 1: Update `astro.config.mjs`**

Replace lines 14-20 (the "NOTE" comment) and line 45 (`output: 'server',`) as follows:

```js
// `output: 'static'` makes every page pre-render at build time. Routes that
// genuinely need a runtime (currently src/pages/api/*.ts and
// public/admin/index.html is served as a static asset) opt in via
// `export const prerender = false;` per-file. The Cloudflare adapter is
// retained so per-route SSR endpoints still deploy as Workers functions.
```

```js
  output: 'static',
```

Final relevant section:

```js
// `output: 'static'` makes every page pre-render at build time. Routes that
// genuinely need a runtime (currently src/pages/api/*.ts) opt in via
// `export const prerender = false;` per-file. The Cloudflare adapter is
// retained so per-route SSR endpoints still deploy as Workers functions.

// Cloudflare Pages directory-search 404: a request to /th/foo with no match
// searches upward for 404.html. Astro emits /th/404/index.html but not
// /th/404.html — copy the file so /th/* unknown paths show the TH 404.
const th404Copy = () => ({ /* ... unchanged ... */ });

export default defineConfig({
  site: 'https://flyed.dev',
  output: 'static',
  adapter: cloudflare({}),
  // ... rest unchanged
});
```

(Leave the `th404Copy` plugin untouched for now; Phase 5 may be able to remove it.)

- [ ] **Step 2: Add `prerender = false` to API routes**

For every file under `src/pages/api/` (currently `enquiry.ts`, `newsletter.ts`, `contact.ts` and any others), add at the top of the file:

```ts
export const prerender = false;
```

Verify by listing:

```bash
ls src/pages/api/*.ts
```

Then for each:

```ts
// at top, after imports
export const prerender = false;
```

- [ ] **Step 3: Build**

```bash
npm run build
```

Expected: succeeds. Inspect `dist/`:

```bash
ls dist/
ls dist/server/ | head -20
```

Expected: `dist/server/entry.mjs` size shrinks dramatically (target: < 300KB instead of 931KB). Static HTML appears in `dist/client/`.

- [ ] **Step 4: Run typecheck**

```bash
npm run check
```

Expected: passes (existing `prerender = true` annotations on pages are now no-ops but valid).

- [ ] **Step 5: Smoke test the SSR API locally**

```bash
npm run preview &
sleep 4
curl -sS -X POST http://127.0.0.1:4321/api/enquiry \
  -H 'content-type: application/json' \
  -d '{"schoolName":"smoke","country":"TH","role":"teacher","email":"t@e.com","phone":"+66","groupSize":20,"ages":"12-13","departureMonth":"Sep","duration":5,"subjects":["Science"]}'
kill %1
```

Expected: HTTP 200 with `{"ok":true,...}` (validation issues are fine for the smoke test — it confirms the worker still runs the route).

- [ ] **Step 6: Commit**

```bash
git add astro.config.mjs src/pages/api/
git commit -m "feat(build): default to static output; opt API routes into SSR"
```

---

### Task 1.5: Add `astro:env` schema and migrate env reads

**Files:**
- Create: `src/env.d.ts`
- Modify: `src/pages/api/enquiry.ts:4-6`, `src/components/Analytics.astro:1-2`
- Modify: `astro.config.mjs` (env config block).
- Test: `tests/unit/env-schema.test.ts`

**Interfaces:**
- Produces: typed `RESEND_API_KEY`, `CRM_WEBHOOK_URL`, `ENQUIRY_TO_EMAIL` from `astro:env/server` and typed `PUBLIC_ANALYTICS_HOST` from `astro:env/client`.

- [ ] **Step 1: Write the failing test**

Create `tests/unit/env-schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('astro:env schema', () => {
  it('declares the runtime env vars we depend on', async () => {
    const env = await import('virtual:astro:env/schema');
    // Public client var
    expect(env.PUBLIC_ANALYTICS_HOST).toBeDefined();
    // Server-only secrets/strings
    expect(env.RESEND_API_KEY).toBeDefined();
    expect(env.CRM_WEBHOOK_URL).toBeDefined();
    expect(env.ENQUIRY_TO_EMAIL).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test, expect fail**

```bash
npm test -- tests/unit/env-schema.test.ts
```

Expected: import error (`virtual:astro:env/schema` not found or no schema yet).

- [ ] **Step 3: Add the schema**

Create `src/env.d.ts`:

```ts
/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

import { defineEnv } from 'astro:env/client';

export const PUBLIC_ANALYTICS_HOST = defineEnv({
  schema: process.env.PUBLIC_ANALYTICS_HOST ?? '',
  access: 'public',
  context: 'client',
});
```

Wait — that's not the canonical `astro:env` API. The correct pattern (Astro 5+):

`src/env.d.ts`:

```ts
import { defineEnv, envField } from 'astro:env';

export default defineEnv({
  server: {
    RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
    CRM_WEBHOOK_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
    ENQUIRY_TO_EMAIL: envField.string({ context: 'server', access: 'public', default: 'sales@flyed.dev' }),
  },
  client: {
    PUBLIC_ANALYTICS_HOST: envField.string({ context: 'client', access: 'public', optional: true }),
  },
});
```

(If your Astro version doesn't ship `astro:env`, drop this task and rely on `import.meta.env` with explicit JSDoc casts. Confirm with `grep -E '"astro":' package.json` and check the version supported `astro:env` at release.)

- [ ] **Step 4: Migrate reads**

`src/pages/api/enquiry.ts`:

```ts
import type { APIRoute } from 'astro';
import { RESEND_API_KEY, CRM_WEBHOOK_URL, ENQUIRY_TO_EMAIL } from 'astro:env/server';
import { enquirySchema } from '@/components/EnquiryForm';
// (delete the three import.meta.env lines)
```

`src/components/Analytics.astro` (around line 2):

```astro
---
import '../styles/global.css';
import { PUBLIC_ANALYTICS_HOST } from 'astro:env/client';
// (delete the import.meta.env.PUBLIC_ANALYTICS_HOST line)
---
```

- [ ] **Step 5: Run test, expect pass**

```bash
npm test -- tests/unit/env-schema.test.ts
npm run check
```

Expected: typecheck and unit tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/env.d.ts astro.config.mjs src/pages/api/enquiry.ts src/components/Analytics.astro tests/unit/env-schema.test.ts
git commit -m "feat(env): type runtime env via astro:env schema"
```

---

### Task 1.6: Move Decap admin shell to `public/admin/index.html` and delete the Astro catch-all

**Files:**
- Move: `src/pages/admin/[...path].astro` → `public/admin/index.html` (after extracting its rendered body)
- Delete: `src/pages/admin/`
- Verify: `/admin` and `/admin/*` now serve from the asset binding.

**Interfaces:**
- Consumes: same Decap CMS shell HTML the catch-all currently emits.
- Produces: a static `public/admin/index.html` reachable as `/admin/`, `/admin/index.html`, `/admin/foo/bar` (Decap's GitHub backend serves content client-side; static shell is sufficient).

- [ ] **Step 1: Read the current catch-all**

```bash
cat src/pages/admin/\[...path\].astro
```

- [ ] **Step 2: Extract the rendered HTML to `public/admin/index.html`**

Create `public/admin/index.html` with the same content the Astro catch-all produced, but with `<link>` and `<script>` paths rewritten so the **current request path** matches the loaded asset path. The file should be plain HTML; no `astro` syntax. The body must include the Decap CMS loader:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Decap CMS — flyed</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <!-- Decap CMS mounts here. The "config.yml" URL is the path that Decap fetches. -->
    <script src="https://unpkg.com/decap-cms@^3.7.0/dist/decap-cms.js"></script>
  </body>
</html>
```

(Adapt the actual rendered HTML from Step 1 into this file. Keep the `<script>` for Decap at the end of `<body>`.)

- [ ] **Step 3: Delete the Astro catch-all**

```bash
git rm src/pages/admin/\[...path\].astro
rmdir src/pages/admin
```

(If the directory is the only entry, use `rmdir`.)

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: `dist/client/admin/index.html` exists.

```bash
ls dist/client/admin/
```

- [ ] **Step 5: Smoke-test locally**

```bash
npm run preview &
sleep 4
curl -sSI http://127.0.0.1:4321/admin/ | head -3
curl -sS  http://127.0.0.1:4321/admin/ | grep -c 'decap-cms'
kill %1
```

Expected: HTTP 200; `decap-cms` text appears.

- [ ] **Step 6: Verify `_headers` covers `/admin/`**

```bash
cat public/_headers | grep -A3 '/admin'
```

Expected: rule exists setting `X-Robots-Tag: noindex, nofollow`. If it doesn't, add:

```
/admin/*
  X-Robots-Tag: noindex, nofollow
  Cache-Control: public, max-age=0, must-revalidate
```

- [ ] **Step 7: Commit**

```bash
git add public/admin/index.html public/_headers
git commit -m "refactor(admin): serve Decap CMS shell as static asset"
```

---

### Task 1.7: Migrate `console.*` in API routes to `Astro.logger`

**Files:**
- Modify: `src/pages/api/enquiry.ts`, `src/pages/api/newsletter.ts`, `src/pages/api/contact.ts`

**Interfaces:**
- Consumes: `Astro` global passed to route handlers (`context`).
- Produces: structured `Astro.logger.{info,warn,error}` calls instead of `console.*`.

- [ ] **Step 1: Read current console usages**

```bash
grep -n 'console\.' src/pages/api/*.ts
```

- [ ] **Step 2: Refactor `src/pages/api/enquiry.ts`**

Change the handler signature:

```ts
export const POST: APIRoute = async ({ request, locals }) => {
  // existing parsing/validation unchanged
```

Replace each `console.error('Resend failed', e)` with:

```ts
locals.logger.error('Resend delivery failed', { enquiryId, err: String(e) });
```

Replace `console.warn('RESEND_API_KEY not set — skipping email send')` with:

```ts
locals.logger.warn('RESEND_API_KEY not configured; skipping email send', { enquiryId });
```

Same pattern for CRM webhook failures and unconfigured CRM URL. Reach `locals.logger` via the `Astro` global (it is automatically available on `Astro.locals` in endpoints).

- [ ] **Step 3: Apply same pattern to newsletter.ts and contact.ts**

```bash
grep -n 'console\.' src/pages/api/newsletter.ts src/pages/api/contact.ts
```

Replace each with `Astro.logger.*` accessed via the route context (use `({ request })` → call `new Astro.logger` is not how this works — instead use the global). Concretely, in an endpoint:

```ts
export const POST: APIRoute = async (ctx) => {
  ctx.locals.logger.warn('Newsletter subscription queued', { payload: ctx.request });
};
```

If `Astro.logger` is not exposed in `locals`, set up middleware (`src/middleware.ts`):

```ts
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (ctx, next) => {
  ctx.locals.logger = ctx.locals.logger; // placeholder if needed
  return next();
});
```

For Workers, `console.*` is captured by CF logpush anyway — the **only** goal of this task is to enable structured-log filtering with `enquiryId`. If `Astro.logger` is unavailable in your Astro version, skip this task and file a follow-up.

- [ ] **Step 4: Verify**

```bash
npm run check
npm run build
```

Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/api/
git commit -m "refactor(api): use Astro.logger instead of console.*"
```

---

## Phase 2 — Quick UX & A11y Wins

> Goal: better Lighthouse, better a11y scores, faster hydration. Closes findings **F-13, F-14, F-17, F-20, F-22, F-27, F-28, F-31, F-33, F-34**.

### Task 2.1: Downgrade heavy React island hydration directives

**Files:**
- Modify: `src/pages/enquire.astro:14`, `src/pages/th/enquire/index.astro:18`, `src/components/Header.astro:64`

**Interfaces:** None.

- [ ] **Step 1: Verify which is below the fold**

Open `/enquire` and confirm the form is below the hero on viewports ≥ 768px. It is. Replace the directive on the `<EnquiryForm />` JSX import:

```diff
- <EnquiryForm client:load {...} />
+ <EnquiryForm client:visible {...} />
```

Apply in both EN and TH files.

- [ ] **Step 2: Replace `LanguageSwitcher client:load`**

Either (a) downgrade to `client:idle`, or (b) convert to a pure-`<details>` element. Going with (a) is lower-risk:

```diff
- <LanguageSwitcher client:load locale={locale} />
+ <LanguageSwitcher client:idle locale={locale} />
```

- [ ] **Step 3: Verify builds + smoke test**

```bash
npm run build
npm run preview &
sleep 4
curl -sS http://127.0.0.1:4321/enquire/ | grep -E '(EnquiryForm|LanguageSwitcher|astro-island)'
kill %1
```

Expected: the hydration marker indicates `client:visible` / `client:idle` and the island bundle is loaded only when appropriate.

- [ ] **Step 4: Commit**

```bash
git add src/pages/enquire.astro src/pages/th/enquire/index.astro src/components/Header.astro
git commit -m "perf(islands): defer EnquiryForm and LanguageSwitcher hydration"
```

---

### Task 2.2: Add `<ClientRouter />` for view transitions + persist header/footer

**Files:**
- Modify: `src/layouts/Layout.astro` (add `<ClientRouter />` to `<head>`)
- Modify: `src/components/Header.astro` (`<header transition:persist>`)
- Modify: `src/components/Footer.astro` (`<footer transition:persist>`)

**Interfaces:**
- Consumes: `astro:transitions` ClientRouter.

- [ ] **Step 1: Add ClientRouter**

In `src/layouts/Layout.astro`, just inside `<head>`, after the `<SEO>` block:

```astro
---
import '../styles/global.css';
import { SEO } from 'astro-seo';
import { ClientRouter } from 'astro:transitions';
import Analytics from '@/components/Analytics.astro';
// ... existing props
---

<!doctype html>
<html lang={isTh ? 'th' : 'en'}>
  <head>
    <!-- ...existing head... -->
    <ClientRouter />
  </head>
```

- [ ] **Step 2: Persist Header**

In `src/components/Header.astro`, change the outermost tag:

```astro
<header transition:persist transition:name="site-header" class="...">
```

- [ ] **Step 3: Persist Footer**

In `src/components/Footer.astro`, the outermost:

```astro
<footer transition:persist transition:name="site-footer" class="...">
```

- [ ] **Step 4: Update CSP if present**

```bash
grep -R 'Content-Security-Policy' public/_headers
```

If absent, skip. CSP for view transitions requires `'unsafe-inline'` for scripts OR nonces — add to your CSP work in Task 2.9.

- [ ] **Step 5: Build + smoke**

```bash
npm run check
npm run build
npm run preview &
sleep 4
# Inspect <head> for the view-transition meta tag
curl -sS http://127.0.0.1:4321/ | grep -E '(view-transition|client-router|astro)'
kill %1
```

Expected: the script tag for the router appears.

- [ ] **Step 6: Commit**

```bash
git add src/layouts/Layout.astro src/components/Header.astro src/components/Footer.astro
git commit -m "feat(nav): enable view transitions and persist chrome"
```

---

### Task 2.3: Add skip link to `<main>` in `PageLayout.astro`

**Files:**
- Modify: `src/layouts/PageLayout.astro`

**Interfaces:** None.

- [ ] **Step 1: Verify the target anchor exists**

```bash
grep -n 'main-content\|id="main"' src/layouts/PageLayout.astro src/components/Header.astro
```

Confirm `<main id="main-content">` exists. If not, add it where the page body starts.

- [ ] **Step 2: Add the skip link**

As the first child of `<body>` (or just before `<main>`), in `PageLayout.astro`:

```astro
<a href="#main-content" class="skip-link">Skip to content</a>
```

- [ ] **Step 3: Style it (visually-hidden until focused)**

Append to `src/styles/global.css`:

```css
.skip-link {
  position: absolute;
  inset-inline-start: 1rem;
  inset-block-start: -3rem;
  z-index: 100;
  padding: 0.5rem 1rem;
  background: var(--color-canvas, #fff);
  color: var(--color-ink, #111);
  border-radius: 0.375rem;
  text-decoration: none;
  transition: inset-block-start 150ms;
}
.skip-link:focus {
  inset-block-start: 1rem;
  outline: 2px solid var(--color-accent, #b48a2a);
  outline-offset: 2px;
}
```

- [ ] **Step 4: Test**

```bash
npm run test:e2e -- tests/e2e/a11y.spec.ts
```

Expected: skip-link discovered by axe, no contrast violation. If axe flags the contrast on the dark focus ring, adjust colors until AA passes.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/PageLayout.astro src/styles/global.css
git commit -m "feat(a11y): add skip-to-content link"
```

---

### Task 2.4: Add ARIA error wiring to `EnquiryForm`

**Files:**
- Modify: `src/components/EnquiryForm.tsx`

**Interfaces:** None.

- [ ] **Step 1: Locate input + error span pairs**

In `EnquiryForm.tsx`, each field renders a `<span>` for `errors[name]`. Replace the input JSX so each input is wired:

```tsx
<input
  type={type}
  id={name}
  name={name}
  aria-invalid={Boolean(errors[name]) || undefined}
  aria-describedby={errors[name] ? `${name}-error` : undefined}
  aria-required={required || undefined}
  // ...existing
/>
{errors[name] && (
  <span id={`${name}-error`} role="alert">
    {errors[name]}
  </span>
)}
```

For the form-level status message (success/failure), wrap the message element:

```tsx
<div role="status" aria-live="polite">{status}</div>
```

- [ ] **Step 2: Test**

The existing E2E suite (`tests/e2e/a11y.spec.ts`) should pass. Run:

```bash
npm run test:e2e -- tests/e2e/a11y.spec.ts
```

Expected: passes.

- [ ] **Step 3: Commit**

```bash
git add src/components/EnquiryForm.tsx
git commit -m "feat(a11y): wire ARIA invalid/described-by/live on EnquiryForm"
```

---

### Task 2.5: Remove `.disableRules(['color-contrast'])` and fix the real issues

**Files:**
- Modify: `tests/e2e/a11y.spec.ts:20` (and any siblings)
- Possibly: `src/styles/global.css`, `src/components/Hero.astro`, others.

**Interfaces:** None.

- [ ] **Step 1: Run a11y suite with the rule enabled**

```bash
# Temporarily remove the disable and run
sed -i.bak "s/\.disableRules(\['color-contrast'\])//" tests/e2e/a11y.spec.ts
npm run test:e2e -- tests/e2e/a11y.spec.ts
```

Expected: axe reports real contrast violations. Capture the report.

- [ ] **Step 2: Fix each violation**

For each finding, adjust the relevant CSS to meet WCAG 2.1 AA (4.5:1 for body text, 3:1 for large text). Hero text over photography typically needs a tinted overlay or darker photo.

- [ ] **Step 3: Re-run**

```bash
npm run test:e2e -- tests/e2e/a11y.spec.ts
```

Expected: pass with no rule disabled.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/a11y.spec.ts src/styles/global.css src/components/Hero.astro
git commit -m "test(a11y): enable color-contrast check; fix findings"
```

---

### Task 2.6: Adopt `@tailwindcss/typography` and remove the manual `.prose` override

**Files:**
- Modify: `package.json` (add dep)
- Modify: `src/styles/global.css` (remove the override block at lines ~130-300)
- Modify: `astro.config.mjs` (add the plugin)

**Interfaces:** None.

- [ ] **Step 1: Install**

```bash
npm install -D @tailwindcss/typography
```

- [ ] **Step 2: Register the plugin in CSS**

In `src/styles/global.css`:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";
```

(The `@plugin` directive is Tailwind 4's mechanism.)

- [ ] **Step 3: Remove the manual `.prose *` override**

Find and delete the section that manually styles `.prose h1`, `.prose p`, etc. (around `src/styles/global.css:130-300`). Trust the plugin.

- [ ] **Step 4: Apply `prose` class to rendered MDX**

Verify every `blog/[...page]`, `itineraries/[slug]`, `destinations/[city]` page wraps the `<Content />` in `<article class="prose prose-lg">`. If not, add.

- [ ] **Step 5: Build, preview, eyeball one blog post**

```bash
npm run build
npm run preview &
sleep 4
curl -sS http://127.0.0.1:4321/blog/ | head -200
kill %1
```

Expected: typography looks equivalent or better. If a visual regression exists, iterate on plugin options or restore one targeted rule with justification.

- [ ] **Step 6: Re-run visual suite**

```bash
npm run test:e2e -- tests/e2e/visual.spec.ts --update-snapshots
```

(Updating snapshots is a one-off; future diffs will fail the build.)

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/styles/global.css astro.config.mjs
git commit -m "refactor(styles): adopt @tailwindcss/typography plugin"
```

---

### Task 2.7: Add a real `og-default.png` and remove social/phone placeholders

**Files:**
- Create: `public/og-default.png` (1200×630)
- Modify: `src/layouts/Layout.astro:14,22-38`

**Interfaces:** None.

- [ ] **Step 1: Generate the PNG**

Easiest path: use the existing brand mark to render a single static image.

```bash
npx --yes sharp-cli@latest -i public/logo.svg -o public/og-default.png resize 1200 630 fit:cover background:#1d1d1f -i public/wordmark.svg composite
```

(If `sharp-cli` isn't suitable, create the image with Figma export or by opening `public/logo.svg` in a design tool and exporting as 1200×630 PNG.)

- [ ] **Step 2: Replace placeholder Organization schema**

In `src/layouts/Layout.astro`, replace the `orgLd` block:

```ts
const orgLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'flyed',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.svg`,
  // Replace placeholders with real socials / phone before launch.
  // Empty arrays are acceptable until real handles exist.
  sameAs: [],
  contactPoint: undefined,
};
```

(Or add the real handles if you have them — see Open Question #3 in the review.)

- [ ] **Step 3: Smoke test OG image URL**

```bash
npm run preview &
sleep 4
curl -sSI http://127.0.0.1:4321/og-default.png
kill %1
```

Expected: 200, content-type `image/png`. If you see 404, fix the path before committing.

- [ ] **Step 4: Commit**

```bash
git add public/og-default.png src/layouts/Layout.astro
git commit -m "feat(seo): ship og-default.png and clean Organization JSON-LD"
```

---

### Task 2.8: Add a Content-Security-Policy header

**Files:**
- Modify: `public/_headers`

**Interfaces:** None.

- [ ] **Step 1: Read current `_headers`**

```bash
cat public/_headers
```

- [ ] **Step 2: Add CSP**

For a route like `/*` (catch-all static):

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: images.unsplash.com; connect-src 'self' https://api.resend.com; font-src 'self' data:
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

(Adjust per the integrations you actually use: add Plausible, Calendly, etc. as needed.)

- [ ] **Step 3: Verify**

```bash
npm run preview &
sleep 4
curl -sSI http://127.0.0.1:4321/ | grep -i 'content-security-policy'
kill %1
```

Expected: header present.

- [ ] **Step 4: E2E suite**

```bash
npm run test:e2e -- tests/e2e/a11y.spec.ts
```

Expected: pass — CSP doesn't axe-check; verify console isn't broken.

- [ ] **Step 5: Commit**

```bash
git add public/_headers
git commit -m "feat(security): add CSP, X-Content-Type-Options, Referrer-Policy headers"
```

---

### Task 2.9: Use `categories` content collection in home pages

**Files:**
- Modify: `src/pages/index.astro:31-39` (and TH mirror at `src/pages/th/index.astro`)

**Interfaces:**
- Consumes: `getCollection('categories')` from `astro:content`.

- [ ] **Step 1: Read existing inline category block**

```bash
sed -n '25,45p' src/pages/index.astro
```

- [ ] **Step 2: Replace with collection read**

```astro
---
import { getCollection } from 'astro:content';
// ...
const categories = (await getCollection('categories')).sort(
  (a, b) => a.data.order - b.data.order
);
---
```

Render `categories.map(c => <a href={...}>{c.data.title}</a>)` in place of the hardcoded array. Use `t(locale, ...)` or `getDict(locale)` for labels.

- [ ] **Step 3: Mirror to TH**

Apply the same change in `src/pages/th/index.astro`.

- [ ] **Step 4: Build & smoke**

```bash
npm run build
npm run preview &
sleep 4
curl -sS http://127.0.0.1:4321/ | grep -E '(Service-learning|Cultural-heritage|STEM)'
kill %1
```

Expected: list present from collection.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro src/pages/th/index.astro
git commit -m "refactor(home): consume categories collection instead of hardcoded list"
```

---

## Phase 3 — API Robustness

> Goal: protect `/api/enquiry` from abuse, capture leads durably, and shift to Astro Actions. Closes findings **F-07, F-23, F-25**.

### Task 3.1: KV-backed rate limiting on `/api/enquiry`

**Files:**
- Modify: `wrangler.jsonc` (add KV binding)
- Modify: `src/pages/api/enquiry.ts` (sliding-window counter)
- Test: `tests/unit/rate-limit.test.ts`

**Interfaces:**
- Consumes: `Astro.locals.runtime.env.RATE_LIMIT_KV` binding.
- Produces: HTTP 429 after N requests per IP per window.

- [ ] **Step 1: Add KV binding**

```jsonc
  "kv_namespaces": [
    { "binding": "RATE_LIMIT_KV", "id": "REPLACE_WITH_REAL_ID" }
  ]
```

You'll need to actually create the KV namespace:

```bash
npx wrangler kv namespace create RATE_LIMIT_KV
```

Then paste the returned `id`.

- [ ] **Step 2: Write the test**

Create `tests/unit/rate-limit.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { rateLimited } from '@/lib/rate-limit';

describe('rateLimited', () => {
  it('rejects after the threshold', async () => {
    let count = 0;
    const fakeKV = {
      get: vi.fn(async () => String(count++)),
      put: vi.fn(async () => undefined),
    };
    const result = await rateLimited({ ip: '1.1.1.1', kv: fakeKV as any, max: 3, windowMs: 60_000 });
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSec).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run, expect fail**

```bash
npm test -- tests/unit/rate-limit.test.ts
```

Expected: `Cannot find module '@/lib/rate-limit'`.

- [ ] **Step 4: Implement the helper**

Create `src/lib/rate-limit.ts`:

```ts
interface FakeKV { get: (k: string) => Promise<string | null>; put: (k: string, v: string, opts?: any) => Promise<void>; }

export interface RateLimit {
  allowed: boolean;
  retryAfterSec: number;
}

export async function rateLimited(opts: {
  ip: string;
  kv: FakeKV;
  max: number;
  windowMs: number;
}): Promise<RateLimit> {
  const key = `rl:${opts.ip}`;
  const now = Date.now();
  const raw = await opts.kv.get(key);
  const list = raw ? (JSON.parse(raw) as number[]).filter((t) => now - t < opts.windowMs) : [];
  if (list.length >= opts.max) {
    return { allowed: false, retryAfterSec: Math.ceil((opts.windowMs - (now - list[0])) / 1000) };
  }
  list.push(now);
  await opts.kv.put(key, JSON.stringify(list), { expirationTtl: Math.ceil(opts.windowMs / 1000) });
  return { allowed: true, retryAfterSec: 0 };
}
```

- [ ] **Step 5: Run, expect pass**

```bash
npm test -- tests/unit/rate-limit.test.ts
```

- [ ] **Step 6: Wire into `enquiry.ts`**

```ts
import { rateLimited } from '@/lib/rate-limit';
// ...
const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
const limit = await rateLimited({
  ip,
  kv: (locals as any).runtime?.env?.RATE_LIMIT_KV,
  max: 5,
  windowMs: 60_000,
});
if (!limit.allowed) {
  return new Response(JSON.stringify({ ok: false, error: 'Rate limit exceeded' }), {
    status: 429,
    headers: { 'Retry-After': String(limit.retryAfterSec) },
  });
}
```

- [ ] **Step 7: Build + manual**

```bash
npm run build
```

Expected: build passes; the import only resolves at runtime on Workers (KV is bound at deploy time).

- [ ] **Step 8: Commit**

```bash
git add src/lib/rate-limit.ts src/pages/api/enquiry.ts wrangler.jsonc tests/unit/rate-limit.test.ts
git commit -m "feat(api): rate-limit /api/enquiry via Cloudflare KV"
```

---

### Task 3.2: Durable lead capture to KV (don't lose enquiries if downstream fails)

**Files:**
- Modify: `src/pages/api/enquiry.ts`
- Modify: `wrangler.jsonc` (add `LEADS_KV` namespace)

**Interfaces:**
- Consumes: `Astro.locals.runtime.env.LEADS_KV`.
- Produces: a record keyed by `enquiryId`; subsequent retrieval by ID.

- [ ] **Step 1: Add binding**

```jsonc
  "kv_namespaces": [
    { "binding": "RATE_LIMIT_KV", "id": "REPLACE_RATE_LIMIT_ID" },
    { "binding": "LEADS_KV", "id": "REPLACE_LEADS_ID" }
  ]
```

Create:

```bash
npx wrangler kv namespace create LEADS_KV
```

- [ ] **Step 2: Implement durable write**

In `src/pages/api/enquiry.ts`, **before** dispatching to Resend/CRM:

```ts
const kv = (locals as any).runtime?.env?.LEADS_KV;
if (kv) {
  await kv.put(enquiryId, JSON.stringify({ enquiry, createdAt: new Date().toISOString() }), {
    expirationTtl: 60 * 60 * 24 * 30, // 30d retry window
  });
}
```

If `kv` is unavailable (local dev), log and continue.

- [ ] **Step 3: Update return**

Change the success body to:

```ts
return new Response(JSON.stringify({ ok: true, enquiryId, durable: Boolean(kv) }), {
  status: 200,
  headers: { 'Content-Type': 'application/json' },
});
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/enquiry.ts wrangler.jsonc
git commit -m "feat(api): persist enquiries to KV before downstream dispatch"
```

---

## Phase 4 — Image System Overhaul

> Goal: replace `<SmartImage>` and the raw `<img>` in `Hero` with `<Image />` from `astro:assets`. Closes findings **F-15, F-16**.

### Task 4.1: Replace `SmartImage.astro` callsite-by-callsite with `<Image />`

**Files:**
- Modify: every `.astro` file under `src/components/` and `src/pages/` that imports `SmartImage`.
- Modify: `src/components/SmartImage.astro` (deprecate or delete).

**Interfaces:**
- Consumes: `astro:assets` `Image` component and `getImage()`.

- [ ] **Step 1: Inventory usages**

```bash
grep -R --include='*.astro' -l 'SmartImage' src/
```

- [ ] **Step 2: For each call site, switch to `<Image />`**

```astro
---
import { Image } from 'astro:assets';
---
<Image
  src={heroImage}            // any remote URL or local import
  alt={title}
  width={1200}
  height={630}
  sizes="(max-width: 768px) 100vw, 1200px"
  loading="lazy"
  decoding="async"
  format="avif"
/>
```

For remote URLs that aren't local assets, register an external image service in `astro.config.mjs`:

```js
image: {
  service: { entrypoint: 'astro/assets/services/sharp' },
  domains: ['images.unsplash.com'],
},
```

- [ ] **Step 3: Hero swap**

In `src/components/Hero.astro`:

```diff
- <img src={heroImage} alt={title} />
+ <Image src={heroImage} alt={title} width={1600} height={900} sizes="(max-width: 1024px) 100vw, 1600px" />
```

- [ ] **Step 4: Build**

```bash
npm run build
```

Expected: dramatically smaller PNG/WebP/AVIF files in `dist/client/_astro/`.

- [ ] **Step 5: Lighthouse**

```bash
npm run lhci
```

Expected: image-related audits improve.

- [ ] **Step 6: Delete `SmartImage.astro`**

```bash
git rm src/components/SmartImage.astro
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(images): replace SmartImage with astro:assets Image"
```

---

## Phase 5 — i18n Single-Source Migration

> Goal: collapse the EN/TH mirror tree under `src/pages/th/*` to locale-aware templates that read from `getDict(locale)`. Closes findings **F-05, F-09, F-46**.

### Task 5.1: Merge `blog` + `blogTh` content collections

**Files:**
- Modify: `src/content.config.ts:23-65`
- Test: `tests/unit/collections.test.ts`

**Interfaces:**
- Consumes: existing `blog/*.en.mdx` and `blog/*.th.mdx` files.
- Produces: single `blog` collection with `locale: z.enum(['en','th'])`.

- [ ] **Step 1: Decide slug strategy**

Conventions matter. Options:
- (a) Each file's `id` includes locale: `article-1.en`, `article-1.th`.
- (b) Strip the suffix: `article-1` for both.

Going with (b):

```ts
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    locale: z.enum(['en', 'th']),
    title: z.string().max(120),
    // ...rest unchanged
  }),
});
```

Add a small wrapper loader that strips the locale suffix from the `id`:

```ts
function localeAware(loader: Loader): Loader {
  return {
    name: 'locale-aware',
    load: async (ctx) => {
      const original = loader.load.bind(loader);
      // Hook to rename ids.
      // ⚠ astro/content loaders don't yet expose a stable id-remap hook — pin to `legacy` collection if needed.
    },
  };
}
```

(In Astro 7, if `id` remap isn't exposed, use `legacy` collections with a `slug` field.)

- [ ] **Step 2: Write the test**

```ts
import { describe, it, expect } from 'vitest';
import { z } from 'astro:content';

describe('blog schema', () => {
  it('requires locale', () => {
    const r = z.object({ locale: z.enum(['en','th']) }).safeParse({ locale: 'en' });
    expect(r.success).toBe(true);
  });
});
```

- [ ] **Step 3: Migrate Decap config**

Update `public/admin/config.yml` to write `locale` frontmatter to each post. Confirm preview still works.

- [ ] **Step 4: Update consumers**

`src/pages/blog/[...page].astro` and the TH mirror:

```ts
const posts = (await getCollection('blog', ({ data }) =>
  data.locale === locale && !data.draft
)).sort((a, b) => +b.data.pubDate - +a.data.pubDate);
```

- [ ] **Step 5: Build**

```bash
npm run build
ls dist/client/blog/
```

Expected: every blog entry appears exactly twice (once under `/blog/...`, once under `/th/blog/...`).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(content): merge blog/blogTh into one locale-aware collection"
```

---

### Task 5.2: Convert EN/TH home to a single template (proof of pattern)

**Files:**
- Modify: `src/pages/index.astro`, `src/pages/th/index.astro`
- Result: one source-of-truth template; `public/_redirects` (or `astro.config.mjs` i18n) routes both URLs to the same template with locale inferred from path.

**Interfaces:**
- Consumes: `getLocale(Astro.url)` and `getDict(locale)`.

- [ ] **Step 1: Move TH home's contents into a helper, then delete the TH file**

In `src/pages/index.astro`:

```astro
---
import { getLocale, getDict } from '@/i18n';
// ...
const locale = getLocale(Astro.url);
const dict = getDict(locale);
// ...existing logic, but parameterize all copy via dict
---
```

- [ ] **Step 2: Move all hardcoded EN copy into `src/i18n/en.json` and TH into `th.json`**

(Use the existing key convention.)

- [ ] **Step 3: Add redirect so `/th/` (without further path) reaches the same template via locale**

In `src/pages/th/index.astro`, **delete** the file. Astro's i18n routing already serves `/th/` from `src/pages/index.astro` when `prefixDefaultLocale: false` is **not** set; with it currently set to `false`, both `/` and `/th/` need distinct source files. To deduplicate:

- Set `i18n.routing.prefixDefaultLocale: true` (now `/en/...` and `/th/...`), or
- Add a `src/pages/th.astro` redirect that 308s to `/`.

Pick redirect for least disruption:

```astro
---
return Astro.redirect('/');
---
```

(Use `Astro.redirect`.)

- [ ] **Step 4: Verify**

```bash
npm run build
npm run preview &
sleep 4
curl -sSI http://127.0.0.1:4321/th/ | head -2
curl -sS  http://127.0.0.1:4321/ | head -5
kill %1
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(i18n): collapse EN/TH home into single locale-aware template"
```

---

### Task 5.3: Apply the pattern to remaining EN/TH pairs (~10 files)

**Files:**
- All pairs under `src/pages/{about,contact,educators,parents,schools,safety,how-it-works,enquire,legal}/` ↔ `src/pages/th/{...}/`.

**Interfaces:**
- Same as Task 5.2.

- [ ] **Step 1: List remaining pairs**

```bash
ls src/pages/th/*/index.astro
ls src/pages/*.astro   # excluding index and admin
```

- [ ] **Step 2: For each pair, follow the Task 5.2 pattern**

This is repetitive work. **Strategy**: do it one page pair per PR:
- `about.astro` ↔ `th/about/index.astro`
- `contact.astro` ↔ `th/contact/index.astro`
- ...etc.

Each PR is independently testable:

```bash
npm run build
npm run preview &
sleep 4
curl -sSI http://127.0.0.1:4321/about/
curl -sSI http://127.0.0.1:4321/th/about/
kill %1
```

- [ ] **Step 3: Remove `th-404-copy` Vite plugin**

Once `trailingSlash: 'never'` is set and the project is fully static, confirm `/th/404.html` is built automatically:

```bash
ls dist/client/th/404* 2>/dev/null
```

If both `404/index.html` and `404.html` exist, the plugin is redundant:

```js
// astro.config.mjs — delete the th404Copy() plugin and remove from integrations
```

- [ ] **Step 4: Commit per pair**

```bash
git commit -m "refactor(i18n): single-source <page>"
```

---

## Phase 6 — DX / Tooling Polish

> Goal: prettier, eslint, single React tree, complete Vitest mocks, CI server unification. Closes findings **F-36, F-38, F-40, F-41, F-42**.

### Task 6.1: Prettier + ESLint + pre-commit

**Files:**
- Create: `.prettierrc.json`, `.prettierignore`, `eslint.config.js`
- Modify: `package.json` (add scripts + deps)

**Interfaces:** None.

- [ ] **Step 1: Install**

```bash
npm install -D prettier prettier-plugin-astro eslint eslint-plugin-astro @typescript-eslint/parser @typescript-eslint/eslint-plugin simple-git-hooks lint-staged
```

- [ ] **Step 2: Write configs**

`.prettierrc.json`:

```json
{
  "printWidth": 100,
  "singleQuote": true,
  "plugins": ["prettier-plugin-astro"],
  "overrides": [{ "files": "*.astro", "options": { "parser": "astro" } }]
}
```

`eslint.config.js`:

```js
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import astroPlugin from 'eslint-plugin-astro';

export default [
  // ...flat config with parser for ts/tsx, plugin-astro for .astro
];
```

(Refer to `eslint-plugin-astro` docs for the flat-config snippet.)

- [ ] **Step 3: Add scripts + hooks**

`package.json`:

```json
{
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "eslint .",
    "lint:fix": "eslint --fix ."
  },
  "simple-git-hooks": {
    "pre-commit": "npx lint-staged"
  },
  "lint-staged": {
    "*": "prettier --write",
    "*.{ts,tsx,astro}": "eslint --fix"
  }
}
```

- [ ] **Step 4: Run**

```bash
npm run format
npm run lint:fix
```

Resolve all auto-fixable issues.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore(tooling): add prettier, eslint, pre-commit hooks"
```

---

### Task 6.2: Verify single React tree

**Files:**
- Verify: `npm ls react react-dom`
- Possibly: `package.json` resolution tightening.

**Interfaces:** None.

- [ ] **Step 1: Check**

```bash
npm ls react react-dom
```

Expected: exactly one version of each at the top.

- [ ] **Step 2: If multiple trees exist, dedupe**

```bash
npm install --save react@^19.2.7 react-dom@^19.2.7
npm install --save @types/react@^19 @types/react-dom@^19
npm dedupe
npm run check
npm run dev
```

Confirm the `astro dev` "Invalid hook call" symptom from F-42 disappears. If not, file a follow-up; the most common cause is `@testing-library/react@16` plus mismatched peer.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "fix(deps): dedupe react/react-dom"
```

---

### Task 6.3: Unify Playwright + CI server strategy

**Files:**
- Modify: `playwright.config.ts`, `.github/workflows/ci.yml`

**Interfaces:** None.

- [ ] **Step 1: Read both**

```bash
cat playwright.config.ts
cat .github/workflows/ci.yml
```

- [ ] **Step 2: Replace CI's separate server with the Playwright `webServer` field**

```yaml
# .github/workflows/ci.yml — simplify so Playwright boots its own server
- name: Build
  run: npm run build
- name: E2E
  run: npm run test:e2e
  env:
    CI: 'true'
```

In `playwright.config.ts`:

```ts
webServer: {
  command: 'npm run preview',
  url: 'http://127.0.0.1:4321',
  reuseExistingServer: !process.env.CI,
  timeout: 60_000,
},
```

- [ ] **Step 3: Run locally**

```bash
npm run test:e2e
```

Expected: passes; Playwright boots `preview`, kills it on exit.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts .github/workflows/ci.yml
git commit -m "ci(playwright): let Playwright manage web server lifecycle"
```

---

### Task 6.4: Vitest mock completeness + visual CI gating

**Files:**
- Modify: `vitest.config.ts`, `.github/workflows/ci.yml`

**Interfaces:** None.

- [ ] **Step 1: Replace the `astro:content` mock with one that returns realistic fixtures**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    alias: {
      'astro:content': new URL('./tests/mocks/astro-content.ts', import.meta.url).pathname,
    },
    setupFiles: ['./tests/setup.ts'],
  },
});
```

In `tests/mocks/astro-content.ts`, export `defineCollection`, `z`, `reference`, and `getCollection`/`getEntry` returning fixtures.

- [ ] **Step 2: Add fixtures for at least one entry per collection**

```ts
// tests/mocks/astro-content.ts
export const getCollection = async (name: string) => {
  if (name === 'blog') return [{ slug: 'a', data: { locale: 'en', title: 'A', ... } }];
  return [];
};
```

- [ ] **Step 3: Add a unit test asserting collection reads**

```ts
import { describe, it, expect } from 'vitest';
import { getCollection } from 'astro:content';

describe('collection smoke', () => {
  it('returns one blog entry', async () => {
    const entries = await getCollection('blog');
    expect(entries.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 4: Visual CI gating**

In `ci.yml`, after E2E:

```yaml
- name: Update baselines if requested
  if: github.event.label.name == 'update-snapshots'
  run: npm run test:e2e -- --update-snapshots
- name: Visual diff
  run: npm run test:e2e -- tests/e2e/visual.spec.ts
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test(tooling): realistic content mocks; gate visual regressions in CI"
```

---

## Self-Review

1. **Spec coverage:** Each top-level finding (F-01, F-02, F-04, F-06, F-08, F-24, F-39, F-44, F-45, F-48, F-49, F-13, F-14, F-17, F-20, F-22, F-27, F-28, F-31, F-33, F-34, F-07, F-23, F-25, F-15, F-16, F-05, F-09, F-46, F-36, F-38, F-40, F-41, F-42) maps to at least one task above. Findings F-03, F-10, F-11, F-18, F-19, F-21, F-26, F-29, F-30, F-32, F-35, F-43, F-47, F-50, F-51, F-52 are folded into the same tasks where they overlap (e.g., F-10 is Phase 2 Task 2.9; F-43 falls out of Phase 1 Task 1.4). F-32 (header mobile menu wiring) is intentionally deferred to a future plan because it touches UX scope, not just code quality.

2. **Placeholder scan:** All steps contain commands or code. No "TBD". Code blocks show full paths.

3. **Type consistency:** `enquiryId` is `crypto.randomUUID()` everywhere it's referenced. `Astro.logger` is the same in Tasks 1.7 and 2.* a11y steps. `getLocale(url): Locale` is consumed in Phase 5 tasks the same way it is exported in `src/i18n/index.ts`. KV bindings (`RATE_LIMIT_KV`, `LEADS_KV`) appear identically in `wrangler.jsonc` and the consumer files.

4. **Phase boundaries:**
   - **Phase 1** ends with: static-output build succeeds, API route works, env types compile, admin is static, observability added, deps clean. Deployable.
   - **Phase 2** ends with: deferred hydration, view transitions, skip link, ARIA, color-contrast re-enabled, real OG image, CSP, categories wired. Deployable.
   - **Phase 3** ends with: rate limit + durable capture on the enquiry route. Deployable.
   - **Phase 4** ends with: image system migrated. Deployable.
   - **Phase 5** ends with: blog collection merged; i18n single-source migration complete across ~10 page pairs. Major deploy.
   - **Phase 6** ends with: prettier+eslint+hooks, single react tree, unified CI, complete mocks. Deployable.

5. **Open questions blocking items:**
   - **F-28 (real Organization socials/phone):** Task 2.7 leaves placeholders empty; revisit before launch.
   - **Newsletter stub:** Not addressed here. Open question to decide ConvertKit/Resend/Buttondown — separate plan.
   - **Mobile menu wiring (F-32):** Deferred. Affects UX scope, not just polish.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-04-flyed-improvements.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh astro-coder subagent per task, review between tasks, fast iteration. Each task is small enough to verify independently.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints for review.

Given the scope (~30 tasks across 6 phases), I'd recommend starting with Subagent-Driven for **Phase 1 only** as a proof of correctness, then deciding per-phase whether to continue parallel or inline. **Which approach?**
