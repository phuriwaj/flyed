---
title: 'UC-002 — Subscribe to the newsletter'
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

# UC-002 — Subscribe to the newsletter

| Field                             | Value                                                                                                                                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary actor                     | Anonymous visitor (prospective customer / educator / parent)                                                                                                                                          |
| Scope                             | flyed marketing site                                                                                                                                                                                  |
| Level                             | User goal (small)                                                                                                                                                                                     |
| Stakeholders & interests          | Visitor: receive a clear acknowledgement that the subscription was processed. Marketing: capture leads for future campaigns. Legal: do not persist anything until a provider integration is in place. |
| Preconditions                     | `/api/newsletter` is reachable. The newsletter endpoint does not require any auth, KV binding, or rate limit (per `src/pages/api/newsletter.ts:6-19`).                                                |
| Success guarantee (postcondition) | The visitor sees a confirmation in the form; no KV write, no provider call, no log line — by design.                                                                                                  |
| Minimal guarantee                 | The endpoint validates the email format; on a malformed email, responds `422`.                                                                                                                        |
| Trigger                           | The footer renders the NewsletterForm (`src/components/Footer.astro`); the visitor enters an email and clicks Subscribe.                                                                              |

## Main success scenario

1. The footer / a content section renders `NewsletterForm` (`src/components/NewsletterForm.tsx`).
2. The visitor types an email into the input and clicks Subscribe (the input has `type="email"` and `required`).
3. The form's `submit` handler calls `e.preventDefault()`, sets state to `sending`, then POSTs `{email}` to `/api/newsletter` with `Content-Type: application/json` (`NewsletterForm.tsx:7-16`).
4. The server handler parses the body and validates `email` with Zod (`src/pages/api/newsletter.ts:8-13`).
5. The handler sleeps for 100 ms (`src/pages/api/newsletter.ts:16`).
6. The handler responds `200 {ok: true, subscribed: true}` (`src/pages/api/newsletter.ts:18`).
7. The client state becomes `done` and the form is replaced with the message "Thanks — we'll send occasional trip ideas." (`NewsletterForm.tsx:18-21`).

## Extensions

- 2a. Visitor clicks Subscribe without an email. The browser blocks the submit (input is `required`, `type="email"`). UC ends — no server contact.
- 4a. Body is not JSON. The handler returns `422 {ok: false, error: "Invalid email"}` after `request.json().catch(() => null)` (`newsletter.ts:9-12`). UC ends; form shows "Try again".
- 4b. Body is JSON but email is malformed. The handler returns `422 {ok: false, error: "Invalid email"}` (`newsletter.ts:11-13`). UC ends; form shows "Try again".
- 6a. Network error during the fetch (e.g., offline). The fetch rejects before step 6; the form sets state to `error` and shows "Try again" (`NewsletterForm.tsx:13-16,41-43`). UC ends; visitor may retry.

## Special requirements

- **No persistence:** the endpoint never persists or forwards the email. This is intentional per `DEPLOY.md:196-199` (newsletter provider "not wired" — HIGH priority before any newsletter CTA drives traffic).
- **UX timing:** the 100 ms artificial delay is intentional to provide the "sending" feedback. Removing it would skip the `sending` flash.

> **OPEN QUESTION (owner: product):** when a provider is integrated (Resend Audiences / Mailchimp / Buttondown / ConvertKit — see SRS OQ-2), this UC grows to include provider-authenticated dispatch + double-opt-in.

## Frequency / volume

> **OPEN QUESTION (owner: product):** no measurements exist. Reasonable estimate: low-volume (a handful per day at launch).

## Acceptance criteria

```gherkin
Feature: Subscribe to the newsletter

  Scenario: Happy path — valid email
    Given the visitor has typed "educator@school.edu"
    When the visitor clicks Subscribe
    Then the form posts to /api/newsletter with body { "email": "educator@school.edu" }
    And the server responds 200 with body { "ok": true, "subscribed": true }
    And within 100-300 ms the form is replaced with the thank-you message

  Scenario: Missing email
    Given the input is empty
    When the visitor clicks Subscribe
    Then the browser blocks the submit (the input is required)
    And no server contact occurs

  Scenario: Malformed email
    Given the visitor has typed "not-an-email"
    When the form submits anyway (e.g., browser allows it)
    Then the server responds 422 with body { "ok": false, "error": "Invalid email" }
    And the form shows "Try again"

  Scenario: Non-JSON body
    Given a malformed request body
    When the request reaches /api/newsletter
    Then the server responds 422 with body { "ok": false, "error": "Invalid email" }

  Scenario: Network error
    Given the device is offline when the form submits
    When the visitor clicks Subscribe
    Then the fetch rejects
    And the form shows "Try again"
```

## Change history

| Date       | Version | Author              | Summary                                                                                         |
| ---------- | ------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| 2026-07-05 | 0.1.0   | docs-architect (AI) | Initial draft. Reverse-engineered from code at `6830fe4`. Pending product / engineering review. |
