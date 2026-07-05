---
title: RB — LEADS_KV put failure (durable: false in response)
doc_type: runbook
status: draft
version: 0.1.0
date: 2026-07-05
authors: ["docs-architect (AI-generated, pending human review)"]
owner: engineering on-call
service: POST /api/enquiry (Cloudflare Worker)
severity_default: P2
related_alerts: []
related: [../deployment.md, RB-enquiry-429.md, RB-rate-limit-kv-eviction.md]
---

# RB — LEADS_KV put failure

## Overview

`POST /api/enquiry` returns `HTTP 200 { ok: true, enquiryId: <uuid>, durable: <bool> }`
(`/home/phurix/projects/flyed/src/pages/api/enquiry.ts:117-125`). The
`durable` field is `true` only when the enquiry has been written to the
`LEADS_KV` namespace AND the write resolved without throwing. When
`durable: false`, the lead has **no durable copy** — the only record is in
the Worker request log (`ctx.logger.warn(...)` at
`src/pages/api/enquiry.ts:75` or `ctx.logger.error(...)` at line 70).

**User-visible impact:** none at the response layer — the user sees a
"Thank you" screen and downstream dispatch (Resend email + CRM webhook) is
attempted best-effort. The impact is **internal**: the lead is not
retrievable from KV.

**Resolved means:** the next enquiry returns `durable: true`, AND any leads
captured during the incident window are recovered manually from logs.

**Severity guidance:** default **P2** (lead loss is a business event). Escalate
to **P1** if `durable: false` rate exceeds 10% of submissions in a 15-minute
window, or if a confirmed customer enquiry is unrecoverable.

## Prerequisites and access

- Cloudflare account with `Workers` and `KV` edit permissions on the `flyed`
  project.
- `wrangler` CLI authenticated.
- Logpush destination OR ad-hoc `wrangler tail` access — without this, lead
  recovery is impossible.
- Read access to `/home/phurix/projects/flyed/src/pages/api/enquiry.ts` and
  `/home/phurix/projects/flyed/wrangler.jsonc`.

## Diagnosis

### 1. Confirm the symptom is durable: false, not 429

```bash
wrangler tail --name=flyed --format=json | \
  jq 'select(.request.url | endswith("/api/enquiry")) | .response'
```

Look at the response bodies, not just the status codes. A 200 with
`"durable":false` is this runbook; a 429 is `RB-enquiry-429.md`; a 500 is a
different failure entirely.

### 2. Recent changes (events-first)

```bash
git log --oneline -10 origin/main
```

Look for changes to:

- `/home/phurix/projects/flyed/wrangler.jsonc` (KV id changes, binding removal)
- `/home/phurix/projects/flyed/src/pages/api/enquiry.ts` lines 59–76
  (the `leadsKv.put` block)

### 3. Is the binding present?

```bash
wrangler kv:namespace list
```

You should see one namespace for `LEADS_KV` (production) and one preview
namespace. Cross-reference the `id` against
`/home/phurix/projects/flyed/wrangler.jsonc:23-26`. If they differ, you have
a stale config — the Worker is binding to the wrong namespace. Fix and
redeploy.

> **Common cause:** the `LEADS_KV` namespace was created but the real `id`
> was never patched into `wrangler.jsonc`. The placeholder id
> `00000000000000000000000000000002` causes Workers to fail at binding
> resolution; the code in `src/pages/api/enquiry.ts:74-76` logs a warning
> instead of an error. This produces exactly the `durable: false` symptom.

### 4. Can the Worker write to KV at all?

```bash
wrangler kv:key put --binding=LEADS_KV "diagnostic-probe-$(date +%s)" '"ok"' --ttl 60
wrangler kv:key list --binding=LEADS_KV --prefix "diagnostic-probe-"
```

If the probe succeeds and `durable: false` persists, the problem is in the
handler's path (e.g. an exception thrown between rate-limit success and the
KV put). If the probe also fails, KV itself is unavailable — see the next
step.

### 5. Is Cloudflare KV healthy?

