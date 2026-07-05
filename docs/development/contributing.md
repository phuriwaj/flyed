---
title: Contributing — flyed
doc_type: readme
status: draft
version: 0.1.0
date: 2026-07-05
authors: ['docs-architect (AI-generated, pending human review)']
reviewers: []
system: flyed marketing site
source_commit: 6830fe4
related: [setup.md, onboarding.md]
---

# Contributing — flyed

> **How-to register.** Steps to follow when changing code, content, or
> configuration in this repo. If you're a new contributor, start with
> `onboarding.md` for a tour, then come back here.

## 1. Branch and PR flow

### 1.1 Base branch

- **`main`** is the trunk. Cloudflare Workers Builds auto-deploys `main`
  to production (see `/home/phurix/projects/flyed/docs/operations/deployment.md:3.2`).
- Long-lived branches are not used. Cut a new branch from `main` for
  each change.

### 1.2 Branch naming

Use a `<type>/<scope>` convention consistent with the project's existing
branches (verified by `git branch -r` and the recent history):

| Type        | Use for                              | Example                          |
| ----------- | ------------------------------------ | -------------------------------- |
| `feat/`     | new user-visible feature             | `feat/enquiry-step5-review`      |
| `fix/`      | bug fix                              | `fix/footer-i18n-th-fallback`    |
| `refactor/` | code change with no behaviour delta  | `refactor/split-enquiry-handler` |
| `docs/`     | documentation-only change            | `docs/architecture-overview`     |
| `chore/`    | tooling, deps, non-functional config | `chore/bump-astro-7`             |
| `test/`     | test-only change                     | `test/add-rate-limit-cases`      |

Keep scope tight (one logical change per branch). Avoid stacking
unrelated changes into a single PR — reviewers will struggle.

### 1.3 PR expectations

- Open the PR as a **draft** if the change is still in flight.
- The PR description should explain _why_ the change is being made
  (problem statement), not just _what_ changed (the diff already says
  that). One paragraph is usually enough.
- Reference any related issue, design spec, or plan document by path.
- Mark `[WIP]` in the title if you want feedback before the change is
  ready to merge.
- **Definition of done** (enforced by CI):
  - `npm run check` passes (Astro check + tsc).
  - `npm run build` succeeds.
  - `npm test` (Vitest unit tests) passes.
  - `npm run test:e2e` passes (Playwright).
  - `npm run lint` passes.
  - `npm run format:check` passes (or run `npm run format` and commit
    the result).
  - Lighthouse CI thresholds pass (`lighthouserc.json` —
    `performance ≥ 0.85 warn`, `accessibility ≥ 0.95 error`,
    `best-practices ≥ 0.90 warn`, `seo ≥ 0.95 error`).

> **OPEN QUESTION (owner: engineering):** No `CODEOWNERS` file is
> committed at `/home/phurix/projects/flyed/CODEOWNERS` (verified by
> `ls -la`). If the team grows, a CODEOWNERS file auto-assigns reviewers
> on touched paths. Decide whether this is worth adding.

### 1.4 Review requirements

> **OPEN QUESTION (owner: engineering):** No branch protection rules
> are visible in the repo. The audit
> (`/home/phurix/projects/flyed/.superpowers/sdd/document-audit-2026-07-05.md`)
> did not surface a `.github/CODEOWNERS` or settings configuration.
> Confirm the team policy: minimum reviewers? required checks?

## 2. Commit convention

The repo's recent history follows **Conventional Commits** (verified
by `git log --oneline -30` — every commit on `wave-7-improvements`
starts with `<type>(<scope>):`).

Format: `<type>(<scope>): <short summary>`

- **type**: one of `feat`, `fix`, `refactor`, `docs`, `chore`, `test`,
  `perf`, `style`, `build`, `ci`.
- **scope** (optional, in parens): the area affected (`api`, `i18n`,
  `cms`, `images`, `content`, `rate-limit`, etc.).
- **summary**: imperative mood, no trailing period, ≤ 72 chars.

Examples from the recent history:

- `chore(repo): gitignore DESIGN.md`
- `chore(repo): commit Wave 7 plan + gitignore harness overlay`
- `merge(wave-7): apply final-review findings (5 IMPORTANTS + 2 NITs)`

The **body** of the commit (separated by a blank line) explains _why_.
The diff explains _what_. Don't duplicate the diff in prose.

