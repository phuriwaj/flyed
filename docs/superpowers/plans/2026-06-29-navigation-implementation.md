# Navigation Component Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reusable Astro Navigation component with header/sidebar variants, mobile drawer/dropdown, auto-detecting active links, self-contained styles.

**Architecture:** Single `.astro` component with scoped styles, inline CSS custom properties for theming, vanilla JS mobile toggle via `<script>` tag. No external dependencies beyond Astro + Tailwind.

**Tech Stack:** Astro, Tailwind CSS v4 (inline utilities, no global vars), vanilla JS toggle

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/navigation/Navigation.astro` | Create | Full component logic + styles |
| `src/components/navigation/index.astro` | Create | Re-export for clean imports |
| `src/components/navigation/Navigation.astro` | Modify | Add test harness (see Task 1) |
| `src/layouts/Layout.astro` | Modify | Add slot for nav injection |
| `src/pages/index.astro` | Modify | Remove inline nav, import Navigation |

---

## Global Constraints

- Self-contained styles: no global `var(--color-*)` dependency
- Tailwind v4: utility classes only, no `@apply` or external CSS vars
- Active link: exact match `/` or prefix match for nested routes
- Mobile toggle: pure `<script>` in Astro frontmatter, no hydration framework
- Accessibility: `aria-expanded`, `aria-controls`, `aria-current="page"`

---

## Task 1: Create Navigation.astro (Header Variant — Desktop)

**Files:**
- Create: `src/components/navigation/Navigation.astro`

**Interfaces:**
- Consumes: none
- Produces: exported `Props` interface, default slot unused

- [ ] **Step 1: Create `src/components/navigation/` directory**

Run: `mkdir -p /home/phurix/projects/flyed/src/components/navigation`

- [ ] **Step 2: Write `Navigation.astro` with desktop header layout**

```astro
---
interface Props {
  links: { label: string; href: string }[];
  logo?: { text: string; href?: string };
  cta?: { label: string; href: string };
  mobileType?: 'drawer' | 'dropdown';
  variant?: 'header' | 'sidebar';
}

const {
  links = [],
  logo,
  cta,
  mobileType = 'dropdown',
  variant = 'header',
} = Astro.props;

const currentPath = Astro.url.pathname;
const isActive = (href: string) => {
  if (href === '/') return currentPath === '/';
  return currentPath.startsWith(href);
};

const logoHref = logo?.href ?? '/';
---

{variant === 'header' && (
  <header
    class="fixed top-0 left-0 right-0 z-50 border-b"
    style="background: rgba(255,255,255,0.8); backdrop-filter: blur(12px); border-color: #e5e7eb;"
  >
    <div class="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
      {logo && (
        <a href={logoHref} class="text-lg font-semibold tracking-tight" style="color: #111827;">
          {logo.text}
        </a>
      )}

      <nav class="hidden md:flex items-center gap-6">
        {links.map(link => (
          <a
            href={link.href}
            aria-current={isActive(link.href) ? 'page' : undefined}
            class="text-sm transition-colors"
            style={isActive(link.href) ? 'color: #111827; font-weight: 500;' : 'color: #6b7280;'}
          >
            {link.label}
          </a>
        ))}
      </nav>

      {cta && (
        <a
          href={cta.href}
          class="hidden md:inline-flex text-sm font-medium px-4 py-2 rounded-lg"
          style="background: #111827; color: #ffffff;"
        >
          {cta.label}
        </a>
      )}

      {/* Mobile hamburger — placeholder, filled in Task 3 */}
      <button
        id="nav-toggle"
        class="md:hidden p-2"
        aria-expanded="false"
        aria-controls="nav-menu"
        aria-label="Toggle navigation"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
    </div>

    {/* Mobile menu placeholder — filled in Task 3 */}
    <div id="nav-menu" class="hidden md:hidden border-t" style="border-color: #e5e7eb; background: white;">
      <div class="max-w-5xl mx-auto px-6 py-4 flex flex-col gap-4">
        {links.map(link => (
          <a
            href={link.href}
            aria-current={isActive(link.href) ? 'page' : undefined}
            class="text-sm"
            style={isActive(link.href) ? 'color: #111827; font-weight: 500;' : 'color: #6b7280;'}
          >
            {link.label}
          </a>
        ))}
        {cta && (
          <a
            href={cta.href}
            class="text-sm font-medium px-4 py-2 rounded-lg text-center"
            style="background: #111827; color: #ffffff;"
          >
            {cta.label}
          </a>
        )}
      </div>
    </div>
  </header>
)}

