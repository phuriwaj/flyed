---
title: Local development setup — flyed
doc_type: readme
status: draft
version: 0.1.0
date: 2026-07-05
authors: ['docs-architect (AI-generated, pending human review)']
reviewers: []
system: flyed marketing site
source_commit: 6830fe4
related: [onboarding.md, contributing.md]
---

# Local development setup — flyed

> **Tutorial register.** Follow each step in order; verification at the end
> of each major step. From a clean machine to green tests in roughly 10 minutes.

This guide assumes a Linux or macOS workstation with `git`, `node`, and
`npm` already installed. Windows + WSL works but requires the path
considerations noted in the troubleshooting section.

## 1. Prerequisites

| Tool   | Version               | How to check        | Where it comes from                                             |
| ------ | --------------------- | ------------------- | --------------------------------------------------------------- |
| Node   | `>= 22.12.0`          | `node --version`    | `/home/phurix/projects/flyed/package.json:6-8` (`engines.node`) |
| npm    | bundled with Node 22  | `npm --version`     | https://nodejs.org/                                             |
| git    | any modern release    | `git --version`     | OS package manager                                              |
| Python | `>= 3.10` (for tests) | `python3 --version` | OS package manager                                              |

> **Node version pin.** The repository's CI workflow pins Node 22
> (`/home/phurix/projects/flyed/.github/workflows/ci.yml:19`) and the
> project `engines` field requires `>= 22.12.0`. Use `nvm` or `fnm` if you
> have a different default Node version: `nvm use 22` after `cd`-ing into
> the repo (a `.nvmrc` is not currently committed — verified by absence
> in the repo root).

> **OPEN QUESTION (owner: engineering):** A `.nvmrc` would make the Node
> version explicit and reproducible. Not committed today. Consider adding
> one with `22.12.0` if new contributors hit the version requirement.

## 2. Clone and install

```bash
git clone git@github.com:flyed-dev/flyed.git
cd flyed
npm install
```

`npm install` reads `/home/phurix/projects/flyed/package.json` and resolves
the dep tree from `package-lock.json`. It will also fetch Playwright
browsers IF `npm install` triggers the postinstall — note the next step
does this manually.

**Verification:** `node_modules/` exists; `npx astro --version` prints
`7.x.x` (or the version declared in
`/home/phurix/projects/flyed/package.json:36`).

## 3. Environment variables

The site uses **Astro's typed env schema** (`astro:env`) defined in
`/home/phurix/projects/flyed/astro.config.mjs:49-66` and
`/home/phurix/projects/flyed/src/env.d.ts:5-22`. There is no committed
`.env.example` file (verified by `find . -maxdepth 2 -name ".env*"` —
only `.gitignore` patterns exist for `.env`).

### 3.1 Server-context secrets (used by `/api/*` Worker endpoints)

| Name               | Required for local? | Default if unset                                  | Purpose                 |
| ------------------ | ------------------- | ------------------------------------------------- | ----------------------- |
| `RESEND_API_KEY`   | No                  | `undefined`; email send is skipped with a warning | Resend email dispatch   |
| `CRM_WEBHOOK_URL`  | No                  | `undefined`; CRM POST is skipped with a warning   | CRM webhook integration |
| `ENQUIRY_TO_EMAIL` | No                  | `sales@flyed.dev` (from `astro.config.mjs:57`)    | Resend `to:` recipient  |

### 3.2 Client-context vars (bundled into the client)

| Name                    | Required for local? | Default | Purpose                     |
| ----------------------- | ------------------- | ------- | --------------------------- |
| `PUBLIC_ANALYTICS_HOST` | No                  | unset   | Plausible (or similar) host |

### 3.3 How to set them locally

For local development, the simplest approach is a `.env` file at the repo
root (gitignored per `/home/phurix/projects/flyed/.gitignore:15-17`):

