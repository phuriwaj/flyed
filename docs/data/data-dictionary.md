---
title: Data dictionary — flyed marketing site
doc_type: data-dictionary
status: draft
version: 0.1.0
date: 2026-07-05
authors:
  - docs-architect (AI-generated, pending human review)
reviewers: []
system: flyed marketing site
source_commit: 6830fe4
related:
  - database-design.md
  - ../requirements/srs.md
  - ../requirements/use-cases/UC-001-submit-school-trip-enquiry.md
  - ../requirements/use-cases/UC-004-browse-content-by-locale.md
  - ../architecture/overview.md (Agent 2)
---

# Data dictionary — flyed marketing site

Scope: Astro Content Collections (`src/content.config.ts` declares 5 collections: `blog`, `itineraries`, `destinations`, `categories`, `team`) and the two Cloudflare KV namespaces (`LEADS_KV`, `RATE_LIMIT_KV`). All entries as of commit `6830fe4` (2026-07-05).

This document is mechanical reference: every field has type, nullability, key, default, description, sensitivity, and a source-of-truth file:line. "Captain Obvious" descriptions (those that merely restate the name) are not accepted (per skill rule).

## Conventions

| Rule                                                                                                                                                                                                                                              | Note                                                      | Source |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------ |
| All content collections are loaded with Astro's `glob()` loader reading `.md` or `.mdx` files.                                                                                                                                                    | `src/content.config.ts:23,52,90,107,120`                  | —      |
| Every field validated by Zod at build time.                                                                                                                                                                                                       | `src/content.config.ts:24-48`, etc.                       | —      |
| Date fields use `z.coerce.date()` — accepts ISO strings or YAML `!!timestamp` objects.                                                                                                                                                            | `src/content.config.ts:28-29`                             | —      |
| Booleans default to `false` unless noted.                                                                                                                                                                                                         | `src/content.config.ts:48` (`draft`), `:85` (`published`) | —      |
| Cross-collection references (`reference('team')`, `reference('itineraries')`, etc.) are resolved at build time via `getEntry`.                                                                                                                    | `src/pages/blog/[slug].astro:41`, `:50-58`                | —      |
| KV namespace TTL semantics: `expirationTtl` in seconds.                                                                                                                                                                                           | `src/lib/rate-limit.ts:49`; `src/pages/api/enquiry.ts:67` | —      |
| KV value format: JSON-encoded string.                                                                                                                                                                                                             | `src/pages/api/enquiry.ts:65`; `src/lib/rate-limit.ts:48` | —      |
| Locale filter: `data.locale === activeLocale && data.draft === false` for blog; no locale filter for other collections.                                                                                                                           | `src/pages/blog/[...page].astro:12`                       | —      |
| Sensitivity classification: `public` (visible to all visitors) / `internal` (build-only) / `pii` (personal data, PII-relevant under PDPA). There are no `secret` columns in any collection (secrets live in Workers secrets, not in collections). | inferred                                                  | —      |

## Table index

| Table         | Domain       | Purpose                          | Rows (class)            | Owner            | Where it lives              |
| ------------- | ------------ | -------------------------------- | ----------------------- | ---------------- | --------------------------- |
| blog          | content      | Marketing articles in MDX        | M                       | Decap editor     | `src/content/blog/`         |
| itineraries   | content      | Trip itineraries                 | S                       | Decap editor     | `src/content/itineraries/`  |
| destinations  | content      | Thai cities / regions            | S                       | Decap editor     | `src/content/destinations/` |
| categories    | content      | Trip types                       | S                       | Decap editor     | `src/content/categories/`   |
| team          | content      | Flyed team members               | S                       | Decap editor     | `src/content/team/`         |
| LEADS_KV      | runtime (KV) | Per-enquiry durable records      | L (traffic-dependent)   | Enquiry endpoint | `wrangler.jsonc:23-26`      |
| RATE_LIMIT_KV | runtime (KV) | Sliding-window timestamps per IP | L (active-IP-dependent) | Rate limit lib   | `wrangler.jsonc:18-21`      |

---

## blog

Source-of-truth schema: `src/content.config.ts:22-49`. Loader: `glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' })`. Locale filter at read sites: `data.locale === 'en'` (or `'th'`) and `data.draft === false`.