<style>
  /* Self-contained — no global var dependency */
</style>
```

- [ ] **Step 3: Verify file compiles**

Run: `cd /home/phurix/projects/flyed && npx astro build --dry-run 2>&1 | head -30`
Expected: no syntax errors in Navigation.astro

---

## Task 2: Create index.astro re-export

**Files:**
- Create: `src/components/navigation/index.astro`

- [ ] **Step 1: Write re-export**

```astro
export { default } from './Navigation.astro';
```

---

## Task 3: Wire up mobile toggle (drawer + dropdown)

**Files:**
- Modify: `src/components/navigation/Navigation.astro`

**Interfaces:**
- Consumes: `mobileType` prop from `Props`
- Produces: functional mobile menu toggle

- [ ] **Step 1: Replace the hamburger + menu block in `Navigation.astro` with full mobile toggle logic**

Find this block in your file:
```astro
{/* Mobile hamburger — placeholder, filled in Task 3 */}
<button ...```

Replace it with:

```astro
{/* Mobile hamburger */}
<button
  id="nav-toggle"
  class="md:hidden p-2 rounded-lg transition-colors"
  aria-expanded="false"
  aria-controls="nav-menu"
  aria-label="Toggle navigation"
  style="color: #6b7280;"
>
  {/* Hamburger icon */}
  <svg id="icon-hamburger" class="w-5 h-5 block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
  </svg>
  {/* Close icon */}
  <svg id="icon-close" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
  </svg>
</button>

