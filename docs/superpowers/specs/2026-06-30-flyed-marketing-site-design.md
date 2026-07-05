# flyed — Marketing Site Design

**Date:** 2026-06-30
**Status:** Draft, awaiting user review
**Owner:** flyed marketing team
**Build target:** flyed.dev (placeholder; swap to flyed.co.th or custom at launch)

---

# Updated 2026-07-05 — persistence and blog model sections brought in line with current implementation

The persistence and blog content-model sections below (§8.2 and §8.4) describe the as-implemented behavior at branch tip `bc0995c`. Earlier text referred to "Astro DB" and a two-collection blog (`blog` + `blogTh`); both are stale. See `docs/architecture/overview.md`, `docs/data/database-design.md`, and `docs/data/data-dictionary.md` for the canonical current-state references.

---

## 1. Problem & Goals

flyed is an inbound educational-travel operator bringing international school groups to Thailand. The marketing site must (a) generate qualified B2B enquiries from international schools, Thai international schools, and the parents of traveling students; (b) rank in organic search for "Thailand school trip" keywords; and (c) reassure risk-conscious school administrators through transparent curriculum alignment, safety, and accreditation signals.

**Success criteria**

- ≥ 80 qualified enquiries per quarter within 6 months of launch
- Organic traffic ≥ 10k sessions/month within 9 months
- Lighthouse Perf ≥ 95, A11y ≥ 95, SEO = 100 on every key page
- Bilingual EN + TH at launch, with TH mirroring every page

---

## 2. Brand & Positioning

**flyed** = the inbound counterpart to The Learning Adventure and EF Tours, focused on Thailand as the destination. Inbound international school groups, ages 11–18, traveling for curriculum-linked service learning, cultural immersion, STEM/environmental programs, sports, language immersion, and history/heritage.

**Tone:** warm & adventurous. Earthy palette (teak, bamboo green, sunset orange, off-white). Photography: real students, golden hour, rice terraces, temples, coast. Copy: human, hopeful, specific to place.

**Decision log (locked during brainstorming 2026-06-30):**

- Target buyers: international schools globally + Thai local international schools
- Languages: English primary, Thai mirrored at launch
- Conversion model: enquiry-to-quote B2B (no real-time booking at launch)
- Trip categories: 6 (Service, Cultural, STEM, Sports, Language, History)
- Destinations: 12 (Bangkok, Chiang Mai, Chiang Rai, Phuket, Krabi, Khao Sok, Kanchanaburi, Ayutthaya, Koh Tao, Sukhothai, Pai, Isan)
- Sample itineraries at launch: 10
- Blog posts at launch: 20 (English; Thai mirrors post-launch)
- Content workflow: git-based MDX
- Imagery: AI-generated with neutral prompts + curated royalty-free

---

## 3. Information Architecture

### 3.1 Route map (English — default locale `/`)

| Route | Purpose |
|---|---|
| `/` | Home — single-visit conversion |
| `/about` | Brand story, team, mission |
| `/how-it-works` | 5-step process for first-time bookers |
| `/safety` | Risk-assessment reassurance |
| `/schools` | Persona page — school admins/procurement |
| `/parents` | Persona page — parents of travelers |
| `/educators` | Persona page — teachers/group leaders |
| `/trips` | Category hub — 6 categories |
| `/trips/[category]` | Category pillar page (6) |
| `/destinations` | Destination hub — 12 cities |
| `/destinations/[city]` | Destination pillar page (12) |
| `/itineraries` | All sample itineraries |
| `/itineraries/[slug]` | Individual sample itinerary (10 at launch) |
| `/blog` | Blog index, paginated, filter by tag |
| `/blog/[slug]` | Blog post (20 at launch) |
| `/enquire` | Primary conversion form |
| `/contact` | Simple contact form + office info |
| `/legal/{privacy,terms,cookies}` | Legal |
| `/api/enquiry` | POST endpoint → email + CRM + Astro DB |
| `/api/newsletter` | POST endpoint → email list |
| `/rss.xml` | Blog RSS |
| `/sitemap-index.xml` | Sitemap (auto) |
| `/404` | Custom 404 |

### 3.2 Thai mirror

Every above route mirrored under `/th/*` via Astro built-in i18n. UI strings from `src/i18n/{en,th}.json`. Blog bodies remain English at launch; TH translations are a post-launch pass.

