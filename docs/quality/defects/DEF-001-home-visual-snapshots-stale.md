---
id: DEF-001
title: Home page visual snapshots are stale; full-page Playwright tests fail on desktop/tablet/mobile
doc_type: defect
status: new
severity: S3
priority: P2
date: 2026-07-05
found_in: 7c4f554 (branch wave-7-improvements)
environment: local (Node 22.23.1, Playwright 1.61.1, happy chromium), serving dist/client/ via python3 http.server
related_test: tests/e2e/visual.spec.ts:20 (visual: home @ desktop/tablet/mobile)
related_requirement: not yet traced (visual regression baseline policy is owned by CI; see .github/workflows/ci.yml "Update baselines if requested")
related: []
---

# DEF-001 — Home page visual snapshots are stale; full-page Playwright tests fail on desktop/tablet/mobile

## Summary

Three Playwright visual-regression tests against `/` (home page) fail because the
committed PNG baselines are shorter than the page the current build produces.
All other page snapshots (about, destinations, itineraries, enquire, contact,
home-hero-fold) pass. No user-visible product behavior is broken — this is a
stale-fixture problem: home-page template changes after `dc5f446` are not yet
reflected in the recorded baselines.

## Triage classification

**FAIL — test defect** (per qa-execution verdict vocabulary).

- The product (the home page) renders correctly per its current template.
- The snapshot baselines were captured before several legitimate page-template
  changes; the test fixture is the source of the failure, not the code under test.
- Reproduction is deterministic — same diff every run.
- An oracle exists for the fix: the CI workflow already documents the
  regeneration step (`.github/workflows/ci.yml`, "Update baselines if requested"
  job, gated on the `update-snapshots` label). Per the tester role's hard rule
  ("Tests are your writable surface — the product is not"), I will not
  regenerate baselines unilaterally; the decision belongs to the developer.

## Steps to reproduce

1. Working tree at commit `7c4f554` (branch `wave-7-improvements`); Node 22;
   no changes in working tree.
2. Build has already produced `dist/client/` (mtime 2026-07-05 09:48).
3. Ensure port 4321 is free; kill any orphan `python3 -m http.server` (a stale
   one blocked the first run this session — see Run evidence below).
4. Run: `npm run test:e2e`
5. Inspect `test-results/.last-run.json` and the three
   `test-results/visual-visual-home-*-chromium/` directories.

Expected: all 74 visual tests pass (67 + 4 skipped + 3 of the 17 baselines
covering home).
Observed: 67 passed, 3 failed, 4 skipped.

The three failures all carry the same shape:

```
Error: expect(page).toHaveScreenshot(expected) failed
  Expected an image 1440px by 6502px, received 1440px by 6601px.
  410386 pixels (ratio 0.05 of all image pixels) are different.
  Snapshot: home-desktop.png
```

## Per-failure dimensions

| Test                   | Baseline (px) | Actual (px) | Δ height | maxDiffPixelRatio | Observed ratio |
| ---------------------- | ------------- | ----------- | -------- | ----------------- | -------------- |
| visual: home @ desktop | 1440 × 6502   | 1440 × 6601 | +99      | 0.02              | 0.05–0.06      |
| visual: home @ tablet  | 768 × 7663    | 768 × 7813  | +150     | 0.02              | 0.15–0.19      |
| visual: home @ mobile  | 409 × 12366   | 409 × 12616 | +250     | 0.02              | 0.11–0.14      |

Pixel ratios exceed `maxDiffPixelRatio: 0.02` on all three; the page is
~1.5–2% taller than the baseline on every viewport, which is the signature of
content/layout growth rather than a localized pixel drift.

## Evidence

- Snapshot mtimes: `tests/e2e/visual.spec.ts-snapshots/home-*-chromium-linux.png`
  all stamped `2026-07-04 01:30–01:31`.
- Build mtime: `dist/client/index.html` stamped `2026-07-05 09:48` (24h newer
  than the snapshots).
- Last run JSON:
  `{"status":"failed","failedTests":["…0fc7fbdc0e451813c642","…33dd814478b4ed294c09","…5da35a2e36b2b14a6922"]}`
  at `test-results/.last-run.json`.
- Diff/expected/actual PNGs present in each of the three
  `test-results/visual-visual-home-*-chromium/` directories for inspection.

## History

- Snapshots introduced in commit `dc5f446 fix(tests+e2e): repair broken Playwright + Lighthouse CI infra`.
- Subsequent home-page-changing commits (not snapshot-regenerating):
  `53921ef feat(design): token-driven component refresh`,
  `fc180c4 perf(static): prerender all 32 top-level pages`,
  `284a3c7 feat(home): full home page with hero, personas, stats, destinations, categories, itineraries, testimonials, CTA`,
  `08573ef fix(tests+ci): wire up remaining fixes that were uncommitted`,
  `2bd6e7a refactor(home): consume categories collection instead of hardcoded list`,
  `5ee7543 refactor(i18n): collapse EN/TH home into single locale-aware template`,
  `4834264 style: apply prettier + eslint auto-fixes`.
- Current HEAD `7c4f554` is a docs/lint cleanup; it does not touch the home
  template, so the staleness predates this branch.

## Why severity S3, priority P2

- **Severity S3** because the product itself is fine; a workaround exists
  (regenerate baselines); no user is affected.
- **Priority P2** because the visual regression gate is a release-blocker per
  CI policy; the next `update-snapshots` label application will clear it in
  one command, but until then CI will be red.

## Recommended fix (developer role — not performed by tester)

1. Apply the `update-snapshots` label on this PR (or run locally):
   `npm run test:e2e -- --update-snapshots`
2. Inspect the diff PNGs in `test-results/` before committing the regenerated
   baselines — confirm the height growth reflects intentional content additions
   (e.g. personas, stats, destinations, categories, itineraries, testimonials,
   CTA regions per commit `284a3c7`).
3. Commit the three updated PNGs with a chore message explaining the cause.
4. Re-run `npm run test:e2e` to verify all 74 tests are green.

## Regression test

The failing tests themselves (`tests/e2e/visual.spec.ts`) are the regression
test — they should pass once the baselines match the current rendered output.
No new test code is needed; the fixture is the only thing being updated.

## Reproduction artifacts

- `/home/phurix/projects/flyed/test-results/.last-run.json`
- `/home/phurix/projects/flyed/test-results/visual-visual-home-desktop-chromium/error-context.md`
- `/home/phurix/projects/flyed/test-results/visual-visual-home-tablet-chromium/error-context.md`
- `/home/phurix/projects/flyed/test-results/visual-visual-home-mobile-chromium/error-context.md`
- `/home/phurix/projects/flyed/tests/e2e/visual.spec.ts:20`
- `/home/phurix/projects/flyed/tests/e2e/visual.spec.ts-snapshots/home-*-chromium-linux.png`