| Column                    | Type                                 | Null | Key | Default | Description                                                                                                                                                                                                            | Sensitivity |
| ------------------------- | ------------------------------------ | ---- | --- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `id`                      | string                               | N    | PK  | —       | Filename without extension (e.g., `01-why-thailand-service-learning.en`). Generated by `glob()` from the file path. Used as URL slug after stripping `.mdx` and `.en`/`.th` suffix.                                    | public      |
| `data.locale`             | enum `'en'` \| `'th'`                | N    | —   | —       | Locale of this post. The merged-collection model means every post belongs to exactly one locale; consumers filter by this field.                                                                                       | public      |
| `data.title`              | string (max 120)                     | N    | —   | —       | Headline of the post. Rendered as `<h1>` and as `og:title`.                                                                                                                                                            | public      |
| `data.description`        | string (max 180)                     | N    | —   | —       | One-paragraph synopsis. Rendered as `meta name="description"` and as `og:description`.                                                                                                                                 | public      |
| `data.pubDate`            | date (coerced)                       | N    | —   | —       | Publication date (UTC). Rendered as `toLocaleDateString('en-US', …)` regardless of locale. Used for blog ordering and RSS `pubDate`.                                                                                   | public      |
| `data.updatedDate`        | date (coerced)                       | Y    | —   | —       | Optional last-modified date. Renders as JSON-LD `dateModified` when present.                                                                                                                                           | public      |
| `data.author`             | reference (`'team'`)                 | N    | FK  | —       | Pointer to a `team` entry by id (e.g., `'kriengsak'`). Resolved via `getEntry()` at build time. Build fails at `src/pages/blog/[slug].astro:55-60` if the reference is missing — a content typo becomes a build error. | public      |
| `data.tags`               | array of enum (see §blog-tags below) | N    | —   | —       | One or more tags from the 10-value blog-tag enum. Used for blog-index chips and related-post matching (≥ 1 overlap qualifies, see `src/pages/blog/[slug].astro:43-48`).                                                | public      |
| `data.heroImage`          | string (path)                        | N    | —   | —       | Path to a hero image, resolved through `astro:assets` post-Wave-7. Examples: `/images/blog/01-service-learning-hero.jpg`.                                                                                              | public      |
| `data.relatedItineraries` | array of reference (`'itineraries'`) | Y    | FK  | `[]`    | Optional references to itineraries shown on the "Related trips" card. Each reference is resolved via `getEntry()`; a missing reference halts the build with a content-path-bearing error message.                      | public      |
| `data.draft`              | boolean                              | N    | —   | `false` | When `true`, the post is hidden from the public blog index and RSS feed. Build-time filter: `data.draft === false` (`src/pages/blog/[...page].astro:12`).                                                              | internal    |
| `body`                    | MDX text                             | N    | —   | —       | File body; rendered via `render(entry)` (`src/pages/blog/[slug].astro:25`). Used for word-count read-time estimates (`src/pages/blog/[slug].astro:32-33`).                                                             | public      |

### §blog-tags

Values: `'Service'`, `'Cultural'`, `'STEM'`, `'Sports'`, `'Language'`, `'History'`, `'Curriculum'`, `'Safety'`, `'Brand'`, `'Educator'`.

Declared at `src/content.config.ts:31-44`. These are tags applied to blog posts and surfaced as filter chips on the blog index (`src/pages/blog/[...page].astro:62-75`) and the `/blog/tag/<tag>` pages (`src/pages/blog/tag/[tag].astro`).

The URL form of a tag is its lowercase (`<tag.toLowerCase()>` — see `src/pages/blog/[...page].astro:67`).

---

## itineraries

Source-of-truth schema: `src/content.config.ts:51-87`.

