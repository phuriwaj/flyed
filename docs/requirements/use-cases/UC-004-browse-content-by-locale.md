---
title: 'UC-004 — Browse content by locale'
doc_type: frs
status: draft
version: 0.1.0
date: 2026-07-05
authors:
  - docs-architect (AI-generated, pending human review)
reviewers: []
system: flyed marketing site
source_commit: 6830fe4
related:
  - ../srs.md
  - ../functional-spec.md
  - ../../data/database-design.md
  - ../../data/data-dictionary.md
---

# UC-004 — Browse content by locale

| Field                             | Value                                                                                                                                                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Primary actor                     | Anonymous visitor                                                                                                                                                                                                                                            |
| Scope                             | flyed marketing site                                                                                                                                                                                                                                         |
| Level                             | User goal (broad — covers all content-discovery flows)                                                                                                                                                                                                       |
| Stakeholders & interests          | Visitor: see content matching their language. Marketing: every page should be reachable in both locales. SEO: hreflang + language attributes must be right. Engineering: the locale-resolution contract must be testable.                                    |
| Preconditions                     | The site has been built (`astro build`) and is serving on Cloudflare Workers with `dist/` pre-rendered and `src/pages/api/*` running as SSR. The first URL segment is parsed to determine the locale.                                                        |
| Success guarantee (postcondition) | Each URL serves a page in the locale implied by the URL; the active locale is correctly indicated on `<html lang>` and via `<link rel="alternate" hreflang="…">`; the content presented is filtered to that locale (where applicable) and to `draft: false`. |
| Minimal guarantee                 | A URL under neither `/` nor `/th/` resolves to the EN-locale page (fallback).                                                                                                                                                                                |
| Trigger                           | Any visitor request to a public URL on `flyed.dev`.                                                                                                                                                                                                          |

## Main success scenario

1. A visitor navigates to a URL such as `/blog/01-why-thailand-service-learning`. The first path segment is empty (no locale prefix), so the resolved locale is `en` (`src/i18n/index.ts:28-32`).
2. The blog index or detail page renders (`src/pages/blog/[slug].astro`). It calls `getCollection('blog', ({ data }) => data.locale === 'en' && !data.draft)` (`src/pages/blog/[slug].astro:13-19`) — only English, non-draft posts.
3. The `Layout.astro` template is used (`src/layouts/Layout.astro:46-104`). It sets `<html lang="en">` and emits `<link rel="alternate" hreflang="en">` pointing to `/blog/01-why-thailand-service-learning`, `<link rel="alternate" hreflang="th">` pointing to `/th/blog/01-why-thailand-service-learning.th`, and `<link rel="alternate" hreflang="x-default">` pointing to the EN URL.
4. The page renders the article body via `render(entry)`.
5. The page reads the author reference (`entry.data.author` — a reference to the `team` collection, resolved via `getEntry`), and surfaces the related posts and related itineraries.
6. The visitor clicks the language switcher in the header. The header navigates to `/th/blog/01-why-thailand-service-learning.th`, resolving to the Thai-locale page.

For other browse routes, the same locale-resolution and content-filtering logic applies:

| Route                                                                                              | Locale-filter applied                                                            | Sort              | Source                                 |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------- | -------------------------------------- |
| `/`                                                                                                | (none)                                                                           | n/a               | `src/pages/index.astro`                |
| `/th`                                                                                              | (none)                                                                           | n/a               | `src/pages/th/index.astro`             |
| `/about`, `/safety`, `/how-it-works`, `/schools`, `/parents`, `/educators`, `/contact`, `/enquire` | (none — same component)                                                          | n/a               | `src/pages/*.astro`                    |
| `/destinations`, `/destinations/<slug>`                                                            | (none across both locales; the route emits localized strings via the dictionary) | n/a               | `src/pages/destinations/*.astro`       |
| `/itineraries`, `/itineraries/<slug>`                                                              | (none across both locales)                                                       | n/a               | `src/pages/itineraries/*.astro`        |
| `/trips`, `/trips/<category>`                                                                      | (none across both locales)                                                       | n/a               | `src/pages/trips/*.astro`              |
| `/blog`, `/blog/<page>`                                                                            | `data.locale === activeLocale && !data.draft`                                    | `pubDate` desc    | `src/pages/blog/[...page].astro:11-21` |
| `/blog/tag/<tag>`                                                                                  | `data.locale === activeLocale && !data.draft`                                    | `pubDate` desc    | `src/pages/blog/tag/[tag].astro:10-27` |
| `/blog/<slug>`                                                                                     | `data.locale === activeLocale && !data.draft`                                    | n/a (single item) | `src/pages/blog/[slug].astro:13-19`    |
| `/rss.xml`                                                                                         | `!data.draft` (no locale filter — RSS is single-locale today)                    | `pubDate` desc    | `src/pages/rss.xml.ts:6-7`             |
| `/sitemap-index.xml`                                                                               | n/a (Astro's i18n sitemap handles per-locale entries)                            | n/a               | `astro.config.mjs:95`                  |

## Extensions

- 1a. URL begins with `/th`. Locale resolves to `th`. Same downstream logic, with the TH dictionary at `src/i18n/th.json`.
- 1b. URL begins with an unknown locale prefix (e.g., `/de/about`). Locale falls back to `en` (`src/i18n/index.ts:30-32`). The `/de/about` request still hits `src/pages/de/about.astro` only if it exists; today there is no German content. A non-existent path falls through to a 404.
- 2a. A visitor hits an unknown URL under `/blog/`. The build-time `getStaticPaths` lists every published EN-locale post; any other URL is a 404. The `/blog.astro` 404 path is served by Astro's default behavior. **NOTE:** there is no separate 404 page at `/blog/404` or `/blog/404.html`; the build may or may not emit the static 404 here.
- 3a. The 404 page exists at `/404.astro` (EN) and `/th/404.astro` (TH). After build, the TH 404 lives at both `dist/th/404/index.html` and `dist/th/404.html` (the latter by the `th-404-copy` Vite plugin at `astro.config.mjs:22-38`).
- 6a. The language switcher mis-targets (e.g., user is on `/blog/01-foo.en` and clicks TH, navigating to `/th/blog/01-foo`). Since `01-foo.en` and `01-foo.th` share the same numeric prefix, this works; for posts whose filename differs across locales (a separate case to consider — see DEPLOY.md and migrations), the link would 404. Today all blog posts use `<n>-<slug>.en.mdx` and `<n>-<slug>.th.mdx` (the locale suffix is on the _file_, not the URL path). The URL rewrite logic at `src/layouts/Layout.astro:79-99` does a simple swap of `/th` prefix.
- 7a. The `cf-connecting-ip` is a typo or null. Locale resolution is path-only; networking does not affect content. UC continues.

## Special requirements

- **Locale fallback (FR-I18N-001):** `getLocale(url)` returns `'th'` only if first segment is `'th'`; otherwise `'en'`. Default-locale pages have no prefix.
- **`<html lang>` (FR-I18N-002):** set from `isTh = Astro.url.pathname.startsWith('/th')` (`src/layouts/Layout.astro:27,46`).
- **Hreflang (FR-I18N-002):** EN / TH / x-default all emitted (`src/layouts/Layout.astro:78-99`).
- **Missing-key fallback (FR-I18N-003):** dictionary lookup `t(locale, key)` returns the literal key path when key is missing — fail-soft.
- **No journal of locale-aware scheduling.** Each blog post is statically generated; there is no per-locale scheduling separate from `pubDate`.
- **404 handler (FR-I18N-004):** `/th/404.html` must exist post-build; the `th-404-copy` plugin ensures this.

## Frequency / volume

This UC covers every public-page request. Volume is unbounded (every page request triggers locale resolution and content filtering). Performance impact: trivial (string parsing of first path segment + filter of a single collection).

## Acceptance criteria

```gherkin
Feature: Browse content by locale

  Scenario: EN URL — locale is en
    Given a request to /about
    When the server renders the page
    Then <html lang="en"> is emitted
    And the EN hreflang tag points to https://flyed.dev/about
    And the TH hreflang tag points to https://flyed.dev/th/about

  Scenario: TH URL — locale is th
    Given a request to /th/about
    When the server renders the page
    Then <html lang="th"> is emitted
    And the EN hreflang tag points to https://flyed.dev/about
    And the TH hreflang tag points to https://flyed.dev/th/about

  Scenario: Unknown locale prefix — fallback to EN
    Given a request to /about (no locale prefix)
    When the server resolves locale
    Then the active locale is "en"

  Scenario: Blog index — EN
    Given a request to /blog
    When the page renders
    Then it lists only posts with data.locale === "en" AND data.draft === false
    And posts are sorted by pubDate descending
    And 12 posts are shown per page

  Scenario: Blog index — TH
    Given a request to /th/blog
    When the page renders
    Then it lists only posts with data.locale === "th" AND data.draft === false

  Scenario: Draft post is hidden
    Given a blog post with data.draft === true
    When a visitor requests the corresponding path
    Then the page is not generated (build filters it out)
    And the request returns 404

  Scenario: Missing translation key — render literal key
    Given a component calls t("th", "footer.something_unknown")
    When the component renders
    Then the text "footer.something_unknown" is shown (literal key)

  Scenario: Content typo on relatedItineraries — build fails
    Given a blog post references an itinerary that does not exist
    When astro build runs
    Then the build throws an error naming the blog post and the missing reference

  Scenario: Destination page — itinerary matching by slug string
    Given an itinerary whose destinations array contains the slug "chiang-mai"
    When a visitor requests /destinations/chiang-mai
    Then the itinerary appears in the "Trips we run here" section

  Scenario: Destination page — itinerary matching by reference id
    Given an itinerary whose destinations array contains a reference to the chiang-mai entry id
    When a visitor requests /destinations/chiang-mai
    Then the itinerary appears in the "Trips we run here" section

  Scenario: TH 404 — built artifact exists
    Given a successful astro build
    When the dist/ directory is inspected
    Then dist/th/404.html exists as a copy of dist/th/404/index.html
```

## Change history

| Date       | Version | Author              | Summary                                                                                         |
| ---------- | ------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| 2026-07-05 | 0.1.0   | docs-architect (AI) | Initial draft. Reverse-engineered from code at `6830fe4`. Pending product / engineering review. |
