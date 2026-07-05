---
title: RB — Astro image service under @astrojs/cloudflare
doc_type: runbook
status: draft
version: 0.1.0
date: 2026-07-05
authors: ['docs-architect (AI-generated, pending human review)']
owner: engineering on-call
service: build-time image pipeline (Astro 7 + @astrojs/cloudflare)
severity_default: P3
related_alerts: []
related: [../deployment.md]
---

# RB — Astro image service under @astrojs/cloudflare

## Overview

Astro 7 can build AVIF / WebP / resized JPEG variants at build time via
`<Image>` from `astro:assets`. The Cloudflare adapter
(`@astrojs/cloudflare@^14.0.2`, declared at
`/home/phurix/projects/flyed/astro.config.mjs:43-48`) gates this on whether
the image source is **ESM-imported** (`src/assets/foo.jpg`) or a string ref
(`/images/foo.jpg` from `public/`). Today, all hero, destination, and blog
images live in `/home/phurix/projects/flyed/public/images/` and are
referenced by string — so **build-time AVIF / WebP variants are not being
produced**.

This runbook covers what to do when:

1. A designer reports broken or unoptimized images on the live site.
2. A performance audit (Lighthouse, WebPageTest) flags image weight.
3. The team is ready to migrate from `public/images/*` (string refs) to
   `src/assets/*` (ESM imports) and unlock real variants.

**Resolved means:** the affected images render correctly AND the team knows
whether AVIF/WebP variants are in play (and why or why not).

**Severity guidance:** default **P3** (no functional regression — images
still serve). Escalate to **P2** if a production page renders broken
images for a paying customer.

## Prerequisites and access

- Read access to `/home/phurix/projects/flyed/astro.config.mjs`,
  `/home/phurix/projects/flyed/src/components/Hero.astro`,
  `/home/phurix/projects/flyed/src/components/HomePage.astro`, and
  `/home/phurix/projects/flyed/src/components/ServiceUtilityCard.astro`
  (the three components that use `<Image>`).
- Read access to `/home/phurix/projects/flyed/public/images/` (where
  current images live).
- Optional: `npm run build` locally with `dist/` inspection.

## Why the current setup produces no AVIF / WebP

The Cloudflare adapter's image service is configured to `passthrough` at
`/home/phurix/projects/flyed/astro.config.mjs:47`. The comment block at
`astro.config.mjs:44-48` and `77-84` explains why:

> `imageService: 'passthrough'` is the only choice that does anything. Any
> other mode (`compile`, `sharp`, custom entrypoint) is silently downgraded
> by `@astrojs/cloudflare` when `src` is a string ref instead of an
> ESM-imported image. The downgrade produces a warning, not an error, so
> the build still succeeds and ships the raw `public/*` images.

The three places that import `<Image>` from `astro:assets`:

- `/home/phurix/projects/flyed/src/components/Hero.astro:2, 34` — `<Image
src={imageSrc} ...>` where `imageSrc` is a string passed in from the page
  (e.g. `/images/hero/hero-1.jpg`).
- `/home/phurix/projects/flyed/src/components/HomePage.astro:17` — same pattern.
- `/home/phurix/projects/flyed/src/components/ServiceUtilityCard.astro:2` — same.

The accompanying comment at `Hero.astro:33` confirms the workaround:

> `format/widths omitted: imageService=passthrough + public/* src → no
build-time variants. Re-add after image-migration follow-up lands.`

> **OPEN QUESTION (owner: design/engineering):** The migration that would
> unlock real AVIF/WebP variants — moving images from `public/images/*` to
> `src/assets/*` and converting string refs to ESM imports — was identified
> as a follow-up after the Wave 7 image refactor (commit
> `b57284e refactor(images): replace SmartImage with astro:assets Image`).
> It is not currently scheduled. Effort estimate: half a day of mechanical
> work plus a content-tree move plus rerunning the Playwright visual
> regression suite.

## Diagnosis

### 1. Is the symptom a "broken image" or a "performance issue"?

These are two distinct problems with two distinct fixes.

