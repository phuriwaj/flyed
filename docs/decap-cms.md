# Decap CMS Operator Runbook

This document is for the developer who set up Decap CMS. Editors should read `public/admin/README.md` instead.

## One-time setup (operator only)

### 1. Decap Cloud account

1. Sign up at https://decapcms.org/cloud/ (free tier: 1 editor, unlimited repos)
2. Add a site: `https://flyed.dev`
3. Connect the GitHub repo: `flyed-dev/flyed`
4. Grant Decap Cloud access to the repo (via GitHub App)
5. Note the GitHub username(s) of authorized editors

### 2. CF Pages branch deploys (verify)

The preview iframe assumes CF Pages is configured to deploy PR branches.

1. Cloudflare Dashboard → flyed Pages project → Settings → Builds
2. Confirm "Enable branch build previews" is ON
3. Preview URL format: `https://<branch>--flyed-dev.pages.dev`

### 3. Invite an editor

1. Add the editor as a GitHub collaborator on `flyed-dev/flyed` (Write access)
2. Add their GitHub username in Decap Cloud → Team
3. Send them the editor README link: `https://flyed.dev/admin/README.md`

## How it works

```
Editor saves in /admin
  → Decap Cloud OAuth via git-gateway
  → Decap creates branch: cms/<slug>
  → Decap commits + opens PR
  → CF Pages auto-deploys branch
  → Editor previews at https://<branch>--flyed-dev.pages.dev/blog/<slug>
  → Reviewer merges PR
  → CF Pages deploys production
```

## File layout

| File | Purpose |
|---|---|
| `public/admin/index.html` | Decap CMS shell (loads from unpkg) |
| `public/admin/config.yml` | Collections, i18n, backend, preview config |
| `public/admin/preview.html` | Custom preview iframe |
| `public/admin/README.md` | Editor how-to |
| `src/content.config.ts` | `blog` and `blogTh` Astro collections |
| `src/pages/th/blog/*` | Thai blog pages (read `blogTh`) |
| `scripts/migrate-blog-i18n.mjs` | One-shot migration of existing posts |

## Day-to-day operations

### Add a new editor

1. GitHub: invite as collaborator
2. Decap Cloud: add to team
3. Done. They log in at `/admin`.

### Disable editorial workflow temporarily

Edit `public/admin/config.yml`. Set `publish_mode: editorial_workflow` to a different value (or remove). Edits will commit directly to main. **Use with caution.**

### Roll back the entire CMS integration

See "Rollback" section in `docs/superpowers/specs/2026-07-03-decap-cms-integration-design.md`.

## Troubleshooting

### Editor can't log in

- Check Decap Cloud → Team → editor's GitHub username is listed
- Check editor is a GitHub collaborator on the repo
- Check `backend.repo` in `config.yml` matches the actual repo name

### Preview iframe shows 404

- Branch hasn't deployed yet — wait 30–60s
- Check CF Pages → Deployments → branch listed with success status
- Verify branch name doesn't have unsupported characters (slashes get converted to `--`)

### Editorial workflow missing (commits land on main directly)

- `publish_mode: editorial_workflow` missing from `config.yml`
- Decap defaults to direct commit if this is unset

### Image upload fails

- File > 5MB (cap enforced in widget config)
- GitHub push rejected (file too large for repo)
- Editor must resize and retry

## Out of scope (not in this iteration)

- Itineraries, destinations, categories in CMS — open a PR
- Custom Decap UI branding matching flyed design — open a PR
- IP allowlist on `/admin` (Cloudflare Access) — open a PR
- Image processing pipeline — open a PR
