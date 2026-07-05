# flyed — Decap CMS Integration Design

**Date:** 2026-07-03
**Status:** Draft, awaiting user review
**Owner:** flyed marketing team
**Build target:** flyed.dev (existing Cloudflare Pages project)

---

## 1. Problem & Goals

The flyed marketing site content (blog posts, itineraries, destinations) currently lives as MDX files in `src/content/`. Editing requires Git knowledge, local dev environment, and a PR workflow. Non-technical editors (marketing, partners) cannot contribute content without dev support.

**Goals**

- Enable non-technical editors to author and publish blog content through a browser GUI
- Preserve the Git-based audit trail and PR review workflow
- Support bilingual (en + th) content authoring in the same UI
- Provide a live preview of drafts before they hit production
- Zero additional infrastructure — keep Cloudflare Pages + GitHub as the only hosts

**Non-goals (deferred to a later iteration)**

- CMS exposure for `itineraries`, `destinations`, `categories`, `team` collections
- Custom CMS UI branding matching flyed design tokens
- IP-allowlist on `/admin` (Cloudflare Access)
- Webhook-based instant preview (rely on CF Pages branch deploys)
- Server-side image optimization pipeline

**Success criteria**

- An authorised editor can create, edit, and publish a blog post through `/admin` without touching Git
- Every CMS save produces a PR; nothing lands on `main` without explicit merge
- Thai translations are authored in a parallel form, gated behind `draft: true` until translated
- Build-time Zod validation continues to catch malformed frontmatter
- Production Lighthouse scores unchanged (admin is noindex)

---

## 2. Decision Log (locked during brainstorming 2026-07-03)

| Decision | Choice | Why |
|---|---|---|
| Auth method | Decap Cloud (SaaS git-gateway) | No backend needed; works with existing CF Pages setup |
| Bilingual strategy | Two MDX files per locale (`*.en.mdx` + `*.th.mdx`) | Decap's built-in i18n support; clean per-locale content |
| Migration | One-shot Node script | Idempotent, committable, run once on existing 5 blog posts |
| Editor workflow | PR + CF Pages preview deploys | Real Astro-rendered preview; existing CF Pages branch deploys handle it |
| MVP scope | `blog` collection only | Tightest scope; iterate later if it works |
| Approach | B: Decap + custom preview iframe | User selected despite 30-60s deploy lag tradeoff |
| Preview URL | Option X: CF Pages branch deploys (`https://<branch>--flyed-dev.pages.dev`) | Real Astro rendering; falls back to `flyed.dev` on main |

---

## 3. Architecture

### 3.1 Component map

```
┌─────────────────────────────────────────────────────────┐
│ Editor browser                                          │
│  ┌────────────────────┐    ┌────────────────────────┐   │
│  │ /admin (Decap UI)  │ ── │ <iframe> preview pane  │   │
│  └─────────┬──────────┘    └────────────┬───────────┘   │
└────────────┼─────────────────────────────┼──────────────┘
             │                             │
       GitHub API                    CF Pages preview URL
             │                             │
       ┌─────▼─────────────────────────────▼──────────┐
       │ flyed-dev/flyed (PR branch)                 │
       │  src/content/blog/*.en.mdx + *.th.mdx      │
       │  astro.config.mjs (output: 'server')        │
       └─────────────────────────────────────────────┘
```

### 3.2 Naming convention

- `src/content/blog/01-post-slug.en.mdx` — English
- `src/content/blog/01-post-slug.th.mdx` — Thai
- `blog` collection glob: `**/*.en.mdx`
- `blogTh` collection glob: `**/*.th.mdx`
- `heroImage` path is shared (no per-locale hero)
- Slug derives from filename without locale suffix (e.g. `01-post-slug.en.mdx` → slug `01-post-slug`)

### 3.3 Decap config (multi-file i18n)

Decap's `i18n.structure: multiple_files` with `path: "{{fields.slug}}.{{locale}}"` produces the `*.en.mdx` / `*.th.mdx` naming. The CMS UI shows a locale switcher in the navbar; editors create or edit either locale independently.

### 3.4 Preview flow