### 3.3 Persona routing

Three persona pages (`/schools`, `/parents`, `/educators`) act as B2B/B2C/B2C entry points, each tailoring copy, itinerary picks, and CTAs to that buyer.

### 3.4 Cross-linking pattern (hub-and-spoke)

Every page links outward to: 1+ category hub, 1+ destination, 1+ sample itinerary, 1+ blog post (where applicable), and `/enquire`.

---

## 4. Content Inventory at Launch

### 4.1 6 trip categories

`service-learning`, `cultural-heritage`, `stem-environmental`, `sports-adventure`, `language-immersion`, `history-heritage`.

### 4.2 12 destinations

11 cities + 1 region: Bangkok, Chiang Mai, Chiang Rai, Phuket, Krabi, Khao Sok, Kanchanaburi, Ayutthaya, Koh Tao, Sukhothai, Pai, and **Isan** (treated as a region-level destination page covering Buriram/Surin/Ubon and surrounding provinces). Each has its own `/destinations/[slug]` page; Isan page lists sub-province activity options in lieu of a single city focus.

### 4.3 10 sample itineraries

| Slug | Title | Cat | Dest | Days |
|---|---|---|---|---|
| `northern-thailand-service-week` | Northern Thailand Service Week | Service | Chiang Mai + Chiang Rai | 7 |
| `andaman-marine-biology` | Marine Biology in the Andaman | STEM | Phuket + Krabi | 5 |
| `ayutthaya-kanchanaburi-history-loop` | Ayutthaya & Kanchanaburi History Loop | History | Ayutthaya + Kanchanaburi | 6 |
| `bangkok-isan-cultural-immersion` | Bangkok & Isan Cultural Immersion | Cultural | Bangkok + Isan | 7 |
| `khao-sok-jungle-ecology` | Khao Sok Jungle Ecology | STEM | Khao Sok | 5 |
| `muay-thai-and-service` | Muay Thai & Service | Sports | Bangkok + Chiang Mai | 8 |
| `andaman-sailing-week` | Sailing the Andaman | Sports | Phuket + Krabi | 7 |
| `koh-tao-dive-certification` | Open-Water Certification, Koh Tao | Sports | Koh Tao | 6 |
| `thai-language-homestay-fortnight` | Thai Language Homestay Fortnight | Language | Chiang Mai | 14 |
| `pai-adventure-and-service` | Pai Adventure & Service | Sports | Pai | 6 |

### 4.4 20 launch blog posts

| # | Title | Tag | Target keyword |
|---|---|---|---|
| 1 | Why Thailand is the world's best classroom for service learning | Service | thailand service learning trips |
| 2 | A week in Chiang Mai: the service-learning itinerary teachers rebook | Service | chiang mai service trip |
| 3 | Marine biology on the Andaman: how we design a 5-day STEM trip | STEM | marine biology school trip thailand |
| 4 | Elephant conservation in Chiang Mai: ethics, sanctuary choice, and what students actually learn | STEM | elephant conservation school trip |
| 5 | From ruins to rivers: teaching Southeast Asian history along the Mekong | History | mekong history school trip |
| 6 | Kanchanaburi in 4 days: a WWII history itinerary for IB and IGCSE | History | kanchanaburi school trip |
| 7 | Ayutthaya day trip vs. 3-day immersion: how to choose | History | ayutthaya school trip |
| 8 | What a real Thai homestay teaches students that no classroom can | Cultural | thailand homestay school |
| 9 | Isan in 7 days: the cultural-immersion itinerary we built twice | Cultural | isan cultural immersion |
| 10 | Bangkok in 48 hours: the best urban itinerary for international school groups | Cultural | bangkok school trip |
| 11 | Thai language immersion: what 2 weeks of homestay + class looks like | Language | thai language immersion |
| 12 | Muay Thai + service: the sports-and-culture itinerary coaches keep booking | Sports | muay thai school tour |
| 13 | Sailing the Andaman: a 7-day marine-sports trip for ages 14–18 | Sports | sailing school trip thailand |
| 14 | Open-water diving in Koh Tao: certifications, safety, age rules | Sports | koh tao diving school |
| 15 | 10 things to know before booking a school trip abroad | Educator | how to plan school trip abroad |
| 16 | How we align a Thailand trip to IB MYP service-learning hours | Curriculum | IB MYP service hours thailand |
| 17 | Risk assessment 101: what UK and US schools need from a Thailand operator | Safety | risk assessment thailand school trip |
| 18 | Packing list: Thailand school trip edition (parents, save this) | Educator | thailand school trip packing list |
| 19 | The real cost of a school trip to Thailand (and how to fundraise it) | Educator | school trip thailand cost |
| 20 | Why we only run trips in Thailand — and what that means for your students | Brand | educational travel thailand |

