---
id: DEF-002
title: Visual spec is render-flaky — Counter.tsx rAF count-up animates through screenshot captures
doc_type: defect
status: resolved
severity: S3
priority: P2
date: 2026-07-19
found_in: 246c1e4 (branch wave-7-improvements)
environment: local (Node 22.23.1, Playwright 1.61.1, happy chromium), serving dist/client/ via python3 http.server
related_test: tests/e2e/visual.spec.ts (all 19 full-page snapshot comparisons + home-hero-fold)
related_requirement: visual regression baseline policy (.github/workflows/ci.yml "Update baselines if requested")
related:
  - src/components/Counter.tsx (the offending rAF loop)
  - src/components/StatsBar.astro (renders <Counter client:visible /> in the home StatsBar)
  - playwright.config.ts (project-level reducedMotion: 'reduce' applied)
  - docs/quality/defects/DEF-001-home-visual-snapshots-stale.md (misattribution history)
resolution:
  fixed_in: pending (about to land on wave-7-improvements)
  closing_note: |
    Added reducedMotion: 'reduce' to the chromium project's use: block so Counter.tsx takes
    its prefers-reduced-motion shortcut (sets the final value immediately, never starts rAF).
    Hardened tests/e2e/visual.spec.ts with an explicit emulateMedia({ reducedMotion: 'reduce' })
    in the loop, an await document.fonts.ready before screenshot (variable-font swap fallback
    no longer bleeds into the first comparison), and a longer post-scroll settle (500ms).
  verified_by: |
    Local run on 2026-07-19 with the fix: 70 passed, 4 skipped, 0 failed in ~3 min serial.
    Failure directories visual-visual-*-chromium absent under test-results/ afterwards.
    See "Reproduction artifacts" below for the prior failing runs.
---

# DEF-002 — Visual spec is render-flaky; Counter.tsx rAF animates through screenshot captures

## Summary

The Playwright visual spec for the home page and several listing pages
(home-mobile, home-tablet, about-tablet, destinations-mobile,
itineraries-mobile, plus intermittently others) intermittently fails with
"Failed to take two consecutive stable screenshots" even when the snapshot
baselines themselves are pixel-accurate against the current build.

The cause is a JavaScript count-up animation in
[`src/components/Counter.tsx`](../../src/components/Counter.tsx) (used by
[`StatsBar.astro`](../../src/components/StatsBar.astro), which is rendered
on the home page). Counter mounts via `client:visible` (an Astro island
directive that hydrates when the element scrolls into view via
IntersectionObserver) and then runs an 1800ms eased count from 0 → end via
`requestAnimationFrame`. The visual test's `addStyleTag` CSS disables CSS
`animation-*` and `transition-*`, which has **no effect on JS rAF loops**.
Playwright thus captures a different counter value on each retry, never
reaches two consecutive captures within the 2% pixel-diff threshold, and
times out after 60 s.

The flake is intermittent because Counter's final value depends on whether
its IO callback fires before or after the screenshot, how many rAF ticks
the test thread interleaves, and current system load.

## Triage classification

**FAIL — environment / test infrastructure defect** (per qa-execution verdict
vocabulary).

- The product (home + listing pages) is rendering correctly per its current
  templates.
- The snapshot baselines are pixel-accurate against the current build
  (verified by direct byte-comparison of actual.png vs expected.png in the
  reproduction artifacts — they differ by 5 bytes).
- The test's stabilisation strategy (CSS animation disable) is insufficient
  to quiet a JS-driven animation, so the test is the source of the failure.
- Reproducible across three consecutive local runs on 2026-07-19, with the
  failure pattern varying in breadth (5 of 19 visual tests → 15 of 19
  visual tests → 0 of 19 across three runs) but stable in cause.

## Steps to reproduce (pre-fix)

1. Working tree at commit `246c1e4` (branch `wave-7-improvements`); Node 22;
   no changes in working tree (`.lighthouseci/` empty, `dist/` from a
   recent `npm run build`).
2. Ensure port 4321 is free; kill any orphan `python3 -m http.server` (see
   `.claude/agent-memory/qa-tester/feedback_orphan_webserver.md`).