1. Editor opens draft in Decap
2. Clicks "Preview" → Decap opens `preview.html` in iframe
3. `preview.html` reads `?branch=...&slug=...&locale=...` from URL
4. Loads `https://<branch>--flyed-dev.pages.dev/blog/<slug>` (CF Pages branch deploy)
5. On `main` branch, loads `https://flyed.dev/blog/<slug>` (live site)

**Latency:** CF Pages branch deploy takes 30-60s after PR creation. Editor sees a 404 in the iframe until deploy completes. Banner in `preview.html` surfaces the branch state and warns when on a non-deployed branch.

---

## 4. File Structure

### 4.1 New files

| File | Purpose |
|---|---|
| `public/admin/index.html` | Decap CMS shell (loads decap-cms.js from CDN) |
| `public/admin/config.yml` | Collection schemas, i18n config, backend settings |
| `public/admin/preview.html` | Custom preview iframe with branch-aware URL |
| `public/admin/README.md` | Editor how-to (log in, create, publish) |
| `scripts/migrate-blog-i18n.mjs` | One-shot split: `*.mdx` → `*.en.mdx` + `*.th.mdx` |
| `tests/migrations/blog-i18n.test.ts` | Vitest: migration idempotency + correctness |
| `tests/e2e/cms.spec.ts` | Playwright: `/admin` loads, `config.yml` parses, preview iframe works |
| `docs/decap-cms.md` | Operator runbook (Decap Cloud setup, editor onboarding) |

### 4.2 Modified files

| File | Change |
|---|---|
| `src/content.config.ts` | Add `blogTh` collection; change `blog` glob to `**/*.en.mdx`; `nameTh`/`roleTh`/`titleTh` for non-blog collections stay (not in MVP scope) |
| `src/pages/th/blog/[slug].astro` | `getStaticPaths` reads from `blogTh` collection; render Thai `Content` |
| `.gitignore` | Ignore `.decap/` local cache |

### 4.3 Verified unchanged

| File | Reason |
|---|---|
| `src/pages/blog/[slug].astro` | Already uses `blog` collection, English body — no change |
| `src/pages/blog/[...page].astro` | Lists from `blog` collection — no change |
| `src/components/*` | No CMS-coupled components |
| `astro.config.mjs` | No new integrations; Decap loads from CDN |
| `wrangler.toml` | No new env vars; Decap Cloud handles OAuth |
| `package.json` | No new deps; Decap loads from `unpkg.com` |

---

## 5. Data Model

### 5.1 `blog` collection (English)

```ts
{
  loader: glob({ pattern: '**/*.en.mdx', base: './src/content/blog' }),
  schema: z.object({
    title: z.string().max(120),
    description: z.string().max(180),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: reference('team'),
    tags: z.array(z.enum(['Service','Cultural','STEM','Sports','Language','History','Curriculum','Safety','Brand','Educator'])),
    heroImage: z.string(),
    relatedItineraries: z.array(reference('itineraries')).default([]),
    draft: z.boolean().default(false),
  }),
}
```

### 5.2 `blogTh` collection (Thai)

Identical schema. `blogTh` reads `**/*.th.mdx`. The schema is duplicated to keep each collection self-contained and to allow future divergence (e.g. Thai-specific tags).

### 5.3 `*Th` fields — partial removal

The new two-file structure means `*Th` fields in the `blog` schema are no longer needed (each `.th.mdx` file has its own `title` field). However, `nameTh`, `titleTh`, `roleTh` fields in `destinations`, `categories`, and `team` schemas are kept — those collections remain single-file in this iteration (out of scope to migrate).

### 5.4 `team` collection (CMS-exposed as relation target)

```ts
{
  loader: glob({ pattern: '**/*.md', base: './src/content/team' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    roleTh: z.string().optional(),
    bio: z.string().max(400),
    photo: z.string(),
    order: z.number().int(),
  }),
}
```

`team` files are NOT split — they're shared reference data. `roleTh` field stays for the TH version of the team page.

---

## 6. Decap Config Detail

### 6.1 Backend

```yaml
backend:
  name: git-gateway
  repo: flyed-dev/flyed
  branch: main
```

`git-gateway` proxies GitHub OAuth through Decap Cloud. Free tier: 1 editor.

### 6.2 Media

```yaml
media_folder: "public/images/uploads"
public_folder: "/images/uploads"
```

Editors upload images to `public/images/uploads/`, committed to the repo. 5MB cap enforced in widget config.

