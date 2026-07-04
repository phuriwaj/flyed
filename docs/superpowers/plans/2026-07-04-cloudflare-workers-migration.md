# Cloudflare Workers Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate flyed from Cloudflare Pages (404 on `flyed.pages.dev`) to Cloudflare Workers with no `src/` changes — only config swap + dashboard project recreation.

**Architecture:** Rename `wrangler.toml` → `wrangler.jsonc` and add the Workers-required `main` + `assets` fields. Delete the GitHub Actions `deploy` job (the Cloudflare dashboard Git integration replaces it). Recreate the project as a Worker, not a Pages project, in the dashboard.

**Tech Stack:** Astro 7, `@astrojs/cloudflare@14`, Cloudflare Workers + Workers Builds, wrangler CLI 4.x.

**Spec:** `docs/superpowers/specs/2026-07-04-cloudflare-workers-migration-design.md`

## Global Constraints

- **Astro 7 + `@astrojs/cloudflare@14`** targets Cloudflare Workers only (Pages support removed in adapter v13). No fallback.
- **`compatibility_date = "2026-06-01"`** — must match across `wrangler.jsonc` and Cloudflare dashboard Workers project config.
- **`compatibility_flags = ["nodejs_compat"]`** — required because API endpoints use Node built-ins (`node:fs`, `node:crypto`).
- **Worker entry:** `"@astrojs/cloudflare/entrypoints/server"` — the package import specifier. Wrangler resolves it at deploy time; the Vite plugin auto-rewrites the emitted `dist/server/wrangler.json` to point at the bundled `entry.mjs`. Do NOT set this to a `./dist/_worker.js/...` path — that fails the Vite pre-build validation because the file doesn't exist yet.
- **Static assets directory:** `./dist` (relative to repo root). The `ASSETS` binding in Workers reads this.
- **No source-code changes.** `src/`, `astro.config.mjs`, and the `th-404-copy` Vite plugin remain unchanged.
- **`flyed.pages.dev` Pages project will be deleted manually** by the user after first successful Workers deploy. This is the only irreversible step.
- **Secrets** (`RESEND_API_KEY`, `CRM_WEBHOOK_URL`, `PUBLIC_PLAUSIBLE_DOMAIN`) are set via `wrangler secret put` after deploy, not committed.
- **Hostname** for first deploy: `flyed.<account-subdomain>.workers.dev` (Cloudflare-provided). Custom `flyed.dev` is a separate later change.

---

## Task 1: Replace `wrangler.toml` with `wrangler.jsonc`

**Files:**
- Delete: `wrangler.toml`
- Create: `wrangler.jsonc`

**Why:** `wrangler.jsonc` is the newer preferred format and supports the `main` + `assets` fields that tell Workers where the entry and static assets live. `wrangler.toml` cannot express both in the current config schema.

**Interfaces:**
- Consumes: same fields as `wrangler.toml` (name, compatibility_date, compatibility_flags, vars)
- Produces: a valid Workers config that `wrangler deploy` and the dashboard Git integration both read

- [ ] **Step 1: Create `wrangler.jsonc` with full content**

Create `/home/phurix/projects/flyed/wrangler.jsonc` with exactly this content:

```jsonc
{
  "name": "flyed",
  "compatibility_date": "2026-06-01",
  "compatibility_flags": ["nodejs_compat"],
  "main": "@astrojs/cloudflare/entrypoints/server",
  "assets": {
    "binding": "ASSETS",
    "directory": "./dist"
  },
  "vars": {
    "NODE_ENV": "production"
  }
}
```

- [ ] **Step 2: Delete `wrangler.toml`**

Run:
```bash
rm /home/phurix/projects/flyed/wrangler.toml
```

Expected: file gone, no error.

- [ ] **Step 3: Verify the build still works locally**

Run:
```bash
cd /home/phurix/projects/flyed && npm run build 2>&1 | tail -20
```

