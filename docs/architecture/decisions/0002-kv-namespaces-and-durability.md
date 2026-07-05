---
status: 'accepted'
date: 2026-07-04
decision-makers: ['flyed engineering']
consulted: ['docs-architect (reverse-documented 2026-07-05)']
informed: []
---

# Use two Cloudflare KV namespaces — `RATE_LIMIT_KV` and `LEADS_KV`

## Context and problem statement

The `/api/enquiry` handler has two distinct persistence needs that must not
interfere with each other:

1. **Rate limiting.** A sliding-window counter keyed by client IP. Short
   TTL (≤ 60 seconds). High write volume per request. Never read back by
   visitors — only by the same handler immediately afterward.
2. **Lead capture.** A durable copy of the validated enquiry payload,
   addressable by a generated `enquiryId`. 30-day retention so a sales
   operator can replay a failed Resend/CRM dispatch from the JSON envelope.
   Low write volume. Read on demand only.

We also need a uniform contract: the API response must tell the caller
honestly whether the lead has a durable copy. A second-side response that
lies ("200 OK") without telling the caller the lead may be in a log only
is worse than a 5xx.

The decision: which Cloudflare KV shape (one namespace, two namespaces,
R2, D1, or Workers KV with TTL semantics) and how the handler reports
durability?

## Decision drivers

- The lead must outlive a downstream dispatch failure (Q3 in the architecture
  overview). KV's `expirationTtl` covers the 30-day replay window without
  manual cleanup.
- Rate-limit entries must auto-expire. Using `expirationTtl = windowMs / 1000`
  (`src/lib/rate-limit.ts:49`) gives free GC.
- IP-keyed rate-limit reads must be cheap. KV is consistent-enough at the
  edge for a sliding-window counter (we accept that two near-simultaneous
  requests could both pass under the limit — the limit is anti-abuse, not
  a quota).
- Two namespaces cost nothing at this scale and let us reason about each
  independently — easier to reset `RATE_LIMIT_KV` than to filter
  mixed-shape entries.
- The `durable` flag must reflect actual KV write success — not "the email
  was sent" or "the code path didn't throw before the put" (commit `8fdbb1e
fix(api): make durable flag honest + add IP fallback`).

## Considered options

- **One KV namespace for both.** Lower config surface; harder to reason
  about TTLs (rate-limit TTL vs lead retention TTL are different orders
  of magnitude).
- **Two KV namespaces, one for rate limiting and one for leads.** Config
  is two extra lines in `wrangler.jsonc`; each namespace has its own TTL
  policy; the `durable` flag maps cleanly to a single write path.
- **R2 (object storage) for leads.** Heavier weight; not needed at the
  volumes a marketing site generates.
- **D1 (SQLite at the edge) for leads.** Tempting, but introduces a schema
  for a single record type and adds a migration surface for a one-developer
  team.
- **Astro DB.** Mentioned in the marketing spec
  (`docs/superpowers/specs/2026-06-30-flyed-marketing-site-design.md`) but
  never wired — KV is simpler for this use case and the audit E.1 flags
  the spec as stale.

## Decision outcome

Chosen option: **"Two KV namespaces"**, because it is the only option that
keeps the two TTLs independent and gives the `durable` flag a single,
auditable write path. The `durable` contract is: `true` only when the
binding was present **and** `leadsKv.put()` resolved without throwing
(`src/pages/api/enquiry.ts:60-76`). On either failure mode the response
is still `200 { ok:true, enquiryId, durable:false }` so the visitor sees
success, but the `durable` flag signals that the lead has no recoverable
copy in `LEADS_KV`.

### Consequences

- Good, because rate-limit and lead-capture TTLs never collide — a 30-day
  lead TTL is safe to apply to the `LEADS_KV` namespace only.
- Good, because the `durable` flag is honest: it reflects a real write
  attempt, not a code path that "intended to write".
- Good, because both namespaces are scoped to the same Worker — no
  cross-namespace ACL, no extra auth.
- Bad, because `LEADS_KV` is a key-value store, not a queryable database —
  finding a lead requires its `enquiryId`. There is no "list leads from
  this week" affordance.
- Bad, because the handler "always returns 200" pattern can mislead a
  caller into thinking the lead reached the inbox. The `durable` flag is
  the disambiguator, but a client that ignores it will be wrong.
- Neutral, because lead retention is bounded at 30 days. A lead that takes
  longer than 30 days to convert cannot be re-fetched — the architecture
  overview R-8 calls this out.
- Neutral, because two namespaces must be created in Cloudflare and their
  real ids patched into `wrangler.jsonc:19-26` before first deploy. The
  `DEPLOY.md` §2.5 runbook step is the single blocker.

### Confirmation

- `wrangler.jsonc:16-27` declares both namespaces with placeholder ids
  and clear comments that they must be replaced before deploy.
- `src/pages/api/enquiry.ts:30-33` documents the IP-detection chain
  (`cf-connecting-ip` → `x-forwarded-for` first hop → `'unknown'`) — added
  in `8fdbb1e fix(api): make durable flag honest + add IP fallback`.
- `src/lib/rate-limit.ts:1-52` documents the sliding-window algorithm and
  fail-open behavior when the binding is missing.
- `src/test/rate-limit.test.ts` (added in commit `028afa3 test(api): add
429 rate-limit coverage + move enquiry.test.ts to tests/unit/`) covers
  the 429 path.
- `DEPLOY.md` §2.5 lists the exact `wrangler kv namespace create` commands.

## Pros and cons of the options

### One KV namespace

- Good, because less config.
- Bad, because the two TTLs must be applied per-key — same key prefix
  strategy across two semantically different namespaces is error-prone.

### Two KV namespaces

- Good, because TTLs are namespace-level, not key-level.
- Good, because each namespace can be reset independently for testing.
- Bad, because two extra lines in `wrangler.jsonc` and two namespaces to
  create on first deploy.

### R2

- Good, because no TTL pressure.
- Bad, because the per-request write is heavier and adds no value at
  marketing-site volumes.

### D1

- Good, because queryable.
- Bad, because schema migrations and a new tool for a one-developer team.

## More information

- API reference: `docs/api/overview.md` (rate-limit, error model, `durable`
  semantics).
- Source: `src/pages/api/enquiry.ts:30-76`, `src/lib/rate-limit.ts`.
- Deploy step: `DEPLOY.md` §2.5.
- Risk: architecture overview R-2 (no recovery procedure for `durable:false`
  yet) and audit OPEN QUESTION F.