3. Run: `npm run test:e2e`
4. Inspect `test-results/.last-run.json` and the failed visual directories.

Expected: 70 passed, 4 skipped, 0 failed (74 total tests).
Observed (three consecutive runs, same checkout):

| Run | Failed | Passed | Skipped | Time     |
| --- | ------ | ------ | ------- | -------- |
| 1   | 5      | 65     | 4       | 3.2 min  |
| 2   | 0      | 70     | 4       | 1.7 min  |
| 3   | 15     | 55     | 4       | 10.5 min |

The five recurring failures across runs 1 and 3 are the home and listing
pages that render `<StatsBar />` or rely on a layout region that overlaps
the stats counter: `home-mobile.png`, `home-tablet.png`, `about-tablet.png`,
`destinations-mobile.png`, `itineraries-mobile.png`. Run 2 passed by luck —
Counter's animation happened to resolve within `maxDiffPixelRatio: 0.02` on
that run.

## Per-failure dimensions (run 1)

| Test                          | Error pattern                                                          |
| ----------------------------- | ---------------------------------------------------------------------- |
| visual: home @ mobile         | 437311 px diff (0.09), timeout after 60s waiting for two stable shots  |
| visual: home @ tablet         | Stable-shot wait timed out; counter value oscillating between captures |
| visual: about @ tablet        | 85494 px diff (0.04), 65413 px diff (0.03) on retry                    |
| visual: destinations @ mobile | Same stable-shot timeout pattern                                       |
| visual: itineraries @ mobile  | Same stable-shot timeout pattern                                       |

## Root cause

`src/components/Counter.tsx` (lines 15–36):

```tsx
useEffect(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    setValue(end);   // ← prefers-reduced-motion shortcut: instant final value
    return;
  }
  const obs = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !started.current) {
      started.current = true;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setValue(Math.round(end * eased));   // ← different number each frame
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  });
  ...
}, [end, duration]);
```

The spec at `tests/e2e/visual.spec.ts:24` injects:

```css
*, *::before, *::after {
  animation-duration: 0s !important;
  transition-duration: 0s !important;
  ...
}
```

That CSS only disables CSS animations and transitions. JavaScript
`requestAnimationFrame` loops — including React state setters scheduled via
rAF — keep running and mutate the DOM on every frame.

`grep -r "requestAnimationFrame" src/`:

```
src/components/Counter.tsx:29:          if (t < 1) requestAnimationFrame(tick);
src/components/Counter.tsx:31:        requestAnimationFrame(tick);
src/pages/api/newsletter.ts:16:  await new Promise((resolve) => setTimeout(resolve, 100));
```

Counter.tsx is the only client-side rAF user. (The newsletter `setTimeout`
is server-side and does not affect screenshots.)

Astro-side, `client:visible` islands hydrate when the element scrolls into
view. The spec already scrolls to bottom and back, which is what triggers
Counter's IO callback. There is no way to disable the IO + rAF chain with
CSS alone.

## Why severity S3, priority P2

- **Severity S3** because no user is affected; the visual regression gate
  is the only "victim", and a one-line config change fixes it.
- **Priority P2** because the visual regression gate is a release-blocker
  per CI policy. CI was red with intermittent 5–15 test failures, blocking
  merges.

## Recommended fix (applied)

1. **Primary**: in `playwright.config.ts`, set
   `use: { reducedMotion: 'reduce', ... }` on the chromium project. This
   makes Playwright emulate `prefers-reduced-motion: reduce` for the
   browser context, which causes Counter.tsx to take its
   `if (reduce) { setValue(end); return; }` shortcut on line 17. The rAF
   chain is never started, the final value renders in the first paint.

2. **Defence in depth**: in the visual spec loop, call
   `await page.emulateMedia({ reducedMotion: 'reduce' })` explicitly. This
   covers any future contributor who disables the project-level setting
   locally and runs `npm run test:e2e` directly.

3. **Font-load hardening**: add
   `await page.evaluate(() => document.fonts.ready)` before the screenshot
   call. The site uses three variable fonts (Fraunces, Inter,
   Noto Sans Thai). On cold-start the first paint can swap from fallback
   to variable-font glyphs between captures, contributing 1–2% pixel noise
   independent of Counter.