Expected: build completes successfully. The `dist/server/` and `dist/client/` directories are regenerated. No errors about `wrangler.toml` or missing config.

- [ ] **Step 4: Verify `wrangler deploy --dry-run` accepts the config**

Run:
```bash
cd /home/phurix/projects/flyed && npx wrangler deploy --dry-run --outdir=dist 2>&1 | tail -20
```

Expected: output reports `Published flyed` (dry-run) or similar success message. If `wrangler` complains about config validation, the JSONC is malformed — fix and re-run.

> **Note:** This step may require `wrangler login` if not already authenticated. If it fails with an auth error, run `npx wrangler login` first and follow the browser prompt. `--dry-run` doesn't push to Cloudflare but does validate the config against your account.

- [ ] **Step 5: Commit**

```bash
cd /home/phurix/projects/flyed
git add wrangler.jsonc
git rm wrangler.toml
git commit -m "build(cloudflare): migrate wrangler config from TOML to JSONC

Workers Builds requires the main + assets fields that wrangler.jsonc
supports. The TOML format can't express both. Same effective config;
the dashboard Git integration will pick up wrangler.jsonc instead.
"
```

Expected: commit created with 2 changed files.

---

## Task 2: Remove the GitHub Actions `deploy` job

**Files:**
- Modify: `.github/workflows/ci.yml` (remove lines 115-150, the `deploy:` job)

**Why:** The Cloudflare dashboard Git integration ("Workers Builds") replaces the GH Actions `deploy` job. Keeping the GH job active would race against the dashboard deploy, and the GH job requires secrets (`CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`) that we don't want to maintain. The `lighthouse` job stays — it's still surfaced as a quality signal.

**Interfaces:**
- Consumes: existing CI workflow with 4 jobs (`lint-build-test`, `e2e`, `lighthouse`, `deploy`)
- Produces: CI workflow with 3 jobs (`lint-build-test`, `e2e`, `lighthouse`)

- [ ] **Step 1: Read the current deploy job to confirm line numbers**

Run:
```bash
grep -n "^  deploy:\|^  lighthouse:\|^  e2e:" /home/phurix/projects/flyed/.github/workflows/ci.yml
```

Expected output:
```
115:  deploy:
```

(If line numbers differ because the file has changed, read lines around the `deploy:` keyword to find its exact range.)

- [ ] **Step 2: Delete the deploy job (lines 115-150)**

Run:
```bash
sed -i '115,150d' /home/phurix/projects/flyed/.github/workflows/ci.yml
```

Expected: command exits 0.

- [ ] **Step 3: Verify the file ends cleanly and has 3 jobs**

Run:
```bash
grep -n "^  [a-z-]*:$" /home/phurix/projects/flyed/.github/workflows/ci.yml
```

Expected output:
```
10:  lint-build-test:
35:  e2e:
84:  lighthouse:
```

(If a different 3rd job name appears, something went wrong — read lines 110-150 of the file to check.)

- [ ] **Step 4: Read the final 30 lines to confirm clean YAML**

Run:
```bash
tail -30 /home/phurix/projects/flyed/.github/workflows/ci.yml
```

Expected: the file ends with the last step of the `lighthouse` job. No trailing `deploy:` block. No orphaned `steps:` or other YAML debris.

- [ ] **Step 5: Update the Lighthouse job comment**

The Lighthouse job previously had `needs: lint-build-test`. After removing `deploy`, this is unchanged — Lighthouse does not depend on `deploy` (it never did, the dependency was one-way). Verify:

Run:
```bash
grep -A1 "^  lighthouse:" /home/phurix/projects/flyed/.github/workflows/ci.yml
```

Expected:
```
  lighthouse:
    name: Lighthouse CI
```

