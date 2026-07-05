---
status: 'accepted'
date: 2026-07-04
decision-makers: ['flyed engineering']
consulted: ['docs-architect (reverse-documented 2026-07-05)']
informed: []
---

# React 19 islands with Astro view transitions

## Context and problem statement

A handful of components need client-side state: the multi-step enquiry
form (`EnquiryForm.tsx`), the language switcher (`LanguageSwitcher.tsx`),
the image carousel on itinerary pages (`ImageCarousel.tsx`), and the stats
counter (`Counter.tsx`). Everything else is static markup. We want to
ship the minimum amount of JavaScript, keep the marketing surface
Lighthouse-friendly (Q1 in the architecture overview, `performance` ≥ 0.95
per `.lighthouserc.json:19`), and let visitors navigate between pages
without a full reload.

The decision: which interactive-component strategy?

## Decision drivers

- Performance — every kilobyte of JS shipped hurts LCP/TBT. Only ship JS
  for components that need it.
- Single-developer team — minimize toolchain breadth.
- Bilingual navigation — switching language today feels like a full page
  reload; we want a softer transition.
- React 19 (`package.json:38-39`) is already adopted; no need to add
  Preact or Solid for a few components.
- Astro view transitions (`<ClientRouter />` from `astro:transitions`,
  added in `src/layouts/Layout.astro:106`) give SPA-like transitions
  without rewriting pages as components.

## Considered options

- **Full SPA (React 19, no Astro).** Largest JS bundle; loses the
  pre-rendered HTML performance; biggest rewrite.
- **Astro-only, no client islands.** Every interactive bit would have to
  be vanilla JS or a separate framework integration; loses the React
  forms the team already wrote.
- **React 19 islands hydrated via `client:visible` / `client:idle`
  directives, paired with `<ClientRouter />` for navigation.** Minimum JS
  per page; React only where state is real; view transitions give a soft
  navigation experience.

## Decision outcome

Chosen option: **"React 19 islands with Astro view transitions"**,
because it is the only option that ships the minimum JavaScript for the
few interactive components while keeping the marketing surface as
pre-rendered HTML, and because view transitions are a one-line addition
to the root layout.

The hydration map today:

| Component            | Hydration        | Evidence                                                                              |
| -------------------- | ---------------- | ------------------------------------------------------------------------------------- |
| `<EnquiryForm>`      | `client:visible` | `src/components/EnquirePage.astro:37`                                                 |
| `<NewsletterForm>`   | `client:visible` | `src/components/Footer.astro:130`                                                     |
| `<ImageCarousel>`    | `client:visible` | `src/pages/itineraries/[slug].astro:145`, `src/pages/th/itineraries/[slug].astro:141` |
| `<Counter>`          | `client:visible` | `src/components/StatsBar.astro:24`                                                    |
| `<LanguageSwitcher>` | `client:idle`    | `src/components/Header.astro:59`                                                      |

`client:visible` hydrates only when the component scrolls into the
viewport — the form below the fold costs nothing until the visitor
navigates to it. `client:idle` hydrates during browser idle time — the
language switcher in the persistent header is interactive on every page,
but its hydration can wait until the document is idle.

### Consequences

- Good, because only the components that need state ship JS — measured by
  the fact that the LHCI gate (`performance` ≥ 0.95) holds today.
- Good, because the `<ClientRouter />` (`src/layouts/Layout.astro:106`)
  gives SPA-like transitions without per-page opt-in. The header itself
  persists across navigations via `transition:persist transition:name="site-header"`
  (`src/components/Header.astro:31`).
- Good, because the language switcher can drop a `<form>` POST entirely —
  it now uses an `<a href>` that triggers the view transition, with the
  React component only providing the open/close state of the dropdown.
- Bad, because view transitions are still SPA-ish: any third-party script
  that initializes on `DOMContentLoaded` (rather than `astro:page-load`)
  must opt in to the new lifecycle. Partytown handles this in
  `astro.config.mjs:97`.
- Bad, because islands can drift from the Astro-side data they were
  rendered with — re-rendering after a view transition requires the island
  to read from the new page. Today this is not an issue because the only
  islands with page-driven props are the form (URL search params at
  `src/components/EnquirePage.astro:17-21`) and the carousel (gallery
  images per itinerary).
- Neutral, because React 19's automatic batching and the new form actions
  are not yet used — every island is a plain React component. The
  upgrade path is open.

### Confirmation

- `astro.config.mjs:98` — `react()` integration registered.
- `package.json:30` — `@astrojs/react@^6.0.0`.
- `src/layouts/Layout.astro:106` — `<ClientRouter />` from
  `astro:transitions` mounted in `<head>`.
- `src/components/Header.astro:31` — `transition:persist transition:name="site-header"`.
- CI lint gate: `npm run lint` + `npm run check` cover `*.tsx` files.
- LHCI gate: `.lighthouserc.json:19` holds ≥ 0.95 across all eight URLs.

## Pros and cons of the options

### Full SPA

- Good, because one consistent mental model.
- Bad, because Lighthouse performance drops (CI gate fails).
- Bad, because the static content has to be re-fetched on every navigation.

### Astro-only, no islands

- Good, because no JS framework.
- Bad, because the existing React form loses its step state.

### React 19 islands + view transitions

- Good, because minimum JS, maximum HTML.
- Good, because React 19 is already adopted.
- Good, because `<ClientRouter />` makes navigation feel SPA-ish without
  per-page opt-in.
- Bad, because islands need to be aware of the `astro:page-load` lifecycle
  if they have setup side effects.

## More information

- React integration: `astro.config.mjs:98`, `package.json:30, 38-39`.
- View transitions: `src/layouts/Layout.astro:106`.
- Header persistence: `src/components/Header.astro:31`.
- ADR-0003 — Astro 7 static default with opt-in SSR; islands hydrate inside
  the static page shell.
- Wave 7 confirmation: commit `8144cd7 chore(deps): confirm react/react-dom
single tree (closes F-42)` and `7fc9be1 merge(wave-7): Task 6.2 —
confirm react/react-dom single tree (F-42)`.