| Column               | Type                                  | Null | Key                       | Default | Description                                                                                                                                                                                                                     | Sensitivity |
| -------------------- | ------------------------------------- | ---- | ------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `id`                 | string                                | N    | PK                        | —       | Filename without extension. URL slug is `data.slug` (separate field) — `id` is for internal references only.                                                                                                                    | public      |
| `data.title`         | string                                | N    | —                         | —       | Itinerary title (e.g., "Sailing the Andaman").                                                                                                                                                                                  | public      |
| `data.description`   | string (max 200)                      | N    | —                         | —       | One-paragraph synopsis for the itinerary.                                                                                                                                                                                       | public      |
| `data.category`      | enum (`categoryEnum`)                 | N    | FK (to `categories.slug`) | —       | One of 6 trip types. Drives the `/trips/<slug>` page filter and the "related itineraries" logic on detail pages. See §categoryEnum below.                                                                                       | public      |
| `data.destinations`  | array of reference (`'destinations'`) | N    | FK                        | —       | Pointers to destination entries (e.g., `'phuket'`, `'krabi'`). Resolved via `getEntry()` at read time. The `[city].astro` page matches either by slug string OR by resolved entry id — both formats are accepted by the schema. | public      |
| `data.days`          | integer (positive)                    | N    | —                         | —       | Trip length in days. Rendered on the "at a glance" sidebar.                                                                                                                                                                     | public      |
| `data.groupSize.min` | integer                               | N    | —                         | —       | Minimum group size.                                                                                                                                                                                                             | public      |
| `data.groupSize.max` | integer                               | N    | —                         | —       | Maximum group size.                                                                                                                                                                                                             | public      |
| `data.ageBand.min`   | integer                               | N    | —                         | —       | Minimum student age (inclusive).                                                                                                                                                                                                | public      |
| `data.ageBand.max`   | integer                               | N    | —                         | —       | Maximum student age (inclusive).                                                                                                                                                                                                | public      |
| `data.priceFrom`     | integer (positive)                    | N    | —                         | —       | Starting price in `data.currency`. Per-trip minimum, not per-student.                                                                                                                                                           | public      |
| `data.currency`      | literal `'USD'`                       | N    | —                         | —       | Currency code. Hard-coded to USD via `z.literal('USD')`.                                                                                                                                                                        | public      |
| `data.startMonths`   | array of month enum                   | N    | —                         | —       | Months when this itinerary runs. Each must be a valid 3-letter month enum. Rendered as a comma-separated list.                                                                                                                  | public      |
| `data.curricula`     | array of curriculum enum              | N    | —                         | —       | Curricula this itinerary aligns with (renders as badges).                                                                                                                                                                       | public      |
| `data.heroImage`     | string                                | N    | —                         | —       | Hero image path.                                                                                                                                                                                                                | public      |
| `data.gallery`       | array of string                       | Y    | —                         | `[]`    | Up to 6 gallery image paths (the detail page renders the first 6).                                                                                                                                                              | public      |
| `data.slug`          | string                                | N    | —                         | —       | URL slug for the itinerary detail page (`/itineraries/<slug>`). Convention: matches `id`.                                                                                                                                       | public      |
| `data.published`     | boolean                               | N    | —                         | `true`  | When `false`, the itinerary is hidden from public listings. Default `true` to favor content going live.                                                                                                                         | internal    |
| `body`               | MDX text                              | N    | —                         | —       | Day-by-day body rendered via `render(entry)` (`src/pages/itineraries/[slug].astro:27`).                                                                                                                                         | public      |

### §categoryEnum

Values: `'service-learning'`, `'cultural-heritage'`, `'stem-environmental'`, `'sports-adventure'`, `'language-immersion'`, `'history-heritage'`.

Declared at `src/content.config.ts:4-11`. Reused by `itineraries.category` and `destinations.bestFor`. Display labels live in `src/i18n/en.json:15-22` and `src/i18n/th.json` (TH equivalents).

### §curricula enum

Values: `'IB-MYP'`, `'IB-DP'`, `'IGCSE'`, `'A-Level'`, `'AP'`, `'GCSE'`, `'Bilingual'`.

Declared at `src/content.config.ts:81`.

### §months

Values: `'Jan'`, `'Feb'`, `'Mar'`, `'Apr'`, `'May'`, `'Jun'`, `'Jul'`, `'Aug'`, `'Sep'`, `'Oct'`, `'Nov'`, `'Dec'`.

Declared at `src/content.config.ts:64-79` and `:97-99`. Three-letter abbreviations, not i18n-aware.

---

## destinations

Source-of-truth schema: `src/content.config.ts:89-104`.