| Symptom                               | Root cause                                                | Fix path                              |
| ------------------------------------- | --------------------------------------------------------- | ------------------------------------- |
| Image 404s on the live site           | Path mismatch between `src={...}` and `public/images/...` | Re-upload or correct the path         |
| Image renders but is large (≥ 200 KB) | No AVIF/WebP variant; JPEG only                           | Migrate to `src/assets/` per §6 below |
| Image renders but wrong aspect ratio  | `width`/`height` mismatch on `<Image>`                    | Edit the call site                    |
| Image renders but blurry on retina    | `densities` or `widths` not set                           | Edit the call site to add widths      |

### 2. Confirm the build did not produce variants

```bash
npm run build
ls dist/client/_astro/ 2>&1 | head -20
# Should show hashed JS/CSS chunks but no AVIF/WebP
find dist/client -name '*.avif' -o -name '*.webp' 2>&1
# If empty: no variants were produced. This is expected under the current
# config. If you see variants: investigate whether the adapter's silent
# downgrade stopped working.
```

### 3. Check whether the image is from `public/` or `src/assets/`

```bash
grep -rn "from 'astro:assets'" /home/phurix/projects/flyed/src --include="*.astro" --include="*.tsx"
grep -rn "import.*\.jpg\|import.*\.png\|import.*\.webp" /home/phurix/projects/flyed/src --include="*.astro" --include="*.tsx"
```

If only the first grep hits and the second does not: every `<Image>` is
using a string ref. Variants will not be produced.

### 4. Reproduce on a clean build

```bash
rm -rf dist .astro
npm run build
grep -E 'passthrough|imageService' dist/server/_astro/*.mjs 2>&1 | head
```

If the adapter logged a downgrade warning during build, it would appear in
the console output. Capture the full build log.

## Mitigation

### A. "Image is broken / 404"

1. Compare the `src={...}` value with the file on disk:
   ```bash
   ls /home/phurix/projects/flyed/public/images/blog/ | head -5
   grep -rn 'heroImage' /home/phurix/projects/flyed/src/content/blog/ | head -5
   ```
2. The blog schema's `heroImage` is a string
   (`/home/phurix/projects/flyed/src/content.config.ts:45`), so a typo in
   the MDX frontmatter manifests as a 404. Fix the frontmatter value.
3. For site-wide 404s: check whether the image was deleted from
   `public/images/` but is still referenced.

### B. "Image is slow / too large"

1. Verify the symptom: open the page in Chrome DevTools → Network → filter
   by Img → note the file size and whether AVIF/WebP is offered.
2. If AVIF/WebP is not offered: this is the expected behavior under the
   current config. Do not change config without testing.
3. Short-term mitigation: hand-optimize the JPEG with `cavif` or
   `imagemin` (see `/home/phurix/projects/flyed/docs/image-prompts.md:104-111`
   for the post-processing recipe).
4. Long-term mitigation: complete the `src/assets/` migration (see §6).

### C. "Designer reports broken image"

1. Ask for the URL and the broken image's dimensions.
2. Run the §1 table to triage.
3. Most "broken" reports under this codebase are case-A (string mismatch)
   or case-B (unoptimized but renders).

## 6. Migrating to `src/assets/` (the unlock)

This is the migration that enables real AVIF/WebP. It is **not in scope**
of this runbook's immediate mitigation but is documented here because it
is the single change that resolves the underlying limitation.

### 6.1 Preconditions

- Decide on a path mapping. Today images live at
  `/home/phurix/projects/flyed/public/images/{blog,destinations,itineraries,hero,categories,team,badges}/...`.
  A 1:1 move to `/home/phurix/projects/flyed/src/assets/images/...` is the
  simplest.
- Decide on the import style. The Astro idiomatic pattern is
  `import heroImg from '~/assets/images/hero/hero-1.jpg'` and then
  `<Image src={heroImg} ...>`. Some call sites currently pass the string
  through props from the page; those props become the imported image
  instead.

### 6.2 Procedure

1. Move files (preserving tree):
   ```bash
   mkdir -p src/assets
   git mv public/images src/assets/images
   ```
