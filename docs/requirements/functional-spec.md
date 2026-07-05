---
title: Functional specification — flyed marketing site
doc_type: frs
status: draft
version: 0.1.0
date: 2026-07-05
authors:
  - docs-architect (AI-generated, pending human review)
reviewers: []
system: flyed marketing site (Astro 7 + Cloudflare Workers + KV)
source_commit: 6830fe4
related:
  - srs.md
  - use-cases/UC-001-submit-school-trip-enquiry.md
  - use-cases/UC-002-subscribe-newsletter.md
  - use-cases/UC-003-submit-contact-form.md
  - use-cases/UC-004-browse-content-by-locale.md
  - ../architecture/overview.md (Agent 2)
  - ../api/overview.md (Agent 2)
---

# Functional specification — flyed marketing site

## 1. Overview

This functional specification elaborates the behavior of each _feature_ of the flyed marketing site at the level required to build and test it. It references the SRS for traceability and writes concrete, executable acceptance criteria — every requirement traceable here is also in [srs.md](./srs.md).

The system serves:

- **Marketing visitors** (school-trip organizers, teachers, parents, prospective parents) reading pages about destinations, itineraries, the team, and the blog.
- **Lead generators** — three flows that produce enquiries, messages, and newsletter signups.
- **Editorial writers** using Decap CMS at `/admin` to commit content.

Pages render under two locales: English (default, no URL prefix) and Thai (`/th/*`). Locale handling and content filtering are formalized in UC-004.

## 2. Actors and roles

| Actor                      | Description                                             | Permissions                                                                  | Authenticated via                            | Source               |
| -------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------- | -------------------- |
| Anonymous visitor          | Anyone reaching the site; primary lead source.          | Read public pages; submit `/api/enquiry`, `/api/contact`, `/api/newsletter`. | None. The system is rate-limited by IP only. | `src/pages/api/*.ts` |
| Decap editor               | A marketing team member with Decap Cloud access.        | Commit to `src/content/**` via `/admin`.                                     | Decap Cloud SSO → GitHub OAuth.              | `docs/decap-cms.md`  |
| Cloudflare operator        | Engineering team member with Cloudflare account access. | Bind KV namespaces, roll back deploys, view Workers logs.                    | Cloudflare account.                          | `DEPLOY.md`          |
| Lighthouse CI (test actor) | Programmatic test runner.                               | Hit `/lighthouse/*` URLs locally and assert category scores.                 | None.                                        | `lighthouserc.json`  |

> **Assumption:** There are no other actors in the system. A "school-trip organizer" is not a separate persona at the auth layer — they are an Anonymous visitor filling the enquiry form. Confirmed by reading `src/pages/api/enquiry.ts` (no session/token check).

## 3. Feature inventory

