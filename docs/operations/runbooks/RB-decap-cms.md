---
title: RB — Decap CMS on Cloudflare Workers
doc_type: runbook
status: draft
version: 0.1.0
date: 2026-07-05
authors: ['docs-architect (AI-generated, pending human review)']
owner: engineering (CMS operator) + marketing (editor)
service: Decap CMS shell at /admin (served as static asset from ASSETS binding)
severity_default: P3
related_alerts: []
related: [../deployment.md]
---

# RB — Decap CMS on Cloudflare Workers

> **Migration note (Wave 7).** This runbook replaces the pre-migration
> `docs/decap-cms.md`, which referenced Cloudflare Pages branch deploys and a
> `https://<branch>--flyed-dev.pages.dev` preview URL. Both are stale — the
> site now deploys as Cloudflare Workers, and the preview URL pattern is
> different (see §3 below).

## Overview

Decap CMS is the browser-based editor for flyed blog content. Editors
navigate to `https://flyed.dev/admin`, log in with GitHub (via Decap Cloud),
and save drafts as PRs that the engineering team merges.

**Operator impact:** "the editor can't do X" or "the preview shows Y". This
runbook covers the four most common failure modes plus the day-to-day
operational tasks.

**Resolved means:** an editor can log in, create or edit a blog post, see a
preview, and produce a PR that merges cleanly.

**Severity guidance:** default **P3** (editing is decoupled from the live
site — pre-rendered content keeps serving). Escalate to **P2** if a
production-correction PR is blocked (e.g. a published post has a factual
error and the editor cannot push a fix).

## Prerequisites and access

- **Decap Cloud** account (free tier; 1 editor is enough for the team) at
  https://decapcms.org/cloud/. The operator owns this account.
- **GitHub** repo admin or maintainer rights on `flyed-dev/flyed` (to
  add/remove editors as collaborators).
- **Cloudflare** account read access on the `flyed` Workers project (to
  verify the preview URL pattern and tail logs).
- **Marketing Slack** `#marketing-eng` (see `public/admin/README.md:69` for
  the editor-side reference).

## How it works (current state — Workers Builds)

```
Editor saves in /admin
  → Decap Cloud OAuth via git-gateway
  → Decap creates branch: cms/<slug>
  → Decap commits + opens PR
  → Cloudflare Workers Builds auto-deploys the PR branch
  → Editor previews at <preview-url>/blog/<slug>      (see §3)
  → Reviewer merges PR
  → Workers Builds auto-deploys production (main)
```

Files involved:

| File                                                    | Purpose                                                  |
| ------------------------------------------------------- | -------------------------------------------------------- |
| `/home/phurix/projects/flyed/public/admin/index.html`   | Decap CMS shell (loads from unpkg)                       |
| `/home/phurix/projects/flyed/public/admin/config.yml`   | Collections, i18n, backend, preview config               |
| `/home/phurix/projects/flyed/public/admin/preview.html` | Custom preview iframe                                    |
| `/home/phurix/projects/flyed/public/admin/README.md`    | Editor how-to (audience: editors, not operators)         |
| `/home/phurix/projects/flyed/src/content.config.ts`     | Astro collection schema (Zod) — single `blog` collection |
| `/home/phurix/projects/flyed/public/_redirects`         | `/admin` rewrite to `index.html`                         |

> **Migration cross-link:** The pre-Wave-7 runbook listed `blog` and
> `blogTh` as separate collections. After commit
> `d930b70 refactor(content): merge blog/blogTh into one locale-aware collection`,
> they are one collection distinguished by the `locale` field (verified
> in `/home/phurix/projects/flyed/src/content.config.ts:22-49`). The
> Decap `config.yml` still exposes two collections in the sidebar
> (`blog` and `blog-th`) — each writes to the same folder with a
> different `path: '{{slug}}.en'` / `path: '{{slug}}.th'` suffix. This is
> the correct user-facing shape; the underlying schema is single-collection.

