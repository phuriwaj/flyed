---
title: RB — Rate-limit KV eviction / TTL behaviour
doc_type: runbook
status: draft
version: 0.1.0
date: 2026-07-05
authors: ['docs-architect (AI-generated, pending human review)']
owner: engineering on-call
service: POST /api/enquiry (RATE_LIMIT_KV binding)
severity_default: P3
related_alerts: []
related: [../deployment.md, RB-enquiry-429.md, RB-leads-kv-failure.md]
---

# RB — Rate-limit KV eviction / TTL behaviour

## Overview

The enquiry handler's IP rate limiter
(`/home/phurix/projects/flyed/src/lib/rate-limit.ts:30-52`) stores a JSON
array of request timestamps at key `rl:<ip>` in the `RATE_LIMIT_KV`
namespace. Each `put()` writes the array with an `expirationTtl` of
`windowMs / 1000` — i.e. **60 seconds** (configured at
`/home/phurix/projects/flyed/src/pages/api/enquiry.ts:36-41`:
`max: 5, windowMs: 60_000`). Cloudflare KV also evicts keys based on
storage pressure (the underlying contract — see Cloudflare KV docs).

This runbook explains what that means operationally and what to do when:

1. A user reports being blocked for longer than the window implies.
2. A traffic spike is followed by an unexplained "quiet" window where
   429s seem lower than the burst would predict.
3. The team is sizing `RATE_LIMIT_KV` capacity.

**Resolved means:** you can explain why a single IP's rate-limit window
appears to reset earlier than `windowMs` would predict (and decide
whether that matters).

**Severity guidance:** **P3** in normal operation. Eviction is the
expected steady state of a sliding-window-on-KV design and does not
indicate a fault. The only time to escalate is if you suspect eviction is
occurring on **non-rate-limit** keys (i.e. `LEADS_KV`) — see
`RB-leads-kv-failure.md` for that.

## Prerequisites and access

- Read access to `/home/phurix/projects/flyed/src/lib/rate-limit.ts` and
  `/home/phurix/projects/flyed/src/pages/api/enquiry.ts`.
- Optional: `wrangler kv:key list --binding=RATE_LIMIT_KV` to inspect
  the current keyspace (production).

## How the sliding window works

Each IP's rate-limit state is a JSON array of `Date.now()` values stored
under `rl:<ip>`. On each request:

1. `get(key)` retrieves the array.
2. Filter out timestamps older than `now - windowMs` (60s).
3. If the remaining count ≥ `max` (5), return `allowed: false`.
4. Otherwise push `now`, `put(key, list, { expirationTtl: 60 })`.

The `expirationTtl: 60` means Cloudflare will automatically delete the key
60 seconds after the last write. This is **load-bearing**: without TTL,
every IP that has ever hit the form would leave a permanent key in KV,
and the namespace would grow without bound.

```ts
// src/lib/rate-limit.ts:48-50
await opts.kv.put(key, JSON.stringify(list), {
  expirationTtl: Math.ceil(opts.windowMs / 1000),
});
```

## What "eviction" means here

Two distinct mechanisms can remove a `rl:<ip>` key before its TTL:

| Mechanism                     | When                                                           | Effect                                                   |
| ----------------------------- | -------------------------------------------------------------- | -------------------------------------------------------- |
| **TTL expiry**                | 60s after last `put` for that IP                               | Key disappears. Next request from that IP starts fresh.  |
| **Storage-pressure eviction** | KV namespace exceeds its quota OR Cloudflare evicts under load | Key may disappear before TTL. Next request starts fresh. |