| ID       | Feature                                           | Actor(s)          | Priority | Status                | Traces to                                                                                 | Evidence                                                                |
| -------- | ------------------------------------------------- | ----------------- | -------- | --------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| FEAT-001 | Submit school-trip enquiry                        | Anonymous visitor | Must     | live                  | FR-FORM-001, FR-FORM-002, FR-FORM-003, FR-FORM-004, FR-FORM-005, FR-FORM-006, FR-FORM-007 | `src/pages/api/enquiry.ts`, `src/components/EnquiryForm.tsx`            |
| FEAT-002 | Submit newsletter signup                          | Anonymous visitor | Should   | live (stub)           | FR-FORM-008, FR-FORM-009                                                                  | `src/pages/api/newsletter.ts`                                           |
| FEAT-003 | Submit contact message                            | Anonymous visitor | Must     | live (no persistence) | FR-FORM-010, FR-FORM-011                                                                  | `src/pages/api/contact.ts`                                              |
| FEAT-004 | Browse home page                                  | Anonymous visitor | Must     | live                  | —                                                                                         | `src/pages/index.astro`, `src/components/HomePage.astro`                |
| FEAT-005 | Browse destination listing                        | Anonymous visitor | Must     | live                  | FR-CONTENT-005                                                                            | `src/pages/destinations/index.astro`, `[city].astro`                    |
| FEAT-006 | Browse itinerary listing + detail                 | Anonymous visitor | Must     | live                  | FR-CONTENT-004                                                                            | `src/pages/itineraries/[slug].astro`                                    |
| FEAT-007 | Browse category / trip-type page                  | Anonymous visitor | Should   | live                  | FR-CONTENT-006                                                                            | `src/pages/trips/[category].astro`                                      |
| FEAT-008 | Browse blog index + tag pages                     | Anonymous visitor | Must     | live                  | FR-CONTENT-001, FR-CONTENT-007                                                            | `src/pages/blog/[...page].astro`, `src/pages/blog/tag/[tag].astro`      |
| FEAT-009 | Read blog post + see related itineraries          | Anonymous visitor | Must     | live                  | FR-CONTENT-002, FR-CONTENT-003                                                            | `src/pages/blog/[slug].astro`                                           |
| FEAT-010 | Read persona page (schools / parents / educators) | Anonymous visitor | Must     | live                  | —                                                                                         | `src/pages/{schools,parents,educators}.astro`                           |
| FEAT-011 | Read safety / about / how-it-works                | Anonymous visitor | Must     | live                  | —                                                                                         | `src/pages/{safety,about,how-it-works}.astro`                           |
| FEAT-012 | Subscribe to RSS                                  | Anonymous visitor | Should   | live                  | FR-CONTENT-008                                                                            | `src/pages/rss.xml.ts`                                                  |
| FEAT-013 | Discover via sitemap                              | Crawler           | Must     | live                  | FR-CONTENT-009                                                                            | `astro.config.mjs:95`                                                   |
| FEAT-014 | Locale switch between EN and TH                   | Anonymous visitor | Must     | live                  | FR-I18N-001, FR-I18N-002                                                                  | `src/components/LanguageSwitcher.tsx`, `src/layouts/Layout.astro:78-99` |
| FEAT-015 | Edit content via Decap CMS                        | Decap editor      | Must     | live                  | —                                                                                         | `docs/decap-cms.md`                                                     |

**Feature count:** 15. **Orphan check:** every ID in this table has at least one section below (§4).

## 4. Feature specifications

### 4.1 FEAT-001 — Submit school-trip enquiry

**Actors.** Anonymous visitor (school-trip organizer, teacher, parent); Decap editor (configures the enquiry form indirectly via collection schema). **Preconditions.** Visitor reaches `/enquire` (or `/th/enquire`). Visitor has never exceeded the rate-limit threshold for this IP (per FR-FORM-004). **Traces to:** FR-FORM-001..007 → fully-dressed use case [UC-001](./use-cases/UC-001-submit-school-trip-enquiry.md).

**Behavior.** See UC-001 for the fully dressed flow. Summary:

1. The visitor lands on `/enquire`; the page renders a five-step React island form (`src/components/EnquiryForm.tsx`).
2. Steps are validated client-side using Zod, one step at a time (`stepSchemas` at `EnquiryForm.tsx:86-93`).
3. On final submit, the form posts JSON to `/api/enquiry`; the server re-validates with the same Zod schema (`enquirySchema`).
4. The handler rate-limits by IP, writes the lead to `LEADS_KV` (UUID key, 30 d TTL), then dispatches to Resend and the CRM webhook.
5. The handler responds `200 {ok: true, enquiryId, durable}`; the form shows a localized thank-you message.

**Business rules.**

