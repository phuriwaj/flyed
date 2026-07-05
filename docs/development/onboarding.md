---
title: Onboarding — first 30 minutes with flyed
doc_type: onboarding
status: draft
version: 0.1.0
date: 2026-07-05
authors: ['docs-architect (AI-generated, pending human review)']
reviewers: []
system: flyed marketing site
source_commit: 6830fe4
related: [setup.md, contributing.md]
---

# Onboarding — first 30 minutes with flyed

> **Tutorial register.** Walk through this in order; each section is a
> self-contained slice you can stop after if you run out of time. By the
> end you should be able to find anything in the repo, run the test
> suite, and know which document to open next.

## Day 1 — run it (10 minutes)

You will: get the site running locally, see the home page render, and
submit a test enquiry form.

1. **Read setup.md first.** Open `/home/phurix/projects/flyed/docs/development/setup.md`
   and follow steps 1–4. You should now have `npm run dev` running at
   `http://localhost:4321/`.

2. **Visit the home page.** Confirm the hero image renders and the
   "How it works" section appears.

3. **Visit the Thai home page.** Click the language switcher in the
   header (top right). The URL should change to `http://localhost:4321/th/`.
   The page should render in Thai.

4. **Submit the enquiry form.** Click "Enquire" in the navigation. Fill
   out step 1 (you can use any dummy school name and email). Submit.
   Without env vars set, the form will return `durable: false` — this is
   expected. To verify the success UI, see
   `/home/phurix/projects/flyed/src/components/EnquiryForm.tsx:158-168`.

5. **Visit the admin shell.** Navigate to `http://localhost:4321/admin/`.
   You should see the Decap CMS shell load (it will fail to authenticate
   without Decap Cloud setup — that is fine, you are verifying the shell
   renders).

**Success looks like:** all four pages render without console errors,
the form returns a success screen.

## Day 2 — read it (15 minutes)

In this order:

1. **The architecture overview.** Open
   `/home/phurix/projects/flyed/docs/architecture/overview.md`. Pay
   attention to the **runtime topology** (Workers + KV + ASSETS
   binding) and the **content layer** (Astro Content Collections).
   Notice that the marketing pages are statically prerendered, but the
   `/api/*` and `/admin/*` paths are dynamic.

2. **The deployment doc.** Open
   `/home/phurix/projects/flyed/docs/operations/deployment.md`. Pay
   attention to the **environment matrix** (production vs preview vs
   local), the **build pipeline table** (GitHub Actions vs Workers
   Builds), and the **rollback procedure**.

3. **The data layer.** Open `/home/phurix/projects/flyed/src/content.config.ts`.
   This is the single source of truth for the blog, itineraries,
   destinations, categories, and team collections. Read the Zod schemas
   for `blog` (lines 22-49) and `itineraries` (lines 51-87).

4. **The API surface.** Open
   `/home/phurix/projects/flyed/docs/api/overview.md` (Agent 3's
   deliverable). Pay attention to the **error catalog** and the
   `durable: false` semantics for `/api/enquiry`.

5. **The runbooks.** Skim the four operational runbooks under
   `/home/phurix/projects/flyed/docs/operations/runbooks/`. You will not
   need them on day 1, but knowing they exist saves time during an
   incident.

## Day 3 — change it (5 minutes for the first change)

Your first task shape: **add a new tag option to the blog schema**.

> **Why this task:** it touches every layer (schema → editor UI →
> migration → test) without needing deploy credentials. It teaches
> more than a day of reading.

1. **Edit the schema.** Open
   `/home/phurix/projects/flyed/src/content.config.ts:31-44`. Add a new
   tag string to the enum, e.g. `'Sustainability'`.

2. **Add the same option to Decap.** Open
   `/home/phurix/projects/flyed/public/admin/config.yml:90-101` (EN
   collection) and lines 195-206 (TH collection). Add `'Sustainability'`
   to the `options:` array in both places.

3. **Update tests.** Add a tag to a blog post's frontmatter in
   `/home/phurix/projects/flyed/src/content/blog/` (any `.mdx` file).
   `npm run check` should pass.

4. **Verify the e2e tests still pass.** `npm run build && npm run test:e2e`.
   No visual snapshot updates should be needed.

5. **Commit and open a PR.** See `contributing.md` for the commit
   convention.

**What this teaches:** the schema is the source of truth (Astro enforces
it at build time); the Decap config is a parallel surface for the same
data (must be kept in sync); tests catch mismatches automatically.

## Directory map — where to look when...