### 6.3 Editorial workflow

```yaml
publish_mode: editorial_workflow
```

Every save creates a branch + PR. Editors cannot push directly to `main`.

### 6.4 Locale

```yaml
locale: en
i18n:
  structure: multiple_files
  locales: [en, th]
  default_locale: en
```

Decap UI is in English (Thai UI not needed; editors are internal staff).

### 6.5 Collection: blog (English)

```yaml
- name: "blog"
  label: "Blog (English)"
  folder: "src/content/blog"
  extension: "mdx"
  create: true
  slug: "{{slug}}"
  path: "{{slug}}.en"
  identifier_field: "title"
  fields:
    - { label: "Title", name: "title", widget: "string" }
    - { label: "Description", name: "description", widget: "text", pattern: ["^.{1,180}$", "Max 180 chars"] }
    - { label: "Publish date", name: "pubDate", widget: "datetime", date_format: "YYYY-MM-DD", time_format: false }
    - { label: "Updated date", name: "updatedDate", widget: "datetime", required: false, date_format: "YYYY-MM-DD", time_format: false }
    - { label: "Author", name: "author", widget: "relation", collection: "team", search_fields: ["name"], value_field: "id", display_fields: ["name"] }
    - { label: "Tags", name: "tags", widget: "select", multiple: true, options: ["Service","Cultural","STEM","Sports","Language","History","Curriculum","Safety","Brand","Educator"] }
    - { label: "Hero image", name: "heroImage", widget: "image", allow_multiple: false, media_library: { config: { max_file_size: 5242880 } } }
    - { label: "Related itineraries", name: "relatedItineraries", widget: "relation", collection: "itineraries", search_fields: ["title"], value_field: "id", display_fields: ["title"], multiple: true, required: false }
    - { label: "Draft", name: "draft", widget: "boolean", default: false, hint: "Hidden when true" }
    - { label: "Body", name: "body", widget: "markdown" }
  preview_path: "blog/{{slug}}"
  preview_path_date_field: "pubDate"
```

### 6.6 Collection: blog-th (Thai)

Identical schema to `blog` with Thai labels for field names. `path: "{{slug}}.th"`. Same `preview_path`.

**Critical for editor UX:** when creating a Thai post, the editor MUST use the exact same slug as the English post (e.g. `01-why-thailand-service-learning`). The Decap slug field shows the existing English slugs as suggestions; the operator should document this in the editor README.

### 6.7 Collection: team (read-only-ish)

```yaml
- name: "team"
  label: "Team"
  folder: "src/content/team"
  extension: "md"
  create: false
  fields:
    - { label: "Name", name: "name", widget: "string" }
    - { label: "Role (EN)", name: "role", widget: "string" }
    - { label: "Role (TH)", name: "roleTh", widget: "string", required: false }
    - { label: "Bio", name: "bio", widget: "text", pattern: ["^.{1,400}$", "Max 400 chars"] }
    - { label: "Photo", name: "photo", widget: "image" }
    - { label: "Order", name: "order", widget: "number", value_type: "int", min: 1 }
```

`create: false` — team members are added via Git. Edit in CMS allowed for photo/bio tweaks.

### 6.8 Custom preview template

