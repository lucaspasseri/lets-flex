# Current Goal

## Parent milestone

Let’s Flex must remain reliable for real users across authentication, guest provisioning, and
application navigation before additional UX work is prioritized.

## Current goal

Diagnose and eliminate the production `/cycles` failure reported by a real user at
`lets-flex.paxeri.dev/cycles`. Establish why the user reached that URL, reproduce the failure from
clean application/session state where possible, identify the smallest root cause supported by
repository and runtime evidence, repair the correct behavior, and protect it with regression
coverage and useful non-sensitive server diagnostics.

## Status

Proposed on 2026-09-10 from the user's explicit production-reliability request. Actions 1, 2, and 3
were completed after review; the goal was completed on 2026-09-10 after explicit user approval.

## Verified delta-first baseline

### Already satisfied

- The completed frontend goal is committed as `62a5ede`; the worktree was clean before this goal's
  tracking update.
- `app.js` mounts `/cycles` after authentication middleware. The current `/cycles` router registers
  `POST /` for cycle creation and `DELETE /:cycleId` for owned deletion; it registers no `GET` route.
- Current application links and redirects point to `/programs` or `/programs/day`; the cycle creation
  form posts to `/cycles`, and cycle deletion uses `DELETE /cycles/:cycleId`.
- Guest entry atomically provisions a guest, starter program, cycle, training day, workout session,
  and session selection state before redirecting to `/`.
- The application has a generic HTML/JSON recovery boundary and logs unexpected errors, so the repair
  can extend existing boundaries rather than introducing a parallel error system.
- The PostgreSQL HTTP test harness can reset a disposable test database and exercise fresh,
  guest-authenticated, and registered-authenticated sessions without production data.

### Reuse

- Reuse the existing Express route/middleware/controller layering, Passport session lifecycle,
  `respondWithApplicationRecovery`, PostgreSQL HTTP harness, and test-database reset path.
- Preserve authentication, guest provisioning, session rotation, CSRF, ownership, status semantics,
  and browser-facing JSON contracts unless the verified root cause requires a narrow correction.
- Reuse `/programs` as the established cycle-management page only if evidence confirms that it is the
  intended destination; do not assume that a redirect is the correct repair.

### Verified gaps and unknowns

- A read-only production request to `GET https://lets-flex.paxeri.dev/cycles` without a session
  returned `302 Location: /auth/login?returnTo=%2Fcycles`; no production data was changed.
- A disposable local reproduction returned fresh-session `302` to sign-in, successfully provisioned a
  guest with `302` to `/`, then returned `404` HTML recovery (`Page not found`) and JSON
  `{ "error": "Not found" }` for guest-authenticated `GET /cycles`. It did not reproduce a 500.
- The current source therefore proves that `/cycles` is not a GET page and that the clean local path
  does not throw. The exact production exception, session state, request headers, deployment revision,
  and user navigation/referrer that produced “Something broke!” remain unknown.
- Historical code once exposed `GET /cycles/:programId` as a JSON lookup route, but no current UI link
  targets it. This is evidence of a possible stale/external path, not proof of the reported cause.
- The global unexpected-error logger currently records only the error stack/value. It does not include
  request method, path, status context, or a safe authenticated principal identifier, which limits
  diagnosis if the production request reaches an exception path.

### Add

- Add only the reproduction, root-cause repair, regression coverage, and safe diagnostic context that
  the investigation proves necessary. Do not redesign Dashboard, Library, starter workout, deletion,
  or exercise-catalog behavior.

## Proposed action sequence

1. **Diagnose and reproduce the production `/cycles` failure.** Trace every route and navigation path
   that can reach `/cycles`; compare fresh, guest, and registered sessions in the disposable local
   environment; inspect session/selection assumptions and error boundaries; and record the exact
   verified root cause or the remaining external evidence required.
2. **Repair the verified root cause and add regression protection.** Implement the smallest supported
   behavior correction, add coverage for the discovered fresh/guest/authenticated scenario, and extend
   unexpected-error diagnostics with enough safe request context to investigate future failures.
   **Completed after review:** explicit `GET /cycles` 404 handling, safe contextual error logging,
   and the session/negotiation regression matrix were implemented and verified; the exact historical
   production exception remains uncorrelated.
3. **Complete reliability verification and review.** Run focused HTTP tests, type/lint/format checks,
   the applicable full suite, inspect the final diff, and record production-safe smoke evidence and
   any remaining deployment or runtime unknowns. **Completed after review:** sequential focused and
   full verification pass; read-only production smoke returns the expected unauthenticated redirect;
   no deploy, push, production-data mutation, or commit is included.

## Scope

### In scope

- `/cycles` route registration, method behavior, links, redirects, session and selection state,
  guest provisioning, authentication state, server-side exceptions, safe logging, and regression
  tests directly related to the reported failure.
- The smallest route/controller/middleware/error-boundary changes required by verified evidence.

### Out of scope

- Dashboard, Library, starter workout, session deletion, exercise catalog, broad UX redesign, schema
  changes, migrations, dependencies, deployment, pushing, committing, or production data mutation.
- Redirecting `/cycles` merely because `/programs` exists, unless the investigation establishes that
  redirect as the correct product behavior.

## Constraints and invariants

- Do not expose stack traces, session contents, credentials, tokens, SQL, or personal data to users.
- Keep server diagnostics useful but redact secrets and avoid raw session/user data.
- Preserve authentication, authorization, CSRF, rate limiting, ownership, guest lifecycle, session
  rotation, validation, and status semantics.
- Use only disposable local/test data for reproduction. Production requests remain read-only unless
  the user separately authorizes a specific production operation.
- Do not commit, push, deploy, or modify production data as part of this goal.

## Done when

- The root cause is documented with verified repository/runtime evidence and unknowns clearly separated.
- The failing path has the correct behavior for the states relevant to the discovered scenario.
- Regression coverage protects the discovered fresh-session, guest, and authenticated behavior where
  applicable.
- Unexpected server errors retain generic user responses and gain enough safe context for diagnosis.
- Focused checks, required repository verification, and production-safe smoke evidence pass, or any
  unavailable check is explicitly documented.
- No unrelated UX, data, deployment, push, commit, or production mutation is included.
- The goal reaches Ready for final review and receives explicit user approval.

## Resume here

Action 1, **Diagnose and reproduce the production `/cycles` failure**, and Action 2,
**Repair the verified root cause and add regression protection**, are Completed after review. Action
3 is Completed after review. The goal was completed on 2026-09-10 after explicit user approval.

## Completion outcome

The unsupported `/cycles` GET path now returns the generic 404 recovery response before mutation
middleware, while POST/DELETE cycle contracts remain unchanged. Regression coverage protects fresh,
guest, registered, expired-session, HTML, and JSON behavior. Unexpected errors retain generic user
responses and now log safe request/principal context. Focused and full verification passed, and a
read-only production smoke request returned the expected unauthenticated redirect. The historical
production 500 remains uncorrelated without a request ID or server trace; deployment and production
data changes were intentionally excluded.
