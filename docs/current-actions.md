# Current Actions

## Current goal

Diagnose and eliminate the production `/cycles` failure reported by a real user at
`lets-flex.paxeri.dev/cycles`, establish the correct behavior from evidence, repair the smallest
verified root cause, and protect it with regression coverage and safe diagnostics.

## Goal status

Proposed on 2026-09-10 from the user's explicit production-reliability request. Actions 1, 2, and 3
were completed after review; the goal was completed on 2026-09-10.

## Status definitions

- `Pending approval` — scope is prepared but implementation is not authorized.
- `Active` — explicitly approved and currently being implemented.
- `Changes requested` — review corrections are authorized for the current action only.
- `Ready for review` — implementation and recorded verification are complete; stop for approval.
- `Completed` — verification evidence was reviewed and the action was explicitly approved.
- `Pending` — sequenced but not yet prepared for implementation approval.

## Verified planning evidence

- Current `app.js` mounts `/cycles` after `requireAuthentication`.
- `src/interfaces/routes/cycles.js` registers only `POST /` and `DELETE /:cycleId`; there is no GET
  handler. Current UI links use `/programs`; the cycle form posts to `/cycles`.
- A read-only production `GET /cycles` request returned `302 /auth/login?returnTo=%2Fcycles`.
- A disposable local database reproduction returned fresh-session `302` to sign-in, guest entry `302`
  to `/`, then guest-authenticated HTML `404 Page not found` and JSON `404 {"error":"Not found"}` for
  `GET /cycles`. The reported 500 was not reproduced.
- Guest provisioning creates the starter program/cycle/day/session and session selection state before
  authenticating the guest. Registered session deserialization rejects unusable principals safely.
- The global error boundary logs an error stack/value but not safe request method/path context. The
  exact production exception, revision, request headers, session state, and user navigation path are
  unknown and require diagnosis rather than assumption.
- Historical code exposed `GET /cycles/:programId` as a JSON lookup route, but no current link targets
  it. This remains a stale-path hypothesis only.
- No production data, source code, deployment, or remote state was mutated during this investigation.

## Confirmed decisions

- This goal is limited to the reported `/cycles` production failure.
- A redirect to `/programs` is not presumed correct; intended behavior must be established first.
- Local/test reproduction may reset disposable test data. Production requests remain read-only.
- Existing authentication, guest, session, CSRF, ownership, validation, and recovery boundaries remain
  invariants.
- Each action has its own implementation approval and review gate.

## Proposed action sequence

### Action 1 — Diagnose and reproduce the production `/cycles` failure

**Status:** Completed

**Implementation approval:** Explicitly approved by the user on 2026-09-10.

**Started:** 2026-09-10 after explicit approval of the action plan.

**Ready for review:** 2026-09-10. Diagnosis and disposable local reproduction are complete; the
verified route boundary and remaining production evidence requirement are recorded below.

**Review approval:** The user explicitly approved the diagnosis on 2026-09-10.

**Completion summary:** The current `/cycles` method boundary and session behavior are verified,
the reported 500 is not reproducible from clean local states, and the exact production exception is
documented as requiring request/log correlation before a repair is selected.

**Purpose:** Determine why a real user reached `/cycles`, what request method/session state was involved,
why production returned the generic 500, and what behavior is correct.

**Planned scope:**

- Trace route registration, all current and historical links/redirects, form methods, authentication
  middleware, guest provisioning, session selection, and global error handling.
- Reproduce fresh unauthenticated, guest-authenticated, and registered-authenticated requests locally
  against disposable test data, including HTML and JSON negotiation and stale/expired session state
  where relevant.
- Compare read-only production behavior and deployment evidence without using production credentials,
  mutating production data, or guessing from the generic user message.
- Record a verified root cause, intended behavior, and the narrow implementation delta for Action 2.

**Acceptance criteria:**

- The action record distinguishes verified facts, hypotheses, and unknowns.
- The `/cycles` request path is exercised for each relevant session state and method.
- The cause of the production 500 is identified, or the specific external evidence required to identify
  it is documented; no speculative repair is implemented.
- Focused read-only/local checks pass and no production data or application code is changed.

**Diagnosis outcome:**

- The current `/cycles` endpoint is not a page route. `GET /cycles` is unmatched after authentication;
  cycle creation is `POST /cycles/`, and owned deletion is `DELETE /cycles/:cycleId`. Current UI links
  and redirects use `/programs` or `/programs/day`, while the cycle form uses the POST endpoint.
- Read-only production evidence returned `302 /auth/login?returnTo=%2Fcycles` for a fresh anonymous
  request. No production credentials, session, or mutation were used.
- A disposable local PostgreSQL reproduction exercised fresh, guest, registered, and expired-guest
  sessions. Fresh access redirected to sign-in; guest and registered access returned HTML `404 Page
not found` and JSON `404 {"error":"Not found"}`; expired-guest access redirected to sign-in. Guest
  provisioning returned `302 /` and created the expected starter hierarchy. The request matrix emitted
  no unexpected diagnostics and never returned `500` or `Something broke!`.
- Existing controller and route coverage confirms POST/DELETE behavior is separate from the unmatched
  GET behavior. Historical code exposed `GET /cycles/:programId` as a JSON lookup, but no current
  navigation targets it. A stale bookmark, external link, or old deployment path is plausible but not
  proven.