{mobileType === 'drawer' ? (
  /* Drawer: full-height side panel */
  <div
    id="nav-menu"
    class="hidden fixed inset-0 z-40 md:hidden"
    style="top: 64px;"
  >
    {/* Backdrop */}
    <div id="nav-backdrop" class="absolute inset-0" style="background: rgba(0,0,0,0.4);" aria-hidden="true"></div>
    {/* Panel */}
    <div
      id="nav-panel"
      class="absolute right-0 top-0 bottom-0 w-72 shadow-xl overflow-y-auto"
      style="background: white;"
    >
      <div class="px-6 py-8 flex flex-col gap-6">
        {links.map(link => (
          <a
            href={link.href}
            aria-current={isActive(link.href) ? 'page' : undefined}
            class="text-base"
            style={isActive(link.href) ? 'color: #111827; font-weight: 500;' : 'color: #6b7280;'}
          >
            {link.label}
          </a>
        ))}
        {cta && (
          <a
            href={cta.href}
            class="text-sm font-medium px-4 py-2.5 rounded-lg text-center mt-2"
            style="background: #111827; color: #ffffff;"
          >
            {cta.label}
          </a>
        )}
      </div>
    </div>
  </div>
) : (
  /* Dropdown: expands below hamburger */
  <div
    id="nav-menu"
    class="hidden md:hidden border-t"
    style="border-color: #e5e7eb; background: white;"
  >
    <div class="max-w-5xl mx-auto px-6 py-4 flex flex-col gap-4">
      {links.map(link => (
        <a
          href={link.href}
          aria-current={isActive(link.href) ? 'page' : undefined}
          class="text-sm"
          style={isActive(link.href) ? 'color: #111827; font-weight: 500;' : 'color: #6b7280;'}
        >
          {link.label}
        </a>
      ))}
      {cta && (
        <a
          href={cta.href}
          class="text-sm font-medium px-4 py-2.5 rounded-lg text-center"
          style="background: #111827; color: #ffffff;"
        >
          {cta.label}
        </a>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 2: Add `<script>` tag at bottom of `Navigation.astro` frontmatter (after the component HTML, before `</Fragment>` or at file end)**

Add this inside the `---` frontmatter block at the very end:

```astro
<script>
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');
  const backdrop = document.getElementById('nav-backdrop');
  const iconHamburger = document.getElementById('icon-hamburger');
  const iconClose = document.getElementById('icon-close');

  if (!toggle || !menu) {
    // header variant not rendered (sidebar-only site)
  } else {
    toggle.addEventListener('click', () => {
      const isOpen = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!isOpen));
      menu.classList.toggle('hidden');

      if (iconHamburger && iconClose) {
        iconHamburger.classList.toggle('hidden');
        iconClose.classList.toggle('hidden');
      }
    });

    backdrop?.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      menu.classList.add('hidden');
      if (iconHamburger && iconClose) {
        iconHamburger.classList.remove('hidden');
        iconClose.classList.add('hidden');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        toggle.setAttribute('aria-expanded', 'false');
        menu.classList.add('hidden');
        if (iconHamburger && iconClose) {
          iconHamburger.classList.remove('hidden');
          iconClose.classList.add('hidden');
        }
      }
    });
  }
</script>
```

- [ ] **Step 3: Test mobile toggle compiles**

Run: `cd /home/phurix/projects/flyed && npx astro build --dry-run 2>&1 | head -30`
Expected: no errors

---

## Task 4: Add sidebar variant

**Files:**
- Modify: `src/components/navigation/Navigation.astro`

- [ ] **Step 1: Add sidebar variant HTML after the header block**

Find where `{variant === 'header' && (` starts and add after the closing `)}`:

```astro
{variant === 'sidebar' && (
  <aside
    class="fixed left-0 top-0 bottom-0 w-64 border-r z-40 overflow-y-auto"
    style="background: #ffffff; border-color: #e5e7eb;"
  >
    <div class="p-6 flex flex-col h-full">
      {logo && (
        <a href={logoHref} class="text-lg font-semibold tracking-tight mb-8" style="color: #111827;">
          {logo.text}
        </a>
      )}

      <nav class="flex flex-col gap-1 flex-1">
        {links.map(link => (
          <a
            href={link.href}
            aria-current={isActive(link.href) ? 'page' : undefined}
            class="text-sm px-3 py-2 rounded-lg transition-colors"
            style={isActive(link.href)
              ? 'color: #111827; font-weight: 500; background: #f3f4f6;'
              : 'color: #6b7280;'}
          >
            {link.label}
          </a>
        ))}
      </nav>

      {cta && (
        <a
          href={cta.href}
          class="text-sm font-medium px-4 py-2.5 rounded-lg text-center mt-6"
          style="background: #111827; color: #ffffff;"
        >
          {cta.label}
        </a>
      )}
    </div>
  </aside>
)}
```

Sidebar reuses same mobile hamburger and menu from header — placed inside the `aside` element for sidebar layout.

---

## Task 5: Integrate into Layout.astro

**Files:**
- Modify: `src/layouts/Layout.astro`

**Goal:** Add a `<slot name="nav" />` above the body slot so pages can inject a nav.

- [ ] **Step 1: Add nav slot to Layout.astro**

Find `<body>` in `src/layouts/Layout.astro` and add:

```astro
<body>
  <slot name="nav" />
  <slot />
</body>
```

---

## Task 6: Update index.astro to use Navigation

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Import Navigation**

Add to frontmatter:
```astro
import Navigation from '@/components/navigation';
```

- [ ] **Step 2: Replace inline nav with Navigation component**

Replace lines 8-18 (the `<nav class="fixed top-0...">` block) with:

```astro
<Navigation
  links={[
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Docs', href: '/docs' },
  ]}
  logo={{ text: 'Flyed', href: '/' }}
  cta={{ label: 'Get started', href: '/signup' }}
  mobileType="dropdown"
/>
```

- [ ] **Step 3: Verify build**

Run: `cd /home/phurix/projects/flyed && npx astro build 2>&1 | tail -20`
Expected: build success, no Navigation errors

---

## Task 7: Spec Self-Review

Checklist:
- [ ] All Props fields implemented: `links`, `logo`, `cta`, `mobileType`, `variant`
- [ ] `mobileType='drawer'` → slide-in panel with backdrop
- [ ] `mobileType='dropdown'` → expands below hamburger
- [ ] Active link detection: exact match `/` and prefix match for nested
- [ ] `aria-current="page"` on active links
- [ ] `aria-expanded` + `aria-controls` on hamburger
- [ ] Escape key closes mobile menu
- [ ] Backdrop click closes drawer
- [ ] Self-contained styles: no global `var(--color-*)` used
- [ ] Sidebar variant: vertical layout, logo top, links middle, CTA bottom

Fix any gaps inline.

---

## Spec Coverage Check

| Spec Requirement | Task |
|-----------------|------|
| Props-driven links | Tasks 1, 3 |
| Logo + CTA config | Tasks 1, 3 |
| Header variant | Tasks 1, 3 |
| Sidebar variant | Task 4 |
| Mobile drawer | Task 3 |
| Mobile dropdown | Task 3 |
| Active route auto-detect | Tasks 1, 3, 4 |
| Self-contained styles | Tasks 1, 3, 4 |
| Accessible hamburger | Tasks 1, 3 |
| Escape key closes menu | Task 3 |
| Backdrop closes drawer | Task 3 |
| Layout slot for nav | Task 5 |
| index.astro integration | Task 6 |

All spec items covered.