---

## 5. Page-by-Page Specs

### 5.1 Home (`/`)

Blocks top→bottom:
1. Hero — full-bleed image, headline *"Educational travel that changes how students see the world."*, sub, primary CTA `Plan a school trip →`, secondary `Browse itineraries →`, lang toggle.
2. Role-switcher — 3 cards (teacher / parent / school admin).
3. Trust strip — accreditation badges + animated counters (240+ schools, 12 destinations, 98% rebook rate, 14 years).
4. Featured destinations — 4 cards (Chiang Mai, Phuket, Bangkok, Kanchanaburi).
5. Trip categories — 6 cards 3×2.
6. Sample itineraries — 3 horizontal cards.
7. Why flyed — 4-up (curriculum-aligned, local experts, 24/7 safety, ethical).
8. Testimonials — 3.
9. Stats band (dark).
10. Blog teaser — 3 latest.
11. CTA band — `Start your enquiry`.
12. Footer.

### 5.2 Category hub (`/trips`)

Hero (small), 6 category cards, top destinations per category (chips), featured itineraries per category, FAQ, CTA.

### 5.3 Category page (`/trips/[category]`)

Hero, intro, 2–3 sample itineraries, "works in these destinations" grid, curriculum alignment (IB MYP/DP, IGCSE, A-Level, AP), safety/ethics callout, teacher testimonial, FAQ, CTA.

### 5.4 Destination hub (`/destinations`)

Hero mosaic of 12 destinations, region grouping (North: Chiang Mai, Chiang Rai, Pai, Sukhothai; Central: Bangkok, Ayutthaya, Kanchanaburi; Andaman: Phuket, Krabi, Khao Sok; Gulf: Koh Tao; Northeast: Isan), best-month chips, FAQ, CTA.

### 5.5 Destination page (`/destinations/[city]`)

Hero + tagline + best-for, intro, "trips we run here" chips, 2 itineraries, "on the ground" local guide, testimonial, travel logistics (months/weather/visa), safety, FAQ, CTA.

### 5.6 Itinerary (`/itineraries/[slug]`)

Hero + days + price-from + badges, at-a-glance panel (days, group size, ages, curriculum tags, price-from, start months), day-by-day accordion, curriculum alignment, team bios (local guide + trip director), included/not-included, gallery 8–10 photos, safety & risk-assessment PDF, teacher testimonial, pre-filled enquiry CTA, related itineraries.

### 5.7 Persona pages (`/schools`, `/parents`, `/educators`)

Each: role-specific hero, 4-up benefits, 1 testimonial, mini-itinerary carousel, persona-specific reassurance section, FAQ, CTA.

### 5.8 About

Story (founded 2012, former-teacher + Thai-local-guide team), team grid (~8), values (4), accreditation row, partner schools, press logos, careers CTA.

### 5.9 How it works

5-step process (Tell us → We design → You review → You travel → We debrief), FAQ, CTA.

### 5.10 Safety

24/7 support, risk-assessment PDF, insurance, staff vetting, hospital partnerships, emergency protocols, partner logos, testimonials.

### 5.11 Contact

Form + Bangkok HQ + Chiang Mai base + phone/email/WhatsApp/Line.

### 5.12 Enquire (`/enquire`) — primary conversion

6 steps:
1. School name, role, email, phone, country
2. Group size, ages/grades, departure month, duration
3. Subjects (multi-select 6 categories), curriculum
4. Destinations (multi-select) or "you choose"
5. Notes / questions
6. Submit → confirmation page with enquiryId

POSTs to `/api/enquiry` → email (Resend) + CRM webhook + Astro DB log.

---

## 6. Design System

### 6.1 Color tokens

