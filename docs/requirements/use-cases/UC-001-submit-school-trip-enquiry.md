---
title: 'UC-001 — Submit a school-trip enquiry'
doc_type: frs
status: draft
version: 0.1.0
date: 2026-07-05
authors:
  - docs-architect (AI-generated, pending human review)
reviewers: []
system: flyed marketing site
source_commit: 6830fe4
related:
  - ../srs.md
  - ../functional-spec.md
---

# UC-001 — Submit a school-trip enquiry

| Field                             | Value                                                                                                                                                                                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary actor                     | Anonymous visitor (school-trip organizer / teacher / parent)                                                                                                                                                                                                          |
| Scope                             | flyed marketing site                                                                                                                                                                                                                                                  |
| Level                             | User goal                                                                                                                                                                                                                                                             |
| Stakeholders & interests          | Visitor: progress through a multi-step form without losing input. Marketing: durable lead capture (must not be lost on downstream failure). Engineering: do not let abuse flood KV / Resend / CRM. Legal: PII is collected, logged minimally, retained within policy. |
| Preconditions                     | `RATE_LIMIT_KV` is bound (production) or the rate limiter is failing open (local dev). `LEADS_KV` is bound (production). Visitor reaches `/enquire` (or `/th/enquire`).                                                                                               |
| Success guarantee (postcondition) | A new entry exists in `LEADS_KV` under a UUID key, a Resend email is dispatched to `ENQUIRY_TO_EMAIL`, a CRM webhook payload is POSTed to `CRM_WEBHOOK_URL`, and the client receives `200 {ok:true, enquiryId, durable}`.                                             |
| Minimal guarantee                 | If `LEADS_KV.put()` fails, the request still returns `200 {ok:true, durable:false}` and downstream dispatch is attempted; the lead is not lost from the response (only from durable storage).                                                                         |
| Trigger                           | Visitor clicks "Plan a Trip" or "Enquire about this trip" / "Enquire", reaching `/enquire`.                                                                                                                                                                           |

## Main success scenario

1. Visitor lands on `/enquire`. The page renders the `EnquiryForm` React island in step 1 (`src/pages/enquire.astro`, `src/components/EnquiryForm.tsx:60`).
2. Visitor fills step 1 fields: `groupSize`, `ages`, `departureMonth`, `duration`, `schoolName`, `role`, `email`, `phone`, `country` (`EnquiryForm.tsx:216-241`). Validation against the per-step schema runs on Next.
3. Visitor selects one or more subjects of interest from the 6-category checkbox grid (`EnquiryForm.tsx:243-281`).
4. Visitor optionally selects destinations from the 12-city checkbox grid (`EnquiryForm.tsx:283-310`). If none, "you choose" is implied.
5. Visitor optionally enters free-text notes (`EnquiryForm.tsx:312-326`).
6. Visitor reviews step 5 — a JSON dump of the entered data (`EnquiryForm.tsx:328-337`).
7. Visitor clicks "Send enquiry". The form's full `enquirySchema.safeParse(data)` runs locally; if it fails, the form shows a localized error message and aborts (`EnquiryForm.tsx:116-126,339-347`).
8. The form posts the validated JSON body to `/api/enquiry` with `Content-Type: application/json` (`EnquiryForm.tsx:127-131`).
9. The server handler parses the body (`src/pages/api/enquiry.ts:11-15`). JSON-parse failure returns `400`.
10. The server re-validates with `enquirySchema.safeParse` (`src/pages/api/enquiry.ts:17-23`). Validation failure returns `422` with `issues`.
11. The server resolves the client IP from headers, in order: `cf-connecting-ip`, first hop of `x-forwarded-for`, `"unknown"` (`src/pages/api/enquiry.ts:30-33`).
12. The server checks the rate limit via `rateLimited({ip, kv, max: 5, windowMs: 60_000})` (`src/pages/api/enquiry.ts:36-41`). If denied, returns `429` with `Retry-After` header.
13. The server generates `enquiryId = crypto.randomUUID()` (`src/pages/api/enquiry.ts:51`).
14. The server writes `{enquiry, createdAt}` to `LEADS_KV` under `enquiryId` with `expirationTtl = 60·60·24·30` seconds (`src/pages/api/enquiry.ts:60-67`). On success, `persisted = true`.
15. If `RESEND_API_KEY` is set, the server POSTs an HTML email to `https://api.resend.com/emails` from `noreply@flyed.dev` to `ENQUIRY_TO_EMAIL` (`src/pages/api/enquiry.ts:79-95`).
16. If `CRM_WEBHOOK_URL` is set, the server POSTs `{...enquiry, enquiryId}` to it (`src/pages/api/enquiry.ts:101-114`).
17. The server responds `200 {ok: true, enquiryId, durable: persisted}` (`src/pages/api/enquiry.ts:117-125`).
18. The form switches to the localized thank-you message (`src/components/EnquiryForm.tsx:158-169`).