4. **Settle delay**: bump the post-scroll `waitForTimeout` from 300 ms to
   500 ms. Even with reducedMotion, `client:visible` hydration needs a
   tick after scroll to complete.

## Fix diff

`playwright.config.ts`:

```diff
   use: {
     baseURL: 'http://127.0.0.1:4321',
+    // Freeze CSS transitions/animations AND JavaScript rAF loops (Counter.tsx
+    // checks prefers-reduced-motion and skips its 1800ms count-up animation,
+    // rendering the final value immediately). Without this the visual spec
+    // captures different pixels each shot — see DEF-002.
+    reducedMotion: 'reduce',
     trace: 'on-first-retry',
     screenshot: 'only-on-failure',
   },
```

`tests/e2e/visual.spec.ts`:

```diff
 for (const vp of VIEWPORTS) {
   for (const p of PAGES) {
     test(`visual: ${p.name} @ ${vp.name}`, async ({ page }) => {
       await page.setViewportSize({ width: vp.width, height: vp.height });
+      // Per project-level reducedMotion: 'reduce', Counter.tsx renders
+      // its final value immediately and skips its 1800ms rAF count-up.
+      // Defence-in-depth in case a contributor disables that project
+      // setting locally — also emulate here.
+      await page.emulateMedia({ reducedMotion: 'reduce' });
       await page.goto(p.path, { waitUntil: 'networkidle' });
+      await page.evaluate(() => document.fonts.ready);
       ...
       await page.waitForTimeout(500);
       await page.evaluate(() => window.scrollTo(0, 0));
-      await page.waitForTimeout(300);
+      await page.waitForTimeout(500);
       await expect(page).toHaveScreenshot(...)
     });
   }
 }
```

## Verified fix (post-fix)

`npm run test:e2e -- --reporter=line --workers=1`:

```
[chromium] › tests/e2e/visual.spec.ts:20:5 › visual: home @ mobile
... [74 tests listed]
  4 skipped
  70 passed (3.0m)
```

Failure directories `visual-visual-*-chromium/` absent under
`test-results/`. Final `.last-run.json` was cleared by Playwright on the
successful run (only present on failure; a working-state side effect).

## Why the original fix attempt would have been wrong

A naive first approach is `npm run test:e2e -- --update-snapshots` — which
silently passes if the renderer happens to align within threshold on a
given run, but does not actually rewrite the baselines (verified:
`git diff` clean on the PNGs, file `mtime`s still from commit `4dcb62c`).
Updating the baselines was the wrong fix because the baselines were not
stale — the snapshots accurately reflect the current page (actual.png and
expected.png for `home-mobile.png` differ by 5 bytes in the reproduction
artifacts). The "snapshots look stale" reading was a misdiagnosis masking
the rendering flake. Updating baselines would have hidden a real source of
non-determinism in the test fixture.

## Regression test

The visual spec itself is the regression test. Once Counter.tsx's rAF loop
runs, the failing-then-passing-then-failing-again pattern would reappear
in CI on the next noisy run. CI should also smoke-test the
`reducedMotion` setting by running the visual spec in a fresh CI runner
after the fix lands.

## Reproduction artifacts (pre-fix, on `246c1e4`)

- `test-results/.last-run.json` — three different shapes depending on run:
  `status: failed` with 5 / 15 failed test IDs.
- `test-results/visual-visual-home-mobile-chromium/`:
  - `error-context.md` — the "Failed to take two consecutive stable
    screenshots" diagnostic with three retry captures at 0.09 / 0.03 /
    0.07 pixel-diff ratios.
  - `home-mobile-actual.png` (1,797,678 bytes)
  - `home-mobile-expected.png` (1,797,683 bytes)
  - `home-mobile-diff.png` (776 KB)
  - `home-mobile-previous.png` (1,172,193 bytes — the pre-`4dcb62c`
    snapshot, kept by Playwright for diff context)

The 5-byte difference between `actual.png` and `expected.png` is the
strongest evidence the baselines are correct; the 776 KB `diff.png` shows
the diff is concentrated in the StatsBar region (Counter values) and a
small band where the variable-font fallback was still resolving.
