---
title: 'UC-003 — Submit a contact message'
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

# UC-003 — Submit a contact message

| Field                             | Value                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary actor                     | Anonymous visitor                                                                                                                                                                                                                                                                                                                                    |
| Scope                             | flyed marketing site                                                                                                                                                                                                                                                                                                                                 |
| Level                             | User goal (small)                                                                                                                                                                                                                                                                                                                                    |
| Stakeholders & interests          | Visitor: confirm their message was received. Marketing / sales: receive the message through some out-of-band channel (today: none — see §Success guarantee). Legal: do not leak PII via logs.                                                                                                                                                        |
| Preconditions                     | The contact form route `/contact` (or `/th/contact`) renders. **Caveat:** the TH-locale form posts to `/th/api/contact`, which does not exist as a handler — see finding F-FEAT-003-1.                                                                                                                                                               |
| Success guarantee (postcondition) | Today: the visitor sees a browser-side navigation submit to a path that may not resolve. Server-side, if `/api/contact` is reached, the handler responds `200` and discards the message — by design. **DESIGN INTENT** (when a persistence channel is added): the message is delivered to a sales mailbox and a confirmation is sent to the visitor. |
| Minimal guarantee                 | Schema validation rejects empty / too-short messages.                                                                                                                                                                                                                                                                                                |
| Trigger                           | Visitor clicks "Contact" in the nav, reaching `/contact`.                                                                                                                                                                                                                                                                                            |

## Main success scenario

1. Visitor lands on `/contact`. The page renders the `ContactPage` Astro component with a native `<form>` posting to `${prefix}/api/contact` (`src/components/ContactPage.astro:47-61`).
2. Visitor fills `name` (≥ 2 chars), `email` (RFC-5322-shaped), `message` (≥ 10 chars).
3. Visitor clicks "Send". The browser submits the form natively (`method="post"`).
4. The browser navigates to the action URL. **For EN locale:** the URL is `/api/contact` and a server-side handler at `src/pages/api/contact.ts` is reached. **For TH locale:** the URL is `/th/api/contact`, which does not exist as an Astro route; the request falls through to a static 404 (or a Cloudflare 404 page).
5. The EN-locale handler parses the body and validates with Zod (`src/pages/api/contact.ts:13-17`).
6. The handler responds `200 {ok: true}` (`contact.ts:18-21`). **No persistence. No log.** (Intentional per source comment.)

## Extensions

- 3a. Browser-side HTML5 validation rejects an empty `name` / `email` / `message` (the inputs are `required`). UC ends without server contact.
- 5a. Body fails Zod validation. Server responds `422 {ok: false}`. UC ends; the visitor is on the response page (because the form is a native submit, not a JS-driven one).

> **Design intent (when persistence is added):** the handler should persist the message to a human-readable destination (mailbox forwarding, CRM write, or Zendesk ticket creation); confirm the channel and legal basis with the product owner.

## Special requirements

- **No logging:** the source comment at `contact.ts:18` explicitly states "No logging in production to avoid leaking form data". Any logging added later must redact PII.
- **Native form submission:** unlike the enquiry flow, the contact form posts natively (no JavaScript fetch). This means browser back/forward semantics apply and the response page replaces the form.

## Frequency / volume

> **OPEN QUESTION (owner: product):** no measurements exist. Reasonable estimate: very low (a few per week).

## Acceptance criteria (as-built)

```gherkin
Feature: Submit a contact message

  Scenario: EN-locale happy path — valid submission
    Given a visitor at /contact
    And the name is "Jane Educator", email "jane@school.edu", message "I'd like to chat about itinerary options"
    When the visitor clicks Send
    Then the browser POSTs to /api/contact
    And the server responds 200 with body { "ok": true }

  Scenario: Missing required field — HTML5 validation
    Given a visitor at /contact
    And the email is empty
    When the visitor clicks Send
    Then the browser blocks the submit

  Scenario: Server-side validation failure — too-short message
    Given a body with message = "short"
    When the body reaches /api/contact
    Then the server responds 422 with body { "ok": false }

  Scenario: Latent bug — TH-locale contact form posts to a non-existent path
    Given a visitor at /th/contact
    When the visitor clicks Send
    Then the browser POSTs to /th/api/contact
    And no Astro route matches
    And the request falls through to a 404 page
    And no message is delivered anywhere
```

## Design-intent acceptance criteria (when persistence is added)

> **Re-write UC-003 when FR-FORM-010 is changed. The shape below is illustrative.**

```gherkin
Feature: Submit a contact message (with persistence)

  Scenario: EN-locale happy path
    Given a valid submission
    When the visitor clicks Send
    Then the message is delivered to a sales mailbox
    And the visitor sees a thank-you confirmation
    And the response includes an opaque message id for tracing

  Scenario: Validation failure
    Given a body that fails Zod validation
    When the server is reached
    Then the server responds 422 with structured errors
    And no message is delivered
```

## Findings

- **F-FEAT-003-1 — Thai locale contact form is broken.** `ContactPage.astro:47` posts to `${prefix}/api/contact`. Under Thai locale, the prefix is `/th`, so the URL becomes `/th/api/contact`. Astro's per-route SSR requires the handler to live at `src/pages/api/contact.ts` (which becomes `/api/contact`) or `src/pages/th/api/contact.ts` (which becomes `/th/api/contact`). Neither resolves to the other. Today, TH-locale visitors see a 404 after submitting. **Recommended fix (engineering):** either (a) move the form's action to `/api/contact` regardless of locale (so both EN and TH use the same handler), or (b) duplicate the handler at `src/pages/th/api/contact.ts`.

## Change history

| Date       | Version | Author              | Summary                                                                                         |
| ---------- | ------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| 2026-07-05 | 0.1.0   | docs-architect (AI) | Initial draft. Reverse-engineered from code at `6830fe4`. Pending product / engineering review. |
