---
title: API overview — flyed runtime endpoints
doc_type: api
status: draft
version: 0.1.0
date: 2026-07-05
authors: ['docs-architect (AI-generated, pending human review)']
reviewers: []
system: flyed marketing site
source_commit: 6830fe4
related:
  - ../architecture/overview.md
  - ../architecture/decisions/0002-kv-namespaces-and-durability.md
  - ./openapi.yaml
---

# API overview — flyed runtime endpoints

This document describes the public HTTP API surface of the flyed marketing
site. It applies to the three runtime endpoints under `/api/*`:
`/api/enquiry`, `/api/contact`, `/api/newsletter`. The marketing surface
itself (HTML pages, blog posts, destinations, itineraries) is pre-rendered
HTML and is out of scope for an API document — see `docs/architecture/overview.md`
for the runtime model and `docs/superpowers/specs/2026-06-30-flyed-marketing-site-design.md`
for the information architecture.

The endpoint shapes are duplicated in machine-readable form in
[`docs/api/openapi.yaml`](./openapi.yaml). This overview covers what a spec
cannot say: conventions, rate-limit behavior, error semantics, and the
`durable` contract.

## 1. Base URLs and environments

| Environment | Base URL                | Notes                                                                                         |
| ----------- | ----------------------- | --------------------------------------------------------------------------------------------- |
| Production  | `https://flyed.dev`     | Apex domain. `www.flyed.dev` redirects to apex via Cloudflare Redirect Rule (`DEPLOY.md` §4). |
| Local dev   | `http://localhost:4321` | `astro dev` (per `CLAUDE.md` and `package.json:9`).                                           |

There is no staging environment. Preview environments are supported by the
KV `preview_id` mechanism (`wrangler.jsonc:21, 26`) but are not currently
wired to per-PR deploys.

## 2. Authentication

There is no end-user authentication. The three endpoints are public and
designed for browser submission via the Astro pages and React islands in
this repo. The only protections are:

- **Schema validation** — every payload is validated server-side with Zod
  (`src/pages/api/enquiry.ts:17`, `src/pages/api/contact.ts:10`,
  `src/pages/api/newsletter.ts:10`).
- **Rate limiting** — `/api/enquiry` is rate-limited by IP (§3.5).

If you are an integrator wanting to submit an enquiry from outside the
flyed site (e.g. a partner form), the request shape is documented below
and the OpenAPI spec; the rate limit applies. There is no API key today —
if you need one, that is an OPEN QUESTION for product (§Open questions).

> **OPEN QUESTION (owner: product):** Should there be an API-key path for
> partner integrations, with a separate (higher) rate-limit tier? Today
> there is no such path; an external POST is treated as anonymous browser
> traffic.

## 3. Conventions

### 3.1 Resource identifiers

- `enquiryId` — UUIDv4 returned by `POST /api/enquiry` on success. Use it
  as the key to look up the durable record in `LEADS_KV` (with the same
  Worker; no external KV read API is exposed).
- No resource versioning, no public read endpoints. The API is write-only
  for marketing-capture purposes.

### 3.2 Requests and responses

- **Content-Type**: `application/json` for every request and response.
- **Request body**: a JSON object matching the schema listed per endpoint
  below. Extra fields are tolerated by Zod's default (`strip`) mode and
  silently dropped.
- **Response body**: always a JSON object with an `ok` boolean. Errors
  include a human-readable `error` string and, for validation failures, a
  Zod `issues` array. Successes on `/api/enquiry` include `enquiryId` and
  `durable`.
- **HTTP status codes**:
  - `200` — success (and, in the enquiry handler, success-with-degraded-
    downstream; see `durable` below).
  - `400` — body is not valid JSON.
  - `422` — body parses but fails schema validation.
  - `429` — rate limit exceeded (enquiry endpoint only).
- **Calendar and locale**: dates inside the enquiry payload are strings
  (e.g. `departureMonth`); the handler does not parse them. All
  timestamps in API responses are absent — `createdAt` is internal to the
  `LEADS_KV` record and not surfaced over HTTP.

### 3.3 Pagination

Not applicable. Every endpoint accepts a single JSON object and returns a
single JSON object. There are no list endpoints.

### 3.4 Filtering, sorting, sparse fields

Not applicable. There is no read API.

### 3.5 Rate limiting

`POST /api/enquiry` is rate-limited per client IP using a sliding-window
algorithm stored in `RATE_LIMIT_KV`.

| Setting                     | Value                                                             | Evidence                         |
| --------------------------- | ----------------------------------------------------------------- | -------------------------------- |
| Window                      | 60 seconds (`windowMs: 60_000`)                                   | `src/pages/api/enquiry.ts:40`    |
| Maximum requests            | 5 per IP per window (`max: 5`)                                    | `src/pages/api/enquiry.ts:39`    |
| Algorithm                   | Sliding window — per-IP timestamps filtered by age on each call   | `src/lib/rate-limit.ts:30-52`    |
| IP source                   | `cf-connecting-ip` → first hop of `x-forwarded-for` → `'unknown'` | `src/pages/api/enquiry.ts:30-33` |
| Behavior on missing binding | Fail open (`{ allowed: true }`)                                   | `src/lib/rate-limit.ts:32-34`    |