```bash
# Only needed if you want to test the real email / CRM paths.
# Leave unset to verify the "skipped" warning behaviour.
# RESEND_API_KEY=re_xxx...
# CRM_WEBHOOK_URL=https://hooks.zapier.com/.../.../
# ENQUIRY_TO_EMAIL=sales@flyed.dev
# PUBLIC_ANALYTICS_HOST=
```

> **Hard rule:** never commit a real `.env`. The gitignore
> (`/home/phurix/projects/flyed/.gitignore:15-17`) excludes `.env`,
> `.env.local`, and `.env.production`.

> **OPEN QUESTION (owner: engineering):** Adding a `.env.example` to the
> repo (gitignored `.env` plus checked-in `.env.example`) would make
> onboarding smoother. Not currently committed.

## 4. Run the dev server

```bash
npm run dev          # foreground, http://localhost:4321
```

Or in background mode (recommended; see
`/home/phurix/projects/flyed/AGENTS.md:5-9`):

```bash
astro dev --background
astro dev status
astro dev logs
astro dev stop
```

**Verification:** open `http://localhost:4321/` in a browser. You should
see the home page hero. The Astro dev server prints a local URL on
startup; click it.

**What works without any env vars set:**

- All static pages render (home, about, destinations, itineraries, blog,
  th/* — full EN + TH surface).
- The enquiry form's `POST /api/enquiry` runs but logs
  `RESEND_API_KEY not configured; skipping email send` and
  `CRM_WEBHOOK_URL not configured; skipping CRM` — the response is
  `200 { ok: true, enquiryId: <uuid>, durable: false }`.
- Rate limiting falls open (no `RATE_LIMIT_KV` binding in local dev —
  see `/home/phurix/projects/flyed/src/lib/rate-limit.ts:32-34`).

**What does NOT work without env vars:**

- Resend emails and CRM webhook posts are skipped (expected; they log
  and continue).
- The enquiry response will have `durable: false` because the
  `LEADS_KV` binding is absent in `astro dev`.

## 5. Run the tests

### 5.1 Unit tests (Vitest)

```bash
npm test              # one-shot
npm run test:watch    # interactive
```

Vitest config is at `/home/phurix/projects/flyed/vitest.config.ts`. Key
points:

- `environment: 'happy-dom'` (line 6) — DOM-emulated for React component
  tests.
- `setupFiles: ['./src/test/setup.ts']` — wires up
  `@testing-library/react` cleanup after each test (see
  `/home/phurix/projects/flyed/src/test/setup.ts:1-7`).
- Module aliases (`@`, `astro:content`, `astro:env/server`, etc.) point
  at mocks under `/home/phurix/projects/flyed/tests/mocks/`.
- `tests/unit/types.d.ts:1-10` declares the `astro:env/server` exports
  so TypeScript recognises them in unit tests.

**Verification:** the run ends with `Test Files  X passed` and `Tests  X
passed`.

### 5.2 E2E tests (Playwright)

```bash
npm run test:e2e                    # one-shot
npm run test:e2e:ui                 # interactive UI
npm run test:e2e -- --update-snapshots   # refresh baselines
```

Playwright config is at `/home/phurix/projects/flyed/playwright.config.ts`.
Key points:

- The webServer boots `python3 -m http.server 4321 --bind 127.0.0.1
--directory dist/client` against the **prerendered** build, NOT
  `astro dev` (line 36). Reason: `astro preview` enters a redirect loop
  on `/enquire` (no Node entry for the Cloudflare adapter) and `astro
dev` fails with "Invalid hook call" inside `workerd` for pages that
  tree-shake React components.
- Build the site first: `npm run build`. The webServer expects
  `dist/client/` to exist.
- Visual regression baselines are committed at
  `/home/phurix/projects/flyed/tests/e2e/visual.spec.ts-snapshots/`.
  Update with `--update-snapshots`.

**Verification:** all `.spec.ts` files pass; the report appears at
`/home/phurix/projects/flyed/playwright-report/index.html`.

> **First-time-only:** install the Chromium binary once.
>
> ```bash
> npx playwright install --with-deps chromium
> ```
>
> CI does this in the `e2e` job (`.github/workflows/ci.yml:55-56`).

### 5.3 Lighthouse CI

```bash
npm run build
npx lhci autorun
```

Lighthouse CI config is at `/home/phurix/projects/flyed/lighthouserc.json`.
The CI workflow uses `/home/phurix/projects/flyed/.lighthouserc.json` —
**both files exist**, but `.lighthouserc.json` is the current
authoritative source for the URLs and thresholds (verified by reading
both: `lighthouserc.json` is the one CI runs; the leading-dot version
appears stale).

> **OPEN QUESTION (owner: engineering):** Two Lighthouse config files
> exist at the repo root (`lighthouserc.json` and `.lighthouserc.json`).
> `lighthouserc.json` is referenced by the `lhci` script
> (`package.json:17`) and CI runs it against URLs including
> `/blog/01-why-thailand-service-learning`. The leading-dot version
> appears to be a stale copy. Confirm which is the canonical config and
> remove the other.

**Thresholds (per `/home/phurix/projects/flyed/lighthouserc.json:24-29`):**

| Category       | Severity | Min score |
| -------------- | -------- | --------- |
| Performance    | warn     | 0.85      |
| Accessibility  | error    | 0.95      |
| Best Practices | warn     | 0.90      |
| SEO            | error    | 0.95      |

### 5.4 Lint and format

```bash
npm run lint            # ESLint, no fix
npm run lint:fix        # ESLint, apply fixes
npm run format          # Prettier, write
npm run format:check    # Prettier, check only
```

Configs:

- ESLint flat config at `/home/phurix/projects/flyed/eslint.config.js`
  — focused on real correctness bugs (`no-unused-vars`, `no-shadow`),
  Prettier handles formatting.
- Prettier at `/home/phurix/projects/flyed/.prettierrc.json` —
  `printWidth: 100`, `singleQuote: true`, `prettier-plugin-astro`.
- Prettier ignore at `/home/phurix/projects/flyed/.prettierignore` —
  excludes `dist/`, `.astro/`, `node_modules/`, `package-lock.json`,
  `wrangler.jsonc` (because Prettier mangles JSONC comments),
  `public/_headers`, `public/_redirects`, and SDD directories.

### 5.5 Type check

```bash
npm run check           # astro check + tsc --noEmit
```

The CI workflow runs this in the `lint-build-test` job
(`.github/workflows/ci.yml:25-26`). A clean tree must pass before PR
merge.

## 6. Pre-commit hooks (optional but recommended)

The repo configures `simple-git-hooks` and `lint-staged` in
`/home/phurix/projects/flyed/package.json:70-76`:

```json
"simple-git-hooks": {
  "pre-commit": "npx lint-staged"
},
"lint-staged": {
  "*.{js,mjs,cjs,ts,tsx,jsx,astro,css,json,md,mdx,yml,yaml,html}": "prettier --write --ignore-unknown",
  "*.{ts,tsx,astro}": "eslint --fix"
}
```

Activate on first clone:

```bash
npx simple-git-hooks
```

This installs a `.git/hooks/pre-commit` that runs `lint-staged` on
staged files. The hooks are **not** installed automatically by
`npm install` — the `postinstall` step is not configured.

> **OPEN QUESTION (owner: engineering):** The repo relies on a manual
> `npx simple-git-hooks` step after clone. Most projects automate this
> via a `"postinstall"` script in `package.json`. Confirm with the team
> whether the manual step is intentional or an oversight.

**Verification:** make a small change, `git add` it, `git commit`. The
hook should fire and reformat/lint.

## 7. Common first-day failures

| Symptom                                                                | Cause                                                                                                                                 | Fix                                                                                                |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `astro: command not found` after `npm install`                         | stale node_modules                                                                                                                    | `rm -rf node_modules && npm install`                                                               |
| `Module not found: astro:env/server` in unit tests                     | missing mocks                                                                                                                         | verified by `vitest.config.ts:21-33`; ensure `tests/mocks/astro-env.ts` exists                     |
| Playwright E2E times out at startup                                    | `dist/client/` missing                                                                                                                | `npm run build` first                                                                              |
| Playwright E2E reports "server already running"                        | port 4321 occupied                                                                                                                    | `lsof -i :4321` and stop the other process, or set `reuseExistingServer: true` (default in non-CI) |
| Dev server hot-reload shows stale styles after a CSS change            | Tailwind 4 cache stale                                                                                                                | `rm -rf .astro && npm run dev`                                                                     |
| ESLint complains about an Astro file with `no-exports-from-components` | The rule is **disabled** in `/home/phurix/projects/flyed/eslint.config.js:73` for `.astro`; if it fires, you're running an old config | `npm install` and re-check                                                                         |
| `EnquiryForm.tsx` validates "duration" as number but UI accepts string | `z.coerce.number()` (line 16) handles it                                                                                              | no action                                                                                          |

## 8. Optional: Decap CMS local preview

To preview the `/admin` shell against the real CMS:

```bash
# In one terminal: serve the local repo as the preview target
npm run dev

# In another terminal: serve Decap's proxy that points to your local backend
npx decap-server
```

Then open `http://localhost:4321/admin/` — Decap's preview iframe will
load your local site. Note: Decap Cloud is configured in
`/home/phurix/projects/flyed/public/admin/config.yml:4-7` (`git-gateway`,
not `proxy`), so `decap-server` is only useful if you switch the backend
to `proxy`. The production flow (Decap Cloud + git-gateway) is documented
in `docs/operations/runbooks/RB-decap-cms.md`.

## 9. Directory map

```
flyed/
├── astro.config.mjs            # Astro + integrations + adapter + env schema
├── wrangler.jsonc              # Cloudflare Workers config (KV bindings, date)
├── package.json                # scripts, deps, hooks
├── tsconfig.json               # strict TS, JSX react-jsx, @/ alias
├── eslint.config.js            # flat config
├── vitest.config.ts            # unit test config
├── playwright.config.ts        # e2e config (python http.server against dist/client)
├── .prettierrc.json            # formatter config
├── public/                     # static assets served at site root
│   ├── admin/                  # Decap CMS shell + config
│   ├── images/                 # hero, blog, destinations, etc.
│   ├── _headers                # CSP, cache-control
│   └── _redirects              # /admin → /admin/index.html, trailing slash
├── src/
│   ├── components/             # Astro + React components
│   ├── content/                # content collections (blog, itineraries, etc.)
│   ├── content.config.ts       # collection Zod schemas
│   ├── env.d.ts                # astro:env schema
│   ├── i18n/                   # EN + TH dictionaries
│   ├── layouts/                # Layout.astro (ClientRouter, SEO)
│   ├── lib/                    # rate-limit.ts (KV-backed)
│   ├── pages/                  # routes — *.astro prerendered, /api/*.ts SSR
│   ├── styles/                 # Tailwind + global CSS
│   ├── test/                   # vitest setup
│   └── utils/                  # small utilities
├── tests/
│   ├── e2e/                    # Playwright specs
│   ├── mocks/                  # vitest module mocks (astro:content, astro:env)
│   └── unit/                   # additional unit tests
└── docs/                       # this documentation set
```

## Verification (full happy path)

After completing all the above, run the full CI-equivalent sequence:

```bash
npm ci
npm run check
npm run build
npm test
npx playwright install --with-deps chromium
npm run test:e2e
npm run lint
npm run format:check
```

All eight commands should exit 0.

## Related

- `onboarding.md` — 30-minute first-week tour (where to look when...).
- `contributing.md` — branch strategy, commit conventions, PR checklist.
- `../operations/deployment.md` — deploy/rollback for production.
- `../operations/runbooks/RB-decap-cms.md` — Decap CMS operator runbook.

## Change history

| Date       | Version | Author                                              | Summary              |
| ---------- | ------- | --------------------------------------------------- | -------------------- |
| 2026-07-05 | 0.1.0   | docs-architect (AI-generated, pending human review) | Initial setup guide. |