### 2.1 Pre-commit hooks

`package.json:70-76` configures `simple-git-hooks` with a `pre-commit`
hook running `lint-staged`. The hook is **not** auto-installed; after
cloning, run once:

```bash
npx simple-git-hooks
```

What it runs (per `package.json:73-75`):

- On `*.{js,mjs,cjs,ts,tsx,jsx,astro,css,json,md,mdx,yml,yaml,html}`:
  `prettier --write --ignore-unknown`.
- On `*.{ts,tsx,astro}`: `eslint --fix`.

> **OPEN QUESTION (owner: engineering):** No `pre-push` hook is
> configured. Adding one that runs `npm run check` and `npm test` before
> push would catch most failures before CI does. Confirm with the team.

## 3. Code style

### 3.1 Linting

`npm run lint` runs ESLint via the flat config at
`/home/phurix/projects/flyed/eslint.config.js`. The config is intentionally
light (the comment at line 8-9 says: "keep the rule surface light and
focused on real correctness bugs"):

- `@typescript-eslint/no-unused-vars` (warn; `^_` prefix opt-out).
- `astro/no-exports-from-components` — disabled at line 73 (the
  codebase legitimately exports `prerender` and `locale` from `.astro`
  page frontmatter; the rule throws 11 false positives).
- `eslint-plugin-astro` recommended baseline.

`npm run lint:fix` auto-fixes what's safe; review the diff.

### 3.2 Formatting

`npm run format` runs Prettier (`/home/phurix/projects/flyed/.prettierrc.json`):

- `printWidth: 100`
- `singleQuote: true`
- `plugins: ['prettier-plugin-astro']`
- Astro files use the `astro` parser (overrides block).

`.prettierignore` excludes:

- Build outputs: `dist/`, `.astro/`, `node_modules/`.
- Lockfile: `package-lock.json`.
- Binary assets: `*.png`, `*.avif`, `*.webp`, `*.ico`, `*.gif`.
- `wrangler.jsonc` — Prettier mangles JSONC comments.
- `public/_headers`, `public/_redirects` — non-JSON config files.
- SDD directories: `.superpowers/`, `docs/superpowers/`,
  `.claude/worktrees/`.
- Stray Windows paths: `undefined:*`.
- Design doc: `DESIGN.md`.

### 3.3 TypeScript

- Strict mode via `extends: 'astro/tsconfigs/strict'`
  (`/home/phurix/projects/flyed/tsconfig.json:2`).
- JSX: `react-jsx`, import source `react`.
- `@/*` alias resolves to `src/*`.
- `ignoreDeprecations: "6.0"` — workaround for an Astro dependency
  emitting TS 6.0 deprecation warnings.

### 3.4 Astro conventions

- Page wrappers (`src/pages/*.astro`) are thin: import the
  `<XxxPage>` component, compute `locale` from URL
  (`getLocale(Astro.url)`), pass as a prop. See
  `/home/phurix/projects/flyed/src/pages/index.astro:1-12` for the
  template.
- Components live under `src/components/`. Prefer `.astro` for
  non-interactive; use `.tsx` only when you need state, effects, or
  refs (then mount via `client:load` or `client:visible` from the
  parent).
- API endpoints under `src/pages/api/` set `export const prerender = false;`
  at the top (`enquiry.ts:7`, `newsletter.ts:4`, `contact.ts:5`).

### 3.5 React conventions

- Functional components with hooks (no class components).
- State via `useState` (see `EnquiryForm.tsx` for the largest
  example).
- Form validation via Zod schemas (`enquirySchema` in
  `EnquiryForm.tsx:4-22`).
- React 19 — `npm test` includes
  `tests/unit/react-version.test.ts` to assert the installed version.

## 4. Testing

### 4.1 What must pass before merge

| Command                | What it checks                           | Time |
| ---------------------- | ---------------------------------------- | ---- |
| `npm run check`        | Astro + tsc type errors                  | ~10s |
| `npm run build`        | Static prerender + Worker build          | ~30s |
| `npm test`             | Vitest unit tests                        | ~10s |
| `npm run test:e2e`     | Playwright e2e + visual regression       | ~60s |
| `npm run lint`         | ESLint                                   | ~5s  |
| `npm run format:check` | Prettier formatting                      | ~5s  |
| Lighthouse CI          | Performance / A11y / BP / SEO on 11 URLs | ~60s |

Total CI time: ~3 minutes (per
`/home/phurix/projects/flyed/.github/workflows/ci.yml:13, 37, 90`).

### 4.2 When to add a unit test

Add a Vitest unit test when:

- You add a new utility function in `src/lib/` or `src/utils/`.
- You change a Zod schema (add a field, change validation).
- You change a React island's behaviour (state machine, validation,
  submit handling).