| Rule       | Statement                                                                                                               | Source                                    |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| BR-ENQ-001 | A valid enquiry must declare `groupSize` as a positive integer in `[4, 60]`.                                            | `src/components/EnquiryForm.tsx:13`       |
| BR-ENQ-002 | A valid enquiry must declare `duration` as a positive integer in `[2, 30]` days.                                        | `src/components/EnquiryForm.tsx:16`       |
| BR-ENQ-003 | A valid enquiry must declare at least one subject of interest from the 6-category list.                                 | `src/components/EnquiryForm.tsx:17,26-33` |
| BR-ENQ-004 | `email` must be RFC-5322-shaped (validated by `z.string().email()`).                                                    | `src/components/EnquiryForm.tsx:7-10`     |
| BR-ENQ-005 | `phone` must be at least 6 characters.                                                                                  | `src/components/EnquiryForm.tsx:11`       |
| BR-ENQ-006 | A lead is written to `LEADS_KV` under a UUIDv4 key with `expirationTtl = 60·60·24·30` seconds.                          | `src/pages/api/enquiry.ts:51-67`          |
| BR-ENQ-007 | Rate-limit: max 5 valid requests per IP per 60 s sliding window.                                                        | `src/pages/api/enquiry.ts:36-41`          |
| BR-ENQ-008 | IP resolution order: `cf-connecting-ip`, first hop of `x-forwarded-for`, else `"unknown"`.                              | `src/pages/api/enquiry.ts:30-33`          |
| BR-ENQ-009 | Outbound dispatch order: KV write → Resend → CRM webhook → response. Failures in Resend or CRM never fail the response. | `src/pages/api/enquiry.ts:53-122`         |

**Edge cases and error behavior.**

| Case                                           | Outcome                                                                            | Source                             |
| ---------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------- |
| Body is not JSON                               | `400 {ok:false, error:"Invalid JSON"}`                                             | `src/pages/api/enquiry.ts:11-15`   |
| Body fails Zod validation                      | `422 {ok:false, error:"Validation failed", issues:[…]}`                            | `src/pages/api/enquiry.ts:17-23`   |
| Rate limit exceeded                            | `429 {ok:false, error:"Rate limit exceeded"}` with `Retry-After` header in seconds | `src/pages/api/enquiry.ts:42-48`   |
| `RATE_LIMIT_KV` missing (local dev)            | Rate-limit fails open; response is as if all requests are allowed                  | `src/lib/rate-limit.ts:30-35`      |
| `LEADS_KV` missing (local dev / wrong binding) | `200 {ok:true, enquiryId, durable:false}`; warning logged                          | `src/pages/api/enquiry.ts:74-76`   |
| `LEADS_KV.put()` throws                        | `200` with `durable:false`; error logged                                           | `src/pages/api/enquiry.ts:69-72`   |
| Resend dispatch throws                         | `200`; KV write already succeeded, CRM dispatch still attempted                    | `src/pages/api/enquiry.ts:78-98`   |
| CRM webhook throws                             | `200`; KV write already succeeded; error logged                                    | `src/pages/api/enquiry.ts:101-115` |

