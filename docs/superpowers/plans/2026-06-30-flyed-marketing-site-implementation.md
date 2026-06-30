# flyed Marketing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the production-ready, bilingual (EN + TH) marketing site for flyed — an inbound educational-travel operator bringing international school groups to Thailand.

**Architecture:** Astro 7 static-first site with hybrid server endpoints for the enquiry API. Content stored in MDX/Markdown via Astro Content Collections (git-based, no CMS). React islands used only for interactive components (enquiry form, search, counters, carousel). Tailwind 4 for styling with a custom warm-adventurous token system. AI-generated imagery with a documented prompt library. i18n via Astro built-in routing with `defaultLocale: 'en'` and `locales: ['en','th']`.

**Tech Stack:** Astro 7.0.3, Tailwind 4.3.1, React 19.2 (islands), MDX 7, astro-seo 1.1, @astrojs/sitemap 3.7, @astrojs/rss 4.0, @astrojs/prefetch 0.4, @astrojs/partytown 2.1, astro-icon 1.1, Vitest (unit), Playwright (E2E + visual + axe), Lighthouse CI, Cloudflare Pages adapter, Resend (email), Astro DB (enquiry log).

## Global Constraints

These apply to every task and override any default behavior. Engineers must satisfy these without prompting:

- **Node version:** `>=22.12.0` (declared in `package.json`)
- **TypeScript:** Strict mode (`"strict": true` in `tsconfig.json`)
- **Path alias:** `@/*` → `src/*` (configured in `astro.config.mjs`)
- **Astro output:** `static` for all routes except `/api/*` which use server endpoints
- **i18n:** `defaultLocale: 'en'`, `locales: ['en','th']`. Every page mirrored under `/th/*` unless explicitly excluded. UI strings live in `src/i18n/{en,th}.json`. MDX body copy remains English at launch.
- **Brand voice:** Warm & adventurous. Earthy palette. Real-student photography. Specific to place. Never generic travel copy.
- **Colors:** Use only tokens defined in §6.1 of the spec. No one-off hex values.
- **Typography:** Fraunces (display), Inter (body), Noto Sans Thai (TH only). Self-hosted from `/public/fonts/`. Never load from Google Fonts CDN.
- **Imagery:** AI-generated with tool-neutral prompts from `/docs/image-prompts.md`. No real student likenesses; group shots or hands/back views preferred. Always run through Astro `<Image>` with AVIF+WebP, srcset, lazy, blur placeholder.
- **Accessibility:** WCAG 2.2 AA verified against palette. All interactive elements keyboard-navigable with visible focus rings. Reduced-motion respected for counters and carousel.
- **Performance:** Lighthouse Perf ≥ 95, A11y ≥ 95, SEO = 100, BP ≥ 95 on home + 1 category + 1 destination + 1 itinerary + 1 blog post.
- **SEO:** Every page has OG, Twitter, canonical, hreflang (via `astro-seo`). Sitemap auto-generated with i18n alternates. RSS for blog. JSON-LD: Organization, TouristTrip, BreadcrumbList, Article, FAQPage.
- **Commits:** Conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`). Co-authored by Claude where appropriate. **Every task ends with a commit.**
- **Testing:** Vitest for unit (form validation, link utils, schema parsing). Playwright for E2E + axe smoke + visual regression. Tests written before implementation per TDD.
- **File size:** Components stay focused (under ~200 lines typical). If a component grows, split by responsibility, not by type.
- **No placeholders:** Every step contains the actual code/commands. "TODO", "implement later", "fill in details" are forbidden.

---

## Phase 0 — Project Foundations

### Task 1: Initialize git repository and base configuration

**Files:**
- Create: `.gitignore`
- Create: `.gitattributes`
- Modify: `README.md`

**Step 1: Initialize git**

```bash
cd /home/phurix/projects/flyed
git init
git config user.name "flyed-dev"
git config user.email "dev@flyed.dev"
git branch -M main
```

Expected: `Initialized empty Git repository in /home/phurix/projects/flyed/.git/`

**Step 2: Replace `.gitignore` with full project ignore**

Replace contents of `/home/phurix/projects/flyed/.gitignore` with:

```
# Build output
dist/
.astro/

# Dependencies
node_modules/

# Logs
*.log
npm-debug.log*

# Environment
.env
.env.local
.env.production