| When you need to...               | Look in...                                                                                                                                                                                     |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add a new page                    | `/home/phurix/projects/flyed/src/pages/<name>.astro` (page) + `/home/phurix/projects/flyed/src/components/` (component). Existing example: `pages/about.astro` → `components/AboutPage.astro`. |
| Add a new API endpoint            | `/home/phurix/projects/flyed/src/pages/api/<name>.ts`. Existing example: `enquiry.ts`. Set `export const prerender = false;`.                                                                  |
| Add a new content collection      | `/home/phurix/projects/flyed/src/content.config.ts` (schema) + `/home/phurix/projects/flyed/src/content/<name>/` (data).                                                                       |
| Add a new translation string      | `/home/phurix/projects/flyed/src/i18n/en.json` + `th.json`. Use `t(locale, 'key.subkey')`.                                                                                                     |
| Add a new env var                 | `/home/phurix/projects/flyed/astro.config.mjs:49-66` (schema) + `/home/phurix/projects/flyed/src/env.d.ts:5-22` (typed re-export). For server context, also `wrangler secret put` in prod.     |
| Change the CSP / security headers | `/home/phurix/projects/flyed/public/_headers`. See the comment block at lines 29-60 for per-directive rationale.                                                                               |
| Add a new Astro component         | `/home/phurix/projects/flyed/src/components/<Name>.astro` for static, `<Name>.tsx` for interactive. The latter requires `client:load` or similar directive in the parent.                      |
| Add a new React island            | `/home/phurix/projects/flyed/src/components/<Name>.tsx`. Mount from a parent `.astro` via `import Foo from './Foo'; <Foo client:visible />`.                                                   |
| Add a Cloudflare KV binding       | `/home/phurix/projects/flyed/wrangler.jsonc:16-27` (binding declaration) + `wrangler kv namespace create <NAME>` (real id) + document the keyspace in a runbook.                               |
| Update CI / Lighthouse thresholds | `/home/phurix/projects/flyed/lighthouserc.json` (canonical, per `package.json:17`). `/.lighthouserc.json` is stale.                                                                            |
| Edit an SEO-related meta tag      | `/home/phurix/projects/flyed/src/layouts/Layout.astro` — global SEO lives here. Per-page meta via the `<SEO>` prop from `astro-seo`.                                                           |
| Debug a runtime failure           | `/home/phurix/projects/flyed/docs/operations/runbooks/` first; if none match, `wrangler tail --name=flyed` and the source file.                                                                |

## Glossary

| Term                         | Meaning                                                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Astro Content Collection** | A typed directory of Markdown/MDX files whose frontmatter is validated against a Zod schema. Defined in `src/content.config.ts`.                            |
| **Decap CMS**                | The browser-based git-backed editor (formerly Netlify CMS). Served at `/admin` as a static shell.                                                           |
| **KV binding**               | A Cloudflare Workers binding to a key-value namespace. `RATE_LIMIT_KV` and `LEADS_KV` are the two in this project.                                          |
| **Pre-render**               | Static HTML generation at build time. The default for `.astro` pages in this project (`output: 'static'`).                                                  |
| **SSR (per-route)**          | A page that opts into runtime execution via `export const prerender = false;`. The `/api/*` endpoints use this.                                             |
| **PRERENDER vs SSR**         | Pre-rendered pages serve from the ASSETS binding (CDN-cached, no Worker invocation). SSR pages run as a Worker function on every request.                   |
| **React island**             | A `.tsx` component hydrated inside an otherwise-static `.astro` page. The boundary is explicit (`client:load`, `client:visible`, etc.).                     |
| **view transitions**         | Astro's `ClientRouter` component (`src/layouts/Layout.astro:106`) animates page-to-page navigation. Enabled by default in this project.                     |
| **Wave**                     | A development cycle of ~40 commits with a spec, plan, and review. Wave 7 (most recent as of this doc) shipped the Workers migration and other improvements. |

## Where to ask questions

> **OPEN QUESTION (owner: engineering):** No documented team chat channel
> exists in this repo. `public/admin/README.md:69` references `#marketing-eng`
> (Slack) and `@flyed-dev` (GitHub org) but does not list engineering
> channels. Confirm with the founder which channel is the right first
> stop for engineering questions.

## Related

- `setup.md` — local dev from zero.
- `contributing.md` — branch strategy, commit conventions, PR checklist.
- `/home/phurix/projects/flyed/docs/architecture/overview.md` — system
  architecture (Agent 1's deliverable).
- `/home/phurix/projects/flyed/docs/api/overview.md` — API reference
  (Agent 3's deliverable).
- `/home/phurix/projects/flyed/docs/operations/deployment.md` — deploy
  procedure.

## Change history

| Date       | Version | Author                                              | Summary                 |
| ---------- | ------- | --------------------------------------------------- | ----------------------- |
| 2026-07-05 | 0.1.0   | docs-architect (AI-generated, pending human review) | Initial 30-minute tour. |