2. Convert string refs to imports. Three call sites today:
   - `src/components/Hero.astro:34` — `src={imageSrc}` becomes
     `src={heroImg}` after importing the asset.
   - `src/components/HomePage.astro` — same pattern.
   - `src/components/ServiceUtilityCard.astro` — same.
3. Update content frontmatter references. The `heroImage` field in blog,
   destination, itinerary, etc. content collections
   (`src/content.config.ts:45, 82, 100`) is a string. Two options:
   - **(a)** Keep string paths (`/images/...`) and rely on the runtime to
     serve them. **Loses the build-time variant benefit.**
   - **(b)** Migrate frontmatter to use ESM imports. **Significant
     frontmatter rework; affects Decap CMS schema.** Open question below.
4. Update the adapter config:
   ```js
   // astro.config.mjs:43-48
   adapter: cloudflare({
     imageService: 'compile',  // was 'passthrough'
   }),
   ```
5. Add `format` and `widths` to the `<Image>` calls in the three sites:
   ```astro
   <Image
     src={heroImg}
     alt={imageAlt}
     width={2400}
     height={1350}
     sizes="100vw"
     widths={[640, 960, 1280, 1920, 2400]}
     formats={['avif', 'webp']}
     ...
   />
   ```
6. Update the `imageService` reference in `astro.config.mjs:77-84`'s
   comment to reflect the new mode.
7. Run `npm run build` and verify `dist/client/_astro/*.avif` /
   `*.webp` exist.
8. Run `npm run test:e2e` and review the visual regression suite at
   `tests/e2e/visual.spec.ts-snapshots/`. The migration will change
   pixel output; expect to update baselines with
   `npm run test:e2e -- --update-snapshots`.

> **OPEN QUESTION (owner: design/engineering):** Step 3 (frontmatter +
> Decap schema) is the load-bearing decision. Option (b) requires editing
> the Decap widget to allow image-picker values that are ESM imports
> rather than URLs. This is non-trivial because the Decap `image` widget
> writes to a string field. Confirm the team's preferred direction
> before starting the migration.

### 6.3 What does NOT need to change

- The `public/admin/` directory stays put — Decap's CMS shell and config
  are static assets that must be served as-is.
- The image upload path (`public/images/uploads/blog/`, written by
  Decap uploads per `/home/phurix/projects/flyed/public/admin/config.yml:42-43`)
  does not conflict with the migration: editor-uploaded images still
  land in `public/` (and are served at `/images/uploads/blog/...`); the
  migration is for hand-curated hero/destination imagery only.
- The `imageService: 'compile'` mode is supported by `@astrojs/cloudflare`
  without any extra build setup; the adapter handles the variant
  generation itself.

## Verification

After any fix:

- **Visual regression:** `npm run test:e2e -- tests/e2e/visual.spec.ts`
  passes. New baselines captured if intentional visual changes were made.
- **Build output:** `find dist/client -name '*.avif' -o -name '*.webp'`
  reflects the expected variant set (empty today, populated after §6).
- **Live site:** `curl -fsS https://flyed.dev/ | grep -E '<img.*\.avif|<img.*\.webp'`
  shows the expected `<source>` elements.

## Escalation

- **Time-box:** if not diagnosed within 30 minutes, escalate to the
  engineering lead. Image-related bugs are usually small but the
  diagnosis requires reading multiple components.
- **If a paying customer reports broken images on a launched page:**
  escalate to the founder immediately. The fix for "broken" is almost
  always a single-file content edit; do not delay.
- **What to hand over:** the diagnosis output (image path, call site,
  build log excerpt), plus the failing test screenshot if from Playwright.

## Post-incident

- File a follow-up ticket for the §6 migration if performance is the
  recurring complaint.
- **UPDATE THIS RUNBOOK** if any step was missing or wrong. The
  Wave 7 review flagged that this runbook did not previously exist;
  keeping it accurate is the difference between a 5-minute image fix
  and a 50-minute spelunking session.

## Related

- `../deployment.md` — for the broader build/deploy pipeline.
- `/home/phurix/projects/flyed/docs/image-prompts.md` — for the
  asset-production recipe that produces the source JPEGs this runbook
  is about.