| Token | Hex | Use |
|---|---|---|
| `--teak-900` | `#1F1410` | Primary text |
| `--teak-700` | `#3D2A1F` | Body emphasis |
| `--teak-500` | `#7A5A40` | Secondary text |
| `--bamboo-700` | `#2D4A2B` | Primary brand |
| `--bamboo-500` | `#5A7A57` | Hover/secondary brand |
| `--bamboo-100` | `#E8EFE6` | Tinted bg |
| `--sunset-600` | `#D96B3D` | CTA accent |
| `--sunset-400` | `#E89668` | Hover accent |
| `--rice-50` | `#FAF6EE` | Page bg |
| `--rice-100` | `#F2EBDA` | Card surface |
| `--gold-500` | `#C8A24A` | Highlight/badge |
| `--ink-900` | `#0E0A07` | True black |
| `--alert-red` | `#B33A2A` | Error |
| `--info-blue` | `#3A6FB3` | Link |

### 6.2 Typography

- Display: **Fraunces** (variable, Google Fonts)
- Body: **Inter** (variable)
- Thai: **Noto Sans Thai** (paired with Inter on `/th/*`)
- Self-hosted in `/public/fonts/`
- Scale (rem): `0.75 / 0.875 / 1 / 1.125 / 1.25 / 1.5 / 1.875 / 2.5 / 3.5 / 5`

### 6.3 Spacing & layout

- 4-pt base; containers: `max-w-7xl` (home), `max-w-6xl` (content), `max-w-prose` (blog)
- Section padding `py-20 md:py-28`
- 12-col Tailwind grid; cards 4-col on desktop

### 6.4 Component inventory

Static (.astro):
`Header`, `Footer`, `MegaMenu`, `Hero`, `Section`, `StatsBar` (animated island), `DestinationCard`, `CategoryCard`, `ItineraryCard`, `BlogCard`, `TestimonialCard`, `BadgeRow`, `Breadcrumbs`, `CTASection`, `FAQAccordion`, `PersonaGrid`.

React islands:
`EnquiryForm`, `SearchBar`, `LanguageSwitcher`, `MegaMenuTrigger`, `Counter`, `ImageCarousel`, `NewsletterForm`.

### 6.5 Accessibility

WCAG 2.2 AA verified against palette. All interactive elements keyboard-navigable with visible focus rings. Reduced-motion respected for counters and carousel.

### 6.6 Performance budgets

Lighthouse: Perf ≥ 95, A11y ≥ 95, SEO = 100, BP ≥ 95 on home + 1 category + 1 destination + 1 itinerary + 1 blog post.

---

## 7. Imagery Strategy

- ~60 AI-generated images needed for launch.
- Master prompt library: `/docs/image-prompts.md` (tool-neutral).
- Style pinned: 35mm film-grain golden-hour, real-student groupings (no close-up faces unless explicit consent), Thailand-specific settings (rice terraces, temples, coast, jungle).
- Post-processing: color-grade pass to enforce palette consistency.
- AI guardrail: no real student likenesses; group shots or hands/back views preferred.
- Astro `<Image>` → AVIF + WebP, srcset, lazy, blur placeholder.

---

## 8. Architecture & Data Flow

### 8.1 Project layout

```
src/
  components/
  content/
    blog/        (20 .mdx)
    itineraries/ (10 .mdx)
    destinations/, categories/, team/, testimonials/
  layouts/
    BaseLayout.astro
    PageLayout.astro
  pages/
    index.astro, about.astro, how-it-works.astro, safety.astro,
    contact.astro, enquire.astro,
    trips/, destinations/, itineraries/, blog/, legal/, api/, th/, 404.astro, rss.xml.ts
  styles/global.css
  utils/{seo.ts, links.ts}
  i18n/{en.json, th.json}
public/
  fonts/, images/{hero,destinations,categories,itineraries,blog,team}/
docs/
  image-prompts.md, brand-voice.md, superpowers/specs/...
```

### 8.2 Content collection schemas (excerpt)

**Updated 2026-07-05:** the original spec described a single `blog` collection for EN content; a parallel `blogTh` collection was briefly introduced and then merged. The current implementation (`src/content.config.ts`) is a single `blog` collection keyed by file name, with a `locale` field on the front-matter that discriminates EN vs TH entries:

```ts
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().max(180),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    locale: z.enum(['en', 'th']),
    author: reference('team'),
    tags: z.array(z.enum([...10 tags])),
    heroImage: z.string(),
    relatedItineraries: z.array(reference('itineraries')).default([]),
    draft: z.boolean().default(false),
  }),
});
```

Editor pattern: locale variants are sibling files with the same slug — `<slug>.en.mdx` and `<slug>.th.mdx` — and a typo in `data.locale` silently hides a post from both locales (flagged as F-I18N-BLOG-001 in `docs/data/database-design.md`).

Analogous schemas for `itineraries`, `destinations`, `categories`, `team`. The `testimonials` collection is not in use; testimonials are inlined on the home page (see `DEPLOY.md` "Known post-launch items").

### 8.3 i18n

Astro built-in i18n: `defaultLocale: 'en'`, `locales: ['en','th']`. Locale-prefixed routing. Shared components; locale-specific copy in `src/i18n/{en,th}.json`.

### 8.4 Enquiry data flow

**Updated 2026-07-05:** the original spec described Astro DB row writes as the durable layer. Astro DB was never wired. The current implementation uses two Cloudflare KV namespaces declared in `wrangler.jsonc` and bound to the runtime:

```
/enquire → POST /api/enquiry
  → zod validation
  → IP-chain sliding-window rate limit (RATE_LIMIT_KV; src/lib/rate-limit.ts)
  → durable write to LEADS_KV (key: UUID v4; value: full enquiry; TTL: 30 days)
  → Resend email (env: RESEND_API_KEY; src/pages/api/enquiry.ts)
  → CRM webhook POST (env: CRM_WEBHOOK_URL)
  → { ok: true, enquiryId, durable } → confirmation page
```

Failure mode: if `LEADS_KV.put()` fails or the binding is missing, the handler still returns 200 with `durable: false` — the lead is then visible only via `ctx.logger.error` and the Workers request log. The recovery procedure for that case is documented in `docs/operations/runbooks/RB-leads-kv-failure.md`.

### 8.5 SEO

- `astro-seo` for OG, Twitter, canonical, hreflang
- `@astrojs/sitemap` with i18n alternates
- `@astrojs/rss` for blog
- Partytown for Plausible/Umami analytics
- Schema.org JSON-LD: Organization, TouristTrip, BreadcrumbList, Article, FAQPage

### 8.6 Deployment

- Output: `static` + hybrid for `/api/*`
- Adapter: Cloudflare Pages (or Netlify)
- Env: `RESEND_API_KEY`, `CRM_WEBHOOK_URL`, `ASTRO_DB_REMOTE_URL`, `PUBLIC_ANALYTICS_HOST`
- GH Actions: PR previews + Lighthouse CI (≥ 90 budget)

### 8.7 Quality gates

- `astro check` clean
- Lighthouse CI thresholds on home + category + destination + itinerary + blog
- axe-core smoke via Playwright
- Playwright E2E: home → category → itinerary → enquiry happy-path
- Playwright visual regression on key pages

---

## 9. Open Items & Risks

| Item | Risk | Owner | Resolution |
|---|---|---|---|
| AI image generation (~60 images) | 2-week sprint | Marketing | Batched generation + color-grade pass |
| TH translations | Need Thai copywriter | Marketing | Spec EN-first; `/th/*` slots ready |
| CRM choice | Unknown at spec time | Sales | User to confirm HubSpot vs Salesforce vs Pipedrive before launch |
| Testimonials | Placeholder copy unless real quotes provided | Marketing | Pre-launch collection from schools |
| Sample itinerary copy depth (10 × ~7 days = 70 blocks) | Long-form content work | Content lead | 2-sprint plan |
| Accreditation claims (ATTA/IATAN/TEATA/GSTC) | Verify before listing on home | Founder | Confirm memberships; only list verified |
| Real school photos vs AI | Trust signal | Marketing | AI at launch; replace with real photos as permissions collected |
| Itinerary pricing | "price-from" needs data | Sales | Provide price-from per itinerary before launch |

---

## 10. Out of Scope (v1)

- Real-time booking/payment
- Customer portal / login
- Multi-currency pricing display
- Live chat (planned for v2)
- Thai-language blog posts (post-launch)
- Search functionality across blog (planned for v2)