**Acceptance criteria.** See [UC-001 acceptance criteria](./use-cases/UC-001-submit-school-trip-enquiry.md#acceptance-criteria).

**Out of scope.** Two-factor authentication of the form, posting to a CRM queue, payment / deposit collection, schedule-planner.

### 4.2 FEAT-002 — Submit newsletter signup

**Actors.** Anonymous visitor. **Preconditions.** `/api/newsletter` reachable. **Traces to:** FR-FORM-008, FR-FORM-009 → [UC-002](./use-cases/UC-002-subscribe-newsletter.md).

**Behavior.** Client (`src/components/NewsletterForm.tsx:7-16`) posts `{email}` to `/api/newsletter`. Server (`src/pages/api/newsletter.ts:8-19`) Zod-validates the email, sleeps for 100 ms (intentional UX), and returns `200 {ok: true, subscribed: true}`. No provider integration; the form's success response acknowledges the user's intended action but no email is sent, no record is persisted.

**Business rules.**

| Rule      | Statement                        | Source                          |
| --------- | -------------------------------- | ------------------------------- |
| BR-NL-001 | `email` must be RFC-5322-shaped. | `src/pages/api/newsletter.ts:6` |

**Edge cases and error behavior.**

| Case                      | Outcome                                                                                                           | Source                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Body is not JSON          | `422 {ok:false, error:"Invalid email"}` (the schema check rejects after `await request.json().catch(() => null)`) | `src/pages/api/newsletter.ts:9-12`  |
| Body fails Zod validation | `422 {ok:false, error:"Invalid email"}`                                                                           | `src/pages/api/newsletter.ts:11-13` |
| Body is valid             | `200 {ok:true, subscribed:true}` after a 100 ms artificial delay                                                  | `src/pages/api/newsletter.ts:14-19` |

**Acceptance criteria.** See [UC-002 acceptance criteria](./use-cases/UC-002-subscribe-newsletter.md#acceptance-criteria).

**Out of scope.** Integration with any provider; double-opt-in; subscriber list export; unsubscribe handling. All four are deferred until a provider is chosen (see SRS FR-FORM-008 OPEN QUESTION).

### 4.3 FEAT-003 — Submit contact message

**Actors.** Anonymous visitor. **Preconditions.** `/api/contact` reachable. **Traces to:** FR-FORM-010, FR-FORM-011 → [UC-003](./use-cases/UC-003-submit-contact-form.md).

**Behavior.** Client renders the contact form (`src/components/ContactPage.astro:47-61`) which is a native `<form>` posting `name`, `email`, `message` to `${prefix}/api/contact` (where `prefix` is `''` or `'/th'`). The server handler at `src/pages/api/contact.ts:12-21` validates the body and returns `200 {ok:true}` without persistence or logging (intentional, per the source comment at line 18).

> **Bug finding:** the contact form posts to `${prefix}/api/contact` (`src/components/ContactPage.astro:47`), so under Thai locale the URL becomes `/th/api/contact`. There is no `src/pages/th/api/` directory; the request routes to a 404 (or, in production, falls through to a Cloudflare static 404). This is a latent bug — Thai-locale visitors cannot submit the contact form today. **Reported in §10 findings.**

**Business rules.**

| Rule      | Statement                                  | Source                       |
| --------- | ------------------------------------------ | ---------------------------- |
| BR-CT-001 | `name` must be a string of length ≥ 2.     | `src/pages/api/contact.ts:7` |
| BR-CT-002 | `email` must be RFC-5322-shaped.           | `src/pages/api/contact.ts:8` |
| BR-CT-003 | `message` must be a string of length ≥ 10. | `src/pages/api/contact.ts:9` |

**Edge cases and error behavior.**

| Case                      | Outcome                                     | Source                           |
| ------------------------- | ------------------------------------------- | -------------------------------- |
| Body is not JSON          | `422 {ok:false}`                            | `src/pages/api/contact.ts:13-17` |
| Body fails Zod validation | `422 {ok:false}`                            | `src/pages/api/contact.ts:14-17` |
| Body is valid             | `200 {ok:true}` with no persistence, no log | `src/pages/api/contact.ts:18-21` |

**Acceptance criteria.** See [UC-003 acceptance criteria](./use-cases/UC-003-submit-contact-form.md#acceptance-criteria).

**Out of scope.** Ticket / case creation, mailbox forwarding, persistence. All absent today.

### 4.4 FEAT-004..FEAT-013 — Browse and discovery

These features are content-browse behavior; their behavior is summarized in UC-004 ([UC-004 — Browse content by locale](./use-cases/UC-004-browse-content-by-locale.md)). Detailed behavior for each browse route:

| Feature                    | Route(s)                                           | Filter logic                                                                                                                                                                                          | Source                                                                            |
| -------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| FEAT-004 Home              | `/`, `/th`                                         | Render the localized home component with `Hero`, `StatsBar`, `ServiceTile`s, `NewsletterForm`, and footer.                                                                                            | `src/components/HomePage.astro`                                                   |
| FEAT-005 Destinations      | `/destinations`, `/destinations/<slug>`            | Filter `destinations` collection; on `[city].astro`, match itineraries whose `destinations[]` includes this entry by slug string OR resolved entry id.                                                | `src/pages/destinations/index.astro`, `src/pages/destinations/[city].astro:31-36` |
| FEAT-006 Itineraries       | `/itineraries`, `/itineraries/<slug>`              | List published only; detail page renders the day-by-day body + an at-a-glance panel + up to 3 related itineraries sharing the same `category`.                                                        | `src/pages/itineraries/index.astro`, `src/pages/itineraries/[slug].astro:13-42`   |
| FEAT-007 Trips by category | `/trips`, `/trips/<slug>`                          | Per-category itineraries + destinations where `bestFor` includes the slug.                                                                                                                            | `src/pages/trips/[category].astro:32-38`                                          |
| FEAT-008 Blog index + tag  | `/blog`, `/blog/<page>`, `/blog/tag/<tag>`         | Filter blog collection by `data.locale` (active locale only) AND `data.draft === false`. Sort by `pubDate` descending, paginate 12 per page. Tag pages are locale-filtered.                           | `src/pages/blog/[...page].astro:11-21`, `src/pages/blog/tag/[tag].astro:10-19`    |
| FEAT-009 Blog post         | `/blog/<post-id>`                                  | Full article body, breadcrumb, author (resolved from `team`), up to 3 related posts (sharing ≥ 1 tag), and up to N related itineraries (explicit references — build fails if a reference is missing). | `src/pages/blog/[slug].astro:13-62`                                               |
| FEAT-010 Persona pages     | `/schools`, `/parents`, `/educators` (and `/th/*`) | Static prose composition.                                                                                                                                                                             | `src/components/{SchoolsPage,ParentsPage,EducatorsPage}.astro`                    |
| FEAT-011 Information pages | `/safety`, `/about`, `/how-it-works` (and `/th/*`) | Static prose composition.                                                                                                                                                                             | `src/components/{SafetyPage,AboutPage,HowItWorksPage}.astro`                      |
| FEAT-012 RSS feed          | `/rss.xml`                                         | All non-draft blog entries, sorted by `pubDate` descending.                                                                                                                                           | `src/pages/rss.xml.ts:6-21`                                                       |
| FEAT-013 Sitemap           | `/sitemap-index.xml`                               | Generated by `@astrojs/sitemap` with i18n awareness.                                                                                                                                                  | `astro.config.mjs:95`                                                             |

### 4.5 FEAT-014 — Locale switch between EN and TH

**Actors.** Anonymous visitor. **Preconditions.** Any page loaded.

**Behavior.** `src/components/LanguageSwitcher.tsx` (rendered in the header) toggles URL prefix `/th` ↔ no prefix on click. The site uses Astro's `prefixDefaultLocale: false` (`astro.config.mjs:71`), so the default locale lives at `/` and the alternate at `/th/*`.

In parallel, `src/layouts/Layout.astro:78-99` emits `<link rel="alternate" hreflang="…">` for `en`, `th`, and `x-default`, and `<html lang="…">` reflects the active locale (line 27 detection, line 46 attribute).

**Business rules.**

| Rule       | Statement                                                                                  | Source                           |
| ---------- | ------------------------------------------------------------------------------------------ | -------------------------------- |
| BR-LOC-001 | The first URL segment equal to `th` selects the Thai locale; otherwise the locale is `en`. | `src/i18n/index.ts:28-32`        |
| BR-LOC-002 | Every page must emit `hreflang` alternates for `en`, `th`, and `x-default`.                | `src/layouts/Layout.astro:78-99` |
| BR-LOC-003 | Thai 404 must exist at `/th/404.html` (built artifact, not auto-generated by Astro).       | `astro.config.mjs:22-38`         |

### 4.6 FEAT-015 — Edit content via Decap CMS

Detailed in `docs/decap-cms.md`. This FRS records the contract rather than re-documenting: Decap CMS at `/admin` writes commits to `src/content/**` against git; the next Workers Builds deploys the new content. The contract is mechanical: editors can change any field in any collection that the Zod schema permits.

## 5. Cross-feature concerns

### Validation conventions

- Every API endpoint validates input with Zod and surfaces failures as structured JSON (`{ok:false, error?, issues?}`).
- Validation messages are localized in the client (the form's `stepSchemas` use the same imported schema; the API does not localize error strings).
- The EnquiryForm `aria-invalid` is set on each input from a per-key error map (`EnquiryForm.tsx:192`).
- Form errors are announced via `role="status" aria-live="polite"` (`EnquiryForm.tsx:339-347`).

### Date handling

- All `pubDate` values are stored as `coerce.date()`; rendered as `toLocaleDateString('en-US', …)` in the EN-locale page (`src/pages/blog/[slug].astro:35`). Thai-locale blog pages do not currently localize dates; this is a known UX gap.
- No Buddhist Era ↔ CE conversion is performed at the boundary; today the system is Gregorian-only. The `pagespeed` Lighthouse locale is irrelevant to dates.

### i18n fallback

- Missing translation keys return the literal key string (`src/i18n/index.ts:18-22`). This is a fail-soft behavior — pages with missing keys render the key, not a broken state.
- `getLocale(url)` falls back to `en` for any URL not starting with `/th` (`src/i18n/index.ts:28-32`).

### Pagination defaults

- Blog index page size: 12 (`src/pages/blog/[...page].astro:18`).
- Tag chips: derived globally across all paginated pages so the chip set is stable across pagination (`src/pages/blog/[...page].astro:16-21`).

### Audit logging

- Enquiry endpoint: `ctx.logger.warn` on rate-limit rejection, `ctx.logger.warn` on missing binding, `ctx.logger.error` on KV put failure / Resend failure / CRM failure (`src/pages/api/enquiry.ts:43,70-73,93-95,109-111`).
- Newsletter endpoint: no logging.
- Contact endpoint: no logging (intentional per source comment).

### Personal data flow (PDPA-relevant)

The enquiry endpoint collects (verified by reading `src/components/EnquiryForm.tsx:4-22`): school name, role, email, phone, country, group size, ages, departure month, trip length, subjects, optional curriculum, optional destinations, optional notes. This data is persisted in `LEADS_KV` (30 d TTL), emailed via Resend (Bangkok HQ mailbox `ENQUIRY_TO_EMAIL`), and POSTed to the CRM webhook. **There is no published retention policy or privacy notice in the repo as of this writing.**

## 6. Open questions and assumptions

### Open questions

| #        | Question                                                                                                                                                  | Owner                 |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| OQ-FRS-1 | Are the eight contact-form static fields (Bangkok HQ address, Chiang Mai address, phone, WhatsApp number, Line handle) accurate or placeholders?          | product               |
| OQ-FRS-2 | The contact form under Thai locale posts to `/th/api/contact`, which does not exist. Confirm whether TH-locale contact form actually works in production. | engineering           |
| OQ-FRS-3 | The newsletter endpoint is a stub. What provider must be integrated and by when?                                                                          | product               |
| OQ-FRS-4 | The `notes` field on the enquiry form is free-text and has no length cap. Should there be a max?                                                          | product               |
| OQ-FRS-5 | Page-size 12 on the blog index — should pagination size be config-driven?                                                                                 | product               |
| OQ-FRS-6 | Should `cf-connecting-ip` rate-limit discrimination be done at the country level (block high-traffic regions)?                                            | product / engineering |

### Assumptions

- The five-step wizard pattern is intended UX; collapse to fewer steps would change FR-FORM-001 behavior.
- The 100 ms delay on `/api/newsletter` is intentional UX feedback, not a mistake.
- The order KV → Resend → CRM is intentional: lead durability must precede best-effort dispatch.
- Each locale's blog index lists only that locale's posts (the merged-collection model).
- The merged `blog` collection includes both `.en.mdx` and `.th.mdx` files in the same directory; consumers must filter by `data.locale`.
- The `ip === 'unknown'` fallback in rate limiting is acceptable for non-CF-proxied environments (i.e., local dev and unit tests).

## Change history

| Date       | Version | Author              | Summary                                                                                         |
| ---------- | ------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| 2026-07-05 | 0.1.0   | docs-architect (AI) | Initial draft. Reverse-engineered from code at `6830fe4`. Pending product / engineering review. |