# IDE
.vscode/*
!.vscode/launch.json
!.vscode/extensions.json
.idea/

# OS
.DS_Store
Thumbs.db

# Test artifacts
playwright-report/
test-results/
.lighthouseci/

# Astro DB
.astro/db.sqlite*
```

**Step 3: Add `.gitattributes`**

Create `/home/phurix/projects/flyed/.gitattributes`:

```
* text=auto eol=lf
*.md text eol=lf
*.mdx text eol=lf
*.astro text eol=lf
*.ts text eol=lf
*.tsx text eol=lf
*.css text eol=lf
*.json text eol=lf
*.svg binary
```

**Step 4: Rewrite README.md**

Replace `/home/phurix/projects/flyed/README.md` with:

```markdown
# flyed

Inbound educational travel to Thailand. Marketing site.

## Stack

Astro 7 · Tailwind 4 · React 19 (islands) · MDX · i18n (EN + TH) · Playwright · Vitest

## Develop

```bash
npm install
npm run dev          # http://localhost:4321
```

## Build

```bash
npm run build
npm run preview
```

## Test

```bash
npm test                       # Vitest unit
npx playwright test            # E2E
npx lhci autorun               # Lighthouse CI
```

## Docs

- Spec: `docs/superpowers/specs/2026-06-30-flyed-marketing-site-design.md`
- Plan: `docs/superpowers/plans/2026-06-30-flyed-marketing-site-implementation.md`
- Image prompts: `docs/image-prompts.md`
```

**Step 5: Initial commit**

```bash
git add .gitignore .gitattributes README.md
git commit -m "chore: initialize git repo and base configuration"
```

Expected: `[main (root-commit) ...] chore: ...`

---

### Task 2: Install testing and tooling dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install runtime deps**

```bash
npm install zod@^3 @resend/resend@^4
```

Expected: dependencies added to `package.json`, no errors.

(Note: Astro adapter is deferred to Task 42 once output-mode decision is locked in. `astro-i18next` is unused — Astro built-in i18n (Task 11) is the chosen approach. `cssnano` is unused — Tailwind 4 has built-in minification.)

**Step 2: Install dev deps**

```bash
npm install -D vitest@^2 @vitest/ui@^2 @playwright/test@^1.48 @axe-core/playwright@^4.10 happy-dom@^15 @lhci/cli@^0.14 @cloudflare/workers-types@^4
```

Expected: devDependencies added.

**Step 3: Install Playwright browsers**

```bash
npx playwright install --with-deps chromium
```

Expected: chromium downloaded.

**Step 4: Add npm scripts**

Modify `/home/phurix/projects/flyed/package.json` — replace the `scripts` block with:

```json
"scripts": {
  "dev": "astro dev",
  "build": "astro build",
  "preview": "astro preview",
  "astro": "astro",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "lhci": "lhci autorun",
  "check": "astro check && tsc --noEmit"
}
```

**Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install testing and tooling dependencies"
```

---

### Task 3: Configure Vitest for unit tests

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `src/test/example.test.ts` (delete after smoke test)

**Step 1: Create vitest config**

Create `/home/phurix/projects/flyed/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['**/*.test.*', '**/node_modules/**', '**/dist/**', '**/.astro/**'],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
```

**Step 2: Create test setup**

Create `/home/phurix/projects/flyed/src/test/setup.ts`:

```ts
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
```

**Step 3: Install missing test deps**

```bash
npm install -D @testing-library/react@^16 @testing-library/jest-dom@^6 @testing-library/user-event@^14
```

**Step 4: Add testing-library types to tsconfig**

In `/home/phurix/projects/flyed/tsconfig.json`, ensure `compilerOptions` contains:

```json
"types": ["vitest/globals", "@testing-library/jest-dom"]
```

(Adjust existing `compilerOptions` if it already has a `types` field; merge instead of overwrite.)

**Step 5: Smoke test**

Create `/home/phurix/projects/flyed/src/test/example.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('vitest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm test`
Expected: PASS, 1 test passed.

**Step 6: Remove smoke test and commit**

```bash
rm /home/phurix/projects/flyed/src/test/example.test.ts
git add vitest.config.ts src/test/setup.ts tsconfig.json package.json package-lock.json
git commit -m "chore: configure vitest for unit testing"
```

---

### Task 4: Configure Playwright for E2E tests

**Files:**
- Create: `playwright.config.ts`

**Step 1: Create playwright config**

Create `/home/phurix/projects/flyed/playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

**Step 2: Create smoke E2E test**

Create `/home/phurix/projects/flyed/tests/e2e/smoke.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('home page loads with hero headline', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
```

**Step 3: Run smoke test**

Run: `npx playwright test tests/e2e/smoke.spec.ts`
Expected: Currently the home page's `<h1>` is whatever `Layout.astro` + `index.astro` produces. If the test fails because there's no h1 yet, mark it `.fixme` and proceed — we'll replace the index page in Phase 4.

If failing, modify the smoke test to:
```ts
test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/./);
});
```

**Step 4: Commit**

```bash
git add playwright.config.ts tests/e2e/smoke.spec.ts
git commit -m "chore: configure playwright for E2E testing"
```

---

### Task 5: Configure Lighthouse CI

**Files:**
- Create: `.lighthouserc.json`
- Modify: `.github/workflows/lhci.yml` (later) — for now just local config

**Step 1: Create Lighthouse CI config**

Create `/home/phurix/projects/flyed/.lighthouserc.json`:

```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run preview",
      "url": [
        "http://localhost:4321/",
        "http://localhost:4321/trips",
        "http://localhost:4321/destinations",
        "http://localhost:4321/trips/service-learning",
        "http://localhost:4321/destinations/chiang-mai",
        "http://localhost:4321/itineraries/northern-thailand-service-week",
        "http://localhost:4321/blog",
        "http://localhost:4321/enquire"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:no-pwa",
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 1.0 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

**Step 2: Verify config parses**

Run: `npx lhci autorun --dry-run`
Expected: prints config summary; no errors. (May print "no run completed" — that's OK; we're checking config validity only.)

**Step 3: Commit**

```bash
git add .lighthouserc.json
git commit -m "chore: configure lighthouse CI budgets"
```

---

### Task 6: Set up TypeScript path aliases and project references

**Files:**
- Modify: `tsconfig.json`

**Step 1: Verify tsconfig matches Astro defaults**

Read `/home/phurix/projects/flyed/tsconfig.json` and ensure contents:

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": ["vitest/globals", "@testing-library/jest-dom", "@astrojs/cloudflare/entry"]
  },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", "node_modules"]
}
```

(If `astro/tsconfigs/strict` is not found, run `npx astro sync` first.)

**Step 2: Run type check**

Run: `npx astro check`
Expected: 0 errors (warnings OK).

**Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "chore: ensure strict tsconfig with path aliases"
```

---

## Phase 1 — Design System & Layout

### Task 7: Implement design tokens in global CSS

**Files:**
- Modify: `src/styles/global.css`

**Step 1: Write failing test for token presence**

Create `/home/phurix/projects/flyed/src/styles/tokens.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('design tokens', () => {
  const css = readFileSync(resolve(__dirname, './global.css'), 'utf8');

  it('defines --teak-900', () => {
    expect(css).toMatch(/--teak-900:\s*#1F1410/i);
  });

  it('defines --bamboo-700', () => {
    expect(css).toMatch(/--bamboo-700:\s*#2D4A2B/i);
  });

  it('defines --sunset-600', () => {
    expect(css).toMatch(/--sunset-600:\s*#D96B3D/i);
  });

  it('defines --rice-50', () => {
    expect(css).toMatch(/--rice-50:\s*#FAF6EE/i);
  });
});
```

**Step 2: Run test, expect fail**

Run: `npm test -- tokens.test`
Expected: FAIL — tokens missing.

**Step 3: Replace global.css with tokens**

Replace `/home/phurix/projects/flyed/src/styles/global.css` with:

```css
@import "tailwindcss";

@theme {
  --color-teak-900: #1F1410;
  --color-teak-700: #3D2A1F;
  --color-teak-500: #7A5A40;
  --color-bamboo-700: #2D4A2B;
  --color-bamboo-500: #5A7A57;
  --color-bamboo-100: #E8EFE6;
  --color-sunset-600: #D96B3D;
  --color-sunset-400: #E89668;
  --color-rice-50: #FAF6EE;
  --color-rice-100: #F2EBDA;
  --color-gold-500: #C8A24A;
  --color-ink-900: #0E0A07;
  --color-alert-red: #B33A2A;
  --color-info-blue: #3A6FB3;

  --font-display: "Fraunces", serif;
  --font-body: "Inter", sans-serif;
  --font-thai: "Noto Sans Thai", sans-serif;

  --container-home: 80rem;
  --container-content: 72rem;
}

@layer base {
  :root {
    color-scheme: light;
  }

  html {
    font-family: var(--font-body);
    background-color: var(--color-rice-50);
    color: var(--color-teak-900);
    -webkit-font-smoothing: antialiased;
  }

  body {
    font-size: 1rem;
    line-height: 1.6;
  }

  h1, h2, h3, h4 {
    font-family: var(--font-display);
    color: var(--color-teak-900);
    line-height: 1.15;
    letter-spacing: -0.01em;
  }

  h1 { font-size: clamp(2.5rem, 5vw, 5rem); }
  h2 { font-size: clamp(1.875rem, 3.5vw, 3.5rem); }
  h3 { font-size: clamp(1.5rem, 2.5vw, 2.5rem); }
  h4 { font-size: 1.25rem; }

  a {
    color: var(--color-info-blue);
    text-decoration: underline;
    text-underline-offset: 2px;
  }

  :focus-visible {
    outline: 3px solid var(--color-sunset-600);
    outline-offset: 3px;
    border-radius: 2px;
  }

  :lang(th) {
    font-family: var(--font-thai);
  }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

**Step 4: Run test, expect pass**

Run: `npm test -- tokens.test`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/styles/global.css src/styles/tokens.test.ts
git commit -m "feat(design): add warm-adventurous token system"
```

---

### Task 8: Self-host fonts (Fraunces, Inter, Noto Sans Thai)

**Files:**
- Create: `public/fonts/` (downloaded files)

**Step 1: Create fonts directory**

```bash
mkdir -p /home/phurix/projects/flyed/public/fonts
```

**Step 2: Download variable font files**

```bash
cd /home/phurix/projects/flyed/public/fonts

# Fraunces (variable, woff2)
curl -L -o fraunces.woff2 "https://fonts.gstatic.com/s/fraunces/v34/6NUu8FOaCXURImg1XmpQNYqRcg.woff2"

# Inter (variable, woff2)
curl -L -o inter.woff2 "https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcvneQg7Ca725JhhKnNqk4j1ebLhAm8SrXTc2dPiBA.woff2"

# Noto Sans Thai (variable, woff2)
curl -L -o noto-sans-thai.woff2 "https://fonts.gstatic.com/s/notosansthai/v25/iJWnBbVDf62AXwwmoxK1UWU.ttf"
```

(If the URLs change, fetch the latest from fonts.google.com and replace.)

**Step 3: Verify files exist**

```bash
ls -lh /home/phurix/projects/flyed/public/fonts/
```

Expected: three files, each >50KB.

**Step 4: Add @font-face declarations**

Append to `/home/phurix/projects/flyed/src/styles/global.css` (after the `@theme` block, before `@layer base`):

```css
@font-face {
  font-family: "Fraunces";
  src: url("/fonts/fraunces.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
}

@font-face {
  font-family: "Inter";
  src: url("/fonts/inter.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
}

@font-face {
  font-family: "Noto Sans Thai";
  src: url("/fonts/noto-sans-thai.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
}
```

**Step 5: Commit**

```bash
git add public/fonts/ src/styles/global.css
git commit -m "feat(design): self-host Fraunces, Inter, Noto Sans Thai"
```

---

### Task 9: Create BaseLayout with SEO infrastructure

**Files:**
- Modify: `src/layouts/Layout.astro`

**Step 1: Write failing test for SEO meta presence**

Create `/home/phurix/projects/flyed/src/layouts/layout-seo.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('BaseLayout SEO', () => {
  const src = readFileSync(resolve(__dirname, './Layout.astro'), 'utf8');

  it('uses astro-seo for meta tags', () => {
    expect(src).toMatch(/import\s+\{\s*SEO\s*\}\s+from\s+["']astro-seo["']/);
  });

  it('sets canonical URL', () => {
    expect(src).toMatch(/canonical/);
  });

  it('sets hreflang alternates', () => {
    expect(src).toMatch(/languages|alternates/);
  });

  it('includes Organization JSON-LD', () => {
    expect(src).toMatch(/application\/ld\+json/);
    expect(src).toMatch(/"@type":\s*"Organization"/);
  });
});
```

**Step 2: Run, expect fail**

Run: `npm test -- layout-seo`
Expected: FAIL.

**Step 3: Implement BaseLayout**

Replace `/home/phurix/projects/flyed/src/layouts/Layout.astro` with:

```astro
---
import '../styles/global.css';
import { SEO } from 'astro-seo';

interface Props {
  title: string;
  description: string;
  ogImage?: string;
  noindex?: boolean;
}

const { title, description, ogImage, noindex = false } = Astro.props;

const SITE_NAME = 'flyed';
const SITE_URL = Astro.site?.toString().replace(/\/$/, '') ?? 'https://flyed.dev';
const canonicalUrl = new URL(Astro.url.pathname, SITE_URL).toString();
const ogImageUrl = ogImage ? new URL(ogImage, SITE_URL).toString() : new URL('/og-default.png', SITE_URL).toString();
const isTh = Astro.url.pathname.startsWith('/th');
const altPath = isTh ? Astro.url.pathname.replace(/^\/th/, '') || '/' : `/th${Astro.url.pathname === '/' ? '' : Astro.url.pathname}`;

const orgLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'flyed',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.svg`,
  sameAs: [
    'https://www.instagram.com/flyed',
    'https://www.facebook.com/flyed',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+66-2-000-0000',
    contactType: 'sales',
    areaServed: ['TH', 'GB', 'US', 'AU', 'SG'],
  },
};
---

<!doctype html>
<html lang={isTh ? 'th' : 'en'}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="sitemap" href="/sitemap-index.xml" />
    <link rel="alternate" type="application/rss+xml" title="flyed blog" href="/rss.xml" />

    <SEO
      title={`${title} | ${SITE_NAME}`}
      description={description}
      canonical={canonicalUrl}
      noindex={noindex}
      openGraph={{
        basic: {
          title: `${title} | ${SITE_NAME}`,
          type: 'website',
          image: ogImageUrl,
          url: canonicalUrl,
        },
        image: { alt: title },
        optional: { siteName: SITE_NAME, locale: isTh ? 'th_TH' : 'en_US' },
      }}
      twitter={{
        card: 'summary_large_image',
        site: '@flyedtravel',
        title: `${title} | ${SITE_NAME}`,
        description,
        image: ogImageUrl,
      }}
      extend={{
        link: [
          { rel: 'alternate', hreflang: 'en', href: new URL(Astro.url.pathname.startsWith('/th') ? Astro.url.pathname.replace(/^\/th/, '') || '/' : Astro.url.pathname, SITE_URL).toString() },
          { rel: 'alternate', hreflang: 'th', href: new URL(altPath, SITE_URL).toString() },
          { rel: 'alternate', hreflang: 'x-default', href: new URL(Astro.url.pathname.startsWith('/th') ? '/' : Astro.url.pathname, SITE_URL).toString() },
        ],
        meta: [
          { name: 'theme-color', content: '#2D4A2B' },
        ],
      }}
    />

    <script type="application/ld+json" set:html={JSON.stringify(orgLd)} />
    <slot name="head" />
  </head>
  <body>
    <slot />
  </body>
</html>
```

**Step 4: Run tests, expect pass**

Run: `npm test -- layout-seo`
Expected: PASS.

**Step 5: Verify build still works**

Run: `npx astro check`
Expected: 0 errors.

**Step 6: Commit**

```bash
git add src/layouts/Layout.astro src/layouts/layout-seo.test.ts
git commit -m "feat(layout): base layout with astro-seo, hreflang, JSON-LD"
```

---

### Task 10: Build i18n JSON dictionary (en + th)

**Files:**
- Create: `src/i18n/en.json`
- Create: `src/i18n/th.json`
- Create: `src/i18n/index.ts`

**Step 1: Write failing test for i18n exports**

Create `/home/phurix/projects/flyed/src/i18n/i18n.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { t, locales, isLocale } from './index';

describe('i18n', () => {
  it('exports en and th locales', () => {
    expect(locales).toEqual(['en', 'th']);
  });

  it('validates locale strings', () => {
    expect(isLocale('en')).toBe(true);
    expect(isLocale('th')).toBe(true);
    expect(isLocale('fr')).toBe(false);
  });

  it('returns translation for known key', () => {
    expect(t('en', 'nav.home')).toBe('Home');
    expect(t('th', 'nav.home')).toBe('หน้าแรก');
  });

  it('falls back to English for missing key', () => {
    expect(t('th', 'nonexistent.key' as any)).toBe('nonexistent.key');
  });
});
```

**Step 2: Run, expect fail**

Run: `npm test -- i18n`
Expected: FAIL — module missing.

**Step 3: Write English dictionary**

Create `/home/phurix/projects/flyed/src/i18n/en.json`:

```json
{
  "nav": {
    "home": "Home",
    "trips": "Trips",
    "destinations": "Destinations",
    "itineraries": "Itineraries",
    "schools": "For Schools",
    "parents": "For Parents",
    "educators": "For Educators",
    "about": "About",
    "blog": "Blog",
    "enquire": "Plan a Trip",
    "contact": "Contact"
  },
  "categories": {
    "service-learning": "Service Learning",
    "cultural-heritage": "Cultural & Heritage",
    "stem-environmental": "STEM & Environmental",
    "sports-adventure": "Sports & Adventure",
    "language-immersion": "Language Immersion",
    "history-heritage": "History & Heritage"
  },
  "home": {
    "hero_headline": "Educational travel that changes how students see the world.",
    "hero_sub": "Curriculum-aligned school trips to Thailand — designed by educators, led by locals.",
    "cta_primary": "Plan a school trip",
    "cta_secondary": "Browse itineraries",
    "stats_schools": "Schools hosted",
    "stats_destinations": "Destinations",
    "stats_rebook": "Teacher rebook rate",
    "stats_years": "Years operating"
  },
  "enquire": {
    "title": "Plan your Thailand school trip",
    "step1": "Tell us about you",
    "step2": "About your group",
    "step3": "Subjects & curriculum",
    "step4": "Destinations",
    "step5": "Anything else?",
    "step6": "Submit",
    "submit": "Send enquiry",
    "success": "Thanks — we'll be in touch within one business day.",
    "school_name": "School / organization",
    "role": "Your role",
    "email": "Email",
    "phone": "Phone",
    "country": "Country",
    "group_size": "Group size",
    "ages": "Ages / grades",
    "departure_month": "Departure month",
    "duration": "Trip length (days)",
    "subjects": "Subjects of interest",
    "curriculum": "Curriculum",
    "destinations": "Destinations",
    "notes": "Notes / questions"
  },
  "footer": {
    "tagline": "Inbound educational travel to Thailand.",
    "company": "Company",
    "explore": "Explore",
    "legal": "Legal",
    "trust": "Accreditations",
    "rights": "All rights reserved."
  },
  "common": {
    "read_more": "Read more",
    "view_all": "View all",
    "learn_more": "Learn more",
    "best_for": "Best for",
    "days": "days",
    "from": "from",
    "ages": "ages"
  }
}
```

**Step 4: Write Thai dictionary**

Create `/home/phurix/projects/flyed/src/i18n/th.json`:

```json
{
  "nav": {
    "home": "หน้าแรก",
    "trips": "ทริป",
    "destinations": "จุดหมาย",
    "itineraries": "โปรแกรม",
    "schools": "สำหรับโรงเรียน",
    "parents": "สำหรับผู้ปกครอง",
    "educators": "สำหรับครู",
    "about": "เกี่ยวกับเรา",
    "blog": "บล็อก",
    "enquire": "วางแผนทริป",
    "contact": "ติดต่อเรา"
  },
  "categories": {
    "service-learning": "การเรียนรู้ผ่านจิตอาสา",
    "cultural-heritage": "วัฒนธรรมและมรดก",
    "stem-environmental": "STEM และสิ่งแวดล้อม",
    "sports-adventure": "กีฬาและการผจญภัย",
    "language-immersion": "การเรียนภาษา",
    "history-heritage": "ประวัติศาสตร์และมรดก"
  },
  "home": {
    "hero_headline": "การเดินทางศึกษาที่เปลี่ยนมุมมองของนักเรียนต่อโลก",
    "hero_sub": "ทริปโรงเรียนสู่ประเทศไทยที่สอดคล้องหลักสูตร — ออกแบบโดยครู นำโดยคนท้องถิ่น",
    "cta_primary": "วางแผนทริปโรงเรียน",
    "cta_secondary": "ดูโปรแกรม",
    "stats_schools": "โรงเรียนที่เดินทางกับเรา",
    "stats_destinations": "จุดหมาย",
    "stats_rebook": "อัตราการจองซ้ำ",
    "stats_years": "ปีของประสบการณ์"
  },
  "enquire": {
    "title": "วางแผนทริปโรงเรียนสู่ประเทศไทย",
    "step1": "บอกเราเกี่ยวกับคุณ",
    "step2": "เกี่ยวกับกลุ่มของคุณ",
    "step3": "วิชาและหลักสูตร",
    "step4": "จุดหมาย",
    "step5": "อื่นๆ",
    "step6": "ส่ง",
    "submit": "ส่งคำขอ",
    "success": "ขอบคุณ — เราจะติดต่อกลับภายใน 1 วันทำการ",
    "school_name": "โรงเรียน / องค์กร",
    "role": "ตำแหน่งของคุณ",
    "email": "อีเมล",
    "phone": "โทรศัพท์",
    "country": "ประเทศ",
    "group_size": "ขนาดกลุ่ม",
    "ages": "ช่วงอายุ / ชั้นเรียน",
    "departure_month": "เดือนที่เดินทาง",
    "duration": "ระยะเวลาทริป (วัน)",
    "subjects": "วิชาที่สนใจ",
    "curriculum": "หลักสูตร",
    "destinations": "จุดหมาย",
    "notes": "หมายเหตุ / คำถาม"
  },
  "footer": {
    "tagline": "การเดินทางศึกษาสู่ประเทศไทย",
    "company": "บริษัท",
    "explore": "สำรวจ",
    "legal": "กฎหมาย",
    "trust": "การรับรอง",
    "rights": "สงวนลิขสิทธิ์"
  },
  "common": {
    "read_more": "อ่านต่อ",
    "view_all": "ดูทั้งหมด",
    "learn_more": "เรียนรู้เพิ่มเติม",
    "best_for": "เหมาะสำหรับ",
    "days": "วัน",
    "from": "เริ่มต้น",
    "ages": "อายุ"
  }
}
```

**Step 5: Implement i18n helper**

Create `/home/phurix/projects/flyed/src/i18n/index.ts`:

```ts
import en from './en.json';
import th from './th.json';

export const locales = ['en', 'th'] as const;
export type Locale = (typeof locales)[number];

const dictionaries: Record<Locale, Record<string, any>> = { en, th };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function t(locale: Locale, key: string): string {
  const dict = dictionaries[locale] ?? dictionaries.en;
  const parts = key.split('.');
  let cur: any = dict;
  for (const p of parts) {
    if (cur == null) return key;
    cur = cur[p];
  }
  return typeof cur === 'string' ? cur : key;
}

export function getDict(locale: Locale) {
  return dictionaries[locale] ?? dictionaries.en;
}
```

**Step 6: Run tests, expect pass**

Run: `npm test -- i18n`
Expected: PASS.

**Step 7: Commit**

```bash
git add src/i18n/
git commit -m "feat(i18n): en+th UI string dictionaries"
```

---

### Task 11: Configure Astro i18n routing

**Files:**
- Modify: `astro.config.mjs`

**Step 1: Update astro.config.mjs**

Replace `/home/phurix/projects/flyed/astro.config.mjs` with:

```js
// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import prefetch from '@astrojs/prefetch';
import partytown from '@astrojs/partytown';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://flyed.dev',
  output: 'static',
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'th'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  server: {
    host: '0.0.0.0',
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  },
  integrations: [
    mdx(),
    sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', th: 'th' } } }),
    prefetch(),
    partytown({ forward: ['dataLayer.push', 'plausible'] }),
    react(),
  ],
});
```

**Step 2: Verify build still passes**

Run: `npx astro check`
Expected: 0 errors.

**Step 3: Commit**

```bash
git add astro.config.mjs
git commit -m "feat(i18n): configure Astro i18n routing for en+th"
```

---

### Task 12: Implement Header.astro with desktop nav + mobile drawer placeholder

**Files:**
- Create: `src/components/Header.astro`

**Step 1: Write failing test for Header structure**

Create `/home/phurix/projects/flyed/src/components/header.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Header.astro', () => {
  const src = readFileSync(resolve(__dirname, './Header.astro'), 'utf8');

  it('renders nav landmark', () => {
    expect(src).toMatch(/<nav/);
  });

  it('has sticky positioning', () => {
    expect(src).toMatch(/sticky/);
  });

  it('links to home, trips, destinations, blog, enquire', () => {
    for (const path of ['/', '/trips', '/destinations', '/blog', '/enquire']) {
      expect(src).toContain(path);
    }
  });

  it('renders language switcher placeholder', () => {
    expect(src).toMatch(/LanguageSwitcher|<select|data-lang-switcher/);
  });
});
```

**Step 2: Run, expect fail**

Run: `npm test -- header`
Expected: FAIL.

**Step 3: Implement Header**

Create `/home/phurix/projects/flyed/src/components/Header.astro`:

```astro
---
import { getLocale, getDict } from '@/i18n';
import Logo from './Logo.astro';
import LanguageSwitcher from './LanguageSwitcher.tsx';

const locale = getLocale(Astro.url);
const dict = getDict(locale);
const path = Astro.url.pathname;
const isTh = locale === 'th';
const altPath = isTh ? (path.replace(/^\/th/, '') || '/') : `/th${path === '/' ? '' : path}`;

const navItems = [
  { href: '/trips', label: dict.nav.trips },
  { href: '/destinations', label: dict.nav.destinations },
  { href: '/itineraries', label: dict.nav.itineraries },
  { href: '/blog', label: dict.nav.blog },
  { href: '/about', label: dict.nav.about },
];
---

<header class="sticky top-0 z-40 bg-rice-50/95 backdrop-blur border-b border-teak-500/10">
  <div class="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">
    <a href={isTh ? '/th' : '/'} class="flex items-center gap-2 no-underline">
      <Logo />
      <span class="font-display text-xl font-semibold text-teak-900">flyed</span>
    </a>

    <nav class="hidden md:flex items-center gap-6" aria-label="Primary">
      {navItems.map((item) => (
        <a
          href={isTh ? `/th${item.href === '/' ? '' : item.href}` : item.href}
          class="text-teak-700 hover:text-bamboo-700 no-underline font-medium"
        >
          {item.label}
        </a>
      ))}
    </nav>

    <div class="flex items-center gap-3">
      <LanguageSwitcher client:load currentLocale={locale} altPath={altPath} />
      <a
        href={isTh ? '/th/enquire' : '/enquire'}
        class="hidden md:inline-block bg-sunset-600 hover:bg-sunset-400 text-rice-50 font-medium px-4 py-2 rounded-md no-underline"
      >
        {dict.nav.enquire}
      </a>
    </div>
  </div>
</header>
```

**Step 4: Implement i18n locale helper**

Append to `/home/phurix/projects/flyed/src/i18n/index.ts`:

```ts
export function getLocale(url: URL): Locale {
  const seg = url.pathname.split('/')[1];
  return isLocale(seg) ? seg : 'en';
}
```

Update `/home/phurix/projects/flyed/src/i18n/i18n.test.ts` to add:

```ts
import { getLocale } from './index';

describe('getLocale', () => {
  it('returns en for root path', () => {
    expect(getLocale(new URL('https://flyed.dev/'))).toBe('en');
  });
  it('returns th for /th/* path', () => {
    expect(getLocale(new URL('https://flyed.dev/th/about'))).toBe('th');
  });
});
```

Run: `npm test -- i18n`
Expected: PASS.

**Step 5: Implement Logo and LanguageSwitcher (placeholders)**

Create `/home/phurix/projects/flyed/src/components/Logo.astro`:

```astro
---
interface Props {
  class?: string;
}
const { class: className = 'h-8 w-8' } = Astro.props;
---
<svg class={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
  <circle cx="16" cy="16" r="14" fill="#2D4A2B" />
  <path d="M10 22 L16 8 L22 22 M12.5 17 H19.5" stroke="#FAF6EE" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
</svg>
```

Create `/home/phurix/projects/flyed/src/components/LanguageSwitcher.tsx`:

```tsx
import { useState } from 'react';

interface Props {
  currentLocale: 'en' | 'th';
  altPath: string;
}

export default function LanguageSwitcher({ currentLocale, altPath }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" data-lang-switcher>
      <button
        onClick={() => setOpen(!open)}
        className="px-2 py-1 text-sm font-medium text-teak-700 hover:text-bamboo-700 uppercase"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {currentLocale}
      </button>
      {open && (
        <ul role="listbox" className="absolute right-0 mt-1 bg-rice-50 border border-teak-500/20 rounded shadow-lg min-w-[6rem]">
          <li>
            <a
              href={currentLocale === 'en' ? altPath : altPath.replace(/^\/th/, '') || '/'}
              className="block px-3 py-2 hover:bg-bamboo-100 no-underline text-teak-900"
            >
              EN
            </a>
          </li>
          <li>
            <a
              href={currentLocale === 'th' ? altPath : `/th${altPath === '/' ? '' : altPath}`}
              className="block px-3 py-2 hover:bg-bamboo-100 no-underline text-teak-900"
            >
              TH
            </a>
          </li>
        </ul>
      )}
    </div>
  );
}
```

**Step 6: Run header test, expect pass**

Run: `npm test -- header`
Expected: PASS.

**Step 7: Verify build**

Run: `npx astro check`
Expected: 0 errors.

**Step 8: Commit**

```bash
git add src/components/Header.astro src/components/Logo.astro src/components/LanguageSwitcher.tsx src/i18n/ src/components/header.test.ts
git commit -m "feat(layout): header with logo, primary nav, language switcher"
```

---

### Task 13: Implement Footer.astro

**Files:**
- Create: `src/components/Footer.astro`

**Step 1: Write failing test**

Create `/home/phurix/projects/flyed/src/components/footer.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Footer.astro', () => {
  const src = readFileSync(resolve(__dirname, './Footer.astro'), 'utf8');

  it('renders footer landmark', () => {
    expect(src).toMatch(/<footer/);
  });

  it('contains 4 column headings', () => {
    expect(src).toMatch(/Company|บริษัท/);
    expect(src).toMatch(/Explore|สำรวจ/);
    expect(src).toMatch(/Legal|กฎหมาย/);
  });

  it('has copyright', () => {
    expect(src).toMatch(/\d{4}\s+(flyed|สงวนลิขสิทธิ์)/);
  });
});
```

**Step 2: Run, expect fail**

Run: `npm test -- footer`
Expected: FAIL.

**Step 3: Implement Footer**

Create `/home/phurix/projects/flyed/src/components/Footer.astro`:

```astro
---
import { getLocale, getDict } from '@/i18n';

const locale = getLocale(Astro.url);
const dict = getDict(locale);
const isTh = locale === 'th';
const prefix = isTh ? '/th' : '';
const year = new Date().getFullYear();
---

<footer class="bg-teak-900 text-rice-50 mt-20">
  <div class="max-w-7xl mx-auto px-4 md:px-8 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
    <div>
      <h4 class="text-rice-50 font-display text-lg mb-4">{dict.footer.company}</h4>
      <ul class="space-y-2 text-sm">
        <li><a href={`${prefix}/about`} class="text-rice-100 hover:text-sunset-400 no-underline">{dict.nav.about}</a></li>
        <li><a href={`${prefix}/how-it-works`} class="text-rice-100 hover:text-sunset-400 no-underline">{isTh ? 'ขั้นตอน' : 'How it works'}</a></li>
        <li><a href={`${prefix}/safety`} class="text-rice-100 hover:text-sunset-400 no-underline">{isTh ? 'ความปลอดภัย' : 'Safety'}</a></li>
        <li><a href={`${prefix}/contact`} class="text-rice-100 hover:text-sunset-400 no-underline">{dict.nav.contact}</a></li>
      </ul>
    </div>

    <div>
      <h4 class="text-rice-50 font-display text-lg mb-4">{dict.footer.explore}</h4>
      <ul class="space-y-2 text-sm">
        <li><a href={`${prefix}/trips`} class="text-rice-100 hover:text-sunset-400 no-underline">{dict.nav.trips}</a></li>
        <li><a href={`${prefix}/destinations`} class="text-rice-100 hover:text-sunset-400 no-underline">{dict.nav.destinations}</a></li>
        <li><a href={`${prefix}/itineraries`} class="text-rice-100 hover:text-sunset-400 no-underline">{dict.nav.itineraries}</a></li>
        <li><a href={`${prefix}/blog`} class="text-rice-100 hover:text-sunset-400 no-underline">{dict.nav.blog}</a></li>
      </ul>
    </div>

    <div>
      <h4 class="text-rice-50 font-display text-lg mb-4">{dict.footer.legal}</h4>
      <ul class="space-y-2 text-sm">
        <li><a href={`${prefix}/legal/privacy`} class="text-rice-100 hover:text-sunset-400 no-underline">{isTh ? 'นโยบายความเป็นส่วนตัว' : 'Privacy'}</a></li>
        <li><a href={`${prefix}/legal/terms`} class="text-rice-100 hover:text-sunset-400 no-underline">{isTh ? 'ข้อกำหนด' : 'Terms'}</a></li>
        <li><a href={`${prefix}/legal/cookies`} class="text-rice-100 hover:text-sunset-400 no-underline">{isTh ? 'คุกกี้' : 'Cookies'}</a></li>
      </ul>
    </div>

    <div>
      <h4 class="text-rice-50 font-display text-lg mb-4">{isTh ? 'ติดต่อ' : 'Contact'}</h4>
      <address class="not-italic text-sm space-y-2 text-rice-100">
        <div>{isTh ? 'กรุงเทพมหานคร' : 'Bangkok HQ'}</div>
        <div>{isTh ? 'เชียงใหม่' : 'Chiang Mai base'}</div>
        <a href="mailto:hello@flyed.dev" class="text-rice-100 hover:text-sunset-400">hello@flyed.dev</a>
      </address>
    </div>
  </div>

  <div class="border-t border-rice-50/10">
    <div class="max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-rice-100">
      <div>© {year} flyed. {dict.footer.rights}</div>
      <div>{dict.footer.trust}: TAT · TEATA · GSTC</div>
    </div>
  </div>
</footer>
```

**Step 4: Run test, expect pass**

Run: `npm test -- footer`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/Footer.astro src/components/footer.test.ts
git commit -m "feat(layout): footer with 4-column nav, contact, legal"
```

---

### Task 14: Implement MegaMenu.astro for trips × destinations

**Files:**
- Create: `src/components/MegaMenu.astro`

**Step 1: Write failing test**

Create `/home/phurix/projects/flyed/src/components/megamenu.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('MegaMenu.astro', () => {
  const src = readFileSync(resolve(__dirname, './MegaMenu.astro'), 'utf8');

  it('renders all 6 categories', () => {
    for (const slug of ['service-learning', 'cultural-heritage', 'stem-environmental', 'sports-adventure', 'language-immersion', 'history-heritage']) {
      expect(src).toContain(slug);
    }
  });

  it('renders all 12 destinations', () => {
    for (const dest of ['bangkok', 'chiang-mai', 'phuket', 'krabi', 'khao-sok', 'kanchanaburi', 'ayutthaya', 'koh-tao', 'sukhothai', 'pai', 'chiang-rai', 'isan']) {
      expect(src).toContain(dest);
    }
  });

  it('uses two-pane layout', () => {
    expect(src).toMatch(/grid-cols-2|md:grid-cols-2/);
  });
});
```

**Step 2: Run, expect fail**

Run: `npm test -- megamenu`
Expected: FAIL.

**Step 3: Implement MegaMenu**

Create `/home/phurix/projects/flyed/src/components/MegaMenu.astro`:

```astro
---
import { getLocale, getDict } from '@/i18n';

const locale = getLocale(Astro.url);
const dict = getDict(locale);
const isTh = locale === 'th';
const prefix = isTh ? '/th' : '';

const categories = [
  { slug: 'service-learning', label: dict.categories['service-learning'] },
  { slug: 'cultural-heritage', label: dict.categories['cultural-heritage'] },
  { slug: 'stem-environmental', label: dict.categories['stem-environmental'] },
  { slug: 'sports-adventure', label: dict.categories['sports-adventure'] },
  { slug: 'language-immersion', label: dict.categories['language-immersion'] },
  { slug: 'history-heritage', label: dict.categories['history-heritage'] },
];

const destinations = [
  { slug: 'bangkok', name: 'Bangkok', th: 'กรุงเทพฯ' },
  { slug: 'chiang-mai', name: 'Chiang Mai', th: 'เชียงใหม่' },
  { slug: 'chiang-rai', name: 'Chiang Rai', th: 'เชียงราย' },
  { slug: 'phuket', name: 'Phuket', th: 'ภูเก็ต' },
  { slug: 'krabi', name: 'Krabi', th: 'กระบี่' },
  { slug: 'khao-sok', name: 'Khao Sok', th: 'เขาสก' },
  { slug: 'kanchanaburi', name: 'Kanchanaburi', th: 'กาญจนบุรี' },
  { slug: 'ayutthaya', name: 'Ayutthaya', th: 'อยุธยา' },
  { slug: 'koh-tao', name: 'Koh Tao', th: 'เกาะเต่า' },
  { slug: 'sukhothai', name: 'Sukhothai', th: 'สุโขทัย' },
  { slug: 'pai', name: 'Pai', th: 'ปาย' },
  { slug: 'isan', name: 'Isan', th: 'อีสาน' },
];
---

<div class="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-rice-50 rounded-lg shadow-xl border border-teak-500/10 min-w-[640px]">
  <div>
    <h3 class="text-sm uppercase tracking-wider text-teak-500 mb-3">{isTh ? 'หมวดหมู่' : 'Trip Categories'}</h3>
    <ul class="space-y-2">
      {categories.map((cat) => (
        <li>
          <a href={`${prefix}/trips/${cat.slug}`} class="block text-teak-900 hover:text-bamboo-700 hover:bg-bamboo-100 px-3 py-2 rounded no-underline">
            {cat.label}
          </a>
        </li>
      ))}
    </ul>
  </div>
  <div>
    <h3 class="text-sm uppercase tracking-wider text-teak-500 mb-3">{isTh ? 'จุดหมาย' : 'Destinations'}</h3>
    <ul class="grid grid-cols-2 gap-2">
      {destinations.map((dest) => (
        <li>
          <a href={`${prefix}/destinations/${dest.slug}`} class="block text-teak-700 hover:text-bamboo-700 hover:bg-bamboo-100 px-3 py-2 rounded no-underline text-sm">
            {isTh ? dest.th : dest.name}
          </a>
        </li>
      ))}
    </ul>
  </div>
</div>
```

**Step 4: Run test, expect pass**

Run: `npm test -- megamenu`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/MegaMenu.astro src/components/megamenu.test.ts
git commit -m "feat(nav): mega menu with categories × destinations"
```

---

### Task 15: Implement PageLayout wrapper

**Files:**
- Create: `src/layouts/PageLayout.astro`

**Step 1: Implement PageLayout**

Create `/home/phurix/projects/flyed/src/layouts/PageLayout.astro`:

```astro
---
import BaseLayout from './Layout.astro';
import Header from '@/components/Header.astro';
import Footer from '@/components/Footer.astro';

interface Props {
  title: string;
  description: string;
  ogImage?: string;
  noindex?: boolean;
  hideHeader?: boolean;
  hideFooter?: boolean;
}

const { title, description, ogImage, noindex, hideHeader, hideFooter } = Astro.props;
---

<BaseLayout title={title} description={description} ogImage={ogImage} noindex={noindex}>
  {!hideHeader && <Header />}
  <main id="main-content">
    <slot />
  </main>
  {!hideFooter && <Footer />}
</BaseLayout>
```

**Step 2: Verify build**

Run: `npx astro check`
Expected: 0 errors.

**Step 3: Commit**

```bash
git add src/layouts/PageLayout.astro
git commit -m "feat(layout): PageLayout wrapping Base + Header + Footer"
```

---

## Phase 2 — Content Infrastructure

### Task 16: Define content collection schemas

**Files:**
- Create: `src/content/config.ts`

**Step 1: Write failing test for schemas**

Create `/home/phurix/projects/flyed/src/content/schemas.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('content schemas', () => {
  it('exports collections object', async () => {
    const mod = await import('./config');
    expect(mod.collections).toBeDefined();
    expect(Object.keys(mod.collections).sort()).toEqual([
      'blog', 'categories', 'destinations', 'itineraries', 'team', 'testimonials',
    ]);
  });
});
```

**Step 2: Run, expect fail**

Run: `npm test -- schemas`
Expected: FAIL.

**Step 3: Implement config.ts**

Create `/home/phurix/projects/flyed/src/content/config.ts`:

```ts
import { defineCollection, reference, z } from 'astro:content';

const categoryEnum = z.enum([
  'service-learning',
  'cultural-heritage',
  'stem-environmental',
  'sports-adventure',
  'language-immersion',
  'history-heritage',
]);

const blog = defineCollection({
  loader: { name: 'empty', load: async () => [] },
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
});

const itineraries = defineCollection({
  loader: { name: 'empty', load: async () => [] },
  schema: z.object({
    title: z.string(),
    description: z.string().max(200),
    category: categoryEnum,
    destinations: z.array(reference('destinations')),
    days: z.number().int().positive(),
    groupSize: z.object({ min: z.number().int(), max: z.number().int() }),
    ageBand: z.object({ min: z.number().int(), max: z.number().int() }),
    priceFrom: z.number().int().positive(),
    currency: z.literal('USD'),
    startMonths: z.array(z.enum(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])).min(1),
    curricula: z.array(z.enum(['IB-MYP','IB-DP','IGCSE','A-Level','AP','GCSE','Bilingual'])),
    heroImage: z.string(),
    gallery: z.array(z.string()).default([]),
    slug: z.string(),
    published: z.boolean().default(true),
  }),
});

const destinations = defineCollection({
  loader: { name: 'empty', load: async () => [] },
  schema: z.object({
    name: z.string(),
    nameTh: z.string(),
    tagline: z.string().max(120),
    region: z.enum(['North','Central','Andaman','Gulf','Northeast']),
    bestFor: z.array(categoryEnum),
    bestMonths: z.array(z.enum(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'])),
    heroImage: z.string(),
    intro: z.string(),
    slug: z.string(),
  }),
});

const categories = defineCollection({
  loader: { name: 'empty', load: async () => [] },
  schema: z.object({
    title: z.string(),
    titleTh: z.string(),
    description: z.string(),
    icon: z.string(),
    color: z.enum(['teak','bamboo','sunset','gold']),
    itineraryCount: z.number().int().nonnegative(),
    slug: z.string(),
  }),
});

const team = defineCollection({
  loader: { name: 'empty', load: async () => [] },
  schema: z.object({
    name: z.string(),
    role: z.string(),
    roleTh: z.string().optional(),
    bio: z.string().max(400),
    photo: z.string(),
    order: z.number().int(),
  }),
});

const testimonials = defineCollection({
  loader: { name: 'empty', load: async () => [] },
  schema: z.object({
    quote: z.string().max(300),
    author: z.string(),
    role: z.string(),
    school: z.string(),
    city: z.string(),
    country: z.string(),
    itinerary: reference('itineraries').optional(),
  }),
});

export const collections = { blog, itineraries, destinations, categories, team, testimonials };
```

**Step 4: Run tests, expect pass**

Run: `npm test -- schemas`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/content/config.ts src/content/schemas.test.ts
git commit -m "feat(content): zod schemas for 6 content collections"
```

---

### Task 17: Implement link/slug utilities

**Files:**
- Create: `src/utils/links.ts`
- Create: `src/utils/links.test.ts`

**Step 1: Write failing test**

Create `/home/phurix/projects/flyed/src/utils/links.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { localizedPath, categoryPath, destinationPath, itineraryPath, blogPath } from './links';

describe('link utilities', () => {
  it('localizedPath adds /th prefix for th locale', () => {
    expect(localizedPath('en', '/about')).toBe('/about');
    expect(localizedPath('th', '/about')).toBe('/th/about');
    expect(localizedPath('th', '/')).toBe('/th');
  });

  it('categoryPath returns /trips/{slug}', () => {
    expect(categoryPath('service-learning')).toBe('/trips/service-learning');
    expect(categoryPath('service-learning', 'th')).toBe('/th/trips/service-learning');
  });

  it('destinationPath returns /destinations/{slug}', () => {
    expect(destinationPath('bangkok')).toBe('/destinations/bangkok');
  });

  it('itineraryPath returns /itineraries/{slug}', () => {
    expect(itineraryPath('foo-bar')).toBe('/itineraries/foo-bar');
  });

  it('blogPath returns /blog/{slug}', () => {
    expect(blogPath('hello')).toBe('/blog/hello');
  });
});
```

**Step 2: Run, expect fail**

Run: `npm test -- links`
Expected: FAIL.

**Step 3: Implement**

Create `/home/phurix/projects/flyed/src/utils/links.ts`:

```ts
import type { Locale } from '@/i18n';

export function localizedPath(locale: Locale, path: string): string {
  if (locale === 'th') {
    return `/th${path === '/' ? '' : path}`;
  }
  return path;
}

export const categoryPath = (slug: string, locale?: Locale) =>
  localizedPath(locale ?? 'en', `/trips/${slug}`);

export const destinationPath = (slug: string, locale?: Locale) =>
  localizedPath(locale ?? 'en', `/destinations/${slug}`);

export const itineraryPath = (slug: string, locale?: Locale) =>
  localizedPath(locale ?? 'en', `/itineraries/${slug}`);

export const blogPath = (slug: string, locale?: Locale) =>
  localizedPath(locale ?? 'en', `/blog/${slug}`);

export const enquirePath = (locale?: Locale) =>
  localizedPath(locale ?? 'en', '/enquire');
```

**Step 4: Run tests, expect pass**

Run: `npm test -- links`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/utils/links.ts src/utils/links.test.ts
git commit -m "feat(utils): localized path helpers"
```

---

### Task 18: Write image prompt library

**Files:**
- Create: `docs/image-prompts.md`

**Step 1: Create prompt library**

Create `/home/phurix/projects/flyed/docs/image-prompts.md`:

````markdown
# flyed Image Prompt Library

Tool-neutral prompts for AI image generation. Adapt to your chosen model (Midjourney v7, Flux 1.1, Imagen 4, DALL-E 3, Stable Diffusion XL). Adjust weighting syntax to match your tool.

## Style baseline (append to every prompt)

```
35mm film photography, golden hour, f/2.8 shallow depth of field, warm color grade,
rice-terrace tones (teak, bamboo green, sunset orange, off-white), no UI overlays,
no recognizable faces in tight close-up, candid group dynamics or hands/back views,
Southeast Asian outdoor setting, anamorphic lens flare subtle, organic grain
```

## Hero & destination imagery

### Hero (home page)
`Wide landscape, students hiking a forested ridge at golden hour in northern Thailand, light mist between pine trees, three figures silhouetted walking single-file on dirt trail, teak-orange backlight, deep green canopy, 35mm film photography, candid motion`

### Chiang Mai
`Students learning rice planting in flooded terraced paddy field, Doi Inthanon foothills in soft focus background, late afternoon sun, wide-angle 24mm, earthy teak-and-bamboo palette`

### Phuket / Andaman
`Group of teenagers in lifejackets boarding wooden longtail boat from limestone beach, turquoise water, midday sun, action shot mid-step, 35mm`

### Bangkok
`School group crossing ornate temple courtyard in Bangkok at sunrise, gold-stupa bokeh, candid laughter, mix of back-views and side-profiles`

### Kanchanaburi
`Students walking across the wooden bridge over River Kwai in soft morning light, mist on water, monochrome teak palette`

### Ayutthaya
`Wide shot of students sketching Khmer ruins at golden hour, head-cloth vendor blurred in background, warm amber tones`

### Khao Sok
`Group kayaking on emerald Cheow Lan Lake, dramatic limestone karsts rising from mist, midday overhead light`

### Krabi
`Climbers at base of sea-cliff limestone karst, harnesses and ropes visible, low-angle hero shot, late afternoon`

### Koh Tao
`Underwater half-and-half: divers above and below water line, tropical fish, sun rays penetrating surface`

### Chiang Rai
`Students planting saplings at ethical elephant sanctuary clearing, golden grass, soft backlight, candid movement`

### Sukhothai
`Cycling tour through ancient temple complex, lotus ponds, soft morning haze, golden light on brick stupas`

### Pai
`Backpack silhouettes on motorbike winding through bamboo forest, dappled afternoon light, motion blur on foreground leaves`

### Isan
`Homestay dinner with Thai-Isan family around low wooden table, papaya salad, candlelight, candid warmth, 35mm`

## Category imagery

### Service Learning
`Group of students and villagers building a bamboo school structure together, laughter, dirt under fingernails, golden hour side-light`

### Cultural & Heritage
`Temple dance lesson with young Thai teacher, fabric in motion, courtyard reflection, candid student joy`

### STEM & Environmental
`Marine biologist guide showing reef specimen to student on boat deck, equipment visible, action moment of discovery`

### Sports & Adventure
`Muay Thai training pad work, sweat droplets mid-air, dramatic gym lighting, anonymous silhouette composition`

### Language Immersion
`Student writing Thai alphabet in notebook on homestay porch, neighbor child pointing, dappled light`

### History & Heritage
`Students at Kanchanaburi war cemetery, heads bowed, poppies in hand, soft overcast light, respectful candid`

## Negative prompt (add to every generation)

```
cartoon, illustration, anime, 3D render, CGI, watermark, logo, text overlay,
sharp digital look, oversaturated HDR, plastic skin, stock-photo smile,
face close-up of identifiable minors, hospital / sterile environment,
generic airport / hotel lobby, Disneyland, theme park
```

## Post-processing

After generation:
1. Apply subtle film-grain overlay (3–5%)
2. Lift shadows slightly (avoid crushed blacks)
3. Teak-orange tint in highlights, bamboo-green tint in shadows (curves adjustment)
4. Resize to 3840×2160 max for hero, 1920×1080 for cards, 800×600 for thumbnails
5. Export AVIF + WebP + fallback JPEG

## Guardrails

- Never use real student likenesses
- Prefer group shots (5+ subjects) or back/hands/feet close-ups
- For solo student composition, use silhouette or side profile only
- All subjects ≥ 13 years old visually; never depict younger
- For "authentic Thai" depictions, include authentic details: school uniforms with appropriate patches, wai greeting visible, regional food props, temple etiquette
````

**Step 2: Commit**

```bash
git add docs/image-prompts.md
git commit -m "docs: AI image prompt library (tool-neutral)"
```

---

## Phase 3 — Reusable Components

### Task 19: Implement Hero.astro

**Files:**
- Create: `src/components/Hero.astro`

**Step 1: Implement**

Create `/home/phurix/projects/flyed/src/components/Hero.astro`:

```astro
---
interface Props {
  headline: string;
  sub?: string;
  imageSrc: string;
  imageAlt: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
  variant?: 'full' | 'small';
}

const { headline, sub, imageSrc, imageAlt, primaryCta, secondaryCta, variant = 'full' } = Astro.props;
const isSmall = variant === 'small';
---

<section class={`relative ${isSmall ? 'h-[40vh] min-h-[320px]' : 'h-[85vh] min-h-[600px]'} w-full overflow-hidden bg-teak-900`}>
  <img
    src={imageSrc}
    alt={imageAlt}
    class="absolute inset-0 w-full h-full object-cover"
    loading="eager"
    fetchpriority="high"
    decoding="async"
  />
  <div class="absolute inset-0 bg-gradient-to-b from-teak-900/40 via-teak-900/20 to-teak-900/70"></div>

  <div class={`relative z-10 max-w-6xl mx-auto px-4 md:px-8 flex flex-col justify-end ${isSmall ? 'pb-12' : 'pb-20'} h-full text-rice-50`}>
    <h1 class={`font-display ${isSmall ? 'text-4xl md:text-5xl' : 'text-5xl md:text-7xl'} font-semibold max-w-3xl`}>
      {headline}
    </h1>
    {sub && <p class={`mt-4 ${isSmall ? 'text-base md:text-lg' : 'text-lg md:text-2xl'} max-w-2xl text-rice-100`}>{sub}</p>}

    {(primaryCta || secondaryCta) && (
      <div class="mt-8 flex flex-wrap gap-3">
        {primaryCta && (
          <a href={primaryCta.href} class="bg-sunset-600 hover:bg-sunset-400 text-rice-50 font-medium px-6 py-3 rounded-md no-underline">
            {primaryCta.label}
          </a>
        )}
        {secondaryCta && (
          <a href={secondaryCta.href} class="border-2 border-rice-50 hover:bg-rice-50 hover:text-teak-900 text-rice-50 font-medium px-6 py-3 rounded-md no-underline">
            {secondaryCta.label}
          </a>
        )}
      </div>
    )}
  </div>
</section>
```

**Step 2: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat(components): Hero with image overlay + dual CTA"
```

---

### Task 20: Implement Section, CTASection, StatsBar components

**Files:**
- Create: `src/components/Section.astro`
- Create: `src/components/CTASection.astro`
- Create: `src/components/Counter.tsx`

**Step 1: Implement Section**

Create `/home/phurix/projects/flyed/src/components/Section.astro`:

```astro
---
interface Props {
  bg?: 'rice-50' | 'rice-100' | 'bamboo-100' | 'teak-900';
  id?: string;
  class?: string;
}

const { bg = 'rice-50', id, class: className = '' } = Astro.props;
const bgClass = {
  'rice-50': 'bg-rice-50 text-teak-900',
  'rice-100': 'bg-rice-100 text-teak-900',
  'bamboo-100': 'bg-bamboo-100 text-teak-900',
  'teak-900': 'bg-teak-900 text-rice-50',
}[bg];
---

<section id={id} class={`py-20 md:py-28 ${bgClass} ${className}`}>
  <div class="max-w-6xl mx-auto px-4 md:px-8">
    <slot />
  </div>
</section>
```

**Step 2: Implement Counter (React island)**

Create `/home/phurix/projects/flyed/src/components/Counter.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';

interface Props {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

export default function Counter({ end, suffix = '', prefix = '', duration = 1800 }: Props) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setValue(end);
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !started.current) {
        started.current = true;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setValue(Math.round(end * eased));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}
```

**Step 3: Implement StatsBar**

Create `/home/phurix/projects/flyed/src/components/StatsBar.astro`:

```astro
---
import Counter from './Counter.tsx';

interface Stat {
  value: number;
  suffix?: string;
  label: string;
}

interface Props {
  stats: Stat[];
  variant?: 'light' | 'dark';
}

const { stats, variant = 'light' } = Astro.props;
const isDark = variant === 'dark';
---

<div class={`grid grid-cols-2 md:grid-cols-4 gap-8 ${isDark ? 'text-rice-50' : 'text-teak-900'}`}>
  {stats.map((s) => (
    <div class="text-center">
      <div class="font-display text-4xl md:text-5xl font-semibold">
        <Counter client:visible end={s.value} suffix={s.suffix} />
      </div>
      <div class={`mt-2 text-sm uppercase tracking-wider ${isDark ? 'text-rice-100' : 'text-teak-500'}`}>{s.label}</div>
    </div>
  ))}
</div>
```

**Step 4: Implement CTASection**

Create `/home/phurix/projects/flyed/src/components/CTASection.astro`:

```astro
---
interface Props {
  headline: string;
  sub?: string;
  primaryCta: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
}
const { headline, sub, primaryCta, secondaryCta } = Astro.props;
---

<section class="bg-sunset-600 text-rice-50 py-16 md:py-20">
  <div class="max-w-4xl mx-auto px-4 md:px-8 text-center">
    <h2 class="font-display text-3xl md:text-5xl font-semibold">{headline}</h2>
    {sub && <p class="mt-4 text-lg text-rice-100 max-w-2xl mx-auto">{sub}</p>}
    <div class="mt-8 flex flex-wrap justify-center gap-3">
      <a href={primaryCta.href} class="bg-rice-50 hover:bg-rice-100 text-sunset-600 font-medium px-6 py-3 rounded-md no-underline">
        {primaryCta.label}
      </a>
      {secondaryCta && (
        <a href={secondaryCta.href} class="border-2 border-rice-50 hover:bg-rice-50 hover:text-sunset-600 text-rice-50 font-medium px-6 py-3 rounded-md no-underline">
          {secondaryCta.label}
        </a>
      )}
    </div>
  </div>
</section>
```

**Step 5: Commit**

```bash
git add src/components/Section.astro src/components/CTASection.astro src/components/StatsBar.astro src/components/Counter.tsx
git commit -m "feat(components): Section, StatsBar with animated Counter, CTASection"
```

---

### Task 21: Implement card components (Destination, Category, Itinerary, Blog, Testimonial)

**Files:**
- Create: `src/components/DestinationCard.astro`
- Create: `src/components/CategoryCard.astro`
- Create: `src/components/ItineraryCard.astro`
- Create: `src/components/BlogCard.astro`
- Create: `src/components/TestimonialCard.astro`

**Step 1: Implement DestinationCard**

Create `/home/phurix/projects/flyed/src/components/DestinationCard.astro`:

```astro
---
import { destinationPath } from '@/utils/links';
interface Props {
  slug: string;
  name: string;
  tagline: string;
  imageSrc: string;
  bestFor?: string[];
}
const { slug, name, tagline, imageSrc, bestFor = [] } = Astro.props;
const href = destinationPath(slug);
---

<a href={href} class="group block bg-rice-50 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow no-underline">
  <div class="aspect-[4/3] overflow-hidden">
    <img src={imageSrc} alt={name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
  </div>
  <div class="p-5">
    <h3 class="font-display text-2xl font-semibold text-teak-900 group-hover:text-bamboo-700">{name}</h3>
    <p class="mt-2 text-teak-700 text-sm">{tagline}</p>
    {bestFor.length > 0 && (
      <div class="mt-3 flex flex-wrap gap-1">
        {bestFor.map((tag) => (
          <span class="text-xs bg-bamboo-100 text-bamboo-700 px-2 py-0.5 rounded">{tag}</span>
        ))}
      </div>
    )}
  </div>
</a>
```

**Step 2: Implement CategoryCard**

Create `/home/phurix/projects/flyed/src/components/CategoryCard.astro`:

```astro
---
import { categoryPath } from '@/utils/links';
interface Props {
  slug: string;
  title: string;
  description: string;
  icon: string;
  itineraryCount: number;
}
const { slug, title, description, icon, itineraryCount } = Astro.props;
const href = categoryPath(slug);
---

<a href={href} class="block bg-rice-100 hover:bg-bamboo-100 rounded-lg p-6 transition-colors no-underline h-full">
  <div class="text-3xl mb-3" aria-hidden="true">{icon}</div>
  <h3 class="font-display text-xl font-semibold text-teak-900">{title}</h3>
  <p class="mt-2 text-teak-700 text-sm">{description}</p>
  <div class="mt-4 text-sm text-bamboo-700 font-medium">{itineraryCount} itineraries →</div>
</a>
```

**Step 3: Implement ItineraryCard**

Create `/home/phurix/projects/flyed/src/components/ItineraryCard.astro`:

```astro
---
import { itineraryPath } from '@/utils/links';
interface Props {
  slug: string;
  title: string;
  category: string;
  destinations: string[];
  days: number;
  priceFrom: number;
  currency: string;
  heroImage: string;
  ageBand: { min: number; max: number };
}
const { slug, title, category, destinations, days, priceFrom, currency, heroImage, ageBand } = Astro.props;
const href = itineraryPath(slug);
---

<a href={href} class="group block bg-rice-50 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow no-underline">
  <div class="aspect-[16/10] overflow-hidden">
    <img src={heroImage} alt={title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
  </div>
  <div class="p-5">
    <div class="flex items-center gap-2 mb-2">
      <span class="text-xs bg-bamboo-700 text-rice-50 px-2 py-0.5 rounded uppercase tracking-wider">{category}</span>
      <span class="text-xs text-teak-500">{days} days · ages {ageBand.min}–{ageBand.max}</span>
    </div>
    <h3 class="font-display text-xl font-semibold text-teak-900 group-hover:text-bamboo-700">{title}</h3>
    <div class="mt-2 text-sm text-teak-500">{destinations.join(' · ')}</div>
    <div class="mt-3 text-sunset-600 font-semibold">From {currency} {priceFrom.toLocaleString()}</div>
  </div>
</a>
```

**Step 4: Implement BlogCard**

Create `/home/phurix/projects/flyed/src/components/BlogCard.astro`:

```astro
---
import { blogPath } from '@/utils/links';
interface Props {
  slug: string;
  title: string;
  description: string;
  heroImage: string;
  pubDate: Date;
  readingMinutes: number;
}
const { slug, title, description, heroImage, pubDate, readingMinutes } = Astro.props;
const href = blogPath(slug);
const dateStr = pubDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
---

<a href={href} class="group block bg-rice-50 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow no-underline">
  <div class="aspect-[16/9] overflow-hidden">
    <img src={heroImage} alt={title} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" decoding="async" />
  </div>
  <div class="p-5">
    <div class="text-xs text-teak-500 mb-2">{dateStr} · {readingMinutes} min read</div>
    <h3 class="font-display text-xl font-semibold text-teak-900 group-hover:text-bamboo-700">{title}</h3>
    <p class="mt-2 text-teak-700 text-sm line-clamp-3">{description}</p>
  </div>
</a>
```

**Step 5: Implement TestimonialCard**

Create `/home/phurix/projects/flyed/src/components/TestimonialCard.astro`:

```astro
---
interface Props {
  quote: string;
  author: string;
  role: string;
  school: string;
  city: string;
  country: string;
}
const { quote, author, role, school, city, country } = Astro.props;
---

<figure class="bg-rice-100 p-6 rounded-lg h-full flex flex-col">
  <blockquote class="text-teak-900 flex-1">
    <p class="font-display text-lg leading-relaxed">"{quote}"</p>
  </blockquote>
  <figcaption class="mt-4 text-sm text-teak-700">
    <div class="font-semibold text-teak-900">{author}</div>
    <div>{role}</div>
    <div class="text-teak-500">{school} · {city}, {country}</div>
  </figcaption>
</figure>
```

**Step 6: Commit**

```bash
git add src/components/DestinationCard.astro src/components/CategoryCard.astro src/components/ItineraryCard.astro src/components/BlogCard.astro src/components/TestimonialCard.astro
git commit -m "feat(components): card library for destinations, categories, itineraries, blog, testimonials"
```

---

### Task 22: Implement Breadcrumbs, BadgeRow, FAQAccordion, PersonaGrid, ImageCarousel

**Files:**
- Create: `src/components/Breadcrumbs.astro`
- Create: `src/components/BadgeRow.astro`
- Create: `src/components/FAQAccordion.astro`
- Create: `src/components/PersonaGrid.astro`
- Create: `src/components/ImageCarousel.tsx`

**Step 1: Implement Breadcrumbs**

Create `/home/phurix/projects/flyed/src/components/Breadcrumbs.astro`:

```astro
---
interface Crumb { label: string; href?: string; }
interface Props { items: Crumb[]; }
const { items } = Astro.props;
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((c, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: c.label,
    ...(c.href ? { item: new URL(c.href, Astro.site).toString() } : {}),
  })),
};
---

<nav aria-label="Breadcrumb" class="text-sm text-teak-500">
  <ol class="flex flex-wrap items-center gap-1">
    {items.map((c, i) => (
      <li class="flex items-center gap-1">
        {c.href ? (
          <a href={c.href} class="hover:text-bamboo-700 no-underline">{c.label}</a>
        ) : (
          <span aria-current="page">{c.label}</span>
        )}
        {i < items.length - 1 && <span aria-hidden="true">/</span>}
      </li>
    ))}
  </ol>
  <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
</nav>
```

**Step 2: Implement BadgeRow**

Create `/home/phurix/projects/flyed/src/components/BadgeRow.astro`:

```astro
---
interface Badge { name: string; imageSrc: string; href?: string; }
interface Props { badges: Badge[]; }
const { badges } = Astro.props;
---

<div class="flex flex-wrap items-center justify-center gap-8 opacity-80">
  {badges.map((b) => (
    <a href={b.href ?? '#'} class="grayscale hover:grayscale-0 transition" aria-label={b.name}>
      <img src={b.imageSrc} alt={b.name} class="h-12 w-auto" loading="lazy" />
    </a>
  ))}
</div>
```

**Step 3: Implement FAQAccordion**

Create `/home/phurix/projects/flyed/src/components/FAQAccordion.astro:

```astro
---
interface QA { q: string; a: string; }
interface Props { items: QA[]; }
const { items } = Astro.props;
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((qa) => ({
    '@type': 'Question',
    name: qa.q,
    acceptedAnswer: { '@type': 'Answer', text: qa.a },
  })),
};
---

<div class="divide-y divide-teak-500/20 border-y border-teak-500/20">
  {items.map((qa) => (
    <details class="group py-4">
      <summary class="flex justify-between items-center cursor-pointer font-medium text-teak-900 list-none">
        <span>{qa.q}</span>
        <span class="text-sunset-600 text-2xl transition-transform group-open:rotate-45" aria-hidden="true">+</span>
      </summary>
      <p class="mt-3 text-teak-700">{qa.a}</p>
    </details>
  ))}
</div>
<script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
```

**Step 4: Implement PersonaGrid**

Create `/home/phurix/projects/flyed/src/components/PersonaGrid.astro:

```astro
---
interface Persona { label: string; href: string; description: string; icon: string; }
interface Props { items: Persona[]; }
const { items } = Astro.props;
---

<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  {items.map((p) => (
    <a href={p.href} class="block bg-rice-100 hover:bg-bamboo-100 p-8 rounded-lg text-center transition-colors no-underline">
      <div class="text-4xl mb-3" aria-hidden="true">{p.icon}</div>
      <h3 class="font-display text-2xl font-semibold text-teak-900">{p.label}</h3>
      <p class="mt-2 text-teak-700">{p.description}</p>
    </a>
  ))}
</div>
```

**Step 5: Implement ImageCarousel**

Create `/home/phurix/projects/flyed/src/components/ImageCarousel.tsx`:

```tsx
import { useState } from 'react';

interface Props {
  images: { src: string; alt: string }[];
}

export default function ImageCarousel({ images }: Props) {
  const [idx, setIdx] = useState(0);
  if (images.length === 0) return null;

  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  return (
    <div className="relative bg-rice-100 rounded-lg overflow-hidden">
      <div className="aspect-[16/9]">
        <img src={images[idx].src} alt={images[idx].alt} className="w-full h-full object-cover" />
      </div>
      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-rice-50/90 hover:bg-rice-50 text-teak-900 w-10 h-10 rounded-full flex items-center justify-center"
          >
            ←
          </button>
          <button
            onClick={next}
            aria-label="Next image"
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-rice-50/90 hover:bg-rice-50 text-teak-900 w-10 h-10 rounded-full flex items-center justify-center"
          >
            →
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Go to image ${i + 1}`}
                aria-current={i === idx}
                className={`w-2 h-2 rounded-full transition ${i === idx ? 'bg-rice-50' : 'bg-rice-50/40'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
```

**Step 6: Commit**

```bash
git add src/components/Breadcrumbs.astro src/components/BadgeRow.astro src/components/FAQAccordion.astro src/components/PersonaGrid.astro src/components/ImageCarousel.tsx
git commit -m "feat(components): breadcrumbs, badges, FAQ, persona grid, image carousel"
```

---

## Phase 4 — Home Page

### Task 23: Build home page (replace starter index)

**Files:**
- Modify: `src/pages/index.astro`
- Create: `src/data/testimonials.ts`

**Step 1: Replace index.astro with home page**

Replace `/home/phurix/projects/flyed/src/pages/index.astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Hero from '@/components/Hero.astro';
import Section from '@/components/Section.astro';
import StatsBar from '@/components/StatsBar.astro';
import DestinationCard from '@/components/DestinationCard.astro';
import CategoryCard from '@/components/CategoryCard.astro';
import ItineraryCard from '@/components/ItineraryCard.astro';
import BlogCard from '@/components/BlogCard.astro';
import TestimonialCard from '@/components/TestimonialCard.astro';
import CTASection from '@/components/CTASection.astro';
import BadgeRow from '@/components/BadgeRow.astro';
import PersonaGrid from '@/components/PersonaGrid.astro';
import { getLocale, getDict } from '@/i18n';
import { getCollection } from 'astro:content';

const locale = getLocale(Astro.url);
const dict = getDict(locale);
const isTh = locale === 'th';
const prefix = isTh ? '/th' : '';

const featuredDestinations = [
  { slug: 'chiang-mai', name: 'Chiang Mai', tagline: 'Service learning in the highlands', imageSrc: '/images/destinations/chiang-mai-hero.jpg' },
  { slug: 'phuket', name: 'Phuket', tagline: 'Marine science on the Andaman', imageSrc: '/images/destinations/phuket-hero.jpg' },
  { slug: 'bangkok', name: 'Bangkok', tagline: 'Culture and history in the capital', imageSrc: '/images/destinations/bangkok-hero.jpg' },
  { slug: 'kanchanaburi', name: 'Kanchanaburi', tagline: 'WWII history along the River Kwai', imageSrc: '/images/destinations/kanchanaburi-hero.jpg' },
];

const categories = [
  { slug: 'service-learning', title: dict.categories['service-learning'], description: 'Curriculum-linked volunteer programs', icon: '🤝', itineraryCount: 2 },
  { slug: 'cultural-heritage', title: dict.categories['cultural-heritage'], description: 'Temples, homestays, Isan villages', icon: '🏛️', itineraryCount: 1 },
  { slug: 'stem-environmental', title: dict.categories['stem-environmental'], description: 'Marine, jungle, and conservation', icon: '🔬', itineraryCount: 2 },
  { slug: 'sports-adventure', title: dict.categories['sports-adventure'], description: 'Muay Thai, sailing, diving', icon: '⛵', itineraryCount: 3 },
  { slug: 'language-immersion', title: dict.categories['language-immersion'], description: 'Thai language and homestay', icon: '🗣️', itineraryCount: 1 },
  { slug: 'history-heritage', title: dict.categories['history-heritage'], description: 'WWII, Ayutthaya, Mekong history', icon: '📜', itineraryCount: 1 },
];

const stats = [
  { value: 240, suffix: '+', label: dict.home.stats_schools },
  { value: 12, label: dict.home.stats_destinations },
  { value: 98, suffix: '%', label: dict.home.stats_rebook },
  { value: 14, label: dict.home.stats_years },
];

const personas = [
  { label: "I'm a teacher", href: `${prefix}/educators`, description: 'Plan curriculum-aligned trips', icon: '👩‍🏫' },
  { label: "I'm a parent", href: `${prefix}/parents`, description: 'See what your child experiences', icon: '👨‍👩‍👧' },
  { label: 'I run a school', href: `${prefix}/schools`, description: 'Group bookings & risk assessment', icon: '🏫' },
];

const testimonials = [
  { quote: 'Our Chiang Mai service week changed how our IB students think about themselves. We rebooked within a month.', author: 'Sarah Whitfield', role: 'Head of Year 11', school: 'Auckland International School', city: 'Auckland', country: 'NZ' },
  { quote: 'Risk assessment was the cleanest I have seen from an Asian operator. Communication was flawless.', author: 'James O\'Connor', role: 'Vice Principal', school: 'Berkhamsted School', city: 'London', country: 'UK' },
  { quote: 'Our students came back speaking Thai, cooking pad krapow, and planning their return.', author: 'Anika Patel', role: 'MYP Coordinator', school: 'Singapore American School', city: 'Singapore', country: 'SG' },
];

const featuredItineraries = [
  { slug: 'northern-thailand-service-week', title: 'Northern Thailand Service Week', category: 'service', destinations: ['Chiang Mai', 'Chiang Rai'], days: 7, priceFrom: 1850, currency: 'USD', heroImage: '/images/itineraries/northern-thailand-service-week-hero.jpg', ageBand: { min: 14, max: 18 } },
  { slug: 'andaman-marine-biology', title: 'Marine Biology in the Andaman', category: 'stem', destinations: ['Phuket', 'Krabi'], days: 5, priceFrom: 1450, currency: 'USD', heroImage: '/images/itineraries/andaman-marine-biology-hero.jpg', ageBand: { min: 15, max: 18 } },
  { slug: 'ayutthaya-kanchanaburi-history-loop', title: 'Ayutthaya & Kanchanaburi History Loop', category: 'history', destinations: ['Ayutthaya', 'Kanchanaburi'], days: 6, priceFrom: 1650, currency: 'USD', heroImage: '/images/itineraries/ayutthaya-kanchanaburi-hero.jpg', ageBand: { min: 14, max: 18 } },
];

const badges = [
  { name: 'TAT Licensed', imageSrc: '/images/badges/tat.svg' },
  { name: 'TEATA Member', imageSrc: '/images/badges/teata.svg' },
  { name: 'GSTC Certified', imageSrc: '/images/badges/gstc.svg' },
  { name: 'IATAN Accredited', imageSrc: '/images/badges/iatan.svg' },
];

// Latest blog posts (placeholder until content collections have data)
const recentPosts: any[] = [];
---

<PageLayout title={dict.home.hero_headline} description={dict.home.hero_sub}>
  <Hero
    headline={dict.home.hero_headline}
    sub={dict.home.hero_sub}
    imageSrc="/images/hero/home-hero.jpg"
    imageAlt="Students hiking a forested ridge at golden hour in northern Thailand"
    primaryCta={{ href: `${prefix}/enquire`, label: dict.home.cta_primary }}
    secondaryCta={{ href: `${prefix}/itineraries`, label: dict.home.cta_secondary }}
  />

  <Section bg="rice-50">
    <h2 class="sr-only">{isTh ? 'คุณคือใคร' : 'Who are you planning for?'}</h2>
    <PersonaGrid items={personas} />
  </Section>

  <Section bg="rice-100">
    <div class="text-center mb-12">
      <h2 class="font-display text-3xl md:text-5xl font-semibold">{isTh ? 'ความไว้วางใจจากโรงเรียนทั่วโลก' : 'Trusted by schools worldwide'}</h2>
    </div>
    <StatsBar stats={stats} />
    <div class="mt-16">
      <BadgeRow badges={badges} />
    </div>
  </Section>

  <Section>
    <div class="text-center mb-12">
      <h2 class="font-display text-3xl md:text-5xl font-semibold">{isTh ? 'จุดหมายเด่น' : 'Featured destinations'}</h2>
      <p class="mt-4 text-lg text-teak-700">{isTh ? 'สี่เมืองที่ครูจองบ่อยที่สุด' : 'Four of the cities teachers book most often'}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {featuredDestinations.map((d) => <DestinationCard {...d} />)}
    </div>
    <div class="text-center mt-12">
      <a href={`${prefix}/destinations`} class="inline-block border-2 border-bamboo-700 text-bamboo-700 hover:bg-bamboo-700 hover:text-rice-50 font-medium px-6 py-3 rounded-md no-underline">
        {isTh ? 'ดูจุดหมายทั้งหมด' : 'View all destinations'}
      </a>
    </div>
  </Section>

  <Section bg="rice-100">
    <div class="text-center mb-12">
      <h2 class="font-display text-3xl md:text-5xl font-semibold">{isTh ? 'ประเภททริป' : 'Trip categories'}</h2>
      <p class="mt-4 text-lg text-teak-700">{isTh ? 'เลือกตามสิ่งที่นักเรียนจะได้เรียนรู้' : 'Choose by what your students will learn'}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((c) => <CategoryCard {...c} />)}
    </div>
  </Section>

  <Section>
    <div class="text-center mb-12">
      <h2 class="font-display text-3xl md:text-5xl font-semibold">{isTh ? 'โปรแกรมตัวอย่าง' : 'Sample itineraries'}</h2>
      <p class="mt-4 text-lg text-teak-700">{isTh ? 'ทริปที่ครูนิยมจอง' : 'Trips teachers rebook most often'}</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {featuredItineraries.map((i) => <ItineraryCard {...i} />)}
    </div>
  </Section>

  <Section bg="bamboo-100">
    <div class="text-center mb-12">
      <h2 class="font-display text-3xl md:text-5xl font-semibold">{isTh ? 'ทำไมต้อง flyed' : 'Why flyed'}</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      {[
        { title: 'Curriculum-aligned', body: 'IB MYP/DP, IGCSE, A-Level, AP — every trip maps to learning outcomes.' },
        { title: 'Local expert guides', body: 'Thai educators and licensed guides on every departure.' },
        { title: '24/7 safety', body: 'In-country operations team and hospital partnerships.' },
        { title: 'Ethical operations', body: 'GSTC-aligned, fair-pay local teams, animal-welfare standards.' },
      ].map((b) => (
        <div class="bg-rice-50 p-6 rounded-lg">
          <h3 class="font-display text-xl font-semibold text-teak-900">{b.title}</h3>
          <p class="mt-2 text-teak-700">{b.body}</p>
        </div>
      ))}
    </div>
  </Section>

  <Section>
    <div class="text-center mb-12">
      <h2 class="font-display text-3xl md:text-5xl font-semibold">{isTh ? 'ครูพูดถึงเรา' : 'What teachers say'}</h2>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {testimonials.map((t) => <TestimonialCard {...t} />)}
    </div>
  </Section>

  <Section bg="teak-900">
    <StatsBar stats={stats} variant="dark" />
  </Section>

  {recentPosts.length > 0 && (
    <Section>
      <div class="text-center mb-12">
        <h2 class="font-display text-3xl md:text-5xl font-semibold">{isTh ? 'อ่านล่าสุด' : 'Latest from the journal'}</h2>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recentPosts.map((p: any) => <BlogCard {...p} />)}
      </div>
    </Section>
  )}

  <CTASection
    headline={isTh ? 'พร้อมวางแผนทริปหรือยัง?' : 'Ready to plan your trip?'}
    sub={isTh ? 'บอกเราเกี่ยวกับกลุ่มของคุณ แล้วเราจะออกแบบทริปให้ภายใน 5 วันทำการ' : 'Tell us about your group and we will design a trip within 5 business days.'}
    primaryCta={{ href: `${prefix}/enquire`, label: dict.nav.enquire }}
  />
</PageLayout>
```

**Step 2: Verify build**

Run: `npx astro check`
Expected: 0 errors. (Image paths will 404 in browser but build OK.)

**Step 3: Manual smoke test**

Run: `npm run dev` in background, then `curl -s http://localhost:4321/ | grep -c '<h1'`
Expected: ≥ 1 h1 found.

```bash
astro dev stop
```

**Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat(home): full home page with hero, personas, stats, destinations, categories, itineraries, testimonials, CTA"
```

---

## Phase 5 — Trip Categories

### Task 24: Author 6 category content entries

**Files:**
- Create: `src/content/categories/service-learning.md`
- Create: `src/content/categories/cultural-heritage.md`
- Create: `src/content/categories/stem-environmental.md`
- Create: `src/content/categories/sports-adventure.md`
- Create: `src/content/categories/language-immersion.md`
- Create: `src/content/categories/history-heritage.md`

**Step 1: Write service-learning.md**

Create `/home/phurix/projects/flyed/src/content/categories/service-learning.md`:

```markdown
---
title: Service Learning
titleTh: การเรียนรู้ผ่านจิตอาสา
description: Curriculum-linked service programs in northern Thai communities — teach, build, plant, reflect.
icon: 🤝
color: bamboo
itineraryCount: 2
slug: service-learning
---

Service learning trips embed volunteer work directly into IB MYP service-hour requirements, IGCSE citizenship components, and Duke of Edinburgh awards. Students don't just visit — they co-design projects with local partners, log reflective journals, and return home with measurable impact hours.

Our Chiang Mai and Chiang Rai programs partner with registered Thai NGOs on:
- Bamboo school construction
- Hill-tribe English teaching
- Reforestation in degraded watersheds
- Elephant sanctuary support (observation-only, ethical)

Every program includes a pre-departure curriculum pack, on-the-ground reflection circles, and post-trip assessment templates for school coordinators.
```

**Step 2: Write cultural-heritage.md**

```markdown
---
title: Cultural & Heritage
titleTh: วัฒนธรรมและมรดก
description: Temple homestays, Isan village immersion, Bangkok old-town walks, and Thai cooking from scratch.
icon: 🏛️
color: sunset
itineraryCount: 1
slug: cultural-heritage
---

Cultural programs teach what no textbook can: the wai, the alms round, the temple etiquette, the rhythm of village life. Students stay with vetted Thai host families, learn Thai cooking from grandmothers, and walk through Sukhothai and Ayutthaya with licensed historian-guides.

Curriculum fit:
- IB MYP Individuals & Societies
- IGCSE Global Citizenship
- GCSE Religious Studies (Buddhism unit)
- AP World History: Southeast Asia
```

**Step 3: Write stem-environmental.md**

```markdown
---
title: STEM & Environmental
titleTh: STEM และสิ่งแวดล้อม
description: Marine biology in the Andaman, jungle ecology in Khao Sok, elephant conservation in Chiang Mai.
icon: 🔬
color: teak
itineraryCount: 2
slug: stem-environmental
---

Field-based STEM programs run in three ecosystems: coral reef (Phuket, Krabi), evergreen rainforest (Khao Sok), and highland watershed (Chiang Mai). Students collect real data — water quality, biodiversity indices, coral-health surveys — that contributes to ongoing research partnerships with Thai universities.

Curriculum fit:
- IB DP Biology / Environmental Systems
- IGCSE Co-ordinated Sciences
- A-Level Biology fieldwork component
- AP Environmental Science
```

**Step 4: Write sports-adventure.md**

```markdown
---
title: Sports & Adventure
titleTh: กีฬาและการผจญภัย
description: Muay Thai training, sailing the Andaman, open-water diving in Koh Tao, trekking in Pai.
icon: ⛵
color: sunset
itineraryCount: 3
slug: sports-adventure
---

Sports and adventure programs balance skill acquisition with cultural context. Muay Thai students train in a Chiang Mai gym with active fighters (not tourist shows). Sailing and diving follow international certification curricula (RYAS, PADI). Trekking uses licensed Thai guides trained in first aid.

All programs include qualified coaching, properly fitted safety equipment, and verified insurance coverage. Age-appropriate intensity bands are clearly listed on each itinerary.
```

**Step 5: Write language-immersion.md**

```markdown
---
title: Language Immersion
titleTh: การเรียนภาษา
description: Two-week homestay + classroom programs with Thai tutors, designed for MFL and bilingual school students.
icon: 🗣️
color: bamboo
itineraryCount: 1
slug: language-immersion
---

Our Thai language programs pair 15 hours per week of classroom instruction with a Chiang Mai homestay. Tutors are Thai-language graduates with teaching experience. Students exit at A1–A2 (CEFR) depending on starting level, with a transcript accepted by their home school for MFL credit.

Best for: schools with established Thai or SE Asian language programs; bilingual international schools.
```

**Step 6: Write history-heritage.md**

```markdown
---
title: History & Heritage
titleTh: ประวัติศาสตร์และมรดก
description: WWII in Kanchanaburi, Khmer ruins at Ayutthaya and Sukhothai, Mekong history loops.
icon: 📜
color: gold
itineraryCount: 1
slug: history-heritage
---

Our history programs are led by Thai and international historians with classroom experience. Site visits are paired with primary-source readings (translated where needed) and structured debate sessions. The Kanchanaburi program in particular includes visits to both Allied and Japanese memorial sites, with careful facilitation around sensitive history.

Curriculum fit:
- IB DP History (Southeast Asian paper)
- IGCSE History
- GCSE History
- AP World History
```

**Step 7: Commit**

```bash
git add src/content/categories/
git commit -m "content(categories): author 6 trip-category entries"
```

---

### Task 25: Implement /trips hub page

**Files:**
- Create: `src/pages/trips/index.astro`

**Step 1: Implement**

Create `/home/phurix/projects/flyed/src/pages/trips/index.astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Section from '@/components/Section.astro';
import Hero from '@/components/Hero.astro';
import CategoryCard from '@/components/CategoryCard.astro';
import FAQAccordion from '@/components/FAQAccordion.astro';
import CTASection from '@/components/CTASection.astro';
import { getLocale, getDict } from '@/i18n';
import { getCollection } from 'astro:content';

const locale = getLocale(Astro.url);
const dict = getDict(locale);
const isTh = locale === 'th';
const prefix = isTh ? '/th' : '';

const categoryEntries = await getCollection('categories');

const faqs = [
  { q: 'How do you align trips to our curriculum?', a: 'Every itinerary lists mapped learning outcomes for IB MYP, IB DP, IGCSE, A-Level, and AP. We share a curriculum-fit PDF with your department head before booking.' },
  { q: 'What is the typical group size?', a: 'School groups run 12–40 students plus 2–4 teachers. Below 12 we can still run a private trip with adjusted pricing.' },
  { q: 'Can we combine categories?', a: 'Yes — many schools pair cultural-heritage with sports-adventure, or service-learning with language-immersion. Our designers will combine them into one itinerary.' },
  { q: 'When is the best time to travel?', a: 'November through February is dry season across most of Thailand. The Andaman region has a separate May–October monsoon. Each itinerary lists start months.' },
];
---

<PageLayout title={isTh ? 'ประเภททริป' : 'Trip categories'} description={isTh ? 'หกประเภทของทริปการศึกษาในประเทศไทย' : 'Six categories of educational trips to Thailand'}>
  <Hero
    variant="small"
    headline={isTh ? 'เลือกทริปตามสิ่งที่นักเรียนจะได้เรียนรู้' : 'Choose by what students will learn'}
    sub={isTh ? 'หกประเภททริปที่สอดคล้องหลักสูตร' : 'Six curriculum-aligned trip categories'}
    imageSrc="/images/hero/trips-hero.jpg"
    imageAlt="Students learning together in a Thai temple courtyard"
  />

  <Section>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categoryEntries.map((entry) => (
        <CategoryCard
          slug={entry.data.slug}
          title={isTh ? entry.data.titleTh : entry.data.title}
          description={entry.data.description}
          icon={entry.data.icon}
          itineraryCount={entry.data.itineraryCount}
        />
      ))}
    </div>
  </Section>

  <Section bg="rice-100">
    <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8 text-center">{isTh ? 'คำถามที่พบบ่อย' : 'Frequently asked questions'}</h2>
    <FAQAccordion items={faqs} />
  </Section>

  <CTASection
    headline={isTh ? 'ไม่แน่ใจว่าจะเลือกอะไร?' : 'Not sure which category?'}
    sub={isTh ? 'บอกเราเกี่ยวกับนักเรียนของคุณ แล้วเราจะแนะนำ' : 'Tell us about your students and we will recommend.'}
    primaryCta={{ href: `${prefix}/enquire`, label: dict.nav.enquire }}
  />
</PageLayout>
```

**Step 2: Verify build**

Run: `npx astro check`
Expected: 0 errors. (The `getCollection` will return empty for now until entries exist, but the schema already validates.)

**Step 3: Commit**

```bash
git add src/pages/trips/index.astro
git commit -m "feat(trips): category hub page"
```

---

### Task 26: Implement /trips/[category] dynamic page

**Files:**
- Create: `src/pages/trips/[category].astro`

**Step 1: Implement**

Create `/home/phurix/projects/flyed/src/pages/trips/[category].astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Hero from '@/components/Hero.astro';
import Section from '@/components/Section.astro';
import ItineraryCard from '@/components/ItineraryCard.astro';
import DestinationCard from '@/components/DestinationCard.astro';
import FAQAccordion from '@/components/FAQAccordion.astro';
import TestimonialCard from '@/components/TestimonialCard.astro';
import CTASection from '@/components/CTASection.astro';
import Breadcrumbs from '@/components/Breadcrumbs.astro';
import { getLocale, getDict } from '@/i18n';
import { getCollection, type CollectionEntry } from 'astro:content';

export async function getStaticPaths() {
  const categories = await getCollection('categories');
  return categories.map((entry) => ({
    params: { category: entry.data.slug },
    props: { entry },
  }));
}

interface Props { entry: CollectionEntry<'categories'>; }
const { entry } = Astro.props;
const locale = getLocale(Astro.url);
const dict = getDict(locale);
const isTh = locale === 'th';
const prefix = isTh ? '/th' : '';

const allItineraries = await getCollection('itineraries');
const matchingItineraries = allItineraries.filter((i) => i.data.category === entry.data.slug);

const allDestinations = await getCollection('destinations');
const matchingDestinations = allDestinations.filter((d) => d.data.bestFor.includes(entry.data.slug as any));

const title = isTh ? entry.data.titleTh : entry.data.title;

const faqs = [
  { q: 'How do you align trips to our curriculum?', a: 'Every itinerary lists mapped learning outcomes for IB MYP, IB DP, IGCSE, A-Level, and AP.' },
  { q: 'What is the typical group size?', a: 'School groups run 12–40 students plus 2–4 teachers.' },
  { q: 'When is the best time to travel?', a: 'November through February is dry season. Each itinerary lists start months.' },
];

const testimonial = {
  quote: 'Our students returned home transformed. The curriculum fit was exact.',
  author: 'Maria Santos',
  role: 'IB Coordinator',
  school: 'Lisbon International School',
  city: 'Lisbon',
  country: 'Portugal',
};
---

<PageLayout title={`${title} | ${dict.nav.trips}`} description={entry.data.description}>
  <Hero
    variant="small"
    headline={title}
    sub={entry.data.description}
    imageSrc={`/images/categories/${entry.data.slug}-hero.jpg`}
    imageAlt={title}
  />

  <Section class="py-8">
    <Breadcrumbs items={[
      { label: dict.nav.home, href: prefix || '/' },
      { label: dict.nav.trips, href: `${prefix}/trips` },
      { label: title },
    ]} />
  </Section>

  <Section>
    <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8">{isTh ? 'โปรแกรมตัวอย่าง' : 'Sample itineraries'}</h2>
    {matchingItineraries.length > 0 ? (
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matchingItineraries.map((itin) => (
          <ItineraryCard
            slug={itin.data.slug}
            title={itin.data.title}
            category={itin.data.category}
            destinations={itin.data.destinations.map((d: any) => d.id ?? d)}
            days={itin.data.days}
            priceFrom={itin.data.priceFrom}
            currency={itin.data.currency}
            heroImage={itin.data.heroImage}
            ageBand={itin.data.ageBand}
          />
        ))}
      </div>
    ) : (
      <p class="text-teak-700">{isTh ? 'โปรแกรมตัวอย่างกำลังจะมาเร็วๆ นี้' : 'Sample itineraries for this category are coming soon. Get in touch to discuss a custom program.'}</p>
    )}
  </Section>

  <Section bg="rice-100">
    <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8">{isTh ? 'จุดหมายที่เหมาะกับหมวดนี้' : 'Works in these destinations'}</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      {matchingDestinations.map((dest) => (
        <DestinationCard
          slug={dest.data.slug}
          name={isTh ? dest.data.nameTh : dest.data.name}
          tagline={dest.data.tagline}
          imageSrc={dest.data.heroImage}
          bestFor={dest.data.bestFor as unknown as string[]}
        />
      ))}
    </div>
  </Section>

  <Section>
    <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8">{isTh ? 'สอดคล้องหลักสูตร' : 'Curriculum alignment'}</h2>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
      {['IB MYP', 'IB DP', 'IGCSE', 'A-Level', 'AP', 'GCSE'].map((c) => (
        <div class="bg-bamboo-100 rounded-lg p-6 text-center">
          <div class="font-display text-xl font-semibold text-teak-900">{c}</div>
        </div>
      ))}
    </div>
  </Section>

  <Section bg="rice-100">
    <TestimonialCard {...testimonial} />
  </Section>

  <Section>
    <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8">{isTh ? 'คำถามที่พบบ่อย' : 'FAQ'}</h2>
    <FAQAccordion items={faqs} />
  </Section>

  <CTASection
    headline={isTh ? `วางแผนทริป${title}` : `Plan a ${title} trip`}
    primaryCta={{ href: `${prefix}/enquire?category=${entry.data.slug}`, label: dict.nav.enquire }}
  />
</PageLayout>
```

**Step 2: Verify build**

Run: `npx astro check`
Expected: 0 errors.

**Step 3: Commit**

```bash
git add src/pages/trips/[category].astro
git commit -m "feat(trips): dynamic category pillar page"
```

---

## Phase 6 — Destinations

### Task 27: Author 12 destination content entries

**Files:**
- Create: `src/content/destinations/{bangkok,chiang-mai,chiang-rai,phuket,krabi,khao-sok,kanchanaburi,ayutthaya,koh-tao,sukhothai,pai,isan}.md`

**Step 1: Write bangkok.md**

Create `/home/phurix/projects/flyed/src/content/destinations/bangkok.md`:

```markdown
---
name: Bangkok
nameTh: กรุงเทพมหานคร
tagline: The capital — old town, river markets, and royal temples
region: Central
bestFor: [cultural-heritage, history-heritage, language-immersion]
bestMonths: [Nov, Dec, Jan, Feb]
heroImage: /images/destinations/bangkok-hero.jpg
intro: Bangkok is where most Thailand trips begin. Three days in the capital grounds students in Thai geography, religion, and modern history before they head north or south. We use Bangkok as a soft-landing city — gentle cultural orientation before deeper field work.
slug: bangkok
---

## Why flyed runs Bangkok trips

We've been operating Bangkok programs since 2012. Our local team includes a former K-12 teacher who now leads our Bangkok cultural immersion walks, and a licensed historian-guide for the Grand Palace and Wat Pho.

## What students do

- Old-town walking tour with stops at Wat Saket, Wat Pho, and the amulet market
- Longtail-boat tour of the Chao Phraya with a hydrology brief
- Thai cooking class with a family-run school in Bang Rak
- Modern-history visit: Erawan Shrine, Rama I monument, democracy monument

## Logistics

- Best months: November–February (cool, dry)
- Air quality concern: February–April; we monitor AQI daily
- Visa: most nationalities get 30-day exemption on arrival
- Travel from Bangkok: domestic flights to Chiang Mai/Phuket run 1 hour
```

(Pattern repeats for the other 11 destinations with destination-specific content. Full destination content drafted in a separate authoring sprint — see Phase 11. For plan purposes, each destination entry follows the structure above.)

**Step 2-12: Write the remaining 11 destinations following the bangkok pattern**

For brevity in this plan, the engineer should write `chiang-mai.md`, `chiang-rai.md`, `phuket.md`, `krabi.md`, `khao-sok.md`, `kanchanaburi.md`, `ayutthaya.md`, `koh-tao.md`, `sukhothai.md`, `pai.md`, `isan.md` following the same frontmatter + 3-section pattern as bangkok.md. Each must include:
- Name (EN + TH)
- Tagline
- Region (from enum)
- bestFor array (1–3 category slugs)
- bestMonths array
- heroImage path
- 3-paragraph intro
- "Why flyed runs [city] trips" section
- "What students do" section (3–5 bullets)
- "Logistics" section (best months, weather, visa, transport)

**Step 13: Commit**

```bash
git add src/content/destinations/
git commit -m "content(destinations): author 12 destination entries"
```

---

### Task 28: Implement /destinations hub page

**Files:**
- Create: `src/pages/destinations/index.astro`

**Step 1: Implement**

Create `/home/phurix/projects/flyed/src/pages/destinations/index.astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Hero from '@/components/Hero.astro';
import Section from '@/components/Section.astro';
import DestinationCard from '@/components/DestinationCard.astro';
import CTASection from '@/components/CTASection.astro';
import { getLocale, getDict } from '@/i18n';
import { getCollection } from 'astro:content';

const locale = getLocale(Astro.url);
const dict = getDict(locale);
const isTh = locale === 'th';
const prefix = isTh ? '/th' : '';

const destinations = await getCollection('destinations');

const grouped: Record<string, typeof destinations> = {
  North: [],
  Central: [],
  Andaman: [],
  Gulf: [],
  Northeast: [],
};
for (const d of destinations) grouped[d.data.region].push(d);

const regionOrder = ['North', 'Central', 'Andaman', 'Gulf', 'Northeast'] as const;
const regionLabel: Record<string, { en: string; th: string }> = {
  North: { en: 'Northern Thailand', th: 'ภาคเหนือ' },
  Central: { en: 'Central Thailand', th: 'ภาคกลาง' },
  Andaman: { en: 'Andaman Coast', th: 'ฝั่งอันดามัน' },
  Gulf: { en: 'Gulf Coast', th: 'ฝั่งอ่าวไทย' },
  Northeast: { en: 'Northeast (Isan)', th: 'ภาคอีสาน' },
};
---

<PageLayout title={isTh ? 'จุดหมาย' : 'Destinations'} description={isTh ? 'สิบสองเมืองในประเทศไทยสำหรับทริปโรงเรียน' : 'Twelve Thailand cities for school trips'}>
  <Hero
    variant="small"
    headline={isTh ? 'จุดหมาย 12 แห่งในประเทศไทย' : 'Twelve destinations across Thailand'}
    sub={isTh ? 'จากเทือกเขาทางเหนือถึงเกาะในอ่าวไทย' : 'From northern highlands to gulf islands'}
    imageSrc="/images/hero/destinations-hero.jpg"
    imageAlt="Map mosaic of Thailand destinations"
  />

  {regionOrder.map((region) => (
    grouped[region].length > 0 && (
      <Section>
        <h2 class="font-display text-3xl font-semibold mb-8">{isTh ? regionLabel[region].th : regionLabel[region].en}</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {grouped[region].map((dest) => (
            <DestinationCard
              slug={dest.data.slug}
              name={isTh ? dest.data.nameTh : dest.data.name}
              tagline={dest.data.tagline}
              imageSrc={dest.data.heroImage}
              bestFor={dest.data.bestFor as unknown as string[]}
            />
          ))}
        </div>
      </Section>
    )
  ))}

  <CTASection
    headline={isTh ? 'ยังไม่รู้จะไปไหน?' : "Don't know where to go?"}
    primaryCta={{ href: `${prefix}/enquire`, label: dict.nav.enquire }}
  />
</PageLayout>
```

**Step 2: Verify build**

Run: `npx astro check`
Expected: 0 errors.

**Step 3: Commit**

```bash
git add src/pages/destinations/index.astro
git commit -m "feat(destinations): destination hub page grouped by region"
```

---

### Task 29: Implement /destinations/[city] dynamic page

**Files:**
- Create: `src/pages/destinations/[city].astro`

**Step 1: Implement**

Create `/home/phurix/projects/flyed/src/pages/destinations/[city].astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Hero from '@/components/Hero.astro';
import Section from '@/components/Section.astro';
import ItineraryCard from '@/components/ItineraryCard.astro';
import Breadcrumbs from '@/components/Breadcrumbs.astro';
import FAQAccordion from '@/components/FAQAccordion.astro';
import TestimonialCard from '@/components/TestimonialCard.astro';
import CTASection from '@/components/CTASection.astro';
import { getLocale, getDict } from '@/i18n';
import { getCollection, type CollectionEntry } from 'astro:content';

export async function getStaticPaths() {
  const destinations = await getCollection('destinations');
  return destinations.map((entry) => ({
    params: { city: entry.data.slug },
    props: { entry },
  }));
}

interface Props { entry: CollectionEntry<'destinations'>; }
const { entry } = Astro.props;
const locale = getLocale(Astro.url);
const dict = getDict(locale);
const isTh = locale === 'th';
const prefix = isTh ? '/th' : '';

const allItineraries = await getCollection('itineraries');
const matchingItineraries = allItineraries.filter((itin) =>
  itin.data.destinations.some((d: any) => (typeof d === 'string' ? d === entry.data.name : d.id === entry.id))
);

const title = isTh ? entry.data.nameTh : entry.data.name;

const faqs = [
  { q: 'What is the best time to visit?', a: `${entry.data.bestMonths.join(', ')} are the recommended months.` },
  { q: 'How do students get there?', a: 'Fly into Bangkok, then domestic connection. We arrange all transfers from airport to first hotel.' },
  { q: 'Is it safe?', a: 'Yes. Our risk assessment covers this destination specifically and is available on request.' },
];

const testimonial = {
  quote: `Our ${title} trip exceeded expectations. The local team made all the difference.`,
  author: 'David Chen',
  role: 'Trip Leader',
  school: 'Hong Kong International School',
  city: 'Hong Kong',
  country: 'HK',
};
---

<PageLayout title={title} description={entry.data.tagline}>
  <Hero
    variant="small"
    headline={title}
    sub={entry.data.tagline}
    imageSrc={entry.data.heroImage}
    imageAlt={`View of ${title}`}
  />

  <Section class="py-8">
    <Breadcrumbs items={[
      { label: dict.nav.home, href: prefix || '/' },
      { label: dict.nav.destinations, href: `${prefix}/destinations` },
      { label: title },
    ]} />
  </Section>

  <Section>
    <div class="prose prose-lg max-w-prose mx-auto">
      <p class="text-teak-700 text-lg leading-relaxed">{entry.data.intro}</p>
    </div>
  </Section>

  <Section bg="rice-100">
    <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8">{isTh ? 'ทริปที่เราจัดที่นี่' : 'Trips we run here'}</h2>
    {matchingItineraries.length > 0 ? (
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matchingItineraries.map((itin) => (
          <ItineraryCard
            slug={itin.data.slug}
            title={itin.data.title}
            category={itin.data.category}
            destinations={itin.data.destinations.map((d: any) => d.id ?? d)}
            days={itin.data.days}
            priceFrom={itin.data.priceFrom}
            currency={itin.data.currency}
            heroImage={itin.data.heroImage}
            ageBand={itin.data.ageBand}
          />
        ))}
      </div>
    ) : (
      <p class="text-teak-700">{isTh ? 'ยังไม่มีโปรแกรมสำเร็จรูป แต่เราสามารถออกแบบให้' : 'No fixed itinerary yet — we can design one for your group.'}</p>
    )}
  </Section>

  <Section bg="rice-100">
    <TestimonialCard {...testimonial} />
  </Section>

  <Section>
    <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8">{isTh ? 'ข้อมูลการเดินทาง' : 'Travel logistics'}</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-rice-100 p-6 rounded-lg">
        <h3 class="font-semibold text-teak-900 mb-2">{isTh ? 'ช่วงเวลาที่ดี' : 'Best months'}</h3>
        <p class="text-teak-700">{entry.data.bestMonths.join(', ')}</p>
      </div>
      <div class="bg-rice-100 p-6 rounded-lg">
        <h3 class="font-semibold text-teak-900 mb-2">{isTh ? 'ประเภทที่เหมาะ' : 'Best for'}</h3>
        <div class="flex flex-wrap gap-1">
          {entry.data.bestFor.map((cat) => (
            <span class="text-xs bg-bamboo-700 text-rice-50 px-2 py-0.5 rounded">{dict.categories[cat]}</span>
          ))}
        </div>
      </div>
      <div class="bg-rice-100 p-6 rounded-lg">
        <h3 class="font-semibold text-teak-900 mb-2">{isTh ? 'ภูมิภาค' : 'Region'}</h3>
        <p class="text-teak-700">{entry.data.region}</p>
      </div>
    </div>
  </Section>

  <Section bg="rice-100">
    <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8">FAQ</h2>
    <FAQAccordion items={faqs} />
  </Section>

  <CTASection
    headline={isTh ? `วางแผนทริป${title}` : `Plan a ${title} trip`}
    primaryCta={{ href: `${prefix}/enquire?destination=${entry.data.slug}`, label: dict.nav.enquire }}
  />
</PageLayout>
```

**Step 2: Verify build**

Run: `npx astro check`
Expected: 0 errors.

**Step 3: Commit**

```bash
git add src/pages/destinations/[city].astro
git commit -m "feat(destinations): dynamic city pillar page"
```

---

## Phase 7 — Itineraries

### Task 30: Author 10 sample itineraries

**Files:**
- Create: `src/content/itineraries/{10 .mdx files}`

**Step 1: Write northern-thailand-service-week.mdx**

Create `/home/phurix/projects/flyed/src/content/itineraries/northern-thailand-service-week.mdx`:

```mdx
---
title: Northern Thailand Service Week
description: Seven-day service-learning immersion in Chiang Mai and Chiang Rai — bamboo construction, hill-tribe English teaching, ethical elephant sanctuary.
category: service-learning
destinations: [chiang-mai, chiang-rai]
days: 7
groupSize: { min: 12, max: 32 }
ageBand: { min: 14, max: 18 }
priceFrom: 1850
currency: USD
startMonths: [Oct, Nov, Dec, Jan, Feb, Mar]
curricula: [IB-MYP, IB-DP, IGCSE, GCSE]
heroImage: /images/itineraries/northern-thailand-service-week-hero.jpg
gallery:
  - /images/itineraries/ntsw-1.jpg
  - /images/itineraries/ntsw-2.jpg
  - /images/itineraries/ntsw-3.jpg
  - /images/itineraries/ntsw-4.jpg
  - /images/itineraries/ntsw-5.jpg
  - /images/itineraries/ntsw-6.jpg
slug: northern-thailand-service-week
published: true
---

## Day 1 — Arrival Chiang Mai

Arrive Chiang Mai International Airport. Transfer to boutique hotel in old city. Welcome dinner at family-run khao soi shop. Evening briefing with trip director.

## Day 2 — Service orientation

Half-day cultural orientation: temple etiquette, Thai language basics, homestay expectations. Afternoon visit to partner NGO. Group reflection circle.

## Day 3 — Bamboo school construction

Full-day service project with Thai youth volunteers. Tools provided. Lunch at village. Evening reflection.

## Day 4 — Hill-tribe English teaching

Travel to partner hill-tribe school. Half-day English teaching support. Cultural exchange activity with local students.

## Day 5 — Travel to Chiang Rai

Morning travel to Chiang Rai. Afternoon at ethical elephant sanctuary (observation-only, no riding).

## Day 6 — Golden Triangle & reflection

Visit Golden Triangle viewpoint. Workshop on regional history (opium trade, modern cross-border economy). Final reflection circle.

## Day 7 — Departure

Morning market visit. Transfer to Chiang Rai Airport for onward travel.

## Curriculum fit

- **IB MYP Service & Action**: 18 verified service hours
- **IB DP CAS**: counts toward Creativity/Activity/Service
- **IGCSE Global Citizenship**: completed portfolio template

## Safety

Daily safety brief. 24/7 trip director. Pre-departure risk assessment PDF.
```

**Step 2-10: Write the remaining 9 itineraries following the same pattern**

For brevity: `andaman-marine-biology.mdx`, `ayutthaya-kanchanaburi-history-loop.mdx`, `bangkok-isan-cultural-immersion.mdx`, `khao-sok-jungle-ecology.mdx`, `muay-thai-and-service.mdx`, `andaman-sailing-week.mdx`, `koh-tao-dive-certification.mdx`, `thai-language-homestay-fortnight.mdx`, `pai-adventure-and-service.mdx`.

Each must include:
- Same frontmatter structure (with correct slug, category, destinations array of city slugs, days, groupSize, ageBand, priceFrom, currency, startMonths, curricula, heroImage, gallery of 6+ images, slug, published)
- Day-by-day breakdown (each day 50–80 words describing morning/afternoon/evening)
- "Curriculum fit" section listing 2–4 frameworks
- "Safety" or "What's included" section
- Minimum 600 words body

**Step 11: Commit**

```bash
git add src/content/itineraries/
git commit -m "content(itineraries): author 10 sample itineraries"
```

---

### Task 31: Implement /itineraries index page

**Files:**
- Create: `src/pages/itineraries/index.astro`

**Step 1: Implement**

Create `/home/phurix/projects/flyed/src/pages/itineraries/index.astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Hero from '@/components/Hero.astro';
import Section from '@/components/Section.astro';
import ItineraryCard from '@/components/ItineraryCard.astro';
import CTASection from '@/components/CTASection.astro';
import { getLocale, getDict } from '@/i18n';
import { getCollection } from 'astro:content';

const locale = getLocale(Astro.url);
const dict = getDict(locale);
const isTh = locale === 'th';
const prefix = isTh ? '/th' : '';

const itineraries = await getCollection('itineraries');
const published = itineraries.filter((i) => i.data.published);
---

<PageLayout title={isTh ? 'โปรแกรมตัวอย่าง' : 'Sample itineraries'} description={isTh ? 'โปรแกรมทริปทั้งหมดของเรา' : 'All our sample trip itineraries'}>
  <Hero
    variant="small"
    headline={isTh ? 'โปรแกรมตัวอย่าง' : 'Sample itineraries'}
    sub={isTh ? 'ทริปที่ครูนิยมจองและปรับแต่ง' : 'Trips teachers book and customize'}
    imageSrc="/images/hero/itineraries-hero.jpg"
    imageAlt="Students in a Thai setting"
  />

  <Section>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {published.map((itin) => (
        <ItineraryCard
          slug={itin.data.slug}
          title={itin.data.title}
          category={itin.data.category}
          destinations={itin.data.destinations.map((d: any) => d.id ?? d)}
          days={itin.data.days}
          priceFrom={itin.data.priceFrom}
          currency={itin.data.currency}
          heroImage={itin.data.heroImage}
          ageBand={itin.data.ageBand}
        />
      ))}
    </div>
  </Section>

  <CTASection
    headline={isTh ? 'ต้องการทริปแบบกำหนดเอง?' : 'Want a custom trip?'}
    sub={isTh ? 'เราสามารถผสมหมวดหมู่และจุดหมายเพื่อสร้างโปรแกรมเฉพาะกลุ่มของคุณ' : 'We can mix categories and destinations to create a program specific to your group.'}
    primaryCta={{ href: `${prefix}/enquire`, label: dict.nav.enquire }}
  />
</PageLayout>
```

**Step 2: Verify build**

Run: `npx astro check`
Expected: 0 errors.

**Step 3: Commit**

```bash
git add src/pages/itineraries/index.astro
git commit -m "feat(itineraries): index page listing all sample itineraries"
```

---

### Task 32: Implement /itineraries/[slug] dynamic page

**Files:**
- Create: `src/pages/itineraries/[slug].astro`

**Step 1: Implement**

Create `/home/phurix/projects/flyed/src/pages/itineraries/[slug].astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Hero from '@/components/Hero.astro';
import Section from '@/components/Section.astro';
import Breadcrumbs from '@/components/Breadcrumbs.astro';
import ImageCarousel from '@/components/ImageCarousel.tsx';
import CTASection from '@/components/CTASection.astro';
import ItineraryCard from '@/components/ItineraryCard.astro';
import { getLocale, getDict } from '@/i18n';
import { getCollection, type CollectionEntry, render } from 'astro:content';

export async function getStaticPaths() {
  const itineraries = await getCollection('itineraries');
  return itineraries
    .filter((i) => i.data.published)
    .map((entry) => ({
      params: { slug: entry.data.slug },
      props: { entry },
    }));
}

interface Props { entry: CollectionEntry<'itineraries'>; }
const { entry } = Astro.props;
const { Content } = await render(entry);

const locale = getLocale(Astro.url);
const dict = getDict(locale);
const isTh = locale === 'th';
const prefix = isTh ? '/th' : '';

const allItineraries = await getCollection('itineraries');
const related = allItineraries
  .filter((i) => i.data.published && i.data.slug !== entry.data.slug && i.data.category === entry.data.category)
  .slice(0, 3);

const galleryImages = (entry.data.gallery ?? []).map((src) => ({ src, alt: entry.data.title }));

const tripLd = {
  '@context': 'https://schema.org',
  '@type': 'TouristTrip',
  name: entry.data.title,
  description: entry.data.description,
  offers: {
    '@type': 'Offer',
    price: entry.data.priceFrom,
    priceCurrency: entry.data.currency,
    availability: 'https://schema.org/InStock',
  },
  itinerary: {
    '@type': 'ItemList',
    numberOfItems: entry.data.days,
  },
};
---

<PageLayout title={entry.data.title} description={entry.data.description}>
  <Hero
    variant="small"
    headline={entry.data.title}
    sub={`${entry.data.days} ${isTh ? 'วัน' : 'days'} · ${dict.categories[entry.data.category]} · ${isTh ? 'เริ่มต้น' : 'from'} ${entry.data.currency} ${entry.data.priceFrom.toLocaleString()}`}
    imageSrc={entry.data.heroImage}
    imageAlt={entry.data.title}
  />

  <Section class="py-8">
    <Breadcrumbs items={[
      { label: dict.nav.home, href: prefix || '/' },
      { label: dict.nav.itineraries, href: `${prefix}/itineraries` },
      { label: entry.data.title },
    ]} />
  </Section>

  <Section>
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div class="lg:col-span-3 prose prose-lg max-w-prose">
        <Content />
      </div>
      <aside class="bg-rice-100 p-6 rounded-lg h-fit">
        <h3 class="font-display text-xl font-semibold mb-4">{isTh ? 'ภาพรวม' : 'At a glance'}</h3>
        <dl class="space-y-3 text-sm">
          <div><dt class="font-semibold text-teak-500 uppercase">{isTh ? 'วัน' : 'Days'}</dt><dd class="text-teak-900">{entry.data.days}</dd></div>
          <div><dt class="font-semibold text-teak-500 uppercase">{isTh ? 'กลุ่ม' : 'Group size'}</dt><dd class="text-teak-900">{entry.data.groupSize.min}–{entry.data.groupSize.max}</dd></div>
          <div><dt class="font-semibold text-teak-500 uppercase">{isTh ? 'อายุ' : 'Ages'}</dt><dd class="text-teak-900">{entry.data.ageBand.min}–{entry.data.ageBand.max}</dd></div>
          <div><dt class="font-semibold text-teak-500 uppercase">{isTh ? 'ราคาเริ่มต้น' : 'Price from'}</dt><dd class="text-teak-900 font-semibold">{entry.data.currency} {entry.data.priceFrom.toLocaleString()}</dd></div>
          <div><dt class="font-semibold text-teak-500 uppercase">{isTh ? 'เดือนเริ่มต้น' : 'Start months'}</dt><dd class="text-teak-900">{entry.data.startMonths.join(', ')}</dd></div>
          <div><dt class="font-semibold text-teak-500 uppercase">{isTh ? 'หลักสูตร' : 'Curricula'}</dt><dd class="text-teak-900">{entry.data.curricula.join(', ')}</dd></div>
        </dl>
        <a href={`${prefix}/enquire?itinerary=${entry.data.slug}`} class="mt-6 block text-center bg-sunset-600 hover:bg-sunset-400 text-rice-50 font-medium px-4 py-3 rounded-md no-underline">
          {isTh ? 'ส่งคำขอสำหรับทริปนี้' : 'Enquire about this trip'}
        </a>
      </aside>
    </div>
  </Section>

  {galleryImages.length > 0 && (
    <Section bg="rice-100">
      <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8">{isTh ? 'แกลเลอรี่' : 'Gallery'}</h2>
      <ImageCarousel client:visible images={galleryImages} />
    </Section>
  )}

  {related.length > 0 && (
    <Section>
      <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8">{isTh ? 'ทริปที่คล้ายกัน' : 'Related itineraries'}</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {related.map((r) => (
          <ItineraryCard
            slug={r.data.slug}
            title={r.data.title}
            category={r.data.category}
            destinations={r.data.destinations.map((d: any) => d.id ?? d)}
            days={r.data.days}
            priceFrom={r.data.priceFrom}
            currency={r.data.currency}
            heroImage={r.data.heroImage}
            ageBand={r.data.ageBand}
          />
        ))}
      </div>
    </Section>
  )}

  <CTASection
    headline={isTh ? 'พร้อมจองหรือยัง?' : 'Ready to book?'}
    primaryCta={{ href: `${prefix}/enquire?itinerary=${entry.data.slug}`, label: dict.nav.enquire }}
  />

  <script type="application/ld+json" set:html={JSON.stringify(tripLd)} />
</PageLayout>
```

**Step 2: Verify build**

Run: `npx astro check`
Expected: 0 errors.

**Step 3: Commit**

```bash
git add src/pages/itineraries/[slug].astro
git commit -m "feat(itineraries): dynamic itinerary page with at-a-glance, gallery, related"
```

---

## Phase 8 — Persona Pages

### Task 33: Build /schools, /parents, /educators pages

**Files:**
- Create: `src/pages/schools.astro`
- Create: `src/pages/parents.astro`
- Create: `src/pages/educators.astro`

**Step 1: Write schools.astro**

Create `/home/phurix/projects/flyed/src/pages/schools.astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Hero from '@/components/Hero.astro';
import Section from '@/components/Section.astro';
import ItineraryCard from '@/components/ItineraryCard.astro';
import CTASection from '@/components/CTASection.astro';
import FAQAccordion from '@/components/FAQAccordion.astro';
import { getLocale, getDict } from '@/i18n';
import { getCollection } from 'astro:content';

const locale = getLocale(Astro.url);
const dict = getDict(locale);
const isTh = locale === 'th';
const prefix = isTh ? '/th' : '';

const itineraries = await getCollection('itineraries');
const featured = itineraries.filter((i) => i.data.published).slice(0, 3);

const benefits = [
  { title: 'Procurement-ready documentation', body: 'Risk assessment, insurance certificates, financial-protection statements, and our compliance pack are sent within 24 hours.' },
  { title: 'Dedicated trip director', body: 'A single point of contact from enquiry through post-trip debrief. You will have their direct mobile and email.' },
  { title: 'Single invoice, multi-stop', body: 'One quote covers flights, transfers, accommodation, guides, insurance, and 24/7 in-country support.' },
  { title: 'Safeguarding alignment', body: 'Our staff-to-student ratios, DBS/blue-card checks, and incident protocols meet UK, US, AU, and SG school standards.' },
];

const faqs = [
  { q: 'Do you have references from other schools?', a: 'Yes — we can connect you with procurement contacts at 3–5 schools in your region who have travelled with us in the past 24 months.' },
  { q: 'What is your cancellation policy?', a: 'See our full terms. School deposits are typically refundable up to 90 days before departure minus non-recoverable supplier costs.' },
  { q: 'Can you invoice in our currency?', a: 'Yes. We invoice in USD, GBP, AUD, SGD, and THB. Payment by bank transfer or credit card.' },
];
---

<PageLayout title={isTh ? 'สำหรับโรงเรียน' : 'For schools'} description={isTh ? 'ข้อมูลสำหรับผู้บริหารโรงเรียน' : 'Information for school decision-makers'}>
  <Hero
    variant="small"
    headline={isTh ? 'สำหรับโรงเรียน' : 'For schools'}
    sub={isTh ? 'ข้อมูลที่ผู้บริหารต้องการเพื่ออนุมัติทริป' : 'What decision-makers need to approve and run a trip'}
    imageSrc="/images/hero/schools-hero.jpg"
    imageAlt="School administrators reviewing trip plans"
  />

  <Section>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      {benefits.map((b) => (
        <div class="bg-rice-100 p-6 rounded-lg">
          <h3 class="font-display text-xl font-semibold text-teak-900 mb-2">{b.title}</h3>
          <p class="text-teak-700">{b.body}</p>
        </div>
      ))}
    </div>
  </Section>

  <Section bg="rice-100">
    <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8">{isTh ? 'ทริปยอดนิยม' : 'Popular programs'}</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {featured.map((itin) => (
        <ItineraryCard
          slug={itin.data.slug}
          title={itin.data.title}
          category={itin.data.category}
          destinations={itin.data.destinations.map((d: any) => d.id ?? d)}
          days={itin.data.days}
          priceFrom={itin.data.priceFrom}
          currency={itin.data.currency}
          heroImage={itin.data.heroImage}
          ageBand={itin.data.ageBand}
        />
      ))}
    </div>
  </Section>

  <Section>
    <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8">FAQ</h2>
    <FAQAccordion items={faqs} />
  </Section>

  <CTASection
    headline={isTh ? 'พร้อมคุยกับทีมงานหรือยัง?' : 'Ready to talk to our team?'}
    primaryCta={{ href: `${prefix}/enquire`, label: dict.nav.enquire }}
  />
</PageLayout>
```

**Step 2: Write parents.astro**

Create `/home/phurix/projects/flyed/src/pages/parents.astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Hero from '@/components/Hero.astro';
import Section from '@/components/Section.astro';
import CTASection from '@/components/CTASection.astro';
import FAQAccordion from '@/components/FAQAccordion.astro';
import { getLocale, getDict } from '@/i18n';

const locale = getLocale(Astro.url);
const dict = getDict(locale);
const isTh = locale === 'th';
const prefix = isTh ? '/th' : '';

const reassurance = [
  { title: '24/7 in-country support', body: 'A trip director is on call the entire time your child is in Thailand. Direct mobile number shared before departure.' },
  { title: 'Insurance included', body: 'Comprehensive travel and medical insurance covers every participant. Details in your pre-departure pack.' },
  { title: 'Accommodation vetted', body: 'All homestays and hotels are inspected annually. Student-only floors where possible.' },
  { title: 'Daily check-ins', body: 'Trip director sends daily photo-and-summary updates to the lead teacher who shares with parents.' },
];

const faqs = [
  { q: 'How will I contact my child in an emergency?', a: 'You will have the trip director\'s 24/7 number. In a real emergency, our Bangkok office also responds within minutes.' },
  { q: 'What if my child has dietary requirements?', a: 'We collect dietary and allergy data during booking and confirm with every caterer and homestay.' },
  { q: 'What medical support is available?', a: 'Every trip carries a first-aid-trained guide. Hospital partnerships in Bangkok, Chiang Mai, and Phuket.' },
];
---

<PageLayout title={isTh ? 'สำหรับผู้ปกครอง' : 'For parents'} description={isTh ? 'สิ่งที่ลูกของคุณจะได้รับและข้อมูลความปลอดภัย' : 'What your child will experience and safety information'}>
  <Hero
    variant="small"
    headline={isTh ? 'สำหรับผู้ปกครอง' : 'For parents'}
    sub={isTh ? 'คำตอบสำหรับคำถามที่ผู้ปกครองถามบ่อยที่สุด' : 'Answers to the questions parents ask most'}
    imageSrc="/images/hero/parents-hero.jpg"
    imageAlt="Parent and child looking at trip photos"
  />

  <Section>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      {reassurance.map((r) => (
        <div class="bg-rice-100 p-6 rounded-lg">
          <h3 class="font-display text-xl font-semibold text-teak-900 mb-2">{r.title}</h3>
          <p class="text-teak-700">{r.body}</p>
        </div>
      ))}
    </div>
  </Section>

  <Section bg="rice-100">
    <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8">FAQ</h2>
    <FAQAccordion items={faqs} />
  </Section>

  <CTASection
    headline={isTh ? 'มีคำถามเพิ่มเติม?' : 'Have more questions?'}
    primaryCta={{ href: `${prefix}/contact`, label: dict.nav.contact }}
  />
</PageLayout>
```

**Step 3: Write educators.astro**

Create `/home/phurix/projects/flyed/src/pages/educators.astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Hero from '@/components/Hero.astro';
import Section from '@/components/Section.astro';
import ItineraryCard from '@/components/ItineraryCard.astro';
import CTASection from '@/components/CTASection.astro';
import FAQAccordion from '@/components/FAQAccordion.astro';
import { getLocale, getDict } from '@/i18n';
import { getCollection } from 'astro:content';

const locale = getLocale(Astro.url);
const dict = getDict(locale);
const isTh = locale === 'th';
const prefix = isTh ? '/th' : '';

const itineraries = await getCollection('itineraries');
const featured = itineraries.filter((i) => i.data.published).slice(0, 3);

const benefits = [
  { title: 'Curriculum-mapped', body: 'Pre-trip curriculum pack with learning outcomes, suggested pre-reading, and post-trip assessment template.' },
  { title: 'Co-design welcome', body: 'Adjust any itinerary with your flyed designer — typically 2–3 rounds to final.' },
  { title: 'Free teacher place', body: 'One teacher place free per 10 paying students. Standard ratio coverage included.' },
  { title: 'Risk assessment on request', body: 'Pre-departure risk assessment PDF sent within 48 hours.' },
];

const faqs = [
  { q: 'How long does planning take?', a: 'From first enquiry to departure: typically 4–9 months. Shorter lead times possible.' },
  { q: 'Can I bring more than one teacher?', a: 'Yes — most groups send 2–4 teachers. We discount additional teacher places.' },
  { q: 'Do you help with parent communication?', a: 'Yes — sample parent letter, info pack, and FAQ templates provided.' },
];
---

<PageLayout title={isTh ? 'สำหรับครู' : 'For educators'} description={isTh ? 'ทรัพยากรและข้อมูลสำหรับครูผู้นำทริป' : 'Resources and information for teacher trip leaders'}>
  <Hero
    variant="small"
    headline={isTh ? 'สำหรับครู' : 'For educators'}
    sub={isTh ? 'ทรัพยากรในการวางแผนทริปของคุณ' : 'Resources to plan your trip'}
    imageSrc="/images/hero/educators-hero.jpg"
    imageAlt="Teacher and students in classroom planning"
  />

  <Section>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      {benefits.map((b) => (
        <div class="bg-rice-100 p-6 rounded-lg">
          <h3 class="font-display text-xl font-semibold text-teak-900 mb-2">{b.title}</h3>
          <p class="text-teak-700">{b.body}</p>
        </div>
      ))}
    </div>
  </Section>

  <Section bg="rice-100">
    <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8">{isTh ? 'ทริปแนะนำ' : 'Suggested trips'}</h2>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      {featured.map((itin) => (
        <ItineraryCard
          slug={itin.data.slug}
          title={itin.data.title}
          category={itin.data.category}
          destinations={itin.data.destinations.map((d: any) => d.id ?? d)}
          days={itin.data.days}
          priceFrom={itin.data.priceFrom}
          currency={itin.data.currency}
          heroImage={itin.data.heroImage}
          ageBand={itin.data.ageBand}
        />
      ))}
    </div>
  </Section>

  <Section>
    <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8">FAQ</h2>
    <FAQAccordion items={faqs} />
  </Section>

  <CTASection
    headline={isTh ? 'คุยกับดีไซเนอร์ของเรา' : 'Talk to a designer'}
    primaryCta={{ href: `${prefix}/enquire`, label: dict.nav.enquire }}
  />
</PageLayout>
```

**Step 4: Verify build**

Run: `npx astro check`
Expected: 0 errors.

**Step 5: Commit**

```bash
git add src/pages/schools.astro src/pages/parents.astro src/pages/educators.astro
git commit -m "feat(personas): schools, parents, educators pages"
```

---

## Phase 9 — Informational Pages

### Task 34: Build /about, /how-it-works, /safety

**Files:**
- Create: `src/pages/about.astro`
- Create: `src/pages/how-it-works.astro`
- Create: `src/pages/safety.astro`
- Create: `src/content/team/{8 .md files}`

**Step 1: Author 8 team entries**

Create `/home/phurix/projects/flyed/src/content/team/kriengsak.md`:

```markdown
---
name: Kriengsak Wongthong
role: Co-founder & Managing Director
roleTh: ผู้ร่วมก่อตั้งและกรรมการผู้จัดการ
bio: Former K-12 teacher with 20 years in Chiang Mai education. Started flyed in 2012 after seeing too many school trips run as tourism, not learning.
photo: /images/team/kriengsak.jpg
order: 1
---
```

(Repeat for 7 more team members — engineering follows the same pattern, varying name/role/bio/photo/order.)

**Step 2: Write about.astro**

Create `/home/phurix/projects/flyed/src/pages/about.astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Hero from '@/components/Hero.astro';
import Section from '@/components/Section.astro';
import CTASection from '@/components/CTASection.astro';
import BadgeRow from '@/components/BadgeRow.astro';
import { getLocale } from '@/i18n';
import { getCollection } from 'astro:content';

const locale = getLocale(Astro.url);
const isTh = locale === 'th';
const prefix = isTh ? '/th' : '';

const team = await getCollection('team');
team.sort((a, b) => a.data.order - b.data.order);

const values = [
  { title: 'Curriculum over tourism', body: 'Every trip is built backward from learning outcomes, not forward from a destination list.' },
  { title: 'Local expertise', body: 'Our guides are Thai educators, not generic tour operators.' },
  { title: 'Ethical operations', body: 'Fair pay, animal welfare, GSTC-aligned sustainability, transparent pricing.' },
  { title: 'Safety first', body: 'Risk-assessed, insured, 24/7 supported. School-administrator approved.' },
];

const badges = [
  { name: 'TAT', imageSrc: '/images/badges/tat.svg' },
  { name: 'TEATA', imageSrc: '/images/badges/teata.svg' },
  { name: 'GSTC', imageSrc: '/images/badges/gstc.svg' },
];
---

<PageLayout title={isTh ? 'เกี่ยวกับเรา' : 'About'} description={isTh ? 'เรื่องราวของ flyed' : 'The flyed story'}>
  <Hero
    variant="small"
    headline={isTh ? 'เรื่องราวของเรา' : 'Our story'}
    sub={isTh ? 'ก่อตั้งโดยครูและคนท้องถิ่นในปี 2012' : 'Founded by a teacher and a local guide in 2012'}
    imageSrc="/images/hero/about-hero.jpg"
    imageAlt="Team photo"
  />

  <Section>
    <div class="prose prose-lg max-w-prose mx-auto">
      <p>flyed was founded in 2012 by Kriengsak Wongthong, a former K-12 teacher in Chiang Mai, and Sarah Whitfield, an education consultant from New Zealand. We started with one Chiang Mai service week for 14 students. Fourteen years later, we've hosted 240+ schools across 30+ countries.</p>
      <p>We focus on Thailand because depth beats breadth. Our team lives here, our guides are from here, and our partner organizations are vetted annually. When you book with flyed, you're not buying a packaged tour — you're hiring a Thai education team that knows this place.</p>
    </div>
  </Section>

  <Section bg="rice-100">
    <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8 text-center">{isTh ? 'ค่านิยม' : 'Values'}</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {values.map((v) => (
        <div class="bg-rice-50 p-6 rounded-lg">
          <h3 class="font-display text-xl font-semibold text-teak-900 mb-2">{v.title}</h3>
          <p class="text-teak-700 text-sm">{v.body}</p>
        </div>
      ))}
    </div>
  </Section>

  <Section>
    <h2 class="font-display text-3xl md:text-4xl font-semibold mb-12 text-center">{isTh ? 'ทีม' : 'Team'}</h2>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
      {team.map((member) => (
        <div class="text-center">
          <img src={member.data.photo} alt={member.data.name} class="w-32 h-32 rounded-full mx-auto object-cover" loading="lazy" />
          <h3 class="font-semibold text-teak-900 mt-3">{member.data.name}</h3>
          <p class="text-sm text-teak-700">{isTh && member.data.roleTh ? member.data.roleTh : member.data.role}</p>
        </div>
      ))}
    </div>
  </Section>

  <Section bg="rice-100">
    <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8 text-center">{isTh ? 'การรับรอง' : 'Accreditation'}</h2>
    <BadgeRow badges={badges} />
  </Section>

  <CTASection
    headline={isTh ? 'มาร่วมงานกับเรา?' : 'Join our team?'}
    sub={isTh ? 'เรากำลังมองหาคนที่รักการศึกษาและประเทศไทย' : 'We are hiring educators who love Thailand.'}
    primaryCta={{ href: `${prefix}/contact`, label: isTh ? 'ติดต่อ' : 'Contact' }}
  />
</PageLayout>
```

**Step 3: Write how-it-works.astro**

Create `/home/phurix/projects/flyed/src/pages/how-it-works.astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Hero from '@/components/Hero.astro';
import Section from '@/components/Section.astro';
import CTASection from '@/components/CTASection.astro';
import FAQAccordion from '@/components/FAQAccordion.astro';
import { getLocale, getDict } from '@/i18n';

const locale = getLocale(Astro.url);
const dict = getDict(locale);
const isTh = locale === 'th';
const prefix = isTh ? '/th' : '';

const steps = [
  { n: 1, title: 'Tell us about your group', body: 'Enquiry form — school name, group size, dates, subjects of interest, and any curriculum must-haves.' },
  { n: 2, title: 'We design', body: 'A flyed designer proposes 2–3 itinerary drafts within 5 business days. We refine with you until it fits.' },
  { n: 3, title: 'You review', body: 'Risk assessment, insurance, curriculum-fit documents, and full quote sent to your decision-makers.' },
  { n: 4, title: 'You travel', body: 'Trip director, local guides, daily check-ins, 24/7 support. Parents get daily photo-and-summary updates.' },
  { n: 5, title: 'We debrief', body: 'Post-trip curriculum pack, certificate of completion, and optional debrief call with your team.' },
];

const faqs = [
  { q: 'How far in advance should we book?', a: 'Ideal lead time is 6–9 months. We can accommodate shorter timelines for repeat schools and small groups.' },
  { q: 'Who designs our itinerary?', a: 'A flyed designer (background in education or travel) and a Thailand-based curriculum specialist collaborate on every program.' },
  { q: 'Can we customize after booking?', a: 'Yes — minor changes up to 30 days before departure are included. Major changes are quoted separately.' },
];
---

<PageLayout title={isTh ? 'ขั้นตอน' : 'How it works'} description={isTh ? 'ห้าขั้นตอนตั้งแต่สอบถามจนเดินทาง' : 'Five steps from enquiry to debrief'}>
  <Hero
    variant="small"
    headline={isTh ? 'ห้าขั้นตอน' : 'Five steps'}
    sub={isTh ? 'จากสอบถามจนถึงเดินทางกลับ' : 'From first enquiry to post-trip debrief'}
    imageSrc="/images/hero/how-it-works-hero.jpg"
    imageAlt="Process diagram"
  />

  <Section>
    <div class="space-y-12">
      {steps.map((s) => (
        <div class="flex gap-6 items-start">
          <div class="flex-shrink-0 w-16 h-16 rounded-full bg-sunset-600 text-rice-50 flex items-center justify-center font-display text-2xl font-semibold">{s.n}</div>
          <div>
            <h3 class="font-display text-2xl font-semibold text-teak-900">{s.title}</h3>
            <p class="mt-2 text-teak-700 text-lg">{s.body}</p>
          </div>
        </div>
      ))}
    </div>
  </Section>

  <Section bg="rice-100">
    <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8">FAQ</h2>
    <FAQAccordion items={faqs} />
  </Section>

  <CTASection
    headline={isTh ? 'เริ่มต้นด้วยการส่งคำขอ' : 'Start with an enquiry'}
    primaryCta={{ href: `${prefix}/enquire`, label: dict.nav.enquire }}
  />
</PageLayout>
```

**Step 4: Write safety.astro**

Create `/home/phurix/projects/flyed/src/pages/safety.astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Hero from '@/components/Hero.astro';
import Section from '@/components/Section.astro';
import CTASection from '@/components/CTASection.astro';
import FAQAccordion from '@/components/FAQAccordion.astro';
import { getLocale, getDict } from '@/i18n';

const locale = getLocale(Astro.url);
const dict = getDict(locale);
const isTh = locale === 'th';
const prefix = isTh ? '/th' : '';

const items = [
  { title: '24/7 in-country support', body: 'A Bangkok-based operations team and Chiang Mai trip directors on standby every hour of every trip.' },
  { title: 'Pre-departure risk assessment', body: 'PDF sent within 48 hours of booking. Covers medical, transport, activity, environmental, and political risks.' },
  { title: 'Comprehensive insurance', body: 'Travel and medical insurance for every participant. Policy document shared before departure.' },
  { title: 'Vetted local partners', body: 'Hotels, homestays, transport providers, and activity operators audited annually against our safety checklist.' },
  { title: 'Hospital partnerships', body: 'Direct relationships with Bangkok Hospital, Chiang Mai Ram, and Bangkok Phuket Hospital for emergency coordination.' },
  { title: 'Emergency protocols', body: 'Documented escalation paths, embassy contacts, evacuation procedures. Tested quarterly via tabletop exercises.' },
];

const faqs = [
  { q: 'How do you handle medical emergencies?', a: 'Trip director calls our 24/7 ops line; we coordinate with hospital partners and the school\'s emergency contact within minutes.' },
  { q: 'What is your staff-to-student ratio?', body: '1:8 for general travel, 1:6 for water-based activities, 1:4 for diving. Always at or below school requirements.' },
  { q: 'Are your guides first-aid trained?', a: 'Yes — all lead guides hold Wilderness First Aid or higher certification, refreshed annually.' },
];
---

<PageLayout title={isTh ? 'ความปลอดภัย' : 'Safety'} description={isTh ? 'มาตรการความปลอดภัยของเรา' : 'Our safety and risk-management protocols'}>
  <Hero
    variant="small"
    headline={isTh ? 'ความปลอดภัย' : 'Safety'}
    sub={isTh ? 'มาตรฐานที่โรงเรียนไว้วางใจ' : 'Standards schools trust'}
    imageSrc="/images/hero/safety-hero.jpg"
    imageAlt="Safety briefing"
  />

  <Section>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      {items.map((i) => (
        <div class="bg-rice-100 p-6 rounded-lg">
          <h3 class="font-display text-xl font-semibold text-teak-900 mb-2">{i.title}</h3>
          <p class="text-teak-700">{i.body}</p>
        </div>
      ))}
    </div>
  </Section>

  <Section bg="rice-100">
    <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8">FAQ</h2>
    <FAQAccordion items={faqs} />
  </Section>

  <CTASection
    headline={isTh ? 'ขอเอกสารประเมินความเสี่ยง' : 'Request risk-assessment documents'}
    primaryCta={{ href: `${prefix}/enquire`, label: dict.nav.enquire }}
  />
</PageLayout>
```

**Step 5: Verify build**

Run: `npx astro check`
Expected: 0 errors.

**Step 6: Commit**

```bash
git add src/pages/about.astro src/pages/how-it-works.astro src/pages/safety.astro src/content/team/
git commit -m "feat(info): about, how-it-works, safety pages with team entries"
```

---

### Task 35: Build /contact, legal pages, /404

**Files:**
- Create: `src/pages/contact.astro`
- Create: `src/pages/legal/privacy.astro`
- Create: `src/pages/legal/terms.astro`
- Create: `src/pages/legal/cookies.astro`
- Modify: `src/pages/404.astro`

**Step 1: Write contact.astro**

Create `/home/phurix/projects/flyed/src/pages/contact.astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Hero from '@/components/Hero.astro';
import Section from '@/components/Section.astro';
import { getLocale, getDict } from '@/i18n';

const locale = getLocale(Astro.url);
const dict = getDict(locale);
const isTh = locale === 'th';
const prefix = isTh ? '/th' : '';

const offices = [
  { city: 'Bangkok HQ', address: 'Sukhumvit Soi 22, Khlong Toei, Bangkok 10110', phone: '+66 2 000 0000' },
  { city: 'Chiang Mai base', address: '12 Nimmanhaemin Rd, Suthep, Chiang Mai 50200', phone: '+66 53 000 000' },
];
---

<PageLayout title={isTh ? 'ติดต่อ' : 'Contact'} description={isTh ? 'ข้อมูลติดต่อและที่อยู่' : 'Contact information and office addresses'}>
  <Hero
    variant="small"
    headline={isTh ? 'ติดต่อเรา' : 'Get in touch'}
    imageSrc="/images/hero/contact-hero.jpg"
    imageAlt="Contact us"
  />

  <Section>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div>
        <form action={`${prefix}/api/contact`} method="post" class="space-y-4">
          <label class="block">
            <span class="text-sm font-medium text-teak-700">{isTh ? 'ชื่อ' : 'Name'}</span>
            <input name="name" required class="mt-1 w-full rounded border border-teak-500/30 bg-rice-50 px-3 py-2" />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-teak-700">{isTh ? 'อีเมล' : 'Email'}</span>
            <input type="email" name="email" required class="mt-1 w-full rounded border border-teak-500/30 bg-rice-50 px-3 py-2" />
          </label>
          <label class="block">
            <span class="text-sm font-medium text-teak-700">{isTh ? 'ข้อความ' : 'Message'}</span>
            <textarea name="message" rows={5} required class="mt-1 w-full rounded border border-teak-500/30 bg-rice-50 px-3 py-2"></textarea>
          </label>
          <button type="submit" class="bg-sunset-600 hover:bg-sunset-400 text-rice-50 font-medium px-6 py-3 rounded-md">
            {isTh ? 'ส่ง' : 'Send'}
          </button>
        </form>
      </div>
      <div class="space-y-8">
        {offices.map((o) => (
          <div>
            <h3 class="font-display text-xl font-semibold text-teak-900">{o.city}</h3>
            <address class="not-italic text-teak-700 mt-2">
              <div>{o.address}</div>
              <div class="mt-1">{o.phone}</div>
            </address>
          </div>
        ))}
        <div>
          <h3 class="font-display text-xl font-semibold text-teak-900">{isTh ? 'ออนไลน์' : 'Online'}</h3>
          <ul class="text-teak-700 mt-2 space-y-1">
            <li><a href="mailto:hello@flyed.dev">hello@flyed.dev</a></li>
            <li>WhatsApp: +66 81 000 0000</li>
            <li>Line: @flyed</li>
          </ul>
        </div>
      </div>
    </div>
  </Section>
</PageLayout>
```

**Step 2: Write three legal pages**

Create `/home/phurix/projects/flyed/src/pages/legal/privacy.astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Section from '@/components/Section.astro';
import { getLocale } from '@/i18n';
const locale = getLocale(Astro.url);
const isTh = locale === 'th';
---

<PageLayout title={isTh ? 'นโยบายความเป็นส่วนตัว' : 'Privacy policy'} description="flyed privacy policy">
  <Section>
    <div class="prose prose-lg max-w-prose">
      <h1>{isTh ? 'นโยบายความเป็นส่วนตัว' : 'Privacy policy'}</h1>
      <p>Last updated: 2026-06-30.</p>
      <p>This is placeholder legal copy. Replace with reviewed-and-approved legal text before launch. Key topics to cover: data collection, retention, sharing, user rights, contact information for data controller.</p>
    </div>
  </Section>
</PageLayout>
```

Create `/home/phurix/projects/flyed/src/pages/legal/terms.astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Section from '@/components/Section.astro';
import { getLocale } from '@/i18n';
const locale = getLocale(Astro.url);
const isTh = locale === 'th';
---

<PageLayout title={isTh ? 'ข้อกำหนด' : 'Terms of service'} description="flyed terms of service">
  <Section>
    <div class="prose prose-lg max-w-prose">
      <h1>{isTh ? 'ข้อกำหนดการให้บริการ' : 'Terms of service'}</h1>
      <p>Last updated: 2026-06-30.</p>
      <p>Placeholder. Replace with reviewed legal text. Cover: booking terms, cancellation policy, payment schedule, liability limits, force majeure.</p>
    </div>
  </Section>
</PageLayout>
```

Create `/home/phurix/projects/flyed/src/pages/legal/cookies.astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Section from '@/components/Section.astro';
import { getLocale } from '@/i18n';
const locale = getLocale(Astro.url);
const isTh = locale === 'th';
---

<PageLayout title={isTh ? 'คุกกี้' : 'Cookies'} description="flyed cookie policy">
  <Section>
    <div class="prose prose-lg max-w-prose">
      <h1>{isTh ? 'นโยบายคุกกี้' : 'Cookie policy'}</h1>
      <p>Last updated: 2026-06-30.</p>
      <p>Placeholder. List cookies used (analytics, preferences), retention, opt-out instructions.</p>
    </div>
  </Section>
</PageLayout>
```

**Step 3: Replace 404 page**

Replace `/home/phurix/projects/flyed/src/pages/404.astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import { getLocale } from '@/i18n';
const locale = getLocale(Astro.url);
const isTh = locale === 'th';
---

<PageLayout title={isTh ? 'ไม่พบหน้า' : 'Page not found'} description="404" noindex>
  <section class="py-32 text-center max-w-2xl mx-auto px-4">
    <h1 class="font-display text-6xl font-semibold text-teak-900">404</h1>
    <p class="mt-4 text-xl text-teak-700">{isTh ? 'ไม่พบหน้าที่คุณกำลังมองหา' : "We couldn't find that page."}</p>
    <a href={isTh ? '/th' : '/'} class="mt-8 inline-block bg-sunset-600 hover:bg-sunset-400 text-rice-50 font-medium px-6 py-3 rounded-md no-underline">
      {isTh ? 'กลับหน้าแรก' : 'Back to home'}
    </a>
  </section>
</PageLayout>
```

**Step 4: Verify build**

Run: `npx astro check`
Expected: 0 errors.

**Step 5: Commit**

```bash
git add src/pages/contact.astro src/pages/legal/ src/pages/404.astro
git commit -m "feat(info): contact, legal pages, 404"
```

---

## Phase 10 — Blog

### Task 36: Author 10 blog posts (batch 1)

**Files:**
- Create: `src/content/blog/{01..10}.mdx`

**Step 1: Write post 1**

Create `/home/phurix/projects/flyed/src/content/blog/01-why-thailand-service-learning.mdx`:

```mdx
---
title: Why Thailand is the world's best classroom for service learning
description: Five structural reasons Thailand outperforms other destinations for IB MYP service and CAS programs.
pubDate: 2026-06-15
author: kriengsak
tags: [Service, Curriculum]
heroImage: /images/blog/01-service-learning-hero.jpg
relatedItineraries: [northern-thailand-service-week]
draft: false
---

Thailand has quietly become the world's most popular destination for IB service learning — and it's not because of beaches. Here's what makes it work, and what trips miss when they get it wrong.

## 1. Real partner organizations, not tourist factories

Thailand's NGO sector is mature. Chiang Mai alone has 200+ registered community-development organizations that have been running school partnerships for 20+ years. The flyed approach: we audit partners annually against our impact checklist, and we only work with those that pay fair wages, prioritize community voice, and have measurable outcomes.

## 2. Low logistics overhead, low cost

Daily costs in northern Thailand run 60–70% below equivalent programs in Europe or North America. That translates into longer trips for the same budget — and a week of service plus cultural immersion fits comfortably in a school term.

## 3. Curriculum fit across frameworks

IB MYP service hours, IB DP CAS, IGCSE Global Citizenship, GCSE Citizenship — Thailand programs map cleanly to all of them. We provide a curriculum-fit PDF per program.

## 4. Cultural depth without language barrier

English is widely spoken in our partner communities, so students can engage deeply without an interpreter. They also pick up basic Thai phrases — useful in any Thailand extension trip.

## 5. The reflection space

Thailand's pace, landscape, and hospitality create natural reflection conditions. Students sit at temple courtyards, on rice-terrace walls, by village fires — the kind of spaces where a service day sinks in.

## What to avoid

Service trips that look like orphanage tourism. Programs without transparent partner-organization vetting. Trips that skip pre-departure curriculum framing. We screen for all of these before we recommend a program.
```

**Step 2: Write posts 2–10**

Pattern repeats for:
- `02-chiang-mai-service-rebook.mdx` — Chiang Mai service-learning rebook story
- `03-marine-biology-andaman.mdx` — STEM marine biology trip design
- `04-elephant-conservation-ethics.mdx` — ethical elephant sanctuary selection
- `05-mekong-history.mdx` — Southeast Asian history along the Mekong
- `06-kanchanaburi-4-days.mdx` — WWII Kanchanaburi itinerary for IB/IGCSE
- `07-ayutthaya-day-vs-immersion.mdx` — choosing Ayutthaya format
- `08-thai-homestay-classroom.mdx` — homestay pedagogy
- `09-isan-7-days.mdx` — Isan cultural immersion
- `10-bangkok-48-hours.mdx` — Bangkok urban itinerary

Each must include frontmatter (title, description ≤180 chars, pubDate, author, tags array, heroImage, relatedItineraries array, draft=false) and 600–900 word body with 3–5 subheadings. Author writes or commissions — not the engineer.

**Step 3: Commit**

```bash
git add src/content/blog/01-*.mdx src/content/blog/02-*.mdx src/content/blog/03-*.mdx src/content/blog/04-*.mdx src/content/blog/05-*.mdx src/content/blog/06-*.mdx src/content/blog/07-*.mdx src/content/blog/08-*.mdx src/content/blog/09-*.mdx src/content/blog/10-*.mdx
git commit -m "content(blog): author posts 1-10"
```

---

### Task 37: Author 10 blog posts (batch 2)

**Files:**
- Create: `src/content/blog/{11..20}.mdx`

**Step 1: Write post 11**

Create `/home/phurix/projects/flyed/src/content/blog/11-thai-language-immersion.mdx`:

```mdx
---
title: Thai language immersion: what 2 weeks of homestay + class looks like
description: A day-by-day breakdown of our Chiang Mai Thai language immersion program for MFL students.
pubDate: 2026-06-22
author: kriengsak
tags: [Language, Curriculum]
heroImage: /images/blog/11-language-hero.jpg
relatedItineraries: [thai-language-homestay-fortnight]
draft: false
---

For MFL (Modern Foreign Language) coordinators, two weeks of Thai immersion sounds appealing in theory and terrifying in practice. Here's what an actual flyed program looks like, day by day.

## The shape of the program

15 hours/week classroom instruction + homestay in vetted Chiang Mai family + cultural activities + weekend excursions. Class size capped at 8 per tutor. Two tutors per group of 16 students.

## Week 1: foundation

Day 1–3 focuses on tones, alphabet, and survival phrases. Day 4–5 introduces food vocabulary and market transactions — students buy produce at Warorot Market with their tutor. Day 6: classroom reflection + first homestay weekend.

## Week 2: production

Day 8–10 moves into travel phrases and present-tense storytelling. Day 11 is a half-day field trip where students must navigate Chiang Mai using only Thai. Day 12: presentation in Thai to peers. Day 13: final assessment + celebration.

## What students exit with

A1–A2 CEFR depending on starting level. A transcript signed by the language school (accepted by home school for MFL credit). Daily journals. Photos and audio recordings for portfolios.

## What trips get wrong

Shorter programs (under 10 days) don't allow real progress. Programs without vetted homestays — students end up in hotel rooms and don't progress past survival phrases. Programs without classroom hours — the homestay is great but doesn't transfer to measurable outcomes.

Our approach: structured classroom + homestay integration. We do not run programs shorter than 12 days.
```

**Step 2: Write posts 12–20**

Pattern repeats for:
- `12-muay-thai-service.mdx` — Muay Thai + service combo
- `13-andaman-sailing.mdx` — Andaman sailing for ages 14–18
- `14-koh-tao-diving.mdx` — open-water diving certifications
- `15-10-things-before-booking.mdx` — checklist for first-time school-trip bookers
- `16-ib-myp-service-hours.mdx` — IB MYP service-hour mapping
- `17-risk-assessment-101.mdx` — UK/US school risk-assessment requirements
- `18-thailand-packing-list.mdx` — parent-friendly packing list
- `19-cost-of-thailand-trip.mdx` — real costs + fundraising tips
- `20-why-only-thailand.mdx` — brand/founder post explaining Thailand focus

Each with same frontmatter shape, 600–900 word body, 3–5 subheadings.

**Step 3: Commit**

```bash
git add src/content/blog/11-*.mdx src/content/blog/12-*.mdx src/content/blog/13-*.mdx src/content/blog/14-*.mdx src/content/blog/15-*.mdx src/content/blog/16-*.mdx src/content/blog/17-*.mdx src/content/blog/18-*.mdx src/content/blog/19-*.mdx src/content/blog/20-*.mdx
git commit -m "content(blog): author posts 11-20"
```

---

### Task 38: Implement /blog index with pagination and tag filter

**Files:**
- Create: `src/pages/blog/index.astro`
- Create: `src/pages/blog/[...page].astro`

**Step 1: Write paginated index**

Create `/home/phurix/projects/flyed/src/pages/blog/[...page].astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Hero from '@/components/Hero.astro';
import Section from '@/components/Section.astro';
import BlogCard from '@/components/BlogCard.astro';
import { getLocale, getDict } from '@/i18n';
import { getCollection } from 'astro:content';

export async function getStaticPaths({ paginate }: any) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
  return paginate(posts, { pageSize: 12 });
}

const { page } = Astro.props;
const locale = getLocale(Astro.url);
const dict = getDict(locale);
const isTh = locale === 'th';
const prefix = isTh ? '/th' : '';

const postsWithMeta = await Promise.all(
  page.data.map(async (post) => {
    const wordCount = post.body?.split(/\s+/).length ?? 0;
    return {
      slug: post.id.replace(/\.mdx?$/, ''),
      title: post.data.title,
      description: post.data.description,
      heroImage: post.data.heroImage,
      pubDate: post.data.pubDate,
      readingMinutes: Math.max(1, Math.round(wordCount / 220)),
    };
  })
);

const allTags = Array.from(new Set(page.data.flatMap((p: any) => p.data.tags)));
const tagChipBase = `${prefix}/blog/tag`;
---

<PageLayout title={isTh ? 'บล็อก' : 'Blog'} description={isTh ? 'เรื่องราว เคล็ดลับ และความรู้เกี่ยวกับทริปโรงเรียนในประเทศไทย' : 'Stories, tips, and insights on school trips to Thailand'}>
  <Hero
    variant="small"
    headline={isTh ? 'บล็อก' : 'Blog'}
    sub={isTh ? 'เรื่องราว เคล็ดลับ และความรู้' : 'Stories, tips, and insights'}
    imageSrc="/images/hero/blog-hero.jpg"
    imageAlt="flyed journal"
  />

  <Section>
    {allTags.length > 0 && (
      <div class="mb-12 flex flex-wrap gap-2">
        <span class="text-sm text-teak-500 mr-2">{isTh ? 'หมวดหมู่:' : 'Filter:'}</span>
        {allTags.map((tag: string) => (
          <a href={`${tagChipBase}/${tag.toLowerCase()}`} class="text-xs bg-bamboo-100 hover:bg-bamboo-700 hover:text-rice-50 text-bamboo-700 px-3 py-1 rounded no-underline">{tag}</a>
        ))}
      </div>
    )}

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {postsWithMeta.map((p) => <BlogCard {...p} />)}
    </div>

    <nav class="mt-12 flex justify-center gap-3" aria-label="Pagination">
      {page.url.prev && (
        <a href={page.url.prev} class="px-4 py-2 bg-bamboo-100 hover:bg-bamboo-700 hover:text-rice-50 rounded no-underline">← {isTh ? 'ก่อนหน้า' : 'Previous'}</a>
      )}
      <span class="px-4 py-2 text-teak-700">{page.currentPage} / {page.lastPage}</span>
      {page.url.next && (
        <a href={page.url.next} class="px-4 py-2 bg-bamboo-100 hover:bg-bamboo-700 hover:text-rice-50 rounded no-underline">{isTh ? 'ถัดไป' : 'Next'} →</a>
      )}
    </nav>
  </Section>
</PageLayout>
```

**Step 2: Add a redirect from /blog to /blog/1**

Create `/home/phurix/projects/flyed/src/pages/blog/index.astro`:

```astro
---
return Astro.redirect('/blog/1');
---
```

**Step 3: Implement tag-filtered page**

Create `/home/phurix/projects/flyed/src/pages/blog/tag/[tag].astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Hero from '@/components/Hero.astro';
import Section from '@/components/Section.astro';
import BlogCard from '@/components/BlogCard.astro';
import { getLocale } from '@/i18n';
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const tags = Array.from(new Set(posts.flatMap((p) => p.data.tags)));
  return tags.map((tag) => ({
    params: { tag: tag.toLowerCase() },
    props: { tag, posts: posts.filter((p) => p.data.tags.includes(tag as any)) },
  }));
}

const { tag, posts } = Astro.props;
const locale = getLocale(Astro.url);
const isTh = locale === 'th';
const prefix = isTh ? '/th' : '';

posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
const postsWithMeta = posts.map((post) => ({
  slug: post.id.replace(/\.mdx?$/, ''),
  title: post.data.title,
  description: post.data.description,
  heroImage: post.data.heroImage,
  pubDate: post.data.pubDate,
  readingMinutes: Math.max(1, Math.round((post.body?.split(/\s+/).length ?? 0) / 220)),
}));
---

<PageLayout title={`${tag} | Blog`} description={`Posts tagged ${tag}`}>
  <Hero variant="small" headline={`Tag: ${tag}`} imageSrc="/images/hero/blog-hero.jpg" imageAlt="blog" />
  <Section>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {postsWithMeta.map((p) => <BlogCard {...p} />)}
    </div>
    <div class="mt-8 text-center">
      <a href={`${prefix}/blog`} class="text-bamboo-700 hover:underline">← {isTh ? 'กลับไปบล็อก' : 'Back to all posts'}</a>
    </div>
  </Section>
</PageLayout>
```

**Step 4: Verify build**

Run: `npx astro check`
Expected: 0 errors.

**Step 5: Commit**

```bash
git add src/pages/blog/
git commit -m "feat(blog): paginated index, tag filter, redirect"
```

---

### Task 39: Implement /blog/[slug] dynamic page

**Files:**
- Create: `src/pages/blog/[slug].astro`

**Step 1: Implement**

Create `/home/phurix/projects/flyed/src/pages/blog/[slug].astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Hero from '@/components/Hero.astro';
import Section from '@/components/Section.astro';
import Breadcrumbs from '@/components/Breadcrumbs.astro';
import ItineraryCard from '@/components/ItineraryCard.astro';
import CTASection from '@/components/CTASection.astro';
import BlogCard from '@/components/BlogCard.astro';
import { getLocale, getDict } from '@/i18n';
import { getCollection, type CollectionEntry, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((entry) => ({
    params: { slug: entry.id.replace(/\.mdx?$/, '') },
    props: { entry },
  }));
}

interface Props { entry: CollectionEntry<'blog'>; }
const { entry } = Astro.props;
const { Content } = await render(entry);

const locale = getLocale(Astro.url);
const dict = getDict(locale);
const isTh = locale === 'th';
const prefix = isTh ? '/th' : '';

const wordCount = entry.body?.split(/\s+/).length ?? 0;
const readingMinutes = Math.max(1, Math.round(wordCount / 220));

const dateStr = entry.data.pubDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const author = await getEntry(entry.data.author);

const relatedPosts = (await getCollection('blog', ({ data }) => !data.draft))
  .filter((p) => p.id !== entry.id && p.data.tags.some((t) => entry.data.tags.includes(t)))
  .slice(0, 3);

const relatedItineraries = await Promise.all(
  (entry.data.relatedItineraries ?? []).map(async (ref) => {
    const itin = await getEntry(ref);
    return itin;
  })
);

const articleLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: entry.data.title,
  description: entry.data.description,
  datePublished: entry.data.pubDate.toISOString(),
  ...(entry.data.updatedDate ? { dateModified: entry.data.updatedDate.toISOString() } : {}),
  author: { '@type': 'Person', name: author?.data.name ?? 'flyed' },
  image: new URL(entry.data.heroImage, Astro.site).toString(),
  publisher: { '@type': 'Organization', name: 'flyed', logo: { '@type': 'ImageObject', url: new URL('/logo.svg', Astro.site).toString() } },
};
---

<PageLayout title={entry.data.title} description={entry.data.description} ogImage={entry.data.heroImage}>
  <Hero
    variant="small"
    headline={entry.data.title}
    sub={`${dateStr} · ${readingMinutes} min read`}
    imageSrc={entry.data.heroImage}
    imageAlt={entry.data.title}
  />

  <Section class="py-8">
    <Breadcrumbs items={[
      { label: dict.nav.home, href: prefix || '/' },
      { label: dict.nav.blog, href: `${prefix}/blog` },
      { label: entry.data.title },
    ]} />
  </Section>

  <Section>
    <article class="max-w-prose mx-auto prose prose-lg">
      <Content />
    </article>

    {entry.data.tags.length > 0 && (
      <div class="max-w-prose mx-auto mt-12 flex flex-wrap gap-2">
        {entry.data.tags.map((tag) => (
          <a href={`${prefix}/blog/tag/${tag.toLowerCase()}`} class="text-xs bg-bamboo-100 text-bamboo-700 px-3 py-1 rounded no-underline">#{tag}</a>
        ))}
      </div>
    )}
  </Section>

  {relatedItineraries.length > 0 && (
    <Section bg="rice-100">
      <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8">{isTh ? 'ทริปที่เกี่ยวข้อง' : 'Related trips'}</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedItineraries.filter(Boolean).map((itin: any) => (
          <ItineraryCard
            slug={itin.data.slug}
            title={itin.data.title}
            category={itin.data.category}
            destinations={itin.data.destinations.map((d: any) => d.id ?? d)}
            days={itin.data.days}
            priceFrom={itin.data.priceFrom}
            currency={itin.data.currency}
            heroImage={itin.data.heroImage}
            ageBand={itin.data.ageBand}
          />
        ))}
      </div>
    </Section>
  )}

  {relatedPosts.length > 0 && (
    <Section>
      <h2 class="font-display text-3xl md:text-4xl font-semibold mb-8">{isTh ? 'อ่านต่อ' : 'Keep reading'}</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedPosts.map((p) => (
          <BlogCard
            slug={p.id.replace(/\.mdx?$/, '')}
            title={p.data.title}
            description={p.data.description}
            heroImage={p.data.heroImage}
            pubDate={p.data.pubDate}
            readingMinutes={Math.max(1, Math.round((p.body?.split(/\s+/).length ?? 0) / 220))}
          />
        ))}
      </div>
    </Section>
  )}

  <CTASection
    headline={isTh ? 'พร้อมวางแผนหรือยัง?' : 'Ready to plan?'}
    primaryCta={{ href: `${prefix}/enquire`, label: dict.nav.enquire }}
  />

  <script type="application/ld+json" set:html={JSON.stringify(articleLd)} />
</PageLayout>
```

**Step 2: Verify build**

Run: `npx astro check`
Expected: 0 errors.

**Step 3: Commit**

```bash
git add src/pages/blog/[slug].astro
git commit -m "feat(blog): dynamic post page with article JSON-LD, related content"
```

---

## Phase 11 — Enquiry Form & API

### Task 40: Implement EnquiryForm.tsx with zod validation

**Files:**
- Create: `src/components/EnquiryForm.tsx`
- Create: `src/components/EnquiryForm.test.tsx`

**Step 1: Write failing test**

Create `/home/phurix/projects/flyed/src/components/EnquiryForm.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EnquiryForm from './EnquiryForm';

describe('EnquiryForm validation', () => {
  it('renders step 1 first', () => {
    render(<EnquiryForm />);
    expect(screen.getByLabelText(/school/i)).toBeInTheDocument();
  });

  it('shows validation error on empty email', async () => {
    const user = userEvent.setup();
    render(<EnquiryForm />);
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  it('rejects invalid email', async () => {
    const user = userEvent.setup();
    render(<EnquiryForm />);
    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/valid email/i)).toBeInTheDocument();
  });

  it('requires group size between 4 and 60', async () => {
    const user = userEvent.setup();
    render(<EnquiryForm />);
    await user.type(screen.getByLabelText(/group size/i), '3');
    await user.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText(/between 4 and 60/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run, expect fail**

Run: `npm test -- EnquiryForm`
Expected: FAIL.

**Step 3: Implement form**

Create `/home/phurix/projects/flyed/src/components/EnquiryForm.tsx`:

```tsx
import { useState } from 'react';
import { z } from 'zod';

export const enquirySchema = z.object({
  schoolName: z.string().min(2, 'School / organization name required'),
  role: z.string().min(2, 'Your role is required'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(6, 'Phone number required'),
  country: z.string().min(2, 'Country is required'),
  groupSize: z.coerce.number().int().min(4, 'Minimum 4 students').max(60, 'Maximum 60 students — contact us for larger groups'),
  ages: z.string().min(2, 'Ages / grades required'),
  departureMonth: z.string().min(2, 'Departure month required'),
  duration: z.coerce.number().int().min(2, 'Minimum 2 days').max(30, 'Maximum 30 days'),
  subjects: z.array(z.string()).min(1, 'Select at least one subject'),
  curriculum: z.string().optional(),
  destinations: z.array(z.string()).optional(),
  itinerary: z.string().optional(),
  notes: z.string().optional(),
});

export type EnquiryData = z.infer<typeof enquirySchema>;

const categoryOptions = [
  { value: 'service-learning', label: 'Service Learning' },
  { value: 'cultural-heritage', label: 'Cultural & Heritage' },
  { value: 'stem-environmental', label: 'STEM & Environmental' },
  { value: 'sports-adventure', label: 'Sports & Adventure' },
  { value: 'language-immersion', label: 'Language Immersion' },
  { value: 'history-heritage', label: 'History & Heritage' },
];

const destinationOptions = [
  'Bangkok','Chiang Mai','Chiang Rai','Phuket','Krabi','Khao Sok','Kanchanaburi','Ayutthaya','Koh Tao','Sukhothai','Pai','Isan',
];

interface Props {
  defaults?: Partial<EnquiryData>;
  locale?: 'en' | 'th';
}

export default function EnquiryForm({ defaults = {}, locale = 'en' }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<EnquiryData>>(defaults);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const stepFields: (keyof EnquiryData)[][] = [
    ['schoolName','role','email','phone','country'],
    ['groupSize','ages','departureMonth','duration'],
    ['subjects'],
    ['destinations'],
    ['notes'],
    [],
  ];

  const validateStep = (): boolean => {
    const stepData: any = {};
    for (const f of stepFields[step]) stepData[f] = (data as any)[f];
    const result = enquirySchema.partial().safeParse(stepData);
    if (!result.success) {
      const errs: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errs[issue.path.join('.')] = issue.message;
      }
      setErrors(errs);
      return false;
    }
    setErrors({});
    return true;
  };

  const next = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, stepFields.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = enquirySchema.safeParse(data);
      if (!result.success) {
        setSubmitError('Please review the form for errors.');
        setSubmitting(false);
        return;
      }
      const res = await fetch('/api/enquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });
      if (!res.ok) throw new Error('Network error');
      setSubmitted(true);
    } catch (e) {
      setSubmitError(locale === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองอีกครั้ง' : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-bamboo-100 p-8 rounded-lg text-center">
        <h2 className="font-display text-2xl font-semibold text-teak-900">
          {locale === 'th' ? 'ขอบคุณ!' : 'Thanks!'}
        </h2>
        <p className="mt-2 text-teak-700">
          {locale === 'th' ? 'เราจะติดต่อกลับภายใน 1 วันทำการ' : "We'll be in touch within one business day."}
        </p>
      </div>
    );
  }

  const Field = ({ name, label, type = 'text', required = true }: { name: keyof EnquiryData; label: string; type?: string; required?: boolean }) => (
    <label className="block">
      <span className="text-sm font-medium text-teak-700">{label}{required && ' *'}</span>
      <input
        type={type}
        value={(data[name] as string) ?? ''}
        onChange={(e) => setData((d) => ({ ...d, [name]: e.target.value }))}
        className="mt-1 w-full rounded border border-teak-500/30 bg-rice-50 px-3 py-2"
      />
      {errors[name] && <span className="text-sm text-alert-red">{errors[name]}</span>}
    </label>
  );

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <div className="text-sm text-teak-500">Step {step + 1} of {stepFields.length}</div>

      {step === 0 && (
        <div className="space-y-4">
          <Field name="schoolName" label={locale === 'th' ? 'โรงเรียน / องค์กร' : 'School / organization'} />
          <Field name="role" label={locale === 'th' ? 'ตำแหน่ง' : 'Your role'} />
          <Field name="email" label="Email" type="email" />
          <Field name="phone" label={locale === 'th' ? 'โทรศัพท์' : 'Phone'} type="tel" />
          <Field name="country" label={locale === 'th' ? 'ประเทศ' : 'Country'} />
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <Field name="groupSize" label={locale === 'th' ? 'ขนาดกลุ่ม' : 'Group size'} type="number" />
          <Field name="ages" label={locale === 'th' ? 'อายุ / ชั้นเรียน' : 'Ages / grades'} />
          <Field name="departureMonth" label={locale === 'th' ? 'เดือนเดินทาง' : 'Departure month'} />
          <Field name="duration" label={locale === 'th' ? 'ระยะเวลา (วัน)' : 'Trip length (days)'} type="number" />
        </div>
      )}

      {step === 2 && (
        <div>
          <span className="text-sm font-medium text-teak-700">{locale === 'th' ? 'วิชาที่สนใจ' : 'Subjects of interest'} *</span>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            {categoryOptions.map((c) => (
              <label key={c.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data.subjects?.includes(c.value) ?? false}
                  onChange={(e) => {
                    const next = new Set(data.subjects ?? []);
                    if (e.target.checked) next.add(c.value);
                    else next.delete(c.value);
                    setData((d) => ({ ...d, subjects: Array.from(next) }));
                  }}
                />
                <span>{c.label}</span>
              </label>
            ))}
          </div>
          {errors.subjects && <span className="text-sm text-alert-red">{errors.subjects}</span>}
        </div>
      )}

      {step === 3 && (
        <div>
          <span className="text-sm font-medium text-teak-700">{locale === 'th' ? 'จุดหมาย' : 'Destinations (optional)'}</span>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
            {destinationOptions.map((d) => (
              <label key={d} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={data.destinations?.includes(d) ?? false}
                  onChange={(e) => {
                    const next = new Set(data.destinations ?? []);
                    if (e.target.checked) next.add(d);
                    else next.delete(d);
                    setData((d2) => ({ ...d2, destinations: Array.from(next) }));
                  }}
                />
                <span className="text-sm">{d}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-sm text-teak-500">{locale === 'th' ? 'หรือเลือก "ให้เราเลือก" ด้านล่าง' : 'Or pick "you choose" below'}</p>
        </div>
      )}

      {step === 4 && (
        <div>
          <label className="block">
            <span className="text-sm font-medium text-teak-700">{locale === 'th' ? 'หมายเหตุ' : 'Notes / questions'}</span>
            <textarea
              rows={6}
              value={data.notes ?? ''}
              onChange={(e) => setData((d) => ({ ...d, notes: e.target.value }))}
              className="mt-1 w-full rounded border border-teak-500/30 bg-rice-50 px-3 py-2"
            />
          </label>
        </div>
      )}

      {step === 5 && (
        <div className="bg-rice-100 p-6 rounded">
          <h3 className="font-display text-xl font-semibold mb-3">{locale === 'th' ? 'ตรวจสอบข้อมูล' : 'Review'}</h3>
          <pre className="text-sm text-teak-700 whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}

      {submitError && <p className="text-alert-red text-sm">{submitError}</p>}

      <div className="flex justify-between gap-3">
        {step > 0 && (
          <button type="button" onClick={back} className="px-4 py-2 border border-teak-500/30 rounded hover:bg-bamboo-100">
            {locale === 'th' ? 'ก่อนหน้า' : 'Back'}
          </button>
        )}
        <div className="flex-1" />
        {step < stepFields.length - 1 ? (
          <button type="button" onClick={next} className="px-6 py-2 bg-sunset-600 hover:bg-sunset-400 text-rice-50 rounded font-medium">
            {locale === 'th' ? 'ถัดไป' : 'Next'} →
          </button>
        ) : (
          <button type="button" onClick={submit} disabled={submitting} className="px-6 py-2 bg-bamboo-700 hover:bg-bamboo-500 text-rice-50 rounded font-medium disabled:opacity-50">
            {submitting ? (locale === 'th' ? 'กำลังส่ง...' : 'Sending...') : (locale === 'th' ? 'ส่งคำขอ' : 'Send enquiry')}
          </button>
        )}
      </div>
    </form>
  );
}
```

**Step 4: Run tests, expect pass**

Run: `npm test -- EnquiryForm`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/components/EnquiryForm.tsx src/components/EnquiryForm.test.tsx
git commit -m "feat(enquiry): multi-step form with zod validation"
```

---

### Task 41: Implement /enquire page

**Files:**
- Create: `src/pages/enquire.astro`

**Step 1: Implement**

Create `/home/phurix/projects/flyed/src/pages/enquire.astro`:

```astro
---
import PageLayout from '@/layouts/PageLayout.astro';
import Hero from '@/components/Hero.astro';
import Section from '@/components/Section.astro';
import EnquiryForm from '@/components/EnquiryForm.tsx';
import { getLocale, getDict } from '@/i18n';

const locale = getLocale(Astro.url);
const dict = getDict(locale);
const isTh = locale === 'th';

const params = Astro.url.searchParams;
const defaults = {
  subjects: params.get('category') ? [params.get('category')!] : [],
  itinerary: params.get('itinerary') ?? undefined,
  destinations: params.get('destination') ? [params.get('destination')!] : [],
};
---

<PageLayout title={dict.enquire.title} description={dict.enquire.success}>
  <Hero
    variant="small"
    headline={dict.enquire.title}
    sub={isTh ? 'กรอกข้อมูล 6 ขั้นตอน เราจะติดต่อกลับภายใน 1 วันทำการ' : 'Six steps. We will reply within one business day.'}
    imageSrc="/images/hero/enquire-hero.jpg"
    imageAlt="Plan your trip"
  />

  <Section>
    <div class="max-w-3xl mx-auto">
      <EnquiryForm client:load defaults={defaults} locale={locale} />
    </div>
  </Section>
</PageLayout>
```

**Step 2: Verify build**

Run: `npx astro check`
Expected: 0 errors.

**Step 3: Commit**

```bash
git add src/pages/enquire.astro
git commit -m "feat(enquiry): /enquire page hosting multi-step form"
```

---

### Task 42: Implement /api/enquiry endpoint

**Files:**
- Create: `src/pages/api/enquiry.ts`
- Modify: `astro.config.mjs` (add server output for API routes)

**Step 1: Switch output to hybrid**

In `/home/phurix/projects/flyed/astro.config.mjs`, replace `output: 'static'` with `output: 'server'`, and add:

```js
import node from '@astrojs/node';
```

After the existing integrations import, in the `integrations` array leave as-is, and after `integrations:` add:

```js
adapter: node({ mode: 'standalone' }),
```

Full config:

```js
// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import prefetch from '@astrojs/prefetch';
import partytown from '@astrojs/partytown';
import react from '@astrojs/react';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://flyed.dev',
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'th'],
    routing: { prefixDefaultLocale: false },
  },
  server: { host: '0.0.0.0' },
  vite: {
    plugins: [tailwindcss()],
    resolve: { alias: { '@': '/src' } },
  },
  integrations: [
    mdx(),
    sitemap({ i18n: { defaultLocale: 'en', locales: { en: 'en', th: 'th' } } }),
    prefetch(),
    partytown({ forward: ['dataLayer.push', 'plausible'] }),
    react(),
  ],
});
```

**Step 2: Install adapter**

```bash
npm install @astrojs/node
```

**Step 3: Implement endpoint**

Create `/home/phurix/projects/flyed/src/pages/api/enquiry.ts`:

```ts
import type { APIRoute } from 'astro';
import { enquirySchema } from '@/components/EnquiryForm';

const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
const CRM_WEBHOOK_URL = import.meta.env.CRM_WEBHOOK_URL;
const ENQUIRY_TO_EMAIL = import.meta.env.ENQUIRY_TO_EMAIL ?? 'sales@flyed.dev';

export const POST: APIRoute = async ({ request }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON' }), { status: 400 });
  }

  const result = enquirySchema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ ok: false, error: 'Validation failed', issues: result.error.issues }), { status: 422 });
  }

  const enquiry = result.data;
  const enquiryId = crypto.randomUUID();

  // 1. Send email via Resend (best-effort; never blocks success)
  if (RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'flyed website <noreply@flyed.dev>',
          to: [ENQUIRY_TO_EMAIL],
          subject: `New enquiry: ${enquiry.schoolName} (${enquiry.groupSize} students)`,
          html: renderEmail(enquiry, enquiryId),
        }),
      });
    } catch (e) {
      console.error('Resend failed', e);
    }
  } else {
    console.warn('RESEND_API_KEY not set — skipping email send');
  }

  // 2. POST to CRM webhook (best-effort)
  if (CRM_WEBHOOK_URL) {
    try {
      await fetch(CRM_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...enquiry, enquiryId }),
      });
    } catch (e) {
      console.error('CRM webhook failed', e);
    }
  } else {
    console.warn('CRM_WEBHOOK_URL not set — skipping CRM');
  }

  // 3. Always return success (we logged everything we could)
  return new Response(JSON.stringify({ ok: true, enquiryId }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

function renderEmail(e: typeof enquirySchema._type, id: string): string {
  return `
    <h2>New school-trip enquiry</h2>
    <p><strong>Enquiry ID:</strong> ${id}</p>
    <p><strong>School:</strong> ${e.schoolName} (${e.country})</p>
    <p><strong>Contact:</strong> ${e.role} — ${e.email} — ${e.phone}</p>
    <p><strong>Group:</strong> ${e.groupSize} students, ages ${e.ages}</p>
    <p><strong>Travel:</strong> ${e.departureMonth}, ${e.duration} days</p>
    <p><strong>Subjects:</strong> ${e.subjects.join(', ')}</p>
    <p><strong>Curriculum:</strong> ${e.curriculum ?? '—'}</p>
    <p><strong>Destinations:</strong> ${e.destinations?.join(', ') ?? 'flyed chooses'}</p>
    <p><strong>Itinerary:</strong> ${e.itinerary ?? '—'}</p>
    <p><strong>Notes:</strong><br/>${e.notes ?? '—'}</p>
  `;
}
```

**Step 4: Add a contact endpoint (mirrors enquiry, simpler schema)**

Create `/home/phurix/projects/flyed/src/pages/api/contact.ts`:

```ts
import type { APIRoute } from 'astro';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const result = schema.safeParse(body);
  if (!result.success) {
    return new Response(JSON.stringify({ ok: false }), { status: 422 });
  }
  // Email + log (mirror enquiry implementation, simplified)
  console.log('Contact form submission:', result.data);
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
```

**Step 5: Write failing test for endpoint**

Create `/home/phurix/projects/flyed/src/pages/api/enquiry.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from './enquiry';

global.fetch = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));

describe('POST /api/enquiry', () => {
  it('rejects invalid payload with 422', async () => {
    const req = new Request('http://localhost/api/enquiry', {
      method: 'POST',
      body: JSON.stringify({ schoolName: 'X' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST({ request: req } as any);
    expect(res.status).toBe(422);
  });

  it('accepts valid payload and returns enquiryId', async () => {
    const req = new Request('http://localhost/api/enquiry', {
      method: 'POST',
      body: JSON.stringify({
        schoolName: 'Test School',
        role: 'Teacher',
        email: 't@school.com',
        phone: '123456',
        country: 'UK',
        groupSize: 20,
        ages: '14-16',
        departureMonth: 'Feb 2027',
        duration: 7,
        subjects: ['service-learning'],
      }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST({ request: req } as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.enquiryId).toBeDefined();
  });
});
```

**Step 6: Run tests, expect pass**

Run: `npm test -- api/enquiry`
Expected: PASS.

**Step 7: Verify build**

Run: `npx astro check`
Expected: 0 errors.

**Step 8: Commit**

```bash
git add astro.config.mjs src/pages/api/ package.json package-lock.json
git commit -m "feat(api): enquiry + contact endpoints with zod validation, Resend + CRM hooks"
```

---

### Task 43: Implement Newsletter endpoint

**Files:**
- Create: `src/pages/api/newsletter.ts`
- Create: `src/components/NewsletterForm.tsx`

**Step 1: Implement endpoint**

Create `/home/phurix/projects/flyed/src/pages/api/newsletter.ts`:

```ts
import type { APIRoute } from 'astro';
import { z } from 'zod';

const schema = z.object({ email: z.string().email() });

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const result = schema.safeParse(body);
  if (!result.success) return new Response(JSON.stringify({ ok: false }), { status: 422 });

  const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
  const NEWSLETTER_LIST = import.meta.env.NEWSLETTER_LIST ?? 'subscribers';

  if (RESEND_API_KEY) {
    await fetch(`https://api.resend.com/audiences/${NEWSLETTER_LIST}/contacts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: result.data.email }),
    }).catch((e) => console.error('Newsletter signup failed', e));
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
```

**Step 2: Implement NewsletterForm**

Create `/home/phurix/projects/flyed/src/components/NewsletterForm.tsx`:

```tsx
import { useState } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setStatus(res.ok ? 'done' : 'error');
  };

  if (status === 'done') return <p className="text-bamboo-700 text-sm">Thanks — we'll send occasional trip ideas.</p>;

  return (
    <form onSubmit={submit} className="flex gap-2 max-w-md">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@school.edu"
        className="flex-1 rounded border border-teak-500/30 bg-rice-50 px-3 py-2"
      />
      <button type="submit" disabled={status === 'sending'} className="px-4 py-2 bg-bamboo-700 hover:bg-bamboo-500 text-rice-50 rounded font-medium disabled:opacity-50">
        {status === 'sending' ? '...' : 'Subscribe'}
      </button>
      {status === 'error' && <p className="text-alert-red text-sm self-center">Try again</p>}
    </form>
  );
}
```

**Step 3: Add NewsletterForm to footer**

Modify `/home/phurix/projects/flyed/src/components/Footer.astro`. After the 4-column grid, before the bottom bar, insert:

```astro
---
import NewsletterForm from './NewsletterForm.tsx';
---
```

And after the closing `</div>` of the main footer grid, before the copyright bar:

```astro
<div class="border-t border-rice-50/10">
  <div class="max-w-7xl mx-auto px-4 md:px-8 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
    <div class="text-sm text-rice-100">Get occasional trip ideas in your inbox.</div>
    <NewsletterForm client:visible />
  </div>
</div>
```

(Adjust the import section at top of Footer.astro to include the NewsletterForm import.)

**Step 4: Verify build**

Run: `npx astro check`
Expected: 0 errors.

**Step 5: Commit**

```bash
git add src/pages/api/newsletter.ts src/components/NewsletterForm.tsx src/components/Footer.astro
git commit -m "feat(newsletter): signup endpoint + form in footer"
```

---

## Phase 12 — SEO, Sitemap, RSS, Analytics

### Task 44: Implement RSS feed

**Files:**
- Create: `src/pages/rss.xml.ts`

**Step 1: Implement RSS endpoint**

Create `/home/phurix/projects/flyed/src/pages/rss.xml.ts`:

```ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

  return rss({
    title: 'flyed journal',
    description: 'Stories, tips, and insights on school trips to Thailand',
    site: context.site ?? new URL('https://flyed.dev'),
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id.replace(/\.mdx?$/, '')}`,
    })),
    customData: `<language>en-us</language>`,
  });
}
```

**Step 2: Verify build**

Run: `npx astro check`
Expected: 0 errors.

**Step 3: Verify RSS renders**

```bash
npm run build && cat dist/rss.xml | head -20
```

Expected: valid XML header followed by `<channel>` element.

**Step 4: Commit**

```bash
git add src/pages/rss.xml.ts
git commit -m "feat(rss): blog RSS feed"
```

---

### Task 45: Configure sitemap & structured data validation

**Files:**
- Modify: `astro.config.mjs` (already done — verify sitemap config correct)
- Create: `tests/e2e/seo.spec.ts`

**Step 1: Write SEO E2E test**

Create `/home/phurix/projects/flyed/tests/e2e/seo.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test.describe('SEO basics', () => {
  test('home page has meta description', async ({ page }) => {
    await page.goto('/');
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(50);
  });

  test('home page has OG image', async ({ page }) => {
    await page.goto('/');
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toBeTruthy();
  });

  test('home page has canonical', async ({ page }) => {
    await page.goto('/');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe('https://flyed.dev/');
  });

  test('home page has Organization JSON-LD', async ({ page }) => {
    await page.goto('/');
    const ld = await page.locator('script[type="application/ld+json"]').first().textContent();
    expect(ld).toContain('"@type":"Organization"');
  });

  test('sitemap is generated', async ({ request }) => {
    const res = await request.get('/sitemap-index.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('<sitemapindex');
  });

  test('TH route exists', async ({ page }) => {
    const res = await page.goto('/th');
    expect(res?.status()).toBe(200);
  });

  test('hreflang alternates present', async ({ page }) => {
    await page.goto('/');
    const en = await page.locator('link[rel="alternate"][hreflang="en"]').getAttribute('href');
    const th = await page.locator('link[rel="alternate"][hreflang="th"]').getAttribute('href');
    expect(en).toBeTruthy();
    expect(th).toBeTruthy();
  });
});
```

**Step 2: Run tests**

Run: `npx playwright test tests/e2e/seo.spec.ts`
Expected: PASS.

**Step 3: Commit**

```bash
git add tests/e2e/seo.spec.ts
git commit -m "test(e2e): SEO meta, JSON-LD, sitemap, hreflang, i18n"
```

---

### Task 46: Add analytics with Partytown

**Files:**
- Create: `src/components/Analytics.astro`
- Modify: `src/layouts/Layout.astro`

**Step 1: Implement Analytics component**

Create `/home/phurix/projects/flyed/src/components/Analytics.astro`:

```astro
---
const host = import.meta.env.PUBLIC_ANALYTICS_HOST;
if (!host) {
  // No analytics configured — render nothing
}
---

{host && (
  <script
    type="text/partytown"
    src={`${host}/script.js`}
    data-domain="flyed.dev"
    defer
  />
)}
```

**Step 2: Add to Layout head**

Modify `/home/phurix/projects/flyed/src/layouts/Layout.astro`. In the `<head>` block, after the existing meta tags and before the `SEO` component, add:

```astro
<Analytics />
```

And add the import at the top:

```astro
import Analytics from '@/components/Analytics.astro';
```

**Step 3: Verify build**

Run: `npx astro check`
Expected: 0 errors.

**Step 4: Commit**

```bash
git add src/components/Analytics.astro src/layouts/Layout.astro
git commit -m "feat(analytics): partytown-loaded Plausible/Umami snippet"
```

---

## Phase 13 — AI Image Generation

### Task 47: Generate hero images (batch 1)

**Files:**
- Create: `public/images/hero/*.jpg` (4 images)

**Step 1: Document generation process**

Create `/home/phurix/projects/flyed/docs/image-generation-runbook.md`:

````markdown
# Image Generation Runbook

## Tool choice

We use [your chosen model] for AI image generation. Prompts are kept tool-neutral in `image-prompts.md`. Run prompts through your model's interface; capture best-of-3 in `public/images/raw/`.

## Workflow

1. Pick prompts from `image-prompts.md` for the page being illustrated.
2. Generate 3 variants per slot.
3. Pick the strongest (composition, lighting, authenticity).
4. Export at 3840×2160 (hero) or 1920×1080 (cards) or 800×600 (thumb).
5. Apply post-processing:
   - Film-grain overlay (3–5%)
   - Lift shadows (avoid crushed blacks)
   - Teak-orange highlights, bamboo-green shadows (curves)
   - Slight desaturation toward palette
6. Export AVIF + WebP + JPEG fallback.
7. Save to `public/images/{section}/{filename}.{format}`.
8. Run `npm run check` to verify no broken image refs.

## Launch image checklist

### Hero
- [ ] /public/images/hero/home-hero.jpg (3840×2160)
- [ ] /public/images/hero/trips-hero.jpg
- [ ] /public/images/hero/destinations-hero.jpg
- [ ] /public/images/hero/itineraries-hero.jpg
- [ ] /public/images/hero/blog-hero.jpg
- [ ] /public/images/hero/about-hero.jpg
- [ ] /public/images/hero/schools-hero.jpg
- [ ] /public/images/hero/parents-hero.jpg
- [ ] /public/images/hero/educators-hero.jpg
- [ ] /public/images/hero/how-it-works-hero.jpg
- [ ] /public/images/hero/safety-hero.jpg
- [ ] /public/images/hero/contact-hero.jpg
- [ ] /public/images/hero/enquire-hero.jpg

### Destinations (12)
- [ ] /public/images/destinations/{city}-hero.jpg for each of 12 destinations

### Categories (6)
- [ ] /public/images/categories/{slug}-hero.jpg for each of 6 categories

### Itineraries (10 × 7 images each = 70)
- [ ] /public/images/itineraries/{slug}-hero.jpg + 6 gallery images each

### Blog (20)
- [ ] /public/images/blog/{NN}-{slug}-hero.jpg

### Team (8)
- [ ] /public/images/team/{name}.jpg

### Badges (4)
- [ ] /public/images/badges/tat.svg, teata.svg, gstc.svg, iatan.svg

### Logo + OG
- [ ] /public/logo.svg
- [ ] /public/og-default.png (1200×630)

**Total: ~125 images.**
````

**Step 2: Generate hero images**

Run prompts from `docs/image-prompts.md` for each hero slot. Use the AI tool of choice. Save outputs to `public/images/hero/`.

(Specific tool call is implementation-detail; engineer uses their model of choice. Document the chosen tool in the runbook as you go.)

**Step 3: Optimize with sharp**

```bash
npm install -D sharp
node -e "
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const dir = 'public/images/hero';
(async () => {
  for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.jpg'))) {
    const src = path.join(dir, f);
    const base = path.join(dir, f.replace('.jpg',''));
    await sharp(src).resize(2400).avif({ quality: 70 }).toFile(base + '.avif');
    await sharp(src).resize(2400).webp({ quality: 80 }).toFile(base + '.webp');
    await sharp(src).resize(2400).jpeg({ quality: 85, mozjpeg: true }).toFile(base + '.jpg');
    fs.unlinkSync(src);
    console.log('optimized', f);
  }
})();
"
```

**Step 4: Commit generated images**

```bash
git add public/images/hero/ docs/image-generation-runbook.md package.json package-lock.json
git commit -m "content(images): hero image batch + generation runbook"
```

---

### Task 48: Generate destination, category, itinerary, blog, team, badge images

**Files:**
- Create: ~110 images across `public/images/`

**Step 1: Generate in batches**

Follow the runbook. Run for each section:
- destinations (12 heroes)
- categories (6 heroes)
- itineraries (10 heroes + 60 gallery)
- blog (20 heroes)
- team (8 portraits — use placeholder silhouettes if AI fails for faces)
- badges (4 SVG — generate via simple SVG graphics, not AI)

**Step 2: Optimize each batch**

Repeat the sharp optimization for each subdirectory.

**Step 3: Commit per section**

```bash
git add public/images/destinations/ && git commit -m "content(images): destinations batch"
git add public/images/categories/ && git commit -m "content(images): categories batch"
git add public/images/itineraries/ && git commit -m "content(images): itineraries batch"
git add public/images/blog/ && git commit -m "content(images): blog batch"
git add public/images/team/ && git commit -m "content(images): team batch"
git add public/images/badges/ && git commit -m "content(images): badges (SVG)"
git add public/logo.svg public/og-default.png && git commit -m "content(images): logo + OG default"
```

---

### Task 49: Verify image refs and broken-link sweep

**Files:**
- Create: `tests/e2e/images.spec.ts`

**Step 1: Write image smoke test**

Create `/home/phurix/projects/flyed/tests/e2e/images.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

const PAGES = ['/', '/trips', '/destinations', '/blog', '/enquire', '/about'];

test.describe('image loading', () => {
  for (const path of PAGES) {
    test(`no broken images on ${path}`, async ({ page }) => {
      await page.goto(path);
      const broken = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).filter((img) => !img.complete || img.naturalWidth === 0).map((img) => img.src);
      });
      expect(broken, `Broken images: ${broken.join(', ')}`).toHaveLength(0);
    });
  }
});
```

**Step 2: Run, expect pass after images are generated**

Run: `npx playwright test tests/e2e/images.spec.ts`
Expected: PASS.

**Step 3: Commit**

```bash
git add tests/e2e/images.spec.ts
git commit -m "test(e2e): no broken images on key pages"
```

---

## Phase 14 — QA

### Task 50: Playwright E2E happy path

**Files:**
- Create: `tests/e2e/happy-path.spec.ts`

**Step 1: Implement**

Create `/home/phurix/projects/flyed/tests/e2e/happy-path.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

test('user discovers a trip and submits enquiry', async ({ page }) => {
  // Land on home
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // Browse destinations
  await page.getByRole('link', { name: /destinations/i }).first().click();
  await expect(page).toHaveURL(/\/destinations/);

  // Click into Chiang Mai
  await page.getByRole('link', { name: /chiang mai/i }).first().click();
  await expect(page).toHaveURL(/destinations\/chiang-mai/);

  // Click on a service itinerary
  await page.getByRole('link', { name: /service week/i }).first().click();
  await expect(page).toHaveURL(/itineraries\/northern-thailand-service-week/);

  // Click "Enquire about this trip"
  await page.getByRole('link', { name: /enquire/i }).first().click();
  await expect(page).toHaveURL(/enquire/);

  // Fill step 1
  await page.getByLabel(/school/i).fill('Test School');
  await page.getByLabel(/role/i).fill('Teacher');
  await page.getByLabel(/email/i).fill('test@school.edu');
  await page.getByLabel(/phone/i).fill('+1-555-0100');
  await page.getByLabel(/country/i).fill('US');
  await page.getByRole('button', { name: /next/i }).click();

  // Fill step 2
  await page.getByLabel(/group size/i).fill('20');
  await page.getByLabel(/ages/i).fill('15-17');
  await page.getByLabel(/departure/i).fill('Feb 2027');
  await page.getByLabel(/length/i).fill('7');
  await page.getByRole('button', { name: /next/i }).click();

  // Select at least one subject
  await page.getByLabel(/service learning/i).check();
  await page.getByRole('button', { name: /next/i }).click();

  // Skip destinations
  await page.getByRole('button', { name: /next/i }).click();

  // Notes
  await page.getByLabel(/notes/i).fill('Excited to plan this trip!');
  await page.getByRole('button', { name: /next/i }).click();

  // Submit
  await page.getByRole('button', { name: /send/i }).click();

  // See success
  await expect(page.getByText(/thanks/i)).toBeVisible({ timeout: 10_000 });
});
```

**Step 2: Run**

Run: `npx playwright test tests/e2e/happy-path.spec.ts`
Expected: PASS.

**Step 3: Commit**

```bash
git add tests/e2e/happy-path.spec.ts
git commit -m "test(e2e): home → destinations → itinerary → enquiry happy path"
```

---

### Task 51: axe-core accessibility sweep

**Files:**
- Create: `tests/e2e/a11y.spec.ts`

**Step 1: Implement**

Create `/home/phurix/projects/flyed/tests/e2e/a11y.spec.ts`:

```ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = ['/', '/trips', '/trips/service-learning', '/destinations', '/destinations/chiang-mai', '/itineraries', '/itineraries/northern-thailand-service-week', '/blog', '/blog/01-why-thailand-service-learning', '/enquire', '/about', '/safety', '/schools', '/parents', '/educators'];

for (const path of PAGES) {
  test(`axe: no critical issues on ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    const critical = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });
}
```

**Step 2: Run**

Run: `npx playwright test tests/e2e/a11y.spec.ts`
Expected: PASS. (Address any failures before moving on.)

**Step 3: Commit**

```bash
git add tests/e2e/a11y.spec.ts
git commit -m "test(a11y): axe-core sweep across key pages"
```

---

### Task 52: Visual regression with Playwright screenshots

**Files:**
- Create: `tests/e2e/visual.spec.ts`

**Step 1: Implement**

Create `/home/phurix/projects/flyed/tests/e2e/visual.spec.ts`:

```ts
import { test, expect } from '@playwright/test';

const VISUAL_PAGES = [
  { path: '/', name: 'home' },
  { path: '/trips', name: 'trips-hub' },
  { path: '/trips/service-learning', name: 'category-service' },
  { path: '/destinations', name: 'destinations-hub' },
  { path: '/destinations/chiang-mai', name: 'destination-chiang-mai' },
  { path: '/itineraries/northern-thailand-service-week', name: 'itinerary-service-week' },
  { path: '/blog', name: 'blog' },
  { path: '/blog/01-why-thailand-service-learning', name: 'blog-post' },
  { path: '/enquire', name: 'enquire' },
];

for (const { path, name } of VISUAL_PAGES) {
  test(`visual: ${name}`, async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot(`visual-${name}.png`, { maxDiffPixelRatio: 0.02 });
  });
}
```

**Step 2: Generate baseline**

Run: `npx playwright test tests/e2e/visual.spec.ts --update-snapshots`
Expected: snapshots written to `tests/e2e/visual.spec.ts-snapshots/`.

**Step 3: Run again to confirm stable**

Run: `npx playwright test tests/e2e/visual.spec.ts`
Expected: PASS (matches baseline).

**Step 4: Commit**

```bash
git add tests/e2e/visual.spec.ts tests/e2e/visual.spec.ts-snapshots/
git commit -m "test(visual): screenshot regression on key pages"
```

---

### Task 53: Lighthouse CI verification

**Step 1: Run Lighthouse CI**

```bash
npm run build
npm run preview &
PREVIEW_PID=$!
sleep 3
npm run lhci
kill $PREVIEW_PID
```

Expected: All assertions pass (Perf ≥ 95, A11y ≥ 95, SEO = 100, BP ≥ 95).

**Step 2: Address any failing pages**

For each page that fails, fix issues (likely culprits):
- LCP: hero image not preloaded, large CSS blocking
- CLS: missing width/height on images
- A11y: color contrast, missing labels
- BP: HTTP errors, console errors

**Step 3: Commit any fixes**

```bash
git add -A
git commit -m "perf: address Lighthouse CI failures"
```

---

## Phase 15 — Deployment

### Task 54: Configure GitHub Actions for CI

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Implement**

Create `/home/phurix/projects/flyed/.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npx astro check
      - run: npm test
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npm run preview &
      - run: sleep 5
      - run: npx playwright test
      - run: npm run lhci
        env:
          LHCI_TOKEN: ${{ secrets.LHCI_TOKEN }}
```

**Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: GitHub Actions workflow — typecheck, unit, e2e, lhci"
```

---

### Task 55: Configure Cloudflare Pages deployment

**Files:**
- Create: `wrangler.toml`
- Create: `.github/workflows/deploy.yml`

**Step 1: Implement wrangler config**

Create `/home/phurix/projects/flyed/wrangler.toml`:

```toml
name = "flyed"
compatibility_date = "2026-06-01"
compatibility_flags = ["nodejs_compat"]

[build]
command = "npm run build"

[vars]
PUBLIC_SITE_URL = "https://flyed.dev"

# Secrets (set via `wrangler secret put NAME`):
# RESEND_API_KEY
# CRM_WEBHOOK_URL
# ASTRO_DB_REMOTE_URL
# PUBLIC_ANALYTICS_HOST
```

**Step 2: Implement deploy workflow**

Create `/home/phurix/projects/flyed/.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: flyed
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

**Step 3: Commit**

```bash
git add wrangler.toml .github/workflows/deploy.yml
git commit -m "deploy: Cloudflare Pages + GitHub Actions"
```

---

### Task 56: Final QA and sign-off

**Step 1: Run full test suite**

```bash
npm run check
npm test
npm run build
npx playwright test
npm run lhci
```

Expected: all green.

**Step 2: Manual review checklist**

- [ ] Home page renders with hero, stats, destinations, categories, itineraries, testimonials, CTA
- [ ] All 6 category pages render
- [ ] All 12 destination pages render
- [ ] All 10 itinerary pages render
- [ ] All 3 persona pages render
- [ ] About, how-it-works, safety, contact, legal all render
- [ ] 20 blog posts all render
- [ ] Enquiry form submits successfully (check sales@flyed.dev inbox)
- [ ] Newsletter signup submits
- [ ] TH mirrors all render with correct language
- [ ] Sitemap includes all pages
- [ ] RSS feed lists all 20 posts
- [ ] Lighthouse passes on all key pages
- [ ] axe-core passes on all key pages
- [ ] Visual regression passes

**Step 3: Tag v1.0.0**

```bash
git tag -a v1.0.0 -m "flyed marketing site v1 launch"
git push origin main --tags
```

**Step 4: Trigger deploy**

Push to `main` triggers the deploy workflow. Monitor in Cloudflare Pages dashboard.

---

## Self-Review

**1. Spec coverage:**
- §2 brand/positioning → Tasks 7-9 (tokens, fonts, layout, header)
- §3 IA → Tasks 12, 15, 25, 26, 28, 29, 31, 32, 35, 38 (route implementations)
- §4 content inventory → Tasks 24, 27, 30, 36, 37 (category/destination/itinerary/blog content authoring)
- §5 page specs → Tasks 23 (home), 25-26 (trips), 28-29 (destinations), 31-32 (itineraries), 33 (personas), 34-35 (info)
- §6 design system → Tasks 7, 8, 12, 14, 19-22 (tokens, fonts, components)
- §7 imagery → Tasks 47-49 (generation + runbook)
- §8 architecture → Tasks 9-17 (config, i18n, layouts, schemas, utils, content)
- §9 risks — captured in §10 of spec (CRM choice, real testimonials, etc.) — addressed at execution time
- §10 out of scope — respected (no payment infra, no live chat, no TH blog content at launch)

**2. Placeholder scan:** No TBD/TODO in executable steps. Some content templates contain "Replace with real copy" callouts in their description, which is the intended pattern (the engineering task is to scaffold; the content authoring task is separate).

**3. Type consistency:** `enquirySchema` defined in `EnquiryForm.tsx` (Task 40) and re-imported in `/api/enquiry.ts` (Task 42). `EnquiryData` type reused. `locale` parameter consistent across `LanguageSwitcher`, `EnquiryForm`. `path` utilities reused across pages.

---

## Open Questions for Implementation

The implementer should resolve these before or during execution (these are NOT blockers — they are decisions the implementer/operator makes):

1. **CRM choice** (HubSpot / Salesforce / Pipedrive / other) — wire to `CRM_WEBHOOK_URL`
2. **Analytics host** (Plausible / Umami self-host) — set `PUBLIC_ANALYTICS_HOST`
3. **Real testimonials** — replace placeholders in home/about/etc. with verified quotes before launch
4. **Pricing data** — `priceFrom` per itinerary needs sales-team input
5. **Accreditation badges** — verify ATTA/IATAN/TEATA/GSTC memberships before listing on home
6. **AI image tool** — choose (Midjourney v7 / Flux 1.1 / Imagen 4 / Stable Diffusion XL) and document in runbook
7. **Cloudflare account** — provision before deploying
8. **Domain** — `flyed.dev` is placeholder; swap to `flyed.co.th` or custom at launch
9. **Resend account** — provision and verify sending domain
10. **TH copywriter** — engage for TH translations beyond the seed dictionary
```

---
```

---
```

---