## 3. Preview URL format

> **OPEN QUESTION (owner: engineering):** Cloudflare Workers Builds default
> branch preview URLs have changed at least once. Confirm the current
> pattern with the Cloudflare dashboard before pasting a fixed URL into a
> reviewer message.

As of the Wave 7 migration, the most likely pattern is one of:

| Pattern                           | Shape                                                           | Notes                                                    |
| --------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| `<branch>.<project>.workers.dev`  | `https://cms-andaman-week.flyed.workers.dev/blog/andaman-week`  | Workers Builds default; no custom domain required        |
| `<branch>--<project>.workers.dev` | `https://cms-andaman-week--flyed.workers.dev/blog/andaman-week` | Alternative separator style; verify in dashboard         |
| Custom branch alias               | `<branch>.<your-domain>`                                        | Only if the team has configured a wildcard Workers route |

**Do NOT** paste the pre-migration URL (`https://<branch>--flyed-dev.pages.dev`)
in any current communication — that pattern was for Cloudflare Pages and
no longer resolves.

## 4. One-time setup (operator only)

### 4.1 Decap Cloud account

1. Sign up at https://decapcms.org/cloud/ (free tier: 1 editor, unlimited repos).
2. Add a site: `https://flyed.dev`.
3. Connect the GitHub repo: `flyed-dev/flyed`.
4. Grant Decap Cloud access to the repo (via GitHub App).
5. Note the GitHub username(s) of authorized editors.

### 4.2 GitHub OAuth app (alternative to Decap Cloud)

If the team prefers self-hosting the OAuth dance (no Decap Cloud dependency):

1. GitHub → Settings → Developer settings → OAuth apps → New OAuth App.
2. Application name: `flyed CMS` (or similar).
3. Homepage URL: `https://flyed.dev`.
4. Authorization callback URL: `https://flyed.dev/admin/`.
5. Generate a client secret. Store it as `CMS_GITHUB_TOKEN` in the Workers
   project's secrets (`wrangler secret put CMS_GITHUB_TOKEN`).
6. Edit `/home/phurix/projects/flyed/public/admin/config.yml` and replace
   the `backend` block:

   ```yaml
   backend:
     name: github
     repo: flyed-dev/flyed
     branch: main
     base_url: https://api.github.com
     auth_endpoint: /login/oauth/authorize
     open_authoring: false
   ```

   Then add an OAuth handler endpoint (not currently present in this
   codebase — would be a `src/pages/api/cms-auth.ts` plus a small Cloudflare
   Access policy). **This option is not yet implemented; OPEN QUESTION
   below.**

> **OPEN QUESTION (owner: engineering):** The CMS_GITHUB_TOKEN workflow is
> documented in `/home/phurix/projects/flyed/DEPLOY.md:38` (as a Cloudflare
> secret) but no OAuth handler is present in the codebase (verified by
> listing `/home/phurix/projects/flyed/src/pages/api/` — only `enquiry.ts`,
> `contact.ts`, `newsletter.ts` exist). Either the token is reserved for
> future use, or the self-hosted OAuth path was scoped out. Confirm.

### 4.3 Invite an editor

1. GitHub → `flyed-dev/flyed` → Settings → Collaborators → Add the editor
   with **Write** access.
2. Decap Cloud → Team → add the editor's GitHub username.
3. Send them the editor guide: `https://flyed.dev/admin/README.md`.

## 5. Day-to-day operations

### 5.1 Add a new editor

1. GitHub: invite as collaborator (Write).
2. Decap Cloud: add to Team.
3. Done. They log in at `/admin`.

### 5.2 Disable editorial workflow temporarily

Edit `/home/phurix/projects/flyed/public/admin/config.yml`. Set
`publish_mode: editorial_workflow` to a different value (or remove it).
Edits will commit directly to `main`. **Use with caution** — this removes
the review gate.