Response when the limit is exceeded:

```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 37

{"ok":false,"error":"Rate limit exceeded"}
```

- `Retry-After` (seconds) is the integer number of seconds until the
  earliest in-window request ages out (minimum 1).
- The handler also writes `ctx.logger.warn(\`Rate limit exceeded
  [ip=...]\`)` (`src/pages/api/enquiry.ts:43`) for observability.

> **OPEN QUESTION (owner: product):** `/api/contact` and
> `/api/newsletter` are not rate-limited today. Should they be? Audit F
> flagged this; current behavior is "trust the schema validator". Confirm
> with product.

### 3.6 Idempotency and concurrency

There is no idempotency key. A duplicate POST creates a new `enquiryId`
and a new `LEADS_KV` record. There is no de-duplication window. The
endpoint is intended for browser submission, where the user is expected
to see the success state and not double-submit; the React form prevents
double-submit via `setSubmitting(true)` in `EnquiryForm.tsx:64-66`.

## 4. Versioning and deprecation policy

There is no API versioning today. The paths are `/api/enquiry`,
`/api/contact`, `/api/newsletter` — no `/v1/` prefix. Breaking changes
have not happened yet; when they do, the path will gain a version segment
rather than mutate in place.

> **OPEN QUESTION (owner: platform):** State the deprecation policy in
> writing — minimum notice window, header convention, doc-update lead
> time — so the first breaking change has a documented playbook. Today
> the answer is "unwritten" (audit F).

## 5. Error model

Every error is a JSON object with `ok: false`. The `error` field is a
short, human-readable English string. Validation failures include the Zod
`issues` array so a client can branch on `issues[0].path` /
`issues[0].message`.

Envelope shape (one shape, all endpoints):

```json
{
  "ok": false,
  "error": "Validation failed",
  "issues": [
    {
      "code": "too_small",
      "minimum": 4,
      "type": "number",
      "inclusive": true,
      "exact": false,
      "message": "between 4 and 60",
      "path": ["groupSize"]
    }
  ]
}
```

| HTTP          | `error` string                               | When                                                | Client action                                                                      |
| ------------- | -------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| 400           | `Invalid JSON`                               | `request.json()` threw.                             | Fix request body.                                                                  |
| 422           | `Validation failed` (enquiry, with `issues`) | Zod safeParse returned `success: false`.            | Branch on `issues[0]`; surface a per-field message.                                |
| 422           | `Invalid email` (newsletter)                 | Email failed `z.string().email()`.                  | Re-prompt for a valid email.                                                       |
| 422           | body parse ok but Zod failed (contact)       | Empty `error` string by design.                     | Re-prompt; do not branch on the `error` field for `/api/contact`.                  |
| 429           | `Rate limit exceeded`                        | 6th request from same IP inside 60s (enquiry only). | Back off per `Retry-After` header.                                                 |
| 200 (enquiry) | —                                            | Successful validation + persistence attempt.        | Inspect `durable` flag — `false` means lead has no recoverable copy in `LEADS_KV`. |

### 5.1 The `durable` contract (enquiry only)

`POST /api/enquiry` returns:

```json
{ "ok": true, "enquiryId": "<uuid>", "durable": true|false }
```

`durable` is `true` **only** when both of the following hold
(`src/pages/api/enquiry.ts:59-76`):

1. The `LEADS_KV` binding was present (`locals.runtime.env.LEADS_KV`
   was not `undefined`).
2. `leadsKv.put(enquiryId, ...)` resolved without throwing.

If either condition fails, `durable` is `false`. The handler still returns
`200` because Resend may have delivered the email successfully even if
KV was unavailable. A client that ignores `durable` will be wrong about
the lead's recoverability.

> **Assumption:** The handler's "always 200" pattern is intentional, based
> on the inline comments at `src/pages/api/enquiry.ts:53-58, 117-121`. If
> a future change makes the handler return 5xx when both `LEADS_KV` and
> Resend fail, this section must be updated. Confirm with engineering.

## 6. Endpoint map

| Endpoint               | Purpose                                                                                        | Spec tag     |
| ---------------------- | ---------------------------------------------------------------------------------------------- | ------------ |
| `POST /api/enquiry`    | Capture a qualified school-trip enquiry; persist to `LEADS_KV`; email via Resend; POST to CRM. | `enquiry`    |
| `POST /api/contact`    | Capture a general contact message (no persistence, no dispatch).                               | `contact`    |
| `POST /api/newsletter` | Capture an email signup (no persistence, no provider integration yet).                         | `newsletter` |

Per-endpoint request/response shapes are in `docs/api/openapi.yaml`.