## Extensions

- 2a. Visitor clicks "Back" (or navigation) without filling all required fields. The form remains on step 1 (`EnquiryForm.tsx:114`). Browser back navigation discards the form; no server state is involved.
- 7a. Client-side validation fails on the review step (e.g., a field was edited to be invalid). The form shows "Please review the form for errors" (`EnquiryForm.tsx:123`). UC ends without server contact.
- 9a. Body is not JSON → server returns `400 {ok:false, error:"Invalid JSON"}` (`enquiry.ts:13-15`). UC ends; the form shows the network error message.
- 10a. Validation fails on the server (e.g., Zod rejects something the client missed). Server returns `422 {ok:false, error:"Validation failed", issues:[…]}` (`enquiry.ts:18-23`). The form reads the first issue, displays `"<field>: <message>"`, and aborts (`EnquiryForm.tsx:132-145`). UC ends.
- 12a. Rate limit exceeded. Server returns `429` with `Retry-After` header in seconds. The form's status code branch falls into the generic "Something went wrong" message (`EnquiryForm.tsx:144`). UC ends; client may retry after `Retry-After`.
- 14a. `LEADS_KV` is not bound (local dev / wrong config). The handler logs a warning and sets `persisted = false` (`enquiry.ts:74-76`). UC continues to step 15.
- 14b. `LEADS_KV.put()` throws. The handler logs an error and sets `persisted = false` (`enquiry.ts:69-72`). UC continues to step 15; durable storage is lost for this lead.
- 15a. `RESEND_API_KEY` is not configured. The handler logs a warning and skips Resend dispatch (`enquiry.ts:96-98`). UC continues to step 16.
- 15b. Resend fetch throws or returns non-2xx. The handler logs an error (`enquiry.ts:91-94`). UC continues to step 16.
- 16a. `CRM_WEBHOOK_URL` is not configured. The handler logs a warning and skips CRM dispatch (`enquiry.ts:113-115`). UC continues to step 17.
- 16b. CRM webhook throws or returns non-2xx. The handler logs an error (`enquiry.ts:108-111`). UC continues to step 17.

## Special requirements

- **IP rate limit (FR-FORM-004):** 5 requests per IP per 60 s sliding window.
- **Lead durability (FR-FORM-006):** KV write precedes any downstream call.
- **Input validation (FR-FORM-002/003):** both JSON-shape and schema are validated.
- **PII handling (NFR-SEC-008):** validation errors shall not echo the submitted values; the form redacts server issues to first-message-only display.
- **Localization (FR-I18N-001):** the EN form posts to `/api/enquiry`; the TH form posts to `/th/api/enquiry`. Both routes resolve to the same handler because Astro's per-route SSR runs the handler at `/api/enquiry.ts` regardless of path. **NOTE:** if the TH locale is to use a distinct handler, the team must move or alias it. See finding F-FEAT-001-1 in §10 of [srs.md](../srs.md).

> **REVIEW NOTE:** the handler file is at `src/pages/api/enquiry.ts`. The TH page's form posts to `/api/enquiry` (no `/th/` prefix), because the form's URL is hard-coded at `EnquiryForm.tsx:127`. Confirm with engineering whether the TH form should use a localized endpoint path. Today they share the same handler via Astro's static-output → SSR handoff.

## Frequency / volume

> **OPEN QUESTION (owner: product):** No measurements exist. Expected volume: O(few hundred) per week at peak (estimate based on a single marketing site with one inbound form). Confirm with `owner: product` once analytics are wired.

## Acceptance criteria