| Column            | Type                    | Null | Key | Default | Description                                                                                                                       | Sensitivity |
| ----------------- | ----------------------- | ---- | --- | ------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `id`              | string                  | N    | PK  | —       | Filename without `.md`.                                                                                                           | public      |
| `data.name`       | string                  | N    | —   | —       | English / Latin name of the destination.                                                                                          | public      |
| `data.nameTh`     | string                  | N    | —   | —       | Thai-language name.                                                                                                               | public      |
| `data.tagline`    | string (max 120)        | N    | —   | —       | Short marketing line.                                                                                                             | public      |
| `data.region`     | enum                    | N    | —   | —       | One of `'North'`, `'Central'`, `'Andaman'`, `'Gulf'`, `'Northeast'`. Single-value region grouping.                                | public      |
| `data.bestFor`    | array of `categoryEnum` | N    | —   | —       | Which categories the destination is best suited to. Drives the `/trips/<slug>` filter (`src/pages/trips/[category].astro:35-38`). | public      |
| `data.bestMonths` | array of month enum     | N    | —   | —       | Recommended travel months.                                                                                                        | public      |
| `data.heroImage`  | string                  | N    | —   | —       | Hero image path.                                                                                                                  | public      |
| `data.intro`      | string                  | N    | —   | —       | Multi-paragraph intro rendered on the destination detail page.                                                                    | public      |
| `data.slug`       | string                  | N    | —   | —       | URL slug for `/destinations/<slug>`.                                                                                              | public      |
| `body`            | Markdown text           | N    | —   | —       | Prose body content. Rendered via `render(entry)`.                                                                                 | public      |

---

## categories

Source-of-truth schema: `src/content.config.ts:106-117`.

| Column                | Type                  | Null | Key | Default | Description                                                                                                                      | Sensitivity |
| --------------------- | --------------------- | ---- | --- | ------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `id`                  | string                | N    | PK  | —       | Filename.                                                                                                                        | public      |
| `data.title`          | string                | N    | —   | —       | English title (e.g., "Service Learning").                                                                                        | public      |
| `data.titleTh`        | string                | N    | —   | —       | Thai-language title.                                                                                                             | public      |
| `data.description`    | string                | N    | —   | —       | Marketing description displayed on the category index page (`/trips/<slug>`).                                                    | public      |
| `data.icon`           | string (emoji)        | N    | —   | —       | Single emoji used as the category icon. Coupling to design system — see DB §4.                                                   | public      |
| `data.color`          | enum                  | N    | —   | —       | One of `'teak'`, `'bamboo'`, `'sunset'`, `'gold'`. Used in component classes (`bg-bamboo-100` style). Coupling to design system. | public      |
| `data.itineraryCount` | integer (nonnegative) | N    | —   | —       | Itinerary count for this category — surfaced on category cards. Manually maintained; not derived.                                | public      |
| `data.slug`           | string                | N    | —   | —       | URL slug for `/trips/<slug>`.                                                                                                    | public      |
| `body`                | Markdown text         | N    | —   | —       | Prose body content rendered via `render(entry)`.                                                                                 | public      |

---

## team

Source-of-truth schema: `src/content.config.ts:119-129`.

| Column        | Type              | Null | Key | Default | Description                                                                           | Sensitivity |
| ------------- | ----------------- | ---- | --- | ------- | ------------------------------------------------------------------------------------- | ----------- |
| `id`          | string            | N    | PK  | —       | Filename. Used as a foreign-key target from blog posts (`author: reference('team')`). | public      |
| `data.name`   | string            | N    | —   | —       | Full legal name.                                                                      | public      |
| `data.role`   | string            | N    | —   | —       | Role title in English (e.g., "Co-founder & Education Director").                      | public      |
| `data.roleTh` | string (optional) | Y    | —   | —       | Thai role title. Optional because not every entry may have a TH translation.          | public      |
| `data.bio`    | string (max 400)  | N    | —   | —       | Short bio.                                                                            | public      |
| `data.photo`  | string            | N    | —   | —       | Path to headshot image.                                                               | public      |
| `data.order`  | integer           | N    | —   | —       | Display order on the team page (lower = earlier).                                     | public      |

There is no `slug` field — entries are referenced by `id` only (e.g., `author: kriengsak`).

---

## LEADS_KV (runtime)

Source-of-truth: `wrangler.jsonc:23-26` (binding declared with placeholder ID); `src/pages/api/enquiry.ts:51-67` (writer).

| "Column"             | Type            | Null | Key | Default | Description                                                                            | Sensitivity |
| -------------------- | --------------- | ---- | --- | ------- | -------------------------------------------------------------------------------------- | ----------- |
| key                  | string (UUIDv4) | N    | PK  | —       | Generated server-side via `crypto.randomUUID()`. Acts as the lead's opaque identifier. | internal    |
| value (JSON-encoded) | object          | N    | —   | —       | See decomposition below.                                                               | pii         |

Decomposition of the value object (verified at `src/pages/api/enquiry.ts:63-67`):

