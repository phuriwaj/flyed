---
status: 'accepted'
date: 2026-07-04
decision-makers: ['flyed engineering']
consulted: ['docs-architect (reverse-documented 2026-07-05)']
informed: []
---

# Defer real AVIF / WebP until images are ESM-imported from `src/assets/`

## Context and problem statement

Lighthouse `performance` ≥ 0.95 (`.lighthouserc.json:19`) and `largest
contentful paint` < 2.5s on mid-tier mobile are quality goals Q1 in the
architecture overview. Modern image formats (AVIF, WebP) typically deliver
20–40% byte savings versus JPEG/PNG at equivalent visual quality. Yet
flyed currently ships JPEG/PNG only — the `public/images/` directory is
served verbatim via the ASSETS binding with no per-format variants.

The decision: how do we ship optimized images today, and what is the
trigger that unlocks real AVIF/WebP variants?

## Decision drivers

- The Cloudflare adapter (`@astrojs/cloudflare@^14.0.2`) only honors
  image-service config when images are ESM-imported into a component.
  With images in `public/images/`, the adapter silently downgrades any
  non-`passthrough` service and prints a warning. This is documented in
  `astro.config.mjs:77-84`.
- `astro:assets` `<Image>` (the new Wave 7 replacement for the legacy
  `SmartImage`) can emit build-time AVIF/WebP variants — but only when
  the image is imported (`src/components/HomePage.astro:17` is the
  starting adoption point).
- Lighthouse CI gates performance on eight URLs including
  `/`, `/trips`, `/destinations`, `/itineraries/*`, `/blog`, `/enquire`
  (`.lighthouserc.json:5-13`). The heaviest image pages are
  `/`, `/destinations/*`, `/itineraries/*`.
- The `<Image>` migration was completed in Wave 7 Task 4.1 (commit
  `b57284e refactor(images): replace SmartImage with astro:assets Image`).
  Not every consumer has been migrated yet (audit B.6 / Wave 7 plan
  Task 4.2-4.4 territory).

## Considered options

- **Enable `compile` image service now.** The Cloudflare adapter would
  downgrade it to `passthrough` and print a warning. We would gain
  nothing and add a build-time warning to the log.
- **Migrate every `public/images/*` consumer to ESM-imported `src/assets/*`
  immediately, then enable `compile`.** Largest effort; risks regressing
  Lighthouse Performance on URLs that depend on images that haven't been
  audited yet.
- **Keep `passthrough` for Wave 7; ship JPEG/PNG; file a follow-up to
  migrate images and flip `imageService` to `compile`.** Accept the
  current Lighthouse numbers as the Wave 7 floor.

## Decision outcome

Chosen option: **"Keep `passthrough` for Wave 7; defer real AVIF/WebP until
the image migration is complete"**, because the `compile` service cannot
do anything today (the adapter downgrades it), and a rushed image migration
risks regressions that the LHCI gate will catch late.

### Consequences

- Good, because Wave 7 ships with a known, stable image pipeline — JPEG/PNG
  via `passthrough`, served by Cloudflare's edge cache.
- Good, because the `<Image>` adoption is incremental — when a component
  imports an image, `astro:assets` runs the configured service on it,
  which today is `passthrough` (no-op). When we flip `imageService` to
  `'compile'`, every already-imported image automatically gets variants.
- Bad, because Lighthouse Performance is gated on JPEG/PNG byte sizes
  today. We accept whatever Lighthouse score that delivers (it currently
  passes the ≥ 0.95 CI gate per `.lighthouserc.json:19`, but with less
  headroom than AVIF/WebP would give).
- Bad, because the marketing-spec's image plan
  (`docs/image-prompts.md`) instructs asset producers to "Export AVIF +
  WebP + fallback JPEG" (post-processing section) — but the assets
  shipped in `public/images/` are JPEG/PNG only, so the AVIF/WebP
  variants are generated at build time only for ESM-imported images.
- Neutral, because the trigger to revisit is mechanical: when every image
  is ESM-imported, flip `imageService` from `'passthrough'` to `'compile'`
  in `astro.config.mjs:47`. No new dep, no config beyond that line.
- Neutral, because the audit OPEN QUESTION (owner: engineering) — "what
  is the switch-over plan when images move from `public/images/` to
  `src/assets/` and get ESM-imported?" — is the follow-up ticket.

### Confirmation

- `astro.config.mjs:46-48` — `imageService: 'passthrough'` is the only
  mode that does anything under the Cloudflare adapter today.
- `astro.config.mjs:77-84` — comment block documents the explicit warning
  about silent downgrade and the single-line change required to flip to
  `'compile'`.
- `src/components/HomePage.astro:17` — `import { Image } from 'astro:assets'`
  is the first consumer; more to follow.
- `.lighthouserc.json:5-13` — eight URLs gated; if the LHCI score drops
  below 0.95 on any URL after an image change, the CI fails.

## Pros and cons of the options

### Enable `compile` now

- Good, because the config line is one character.
- Bad, because the adapter silently downgrades it and prints a warning —
  zero benefit, one more log line.

### Migrate every image immediately, then enable `compile`

- Good, because AVIF/WebP variants ship as soon as the migration lands.
- Bad, because the migration is wide (every `public/images/*` consumer),
  risks Lighthouse regressions on URLs with images we haven't audited
  individually, and would consume Wave 7 capacity that was spent on other
  tasks.

### Defer to a follow-up wave

- Good, because Wave 7 ships with a known-stable image pipeline.
- Good, because the single-line flip is mechanical when the migration is done.
- Bad, because we ship JPEG/PNG byte sizes longer than necessary.

## More information

- Astro config: `astro.config.mjs:43-48, 77-84`.
- Asset production guide: `docs/image-prompts.md` (mentions exporting
  AVIF + WebP + fallback JPEG).
- Wave 7 image refactor: commit `b57284e refactor(images): replace
SmartImage with astro:assets Image` (Task 4.1) and follow-up
  `8117cff fix(images): drop no-op format/widths attrs from
Hero/HomePage/ServiceUtilityCard`.
- Lighthouse CI: `.lighthouserc.json`.
- Follow-up trigger: when every consumer imports from `src/assets/`, flip
  `imageService` to `'compile'` in `astro.config.mjs:47` and rerun LHCI
  on all eight gated URLs.