### 5.3 Reset the admin password

Decap Cloud does not manage passwords (it uses GitHub OAuth). The
"password" the editor uses is their GitHub account. To reset:

1. The editor resets their GitHub password at https://github.com/settings/security.
2. If their GitHub account is the wrong one in Decap Cloud's team list,
   remove and re-add them in Decap Cloud → Team.

### 5.4 Content rollback via git

Decap creates commits on `cms/<slug>` branches. The canonical rollback for
"this PR introduced a bad post" is the same as for any git content:

```bash
git checkout main
git pull origin main
git log --oneline -20        # find the commit to revert
git revert <commit-sha>      # or: git reset --hard <good-sha> for force-push (use with caution)
git push origin main
```

Cloudflare Workers Builds will auto-deploy the rolled-back commit within
~2 minutes. **Verification:** the rolled-back post is gone from
`/blog/<slug>`.

## 6. Troubleshooting

### 6.1 Editor can't log in

- Check Decap Cloud → Team → editor's GitHub username is listed.
- Check editor is a GitHub collaborator on the repo with at least Write
  access.
- Check `backend.repo` in `/home/phurix/projects/flyed/public/admin/config.yml:6`
  matches `flyed-dev/flyed` exactly.

### 6.2 Preview iframe shows 404 or wrong content

- Branch hasn't deployed yet — wait 30–60s. Workers Builds can be slower
  than Pages for cold starts.
- Check Workers → flyed → Deployments for the PR branch. Confirm
  "Success" status.
- Verify the preview URL matches the pattern in §3 above — do NOT paste
  a Pages-style URL.
- If the preview shows the main branch instead of the PR branch, check
  the `cms/<slug>` branch exists and has been pushed:
  `git ls-remote origin 'refs/heads/cms/*'`.

### 6.3 Editorial workflow missing (commits land on main directly)

- `publish_mode: editorial_workflow` missing from
  `/home/phurix/projects/flyed/public/admin/config.yml:10`.
- Decap defaults to direct commit if this is unset.

### 6.4 Image upload fails

- File > 5 MB (cap enforced at
  `/home/phurix/projects/flyed/public/admin/config.yml:108`,
  `max_file_size: 5242880`).
- GitHub push rejected (file too large for repo — GitHub rejects files
  > 100 MB; in practice, the 5 MB cap should prevent this).
- Editor must resize and retry.

### 6.5 /admin returns 404

- Verify `/home/phurix/projects/flyed/public/admin/index.html` exists in
  the deployed build (`/admin/index.html` on the live site).
- Verify `/home/phurix/projects/flyed/public/_redirects:11` has the
  `/admin /admin/index.html 200` rule. This is a Cloudflare Pages
  redirect rule; under Workers, the ASSETS binding serves `index.html`
  for directory paths directly — the redirect may be redundant but
  harmless. If `/admin` 404s, check whether the Workers project has
  static-asset auto-index enabled.

## 7. Out of scope (not yet implemented)

These items were identified in the original
`/home/phurix/projects/flyed/docs/decap-cms.md:95-101` as future work. None
has been implemented; all are open.

- Itineraries, destinations, categories in CMS — would extend the
  `collections:` block in `config.yml` and require schema additions in
  `src/content.config.ts`.
- Custom Decap UI branding matching flyed design — would modify the
  `logo_url` and override Decap's CSS.
- IP allowlist on `/admin` (Cloudflare Access) — would require a Zero
  Trust policy in the Cloudflare dashboard.
- Image processing pipeline (resize on upload, AVIF/WebP variants) — not
  planned. See `RB-image-service.md` for why AVIF/WebP variants are
  blocked at the build step today.

## Related

- `../deployment.md` — for the broader deploy/rollback procedure.
- `public/admin/README.md` (at `/home/phurix/projects/flyed/public/admin/README.md`)
  — editor-facing companion doc. Different audience (editors, not operators).