### 4.3 When to add an e2e test

Add a Playwright spec under `/home/phurix/projects/flyed/tests/e2e/`
when:

- You add a new page that has unique rendering behaviour worth pinning.
- You change a critical user flow (enquiry submission, language
  switch, blog reading).
- You change a layout that has a committed visual snapshot.

### 4.4 Visual regression snapshots

Visual regression tests live in `tests/e2e/visual.spec.ts` and use
committed baselines in
`/home/phurix/projects/flyed/tests/e2e/visual.spec.ts-snapshots/`.
When you intentionally change visuals:

```bash
npm run test:e2e -- --update-snapshots
# Review the diff before committing:
git diff tests/e2e/visual.spec.ts-snapshots/
```

## 5. Schema and content changes

### 5.1 Astro Content Collection schema

When you add or change a field in `/home/phurix/projects/flyed/src/content.config.ts`:

1. The build will fail for any existing content that violates the new
   schema. Update the affected `.mdx` files in the same PR.
2. If the new field is editor-controlled, mirror the change in
   `/home/phurix/projects/flyed/public/admin/config.yml` (both the
   EN and TH collection blocks).
3. Add or update the data dictionary entry once it exists
   (Agent 3 may add this — verify by reading `docs/data/` if
   present).

### 5.2 i18n (EN + TH)

All user-facing strings go in:

- `/home/phurix/projects/flyed/src/i18n/en.json` (English)
- `/home/phurix/projects/flyed/src/i18n/th.json` (Thai)

Use `t(locale, 'key.subkey')` to read them. Both files must have the
same key shape — `tests/unit/i18n.test.ts` likely asserts this.

### 5.3 Env schema

When you add an env var:

1. Add it to `/home/phurix/projects/flyed/astro.config.mjs:49-66`
   (schema).
2. Add the matching `envField` to `/home/phurix/projects/flyed/src/env.d.ts:5-22`
   (typed re-export).
3. If server context: also configure in production via
   `wrangler secret put <NAME>`.
4. Update `/home/phurix/projects/flyed/docs/operations/deployment.md`
   §6.1 env var table.

## 6. Documentation expectations

Different changes require different doc updates:

| Change                                      | Doc updates required                                                                      |
| ------------------------------------------- | ----------------------------------------------------------------------------------------- |
| New env var                                 | `docs/operations/deployment.md` §6.1                                                      |
| New API endpoint                            | `docs/api/overview.md` (Agent 3's deliverable) + a runbook if it has a novel failure mode |
| New content collection                      | `docs/data/data-dictionary.md` once it exists                                             |
| Schema change with business intent          | New ADR under `docs/architecture/decisions/`                                              |
| New architectural choice                    | New ADR under `docs/architecture/decisions/`                                              |
| Operational change (deploy step, env, etc.) | `docs/operations/deployment.md`                                                           |
| New failure mode                            | New `docs/operations/runbooks/RB-<slug>.md`                                               |
| User-facing capability change               | Add an entry to `/CHANGELOG.md` once it exists                                            |

The `docs/` index page (Agent 4 owns it) will link to the new doc.

## 7. Working with imagery

> **Asset production.** This subsection is moved/preserved from
> `/home/phurix/projects/flyed/docs/image-prompts.md` (which remains as a
> standalone reference — see "Image prompts" at the end of this doc).

### 7.1 Style baseline (append to every prompt)

```
35mm film photography, golden hour, f/2.8 shallow depth of field, warm color grade,
rice-terrace tones (teak, bamboo green, sunset orange, off-white), no UI overlays,
no recognizable faces in tight close-up, candid group dynamics or hands/back views,
Southeast Asian outdoor setting, anamorphic lens flare subtle, organic grain
```

### 7.2 Hero + destination prompts (12 destinations)

| Destination      | Prompt theme                                      |
| ---------------- | ------------------------------------------------- |
| Hero (home)      | Students hiking a forested ridge at golden hour   |
| Chiang Mai       | Rice planting in flooded terraced paddy           |
| Phuket / Andaman | Teens boarding longtail boat from limestone beach |
| Bangkok          | Temple courtyard crossing at sunrise              |
| Kanchanaburi     | Wooden bridge over River Kwai in morning mist     |
| Ayutthaya        | Sketching Khmer ruins at golden hour              |
| Khao Sok         | Kayaking on emerald Cheow Lan Lake                |
| Krabi            | Limestone karst base climbing                     |
| Koh Tao          | Underwater half-and-half divers                   |
| Chiang Rai       | Saplings at ethical elephant sanctuary            |
| Sukhothai        | Cycling through temple complex with lotus ponds   |
| Pai              | Motorbike through bamboo forest                   |
| Isan             | Homestay dinner with Thai-Isan family             |

### 7.3 Category imagery (6 categories)

| Category             | Prompt theme                                  |
| -------------------- | --------------------------------------------- |
| Service Learning     | Students and villagers building bamboo school |
| Cultural & Heritage  | Temple dance lesson with fabric in motion     |
| STEM & Environmental | Marine biologist showing reef specimen        |
| Sports & Adventure   | Muay Thai pad work                            |
| Language Immersion   | Thai alphabet writing on homestay porch       |
| History & Heritage   | Kanchanaburi war cemetery, heads bowed        |

### 7.4 Negative prompt

```
cartoon, illustration, anime, 3D render, CGI, watermark, logo, text overlay,
sharp digital look, oversaturated HDR, plastic skin, stock-photo smile,
face close-up of identifiable minors, hospital / sterile environment,
generic airport / hotel lobby, Disneyland, theme park
```

### 7.5 Post-processing

1. Apply subtle film-grain overlay (3–5%).
2. Lift shadows slightly (avoid crushed blacks).
3. Teak-orange tint in highlights, bamboo-green tint in shadows (curves).
4. Resize to 3840×2160 max for hero, 1920×1080 for cards, 800×600 for
   thumbnails.
5. Export AVIF + WebP + fallback JPEG (subject to the
   `imageService: 'passthrough'` limitation — see
   `docs/operations/runbooks/RB-image-service.md` for why AVIF/WebP
   variants may not appear in production today).

### 7.6 Guardrails

- Never use real student likenesses.
- Prefer group shots (5+ subjects) or back/hands/feet close-ups.
- For solo student composition, use silhouette or side profile only.
- All subjects ≥ 13 years old visually; never depict younger.
- For "authentic Thai" depictions, include authentic details: school
  uniforms with appropriate patches, wai greeting visible, regional
  food props, temple etiquette.

> **Image prompts — full reference:** the canonical asset-production
> guide with full prompts and tool-neutral instructions remains at
> `/home/phurix/projects/flyed/docs/image-prompts.md`.

## 8. Security disclosure

If you discover a security issue (XSS, CSP bypass, secret leak, etc.):

> **OPEN QUESTION (owner: engineering):** No `SECURITY.md` is
> committed at `/home/phurix/projects/flyed/SECURITY.md`. The repo
> currently relies on GitHub's default security reporting (Dependabot,
> private vulnerability reporting on the repo settings page). For a
> public marketing site, a `SECURITY.md` describing how to report a
> vulnerability privately (and the expected response window) is best
> practice. Add this file before opening the site to public traffic.

For urgent issues (active exploit, leaked secret): rotate the affected
secret immediately via `wrangler secret put <NAME>` and email the
founder directly. Do not open a public GitHub issue for an active
incident.

## Related

- `setup.md` — local dev from zero.
- `onboarding.md` — first-week tour.
- `/home/phurix/projects/flyed/docs/operations/deployment.md` —
  production deploy procedure.
- `/home/phurix/projects/flyed/docs/operations/runbooks/` —
  incident response.
- `/home/phurix/projects/flyed/docs/image-prompts.md` — full
  asset-production reference.

## Change history

| Date       | Version | Author                                              | Summary                                                                                   |
| ---------- | ------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 2026-07-05 | 0.1.0   | docs-architect (AI-generated, pending human review) | Initial contributing guide; absorbed "Working with imagery" from `docs/image-prompts.md`. |