`public/admin/preview.html` reads URL params and loads CF Pages branch preview URL. See section 3.4 for the full flow.

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Preview</title>
    <style>
      body { margin: 0; font-family: system-ui; }
      .preview-frame { width: 100vw; height: 100vh; border: 0; }
      .preview-banner { padding: 8px 12px; background: #fef3c7; font-size: 13px; border-bottom: 1px solid #fbbf24; }
    </style>
  </head>
  <body>
    <div class="preview-banner" id="banner">Loading preview…</div>
    <iframe id="frame" class="preview-frame"></iframe>
    <script>
      const params = new URLSearchParams(window.location.search);
      const branch = params.get('branch') || 'main';
      const slug = params.get('slug') || '';
      const locale = params.get('locale') || 'en';
      const cleanSlug = slug.replace(/\.mdx?$/, '');

      const previewUrl = branch === 'main'
        ? `https://flyed.dev/blog/${cleanSlug}`
        : `https://${branch}--flyed-dev.pages.dev/blog/${cleanSlug}`;

      document.getElementById('frame').src = previewUrl;
      document.getElementById('banner').textContent =
        branch === 'main' ? 'Live site (main branch)' : `Preview: ${branch}`;
    </script>
  </body>
</html>
```

---

## 7. Migration Script

### 7.1 Purpose

Split all existing `src/content/blog/*.mdx` into `*.en.mdx` + `*.th.mdx` pairs. The Thai version starts as a copy of the English content with a `TODO` frontmatter marker and `draft: true`, so it doesn't publish untranslated.

### 7.2 Algorithm

```
for each src/content/blog/*.mdx (not already *.en.mdx or *.th.mdx):
  1. Parse frontmatter + body
  2. Compute new slug: filename minus .mdx
  3. Write: <slug>.en.mdx with original content
  4. Write: <slug>.th.mdx with:
     - frontmatter: copy of original (title/desc as-is for now)
     - body: copy of original English body
     - prepend body with: <!-- TODO(editor): translate this post to Thai. Set draft: false when done. -->
     - frontmatter `draft: true` to hide untranslated
  5. Delete original *.mdx
```

### 7.3 Idempotency

If a file already matches `*.en.mdx` or `*.th.mdx` pattern, skip it. Re-running on already-migrated files is a no-op.

### 7.4 Failure mode

Script writes to a temp file (`*.en.mdx.new`, `*.th.mdx.new`), validates YAML parses, then atomically renames. On any parse error, leaves originals untouched and exits non-zero.

### 7.5 Run command

```bash
node scripts/migrate-blog-i18n.mjs
# or via npm script:
npm run migrate:blog-i18n
```

### 7.6 Expected output on first run

```
[migrate] processing 01-why-thailand-service-learning.mdx
[migrate]   wrote 01-why-thailand-service-learning.en.mdx
[migrate]   wrote 01-why-thailand-service-learning.th.mdx (draft: true)
[migrate]   deleted 01-why-thailand-service-learning.mdx
[migrate] processing 02-chiang-mai-service-rebook.mdx
...
[migrate] done. 5 posts migrated.
```

---

## 8. Editor Workflow

### 8.1 First-time setup (operator)

1. Sign up at https://decapcms.org/cloud/ (free tier)
2. Add site: production URL = `https://flyed.dev`
3. Connect GitHub repo: `flyed-dev/flyed`
4. Invite editor by GitHub username
5. Editor visits `/admin` → GitHub OAuth → ready

### 8.2 Creating a post (English)

1. Editor logs in to `/admin`
2. Clicks "New Blog (English)"
3. Fills form fields
4. Clicks "Publish"
5. Decap creates branch `cms/<post-slug>`, commits, opens PR
6. Editor (or reviewer) sees PR in GitHub
7. CF Pages auto-deploys preview URL
8. Reviewer clicks "Approve and merge" → main → production deploy

### 8.3 Translating to Thai

1. Editor logs in, switches to "Blog (ไทย)" collection
2. Clicks "New Blog (ไทย)" — but the slug must match an existing English slug
3. Decap's `path: "{{fields.slug}}.th"` enforces this
4. Editor translates `title`, `description`, body
5. Sets `draft: false` when done
6. Publishes → PR → merge

### 8.4 Editing existing post

1. Editor logs in → opens post from list
2. Edits fields
3. Publishes → PR → merge

### 8.5 Draft workflow

1. Editor clicks "Set status → Draft" before publishing
2. PR created with `[DRAFT]` in title, no CF Pages deploy
3. Editor returns later → opens in Decap → continues editing
4. When ready → "Set status → Ready" → reviewer merges

---

## 9. Error Handling

### 9.1 Build-time (Zod)

All existing Zod validation in `content.config.ts` continues to apply. A bad frontmatter commit (e.g. via direct git push) fails the build with a clear error.

### 9.2 Migration script

- YAML parse failure → exit non-zero, log offending file, do not delete original
- File write failure → exit non-zero, log error
- Idempotent: re-running is safe

### 9.3 Decap config errors

- `config.yml` is a static file; if syntax breaks, Decap shows a parse error in the UI
- Add `tests/e2e/cms.spec.ts` to assert `/admin/config.yml` returns 200 and parses as YAML

### 9.4 Preview URL 404s

- Branch not yet deployed → CF Pages returns 404 for ~30-60s
- `preview.html` shows branch name in banner; user can wait or refresh
- Fallback: when branch is `main`, loads `https://flyed.dev/blog/<slug>` (live site)

### 9.5 Image upload failure

- Decap enforces 5MB cap in widget config
- Server-side errors during commit logged in Decap UI
- Editor retries

---

## 10. Testing

### 10.1 Unit / migration

`tests/migrations/blog-i18n.test.ts` (Vitest):

- `npm run migrate:blog-i18n` on fixture MDX files
- Assert `.en.mdx` and `.th.mdx` outputs exist
- Assert frontmatter preserved
- Assert Thai version has `draft: true` and `TODO` body marker
- Assert idempotency: run twice, file count unchanged

### 10.2 E2E

`tests/e2e/cms.spec.ts` (Playwright):

- Visit `/admin` → assert Decap script tag present
- Visit `/admin/config.yml` → assert HTTP 200 + YAML parses
- Visit `/admin/preview.html?slug=foo&locale=en&branch=main` → assert iframe loads
- Visit `/admin/index.html` → assert noindex meta tag present

### 10.3 Type check

- `npm run check` must pass (Astro + tsc)
- Verify both `blog` and `blogTh` schemas are exported and used

### 10.4 Build

- `npm run build` must succeed end-to-end
- `dist/admin/index.html` must exist
- `dist/admin/config.yml` must exist
- `dist/admin/preview.html` must exist
- All blog pages render correctly in both locales

### 10.5 Manual smoke

- Editor logs in to `/admin` (real GitHub OAuth)
- Creates a draft English post
- Sees PR created in `flyed-dev/flyed`
- Sees CF Pages preview URL work after ~45s
- Merges PR → production live

---

## 11. Rollback Plan

If something goes wrong post-launch:

1. **CMS removal** (3 commands):
   - Delete `public/admin/` (3 files)
   - Revert `src/content.config.ts` to single-collection
   - Revert `src/pages/th/blog/[slug].astro` to original

2. **Reverse migration** (recover content):
   - `scripts/migrate-blog-i18n.mjs` → add `--reverse` flag (or write `revert.mjs`)
   - Pairs `.en.mdx` + `.th.mdx` → `.mdx` (TH content discarded)

3. **Decap Cloud account** kept (no cost), can be re-enabled later

4. **No data loss** if migration was successful — content lives in git history

---

## 12. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Editor pushes broken frontmatter | Medium | Build fail | Decap widget validation; build-time Zod catches rest |
| Image upload too large | Low | Upload fail | 5MB cap in widget config |
| Preview URL format changes | Low | Preview 404 | Pin to CF Pages format docs; refresh on CF dashboard change |
| Thai translation stale | Medium | User sees English content | `draft: true` default on new Thai files; pre-existing Thai pages continue to use English body until translated |
| Migration corrupts files | Low | Data loss | Migration script writes to `.new` first, validates YAML, atomically renames |
| Decap Cloud outage | Low | Editors blocked | Fallback to git CLI for urgent edits |
| GitHub rate limit | Low | Slow API | Decap Cloud uses auth'd requests, 5000/hr |
| Branch deploy cost | Low | CF Pages minutes | Branch deploys are free on CF Pages hobby tier |
| `itineraries` relation widget breaks | Low | Editor cannot link | Tested in CMS spec; widget config validated |
| `team` author ref typo | Low | Build fail | Relation widget validates ID against team collection |

---

## 13. Open Questions

None. All decisions locked in brainstorming 2026-07-03.

---

## 14. Out of Scope (Future PRs)

- `itineraries`, `destinations`, `categories` in CMS
- `team` write access (currently `create: false`)
- Custom Decap UI branding matching flyed design tokens
- Cloudflare Access IP allowlist on `/admin`
- Server-side image optimization (use Decap defaults)
- Webhook-based instant preview (CF Pages branch deploy is sufficient)
- Migration of `destinations`/`categories` to two-file i18n (current `*Th` inline fields continue working)

---

**Status:** Awaiting user review before transitioning to implementation plan via `superpowers:writing-plans`.

> **Note (2026-07-05):** The runbook has since been moved to docs/operations/runbooks/RB-decap-cms.md (commit 5fe0e2a).