## 7. Integration walkthroughs

### 7.1 Submit an enquiry (curl, EN locale)

```bash
curl -sS -X POST https://flyed.dev/api/enquiry \
  -H 'Content-Type: application/json' \
  -d '{
    "schoolName": "St. Mary'\''s International School",
    "role": "Head of Sixth Form",
    "email": "trip-lead@stmarys.example",
    "phone": "+44 20 7946 0000",
    "country": "United Kingdom",
    "groupSize": 24,
    "ages": "16-17",
    "departureMonth": "Jun",
    "duration": 10,
    "subjects": ["history-heritage", "cultural-heritage"],
    "curriculum": "IB-DP",
    "destinations": ["Bangkok", "Ayutthaya"],
    "notes": "Looking for a WW2-history focus if possible."
  }'
```

Successful response:

```json
{ "ok": true, "enquiryId": "5b1f...c0a2", "durable": true }
```

Validation failure (HTTP 422):

```json
{
  "ok": false,
  "error": "Validation failed",
  "issues": [{ "path": ["groupSize"], "message": "between 4 and 60" }]
}
```

Rate-limit failure (HTTP 429):

```json
{ "ok": false, "error": "Rate limit exceeded" }
```

with `Retry-After: 37` header.

### 7.2 Submit a contact message

```bash
curl -sS -X POST https://flyed.dev/api/contact \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Pat Q. Educator",
    "email": "pat@school.example",
    "message": "Quick question about teacher chaperone ratios."
  }'
```

Successful response: `{ "ok": true }`. The handler does **not** persist,
email, or log this — the `name`, `email`, and `message` go into the void
by design (`src/pages/api/contact.ts:18`). This is intentional for
Waves-7-pre-launch behavior; see §Open questions.

### 7.3 Submit a newsletter signup

```bash
curl -sS -X POST https://flyed.dev/api/newsletter \
  -H 'Content-Type: application/json' \
  -d '{ "email": "reader@example.com" }'
```

Successful response: `{ "ok": true, "subscribed": true }`. The handler
does **not** persist or dispatch — the email address goes into the void
(`src/pages/api/newsletter.ts:16-18`). Wiring a real provider is a
known post-launch item (`DEPLOY.md` "Known post-launch items").

## 8. Changelog

There is no API changelog yet. Notable code-level changes that affect
this contract:

| Date       | Commit                                                                                 | Change                                                                         |
| ---------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 2026-07-04 | `8fdbb1e fix(api): make durable flag honest + add IP fallback`                         | `durable` flag now reflects actual KV write success; IP-detection chain added. |
| 2026-07-04 | `c2f878a merge(wave-7): Task 3.2 — durable lead capture to KV`                         | LEADS_KV write introduced before dispatch.                                     |
| 2026-07-04 | `028afa3 test(api): add 429 rate-limit coverage + move enquiry.test.ts to tests/unit/` | 429 path now tested.                                                           |

## Open questions and assumptions

> **Assumption:** The `/api/contact` and `/api/newsletter` handlers'
> no-op behavior is intentional for the pre-launch Wave 7 window — based
> on the inline comment "No logging in production to avoid leaking form
> data" in `src/pages/api/contact.ts:18`. Confirm with product whether
> these endpoints should dispatch to a backend before launch, or remain
> stubs.

> **Assumption:** `/api/newsletter` returning success without a provider
> is the post-launch gap noted in `DEPLOY.md`. Confirm with product that
> the form is safe to keep accepting email addresses today.

> **Assumption:** The `durable: false` 200-response pattern is intentional
> and product-acceptable. Confirm with product that visitors are not
> expected to see a 5xx when their enquiry "failed" downstream.

> **OPEN QUESTION (owner: product):** Should `/api/contact` and
> `/api/newsletter` be rate-limited? They are not today. The cost of a
> yes decision is two more KV namespaces or a shared namespace; the cost
> of no is abuse potential. Confirm.

> **OPEN QUESTION (owner: platform):** State the API deprecation policy
> (notice window, header convention, doc-update lead time). Today the
> answer is "unwritten" — the first breaking change will set the
> precedent.

> **OPEN QUESTION (owner: product):** Should partner integrations have an
> API-key path with a higher rate-limit tier? Today every POST is
> anonymous browser traffic.

> **OPEN QUESTION (owner: engineering):** Audit F (LEADS_KV failure
> runbook) — when `durable: false` is returned, where does the lead
> record live? Today, only in the request log (`ctx.logger.error`). A
> runbook for "LEADS_KV was down at 14:32 UTC for 6 minutes" is missing.

## Change history

| Date       | Version | Author              | Summary                                                                         |
| ---------- | ------- | ------------------- | ------------------------------------------------------------------------------- |
| 2026-07-05 | 0.1.0   | docs-architect (AI) | Initial API overview derived from `src/pages/api/*.ts` at branch tip `6830fe4`. |