- **Verified root-cause boundary:** the repository contains no current GET `/cycles` page and the clean
  path is a controlled 404, not a server exception. **Unknown:** the exact production exception that
  produced the reported 500 cannot be identified from the public request and repository alone.
- Required external evidence for a definitive 500 correlation is a production request timestamp or
  request ID plus the corresponding server stack trace/deployment revision, and—if available—the
  user's preceding link/referrer or request method. The global logger currently lacks safe method/path
  context, which is a repair candidate only after Action 1 review.

**Preserved behavior and exclusions:**

- No redirect or GET handler was added speculatively. `/programs` remains the established cycle
  management surface, while mutation endpoint semantics and authentication/session behavior remain
  unchanged.
- No production data, deployment, push, commit, application code, or tracking behavior outside this
  diagnosis record changed.

**Verification evidence:**

- Read-only production `curl` checks and the disposable local integration matrix completed
  successfully. The local matrix covered fresh, guest, registered, and expired sessions plus HTML and
  JSON GET negotiation; diagnostics capture remained empty.
- `npm run format:check` and `git diff --check` pass after this tracking update. No application test
  suite was rerun because Action 1 changed no application code.

### Action 2 — Repair the verified root cause and add regression protection

**Status:** Completed

**Implementation approval:** Explicitly approved by the user on 2026-09-10.

**Started:** 2026-09-10 after explicit approval of the prepared next action.

**Ready for review:** 2026-09-10 after implementation and verification.

**Review approval:** The user explicitly approved the changes on 2026-09-10.

**Completion summary:** `GET /cycles` now exits through the existing generic 404 recovery boundary
before cycle mutation middleware, unexpected errors carry safe request/principal context in server
logs, and the relevant session-state/negotiation regression matrix passes.

Implement only within the verified route boundary from Action 1. The current repair scope is:

- make `GET /cycles` an explicit generic 404 recovery response without redirecting it or changing
  POST/DELETE behavior;
- bypass cycle mutation middleware for that unsupported GET path;
- add safe method/path/principal/request-id context to unexpected server-error logging without
  logging query strings, bodies, cookies, tokens, or stack details to the user; and
- add HTTP regression coverage for fresh, guest, registered, and expired-session behavior where
  applicable, plus HTML/JSON negotiation and preservation of mutation contracts.

The exact historical production exception remains unverified; this repair addresses the proven
invalid GET boundary and improves the diagnostics needed if a deployment-specific exception recurs.
The repair must preserve correct status/method semantics, add fresh/guest/authenticated regression
coverage where relevant, and extend unexpected-error logging with safe method/path/request context
without exposing credentials, tokens, session contents, or personal data.

**Implementation summary:**

- Added an explicit `GET /cycles` recovery route before cycle mutation middleware. It returns the
  existing generic 404 HTML/JSON response and does not redirect to `/programs`; POST and DELETE
  routes remain unchanged.
- Extended the global error boundary log with request method/path, an optional inbound request ID,
  and allow-listed principal role plus numeric ID. Query strings, bodies, cookies, tokens, and stack
  details remain absent from the user response.
- Added HTTP coverage for fresh unauthenticated, guest, registered, and expired-guest sessions,
  HTML/JSON negotiation, and the generic-response boundary. Existing cycle mutation coverage remains
  in place.
- The exact historical production 500 is still not correlated to a deployment/request record; no
  production deployment or mutation was attempted.

**Verification evidence:**

- Focused PostgreSQL HTTP suite: 61 tests passed, 0 failed.
- Full repository verification (`npm run verify`): 216 tests passed, 0 failed; format, lint, type,
  and browser-type checks passed.
- `git diff --check` passed. No production data, deployment, push, or commit was performed.

### Action 3 — Complete reliability verification and review

**Status:** Completed

**Implementation approval:** Explicitly approved by the user on 2026-09-10.

**Started:** 2026-09-10 after explicit approval of the prepared next action.

**Ready for review:** 2026-09-10 after final verification.

**Review approval:** The user explicitly approved the final verification changes on 2026-09-10.

**Completion summary:** Focused and full verification passed sequentially, the final diff was
inspected, and read-only production smoke evidence was recorded. No deployment or production data
mutation was performed.

Run focused HTTP coverage, formatting, lint, type checks, relevant full verification, inspect the
final diff, and record production-safe smoke evidence and remaining deployment/runtime unknowns. No
commit, push, deploy, or production-data mutation is authorized.

**Verification outcome:**

- Sequential focused PostgreSQL HTTP suite passed: 61 tests, 0 failures.
- Sequential `npm run verify` passed: format, lint, application types, browser types, and 216 tests
  with 0 failures. The initial parallel attempt was discarded because both suites reset the same
  disposable database concurrently; rerunning sequentially passed without code changes.
- `git diff --check` passed. The final diff is limited to `app.js`, the `/cycles` router, the focused
  HTTP test, and active-goal tracking files; the archived prior-goal records remain untracked and
  contain no application changes.
- Read-only production smoke: `GET https://lets-flex.paxeri.dev/cycles` with HTML negotiation returned
  `302 /auth/login?returnTo=%2Fcycles`; no credentials, session reuse, mutation, deployment, or
  production data access was performed.
- Remaining runtime unknown: the historical production 500 still lacks a request ID/log/deployment
  correlation. The repaired route and safe error context are ready for later deployment and review;
  deployment itself is outside this goal.

## Resume here

Action 1 is Completed. Action 2 is Completed after review. Action 3 is Completed after review.
The goal was completed on 2026-09-10 after explicit user approval.
