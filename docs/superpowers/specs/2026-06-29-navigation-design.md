# Navigation Component Design

## Overview

Reusable Astro Navigation component supporting both horizontal header nav and vertical sidebar nav. Self-contained styling, props-driven configuration, mobile-responsive with drawer/dropdown toggle.

## Component Architecture

**File**: `src/components/navigation/Navigation.astro`
**Re-export**: `src/components/navigation/index.astro`

## Props

```typescript
interface Props {
  // Nav links
  links: { label: string; href: string }[];

  // Logo config
  logo?: {
    text: string;
    href?: string; // defaults to "/"
  };

  // CTA button
  cta?: {
    label: string;
    href: string;
  };

  // Mobile menu type
  mobileType?: 'drawer' | 'dropdown'; // default: 'dropdown'

  // Layout mode
  variant?: 'header' | 'sidebar'; // default: 'header'
}
```

## Variants

### Header (default)

- **Desktop**: logo left, links center-right, CTA button far right. Horizontal flex row.
- **Mobile**: hamburger button triggers mobile menu. Logo stays visible.
- **Mobile type = drawer**: menu slides in from right, overlays content, closes on backdrop click or X button.
- **Mobile type = dropdown**: menu expands below hamburger, pushes content down.

### Sidebar

- **Desktop**: vertical stack of links, optional logo at top, CTA at bottom.
- **Mobile**: same drawer/dropdown behavior as header.
- **Active link**: auto-detected via `Astro.url.pathname`. Exact match highlights link; prefix match for nested routes (e.g. `/docs/guides` highlights `/docs`).

## Styling

- **Self-contained**: all styles via Tailwind utilities + inline style attributes. No dependency on global CSS variables.
- **CSS custom properties**: defined inline on the component root for theming consistency.
- **Active link**: `aria-current="page"` attribute + distinct visual style (e.g. font-weight or color shift).
- **Transitions**: Tailwind transition utilities for mobile menu open/close.

## Active Route Detection

```javascript
const currentPath = Astro.url.pathname;
const isActive = (href: string) => {
  if (href === '/') return currentPath === '/';
  return currentPath.startsWith(href);
};
```

## Mobile Toggle

- Pure `<script>` tag in Astro component — no React/hydration needed.
- Hamburger button: `<button>` with `aria-expanded` + `aria-controls`.
- Menu: `<div>` with `id` matching `aria-controls`.
- Escape key closes mobile menu.
- Backdrop click closes drawer (dropdown: not applicable).

## Props Usage Example

```astro
---
import Navigation from '@/components/navigation';
---

<Navigation
  links={[
    { label: 'Features', href: '/features' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Docs', href: '/docs' },
  ]}
  logo={{ text: 'Flyed', href: '/' }}
  cta={{ label: 'Get started', href: '/signup' }}
  mobileType="drawer"
/>
```

## File Checklist

- [ ] `src/components/navigation/Navigation.astro`
- [ ] `src/components/navigation/index.astro`
- [ ] Update `src/layouts/Layout.astro` to use Navigation
- [ ] Update `src/pages/index.astro` to remove inline nav