| Sub-field   | Type                                                                    | Description                                                                                                                                                                                                                                  | Sensitivity |
| ----------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| `enquiry`   | object matching `enquirySchema` (`src/components/EnquiryForm.tsx:4-22`) | The validated submission. Comprises: `schoolName`, `role`, `email`, `phone`, `country`, `groupSize`, `ages`, `departureMonth`, `duration`, `subjects` (array), `curriculum?` (string), `destinations?` (array of string), `notes?` (string). | pii         |
| `createdAt` | string (ISO-8601)                                                       | Submission timestamp in UTC (`new Date().toISOString()`).                                                                                                                                                                                    | internal    |

Other invariants:

- `expirationTtl = 60·60·24·30 = 2 592 000` seconds = 30 days (`src/pages/api/enquiry.ts:67`).
- After 30 days, Cloudflare deletes the record. No copy is kept elsewhere unless a log-exporter pipeline duplicates it.

---

## RATE_LIMIT_KV (runtime)

Source-of-truth: `wrangler.jsonc:18-21` (binding); `src/lib/rate-limit.ts:30-52` (library).

| "Column"             | Type                            | Null | Key | Default | Description                                                                                                                                          | Sensitivity |
| -------------------- | ------------------------------- | ---- | --- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| key                  | string                          | N    | PK  | —       | `rl:<ip>` where `<ip>` is one of: `cf-connecting-ip`, first hop of `x-forwarded-for`, or literal `"unknown"` (see `src/pages/api/enquiry.ts:30-33`). | internal    |
| value (JSON-encoded) | array of number (ms timestamps) | N    | —   | —       | List of millisecond timestamps inside the sliding window. Coerced via `JSON.parse` at `src/lib/rate-limit.ts:39`.                                    | internal    |

Other invariants:

- `expirationTtl = Math.ceil(windowMs / 1000)` (`src/lib/rate-limit.ts:49`). Current configuration: `windowMs = 60_000` ⇒ `expirationTtl = 60` seconds.
- Allowed iff `list.length < max` (default `max = 5` per `src/pages/api/enquiry.ts:39`).
- The library fails open when the binding is missing (`src/lib/rate-limit.ts:30-35`).

---

## Maintenance

This document was generated from `src/content.config.ts` at `6830fe4` (2026-07-05).

To regenerate or verify against current code:

```bash
git log -1 --format='%H %ad' -- src/content.config.ts      # last-touch commit + date
git log -1 --format='%H'                                   # current HEAD
```

Re-run on each schema change to `src/content.config.ts`. The audit's source-of-truth is the file plus the actual content files; missing entries signal a partial migration.

## Open questions and assumptions

| #       | Question                                                                                                                                                                                                                                                    | Owner          |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- |
| OQ-DD-1 | Should the `body` field appear in the column table for collections, given it is unstructured markdown/MDX? Today it is included for completeness.                                                                                                           | docs-architect |
| OQ-DD-2 | The `expirationTtl` on `LEADS_KV` is operational; PDPA compliance is undetermined.                                                                                                                                                                          | legal          |
| OQ-DD-3 | Are the 10 blog-tag enum values correctly scoped (the list includes `'Brand'` — is that ever used)?                                                                                                                                                         | product        |
| OQ-DD-4 | The `itineraries.itineraryCount` on `categories` is manually maintained (not derived). If this drifts from the count of itineraries in `category === slug`, the page renders wrong counts. Confirm maintenance practice or move to a build-time derivation. | editorial      |

### Assumptions

- The five content collections (`blog`, `itineraries`, `destinations`, `categories`, `team`) are the full set as of commit `6830fe4`. Adding new collections requires changes to both this dictionary and `src/content.config.ts`.
- The `body` field on each content collection is unstructured prose; downstream rendering treats it as text and runs `entry.body.split(/\s+/).length` for read-time estimates.
- `reference()` resolution at build time means every FK consumes a build-time lookup; a missing reference halts the build (intentional, to surface content typos early).
- Sensitivity classification covers three buckets only: `public`, `internal`, `pii`. There are no `secret` columns in any collection because secrets live in Workers secrets, not in content files.

## Change history

| Date       | Version | Author              | Summary                                                                          |
| ---------- | ------- | ------------------- | -------------------------------------------------------------------------------- |
| 2026-07-05 | 0.1.0   | docs-architect (AI) | Initial draft. Derived from `src/content.config.ts` and KV writers at `6830fe4`. |