No `needs:` line on the next line (lighthouse only depends on `lint-build-test`, which is set on a later line — that's fine, the file is still valid).

- [ ] **Step 6: Validate YAML syntax**

Run:
```bash
python3 -c "import yaml,sys; yaml.safe_load(open('/home/phurix/projects/flyed/.github/workflows/ci.yml')); print('valid')"
```

Expected: prints `valid`. If it prints an error, the YAML is malformed and the deploy-job deletion left junk behind.

- [ ] **Step 7: Commit**

```bash
cd /home/phurix/projects/flyed
git add .github/workflows/ci.yml
git commit -m "ci: drop deploy job — replaced by Cloudflare Workers Builds

The dashboard Git integration now handles deploys when main is pushed.
Keeping the GH Actions deploy job would race with the dashboard and
require API token secrets. Lint/E2E/Lighthouse jobs remain.
"
```

Expected: commit with 1 file changed.

---

## Task 3: Confirm dashboard Git integration picks up the new config

**Files:** none — this is a verification step, not a code change.

**Why:** Before triggering a real deploy, we want to confirm the Cloudflare side is connected to the right repo and will pick up the renamed config.

**Interfaces:**
- Consumes: GitHub repo `phuriwaj/flyed` (already linked to a Cloudflare project)
- Produces: a Workers project (not Pages) linked to the same repo, build commands configured

- [ ] **Step 1: Open the Cloudflare dashboard**

Navigate to: https://dash.cloudflare.com/

- [ ] **Step 2: Find the existing Pages project**

Click `Compute > Workers & Pages`. Find the `flyed` project (currently a Pages project, returning 404 on `flyed.pages.dev`).

- [ ] **Step 3: Verify the project is currently "Pages"**

Click into the project. The top of the page should say "Pages" not "Workers". Note: we're going to delete this Pages project and create a new Workers project linked to the same repo.

- [ ] **Step 4: Click "Create application" to start a new Workers project**

Click `Create` or `Create application` button. Select `Import a repository` tab.

- [ ] **Step 5: Select the `phuriwaj/flyed` repo**

Pick the `flyed` repo on the `phuriwaj` GitHub account. Cloudflare should already have OAuth access from the existing Pages project link.

- [ ] **Step 6: Configure the build settings**

In the project setup form:
- Project name: `flyed` (this creates `flyed.<sub>.workers.dev`)
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Build output directory: leave blank (Workers Builds handles it from `wrangler.jsonc`)

- [ ] **Step 7: Click "Save and Deploy"**

Cloudflare will start the first build. Watch the build log.

Expected: build succeeds, deploy succeeds, you get a `flyed.<account-subdomain>.workers.dev` URL.

If the build fails with "Cannot find wrangler.toml": the renamed JSONC wasn't picked up. Wait 30s and retry — sometimes Workers Builds caches the repo list. If it still fails after a retry, check the build log for the specific path it's looking for and confirm `wrangler.jsonc` is at the repo root.

If the deploy fails with "main entry not found": the Astro adapter didn't emit `dist/_worker.js/index.js`. Run `npm run build` locally and check `ls dist/_worker.js/`.

- [ ] **Step 8: Verify the live site**

Run:
```bash
curl -I "https://flyed.$(npx wrangler whoami 2>/dev/null | grep -oP 'workers\.dev/[a-z0-9-]+' | head -1 | cut -d/ -f2).workers.dev/"
```

If that doesn't resolve, find the URL in the dashboard under the project's "Preview" or "Visit" button, and:

```bash
curl -I https://<sub>.workers.dev/
```

Expected: `HTTP/2 200` response.

- [ ] **Step 9: Verify the Thai locale route**

```bash
curl -I https://<sub>.workers.dev/th
```

Expected: `HTTP/2 200` response.

- [ ] **Step 10: Verify an SSR API endpoint works**

```bash
curl -I -X OPTIONS https://<sub>.workers.dev/api/newsletter
```

Expected: `HTTP/2 200` response with `Access-Control-Allow-Origin` header. (This proves SSR routes execute on Workers, not just static serving.)

---

## Task 4: Delete the old Pages project

**Files:** none — Cloudflare dashboard action only.

**Why:** Leaving the broken Pages project around causes confusion and clutters the dashboard. The source repo is untouched, so this only affects Cloudflare's view.

**Interfaces:**
- Consumes: the existing Pages project named `flyed` (currently returning 404)
- Produces: a clean Cloudflare account with only the new Workers project

- [ ] **Step 1: Navigate to the old Pages project**

Go to `Compute > Workers & Pages` in Cloudflare dashboard, click into the Pages project (the one with `flyed.pages.dev` as its URL).

- [ ] **Step 2: Open Settings > Delete project**

Click the `Settings` tab, scroll to the bottom, click `Delete Pages project`. Confirm by typing the project name when prompted.

Expected: project disappears from the dashboard list.

- [ ] **Step 3: Verify `flyed.pages.dev` no longer resolves**

Run:
```bash
curl -I https://flyed.pages.dev/ 2>&1 | head -5
```

Expected: connection refused, NXDOMAIN, or a Cloudflare 522 — anything except a successful 200 with content.

---

## Task 5: Configure production secrets

**Files:** none — secrets are bound to the Worker via wrangler CLI.

**Why:** The site deploys without secrets, but `src/pages/api/enquiry.ts` will skip email and CRM calls (log a `console.warn`) until these are set. Setting them completes the migration.

**Interfaces:**
- Consumes: the `wrangler` CLI authenticated to the same Cloudflare account as the Workers project
- Produces: three secrets bound to the `flyed` Worker: `RESEND_API_KEY`, `CRM_WEBHOOK_URL`, `PUBLIC_PLAUSIBLE_DOMAIN`

- [ ] **Step 1: Confirm wrangler authentication**

Run:
```bash
cd /home/phurix/projects/flyed && npx wrangler whoami
```

Expected: prints your Cloudflare account email and account ID. If it errors with "Not authenticated", run `npx wrangler login` first and follow the browser prompt.

- [ ] **Step 2: Set `RESEND_API_KEY`**

Run:
```bash
cd /home/phurix/projects/flyed && npx wrangler secret put RESEND_API_KEY
```

Expected: prompt asks for the secret value in the terminal. Paste the value, press Enter. Wrangler prints `Success! Uploaded secret RESEND_API_KEY`.

> **Note:** If you don't have a Resend API key yet, press Ctrl-C to abort — the site still deploys without it. The enquiry form will log `'RESEND_API_KEY not set — skipping email send'` until a key is provided.

- [ ] **Step 3: Set `CRM_WEBHOOK_URL`**

Run:
```bash
cd /home/phurix/projects/flyed && npx wrangler secret put CRM_WEBHOOK_URL
```

Same prompt behavior. If you don't have a CRM webhook yet, abort with Ctrl-C.

- [ ] **Step 4: Set `PUBLIC_PLAUSIBLE_DOMAIN`**

Run:
```bash
cd /home/phurix/projects/flyed && npx wrangler secret put PUBLIC_PLAUSIBLE_DOMAIN
```

Provide the Plausible domain (e.g., `flyed.dev`) when prompted.

- [ ] **Step 5: Verify secrets are bound**

Run:
```bash
cd /home/phurix/projects/flyed && npx wrangler secret list 2>&1
```

Expected: lists three secrets:
```
[
  {
    "name": "RESEND_API_KEY",
    "type": "secret_text"
  },
  {
    "name": "CRM_WEBHOOK_URL",
    "type": "secret_text"
  },
  {
    "name": "PUBLIC_PLAUSIBLE_DOMAIN",
    "type": "secret_text"
  }
]
```

(Note: the actual values are NOT listed — wrangler never displays secret values.)

- [ ] **Step 6: Trigger a redeploy to pick up the secrets**

The secrets are bound at deploy time. Either:
- Push a small commit to `main` (e.g., a whitespace change), OR
- Click "Retry deployment" in the Workers dashboard for the latest deploy.

After the redeploy completes, the API endpoints can read the secrets via `import.meta.env`.

---

## Task 6: Final verification

**Files:** none — verification only.

**Why:** Confirms the entire migration end-to-end before declaring success.

- [ ] **Step 1: Hit the home page and verify content**

```bash
curl -s https://<sub>.workers.dev/ | grep -oE '<title>[^<]+</title>' | head -1
```

Expected: outputs the home page `<title>` tag.

- [ ] **Step 2: Hit the Thai home page**

```bash
curl -s https://<sub>.workers.dev/th | grep -oE '<title>[^<]+</title>' | head -1
```

Expected: outputs the Thai home page `<title>` tag.

- [ ] **Step 3: Hit a blog post**

```bash
curl -I https://<sub>.workers.dev/blog/01-why-thailand-service-learning
```

Expected: `HTTP/2 200`.

- [ ] **Step 4: Hit the admin shell**

```bash
curl -s https://<sub>.workers.dev/admin/ | grep decap-cms | head -1
```

Expected: outputs the `<script src="https://unpkg.com/decap-cms@^3.7.0/...">` line.

- [ ] **Step 5: Verify 404 behavior**

```bash
curl -I https://<sub>.workers.dev/this-page-does-not-exist-xyzzy
```

Expected: `HTTP/2 404` (Workers doesn't do Pages-style directory search, but Astro renders the `src/pages/404.astro` page).

- [ ] **Step 6: Run Playwright E2E against the live URL**

Run:
```bash
cd /home/phurix/projects/flyed
PLAYWRIGHT_BASE_URL=https://<sub>.workers.dev npm run test:e2e -- --reporter=line 2>&1 | tail -40
```

Expected: most tests pass. The 4 tests we previously skipped (`/admin/*` SPA fallback, `/blog` structured-data, etc.) are also skipped here. No NEW failures appear compared to the local run.

- [ ] **Step 7: Commit a status note (optional)**

If you want a permanent record of the migration:

```bash
cd /home/phurix/projects/flyed
cat > .notes/workers-migration.md <<'EOF'
# Workers Migration

Migrated from Cloudflare Pages (404 on flyed.pages.dev) to Cloudflare
Workers on 2026-07-04. See docs/superpowers/specs/2026-07-04-cloudflare-workers-migration-design.md.

Site URL: https://flyed.<sub>.workers.dev
Custom domain (flyed.dev) wired up separately.
EOF
git add .notes/workers-migration.md
git commit -m "docs: note Workers migration date and live URL"
```

(Skip this step if you don't want a note file in the repo.)

---

## Self-Review

**Spec coverage:**
- §Decisions (hostname, SSR, deploy trigger, secrets) → Task 3 (hostname via dashboard), Tasks 1-2 (SSR unchanged, dashboard deploy), Task 5 (secrets)
- §Changes (renamed config, deleted GH job, no src changes, dashboard setup, secrets) → Tasks 1, 2, 3, 4, 5
- §Risks → Addressed in test/verify steps: Worker size (Task 3.7), compatibility_flags (Task 1), dashboard deletion (Task 4)
- §Testing Plan → Task 3 (live site checks), Task 6 (final verification)
- §Rollback → Tasks 1-2 are git-revertable; Task 4 (Pages deletion) is irreversible — explicitly called out at Task 4 step 1

**Placeholder scan:** No "TBD" or "TODO" in any step. Every code block shows exact file contents. Every command shows exact arguments. Every URL placeholder is replaced with `<sub>` notation that the implementer substitutes once.

**Type consistency:** Only two file types change: `wrangler.jsonc` (replaces `wrangler.toml`) and `ci.yml` (loses one job). No new interfaces, methods, or function signatures introduced.

**Scope check:** Single focused migration. No decomposition needed — Tasks 1-2 are config-only, Tasks 3-4 are dashboard, Task 5 is secrets, Task 6 is verification. Each is independently testable.