Check [Cloudflare Status](https://www.cloudflarestatus.com/) for KV
incidents. If there is an active incident, ride it out (Cloudflare resolves
KV incidents; no operator action is productive while their backend is
degraded).

### 6. Inspect the Worker error log

```bash
wrangler tail --name=flyed --format=json | \
  jq 'select(.message | test("LEADS_KV"; "i"))'
```

You should see either `LEADS_KV put failed [enquiryId=...]` (an exception
during the put) or `LEADS_KV not bound; enquiry not durably persisted
[enquiryId=...]` (no binding). These two messages identify the root cause
directly.

## Mitigation

> **The mitigation order matters.** Always do A first (binding check) — it's
> the most common cause and the cheapest fix.

### A. Binding is missing or stale

1. Confirm: `wrangler kv:namespace list` returns the namespace and the `id`
   matches `wrangler.jsonc:25`.
2. If missing: `wrangler kv namespace create LEADS_KV` (and `--preview`),
   patch the ids into `wrangler.jsonc:25-26`, commit, push.
3. **Verification:** `wrangler tail` shows the next enquiry logs
   `LEADS_KV put succeeded` (or simply does not log the warning).

### B. Cloudflare KV incident

1. No operator action — wait for Cloudflare to resolve.
2. Page the founder if the incident lasts more than 60 minutes and leads are
   being lost. Have Logpush ready to capture the affected window.

### C. Worker code exception

1. Read the error message in step 6 above. The most common exception is
   `ReferenceError: locals is not defined` in a handler refactor — verify
   the handler reads `(locals as any)?.runtime?.env?.LEADS_KV` correctly
   (`src/pages/api/enquiry.ts:59`).
2. Roll back to the last good deploy (see `../deployment.md` §5.1).
3. File a fix ticket with the exception message.

### D. Lead recovery (the manual retry loop)

> **This is the painful one.** Wave 7's final review captured that lead
> recovery during a KV outage is a manual process. Until log-export
> automation lands, follow the steps below for every enquiry confirmed
> lost during the incident window.

1. **Pull the window.** From `wrangler tail` (or Logpush archive), filter
   for `enquiryId` records where the response body had `"durable":false`.
   Note: `enquiryId` is logged at `src/pages/api/enquiry.ts:75`. If your
   log retention does not cover the full window, escalate immediately —
   leads outside the log window are unrecoverable.
2. **Reconstruct the lead payload.** Each request body is in the log. The
   schema is `enquirySchema` in
   `/home/phurix/projects/flyed/src/components/EnquiryForm.tsx:4-22`.
3. **Resend the email manually** using the Resend dashboard (manual send)
   or a one-off `curl` to `https://api.resend.com/emails` with the same
   payload as `src/pages/api/enquiry.ts:80-90`.
4. **POST to CRM manually** using `curl -X POST -H 'Content-Type: application/json'`
   to the same `CRM_WEBHOOK_URL` with `{ ...enquiry, enquiryId }`
   (matching the shape in `src/pages/api/enquiry.ts:101-107`).
5. **Record the recovery** in the team's incident log: list of `enquiryId`
   values, recovery timestamp, who did the recovery. This is the audit
   trail for the missed SLA.
6. **Verification:** every recovered `enquiryId` shows up in the Resend
   dashboard's delivery log and the CRM's inbound webhook log.

> **Destructive step warning:** Step 3 and step 4 may trigger duplicate
> emails or duplicate CRM records if a downstream dispatch actually
> succeeded (the handler returns 200 OK even when one or both dispatches
> fail). Before re-sending, check the Resend dashboard's "Sent" log for
> the recipient email to avoid duplicates.

## Verification

- The most recent 50 `POST /api/enquiry` responses all carry `"durable":true`.
- Workers logs no longer contain `LEADS_KV put failed` or `LEADS_KV not bound`.
- Every lead captured during the incident window has been re-sent to Resend
  and re-POSTed to the CRM webhook (if a CRM is configured).

## Escalation

- **Time-box:** if not mitigated within 30 minutes, escalate to the
  engineering lead.
- **If a confirmed customer enquiry is unrecoverable** (log retention too
  short, or the lead was not logged): escalate to the founder immediately.
  Treat this as a data-loss event.
- **What to hand over:** the diagnosis output above, the list of recovered
  vs unrecoverable `enquiryId`s, the time window of the incident.

## Post-incident

- Open a postmortem if duration > 30 minutes OR any lead was unrecoverable.
  See `docs/operations/deployment.md` §1 (postmortem location).
- File an automation ticket to add Logpush → object storage so future
  incidents do not depend on `wrangler tail` retention.
- **UPDATE THIS RUNBOOK** if a step was missing or wrong. The Wave 7
  review called this runbook out specifically — keeping it accurate is
  the difference between a 30-minute incident and a 3-hour one.

## Related

- `RB-enquiry-429.md` — separate failure mode, but can co-occur if KV is
  having a partial outage.
- `RB-rate-limit-kv-eviction.md` — explains why rate-limit KV is unrelated
  to `LEADS_KV` and why fixing one does not fix the other.