> **What eviction is NOT:** eviction does **not** mean the rate limit is
> bypassed for abusive traffic. It means the next request starts a new
> window — which is the same behaviour as TTL expiry. The two are
> indistinguishable from the application's point of view, and both are
> acceptable for the design intent ("at most 5 requests in any rolling
> 60-second window per IP"). A worst-case abusive IP can reset its
> window early by exploiting eviction; this is a low-severity abuse
> vector, not a fault.

## Operational consequences

### C.1 The rate-limit window can reset early

A user who hits the cap and waits 60 seconds will see the cap reset (TTL
expiry). A user who hits the cap and gets evicted before 60 seconds will
also see the cap reset. From the user's perspective the behaviour is
identical: the cap resets roughly every minute. Document this in any
customer-facing explanation ("we rate-limit to 5 enquiries per minute per
IP address").

### C.2 Capacity planning

`RATE_LIMIT_KV` is bounded by the number of unique IPs that hit
`/api/enquiry` in any 60-second window. With KV's free-tier allocation
(see Cloudflare pricing), this is unlikely to be a real concern for a
marketing site. If the team ever sees storage-pressure eviction alerts
from Cloudflare, the fix is either:

1. Reduce TTL (smaller window, more resets, more keys).
2. Switch from per-IP to per-IP-bucketed keys (less granular, smaller
   keyspace).
3. Upgrade the KV plan.

For flyed, option 1 reduces both fairness and abuse-resistance; option 2
is a code change; option 3 is the cleanest if growth justifies it.

> **OPEN QUESTION (owner: engineering):** What is the actual storage quota
> on `RATE_LIMIT_KV`? Cloudflare's default Workers Paid plan includes
> 1 GB of KV storage; the free tier has none. Confirm with the Cloudflare
> dashboard before assuming the namespace can grow without bound.

### C.3 Observability — distinguishing eviction from TTL expiry

Cloudflare does not surface per-key eviction events. From the
application's point of view, the only signal is "the rate-limit window
reset earlier than expected". The handler does not log this; it cannot
distinguish a reset-due-to-TTL from a reset-due-to-eviction.

If the team needs this signal for debugging, the minimal instrumentation
is:

```ts
// src/lib/rate-limit.ts (illustrative — not currently in source)
const ttl = Math.ceil(opts.windowMs / 1000);
console.log(`rate-limit write [ip=${opts.ip}] count=${list.length} ttl=${ttl}`);
```

> **Not currently implemented.** Adding logging here would produce one
> log line per request. The trade-off (log volume vs debuggability) is
> OPEN.

## Diagnosis

### 1. "User reports being blocked for longer than 60 seconds"

- This is **not** consistent with KV TTL/eviction. After TTL/eviction,
  the window resets — the user should be **unblocked**, not still
  blocked.
- Investigate `src/lib/rate-limit.ts:41-45` — the `retryAfterSec` value
  is derived from `(windowMs - (now - oldest)) / 1000` and is sent in
  the `Retry-After` header. A user reading the header should see ≤ 60.
- If the header says > 60, that is a bug in `rate-limit.ts`, not a
  KV-eviction issue. Open a fix ticket.

### 2. "Traffic spike followed by a quiet window"

- Expected: the spike exhausts many IPs' `max: 5` and produces many
  429s. After 60s, all those IPs' windows reset, and a new surge could
  land.
- Investigate `wrangler tail` for the relevant window. Count 429s.
- If 429s drop earlier than 60s after the spike ended, it is KV
  eviction, not a fault. No action required.

### 3. "Storage-pressure eviction alert from Cloudflare"

- Follow the Cloudflare KV docs for capacity upgrade.
- Cross-reference `wrangler kv:namespace list` to confirm the namespace
  is the right one (`RATE_LIMIT_KV` should NOT hold `LEADS_KV` data and
  vice versa).
- If unsure which binding is which, re-read
  `/home/phurix/projects/flyed/wrangler.jsonc:16-27`.

## Mitigation

There is **no mitigation required** for the steady-state TTL/eviction
behaviour. This runbook exists so that operators do not mistake normal
behaviour for a fault.

If the team wants to make the rate-limit window less bursty:

1. Increase `max` and `windowMs` at
   `/home/phurix/projects/flyed/src/pages/api/enquiry.ts:39-40`.
2. Or move the rate limiter off KV to Cloudflare's WAF rate-limit rules
   (a separate feature; would require a new config in the Cloudflare
   dashboard).

> **OPEN QUESTION (owner: engineering):** Is the current `5 / 60s`
> rate the right value? It is the value committed during the rate-limit
> implementation (commit
> `b3a06cb feat(api): add per-IP rate limiting`). For a marketing site's
> enquiry form, this is conservative. Confirm with the founder whether
> paying customers have ever been blocked.

## Verification

After any change to the rate-limit parameters or storage plan:

- `curl` 6 times from a single IP to `/api/enquiry` — the 6th should
  return 429 with `Retry-After ≤ 60`.
- `wrangler kv:key list --binding=RATE_LIMIT_KV --prefix 'rl:' | wc -l`
  shows the number of unique IPs in the namespace. Compare against
  baseline.
- `wrangler tail` shows no 5xx from the handler.

## Escalation

- **Time-box:** in normal operation, do not escalate. TTL/eviction is
  expected behaviour.
- **If a paying customer is blocked and the rate-limit parameters look
  correct:** escalate to the engineering lead. The fix is usually a
  one-line parameter change.
- **If Cloudflare reports an active KV incident:** see
  `RB-leads-kv-failure.md` §5 for the upstream-status check.

## Post-incident

- No postmortem required for normal TTL/eviction.
- File a ticket if a customer-facing block occurred and the root cause
  was the rate-limit parameters being too tight.
- **UPDATE THIS RUNBOOK** if any step was missing or wrong. The
  Wave 7 review flagged that this runbook did not previously exist.

## Related

- `RB-enquiry-429.md` — what to do when the rate limiter is firing.
- `RB-leads-kv-failure.md` — the `LEADS_KV` namespace has different
  TTL behaviour (30 days, see
  `/home/phurix/projects/flyed/src/pages/api/enquiry.ts:66`) and a
  different operational profile. Do NOT confuse the two.