```gherkin
Feature: Submit a school-trip enquiry

  Scenario: Happy path — form validation passes, KV write succeeds, dispatch succeeds
    Given a visitor at /enquire
    And the visitor fills in all step-1 fields with valid values
    And the visitor selects a subject "Service Learning"
    And the visitor clicks Next twice without selecting destinations
    And the visitor enters notes "Looking for an October trip"
    And the visitor clicks Send enquiry
    When the form posts to /api/enquiry
    Then the server responds 200 with body { "ok": true, "enquiryId": "<uuid>", "durable": true }
    And a new record exists in LEADS_KV under <uuid> with value matching the submitted enquiry
    And a Resend email was dispatched from noreply@flyed.dev to ENQUIRY_TO_EMAIL
    And a payload matching the enquiry was POSTed to CRM_WEBHOOK_URL
    And the form shows "Thanks — we'll be in touch within one business day."

  Scenario: Invalid JSON body — server returns 400
    Given a malformed request body that is not parseable as JSON
    When the form posts to /api/enquiry
    Then the server responds 400 with body { "ok": false, "error": "Invalid JSON" }
    And no record is written to LEADS_KV

  Scenario: Validation failure — required field missing
    Given a body with email missing
    When the form posts to /api/enquiry
    Then the server responds 422 with body { "ok": false, "error": "Validation failed", "issues": [...] }
    And at least one issue references path ["email"]
    And no record is written to LEADS_KV

  Scenario: Out-of-range groupSize
    Given a body with groupSize = 3
    When the form posts to /api/enquiry
    Then the server responds 422 with body { "ok": false, "error": "Validation failed", "issues": [...] }
    And at least one issue references path ["groupSize"]

  Scenario: Rate limit exceeded — server returns 429
    Given an IP that has submitted 5 valid enquiry requests in the last 60 s
    When a sixth request from the same IP is received
    Then the server responds 429 with body { "ok": false, "error": "Rate limit exceeded" }
    And the response includes a Retry-After header in seconds
    And the warning "Rate limit exceeded [ip=<ip>]" is logged

  Scenario: LEADS_KV binding missing
    Given the LEADS_KV binding is not present in ctx.locals.runtime.env
    When a valid enquiry is submitted
    Then the server responds 200 with body { "ok": true, "enquiryId": "<uuid>", "durable": false }
    And the warning "LEADS_KV not bound; enquiry not durably persisted [enquiryId=<uuid>]" is logged
    And Resend and CRM dispatch is still attempted

  Scenario: LEADS_KV.put() throws
    Given the LEADS_KV binding is present and put() rejects
    When a valid enquiry is submitted
    Then the server responds 200 with body { "ok": true, "enquiryId": "<uuid>", "durable": false }
    And the error "LEADS_KV put failed [enquiryId=<uuid>]: <message>" is logged

  Scenario: Resend dispatch throws
    Given the LEADS_KV write succeeds
    And Resend fetch throws
    When a valid enquiry is submitted
    Then the server still responds 200 with body { "ok": true, "enquiryId": "<uuid>", "durable": true }
    And the error "Resend delivery failed [enquiryId=<uuid>]: <message>" is logged
    And the CRM webhook is still attempted

  Scenario: CRM webhook throws
    Given the LEADS_KV write succeeds
    And the CRM webhook fetch throws
    When a valid enquiry is submitted
    Then the server still responds 200 with body { "ok": true, "enquiryId": "<uuid>", "durable": true }
    And the error "CRM webhook failed [enquiryId=<uuid>]: <message>" is logged

  Scenario: IP resolution — cf-connecting-ip present
    Given a request with cf-connecting-ip: 203.0.113.7
    When the request is processed
    Then the rate limit bucket uses IP "203.0.113.7"

  Scenario: IP resolution — falls back to x-forwarded-for
    Given a request without cf-connecting-ip
    And a request with x-forwarded-for: "198.51.100.4, 10.0.0.1"
    When the request is processed
    Then the rate limit bucket uses IP "198.51.100.4"

  Scenario: IP resolution — falls back to "unknown"
    Given a request without cf-connecting-ip and without x-forwarded-for
    When the request is processed
    Then the rate limit bucket uses IP "unknown"
```

## Change history

| Date       | Version | Author              | Summary                                                                                         |
| ---------- | ------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| 2026-07-05 | 0.1.0   | docs-architect (AI) | Initial draft. Reverse-engineered from code at `6830fe4`. Pending product / engineering review. |
