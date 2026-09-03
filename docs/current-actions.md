# Current Actions

## Current goal

Complete password-reset email delivery through Resend as defined in
`docs/current-goal.md`.

## Status definitions

- `Pending`: proposed or approved as part of the sequence but not active.
- `Pending approval`: prepared scope awaiting explicit user approval.
- `Active`: the only action that may be implemented.
- `Blocked`: cannot proceed without a decision or prerequisite.
- `Changes requested`: implementation exists but requires corrections.
- `Ready for review`: implementation and verification are finished, awaiting user approval.
- `Completed`: explicitly approved by the user.

Only one action may be `Active`. The coding agent may move an action from `Active` to
`Ready for review`; only the user may approve completion or activate the next action.

## Existing implementation under review

The worktree already contains the password-reset foundation and end-user flow:

- database schema for reset tokens and request-limit counters;
- repository and service logic for issue, expiry, supersession, consumption, password
  replacement, and session invalidation;
- anonymous request/completion routes, controllers, validation, CSRF-protected EJS pages,
  login links/status, and focused CSS;
- database-backed per-IP request limiting;
- `APP_BASE_URL` and `PASSWORD_RESET_TTL_MS` configuration documentation;
- an application-owned `sendPasswordReset` contract represented by an injected fake and the
  configured Resend adapter completed in Action 1;
- expanded HTTP integration tests using the fake email service.

These committed changes must be preserved and are now being reviewed under Action 2. Any
defect discovered during review must be recorded before expanding scope.

## External prerequisites

- [x] Configure `AUTH_EMAIL_FROM="Let’s Flex account@auth.paxeri.dev"` as the approved
      sender value.
- [x] `auth.paxeri.dev` is added to Resend and the user confirmed **Verified** status on
      2026-09-03; public DNS also exposes the expected DKIM and Amazon SES SPF/MX records.
- [x] Do not configure reply-to yet.
- [x] Production is currently served through Render behind Cloudflare, confirmed from the
      public `https://paxeri.dev` response headers on 2026-09-03.
- [x] The user confirmed the previously missing required environment variables are present
      in Render; their values were not displayed or recorded.
- [x] Production `APP_BASE_URL=https://paxeri.dev` is confirmed by the user.
- [x] Production `AUTH_EMAIL_FROM` is configured with the verified sender, confirmed by the
      user without exposing the stored value.
- [x] Open and click tracking are disabled in Resend, confirmed by the user on 2026-09-03.

The adapter and automated tests can be developed with fake values before domain verification.
A real delivery check cannot pass until the sender domain and deployment secrets are ready.

## Completed actions

### 1. Add and verify the Resend email adapter

Status: Completed

Approved on 2026-09-03 after final verification. The official Resend adapter is wired into
normal startup behind the application-owned email boundary; production configuration is
validated, provider failures are sanitized, automated delivery remains fake or mocked, and
the public password-reset response remains neutral.

#### Outcome

Normal application startup uses a configured Resend implementation of the existing
`sendPasswordReset` boundary, while tests retain injected fakes and make no external calls.

This is the next small, cohesive implementation action. It does not revisit the token,
HTTP, rate-limit, password-update, session, or UI implementation except where necessary to
wire and verify delivery.

#### Approved decisions

- Use the official Resend Node.js SDK; adding `resend` as a production dependency is
  explicitly approved.
- Set `AUTH_EMAIL_FROM="Let’s Flex account@auth.paxeri.dev"`.
- Do not configure reply-to yet.
- Keep open and click tracking disabled for password-reset messages.
- Read the API key from `RESEND_API_KEY` and fail production startup clearly when required
  email configuration is absent.
- Build production reset links from the configured `APP_BASE_URL`, which is
  `https://paxeri.dev` in production.
- Automated tests use fake or mocked clients and never contact Resend.
- Preserve neutral public responses and secret-free internal error reporting.
- Domain verification and controlled real delivery belong to Action 3 and do not block
  this action's fake-tested adapter implementation.

Domain verification and real secret installation are not required to write unit-tested
adapter code, but they are required for the later live-delivery verification.

#### Work

- implement the Resend adapter behind `sendPasswordReset`;
- construct concise transactional text and HTML content containing the supplied reset URL,
  expiry information, and ignore-if-unrequested guidance;
- read `RESEND_API_KEY` and `AUTH_EMAIL_FROM` from the environment and validate them without
  exposing their values;
- wire the adapter into normal startup while preserving `createApp({ emailService })` for
  tests;
- convert provider non-success responses and network failures into secret-free application
  errors suitable for existing neutral request handling;
- retain safe operational context such as a provider request ID only if available without
  logging message contents, recipients, tokens, reset URLs, or provider response bodies;
- add focused tests for payload mapping, configuration validation, successful delivery,
  provider rejection, and transport failure using mocked transport;
- add `.env.sample` placeholders and README setup notes for Resend without a real key;
- verify no automated path contacts Resend.

#### Constraints

- Do not commit or print the real Resend API key.
- Do not log reset tokens, reset URLs, recipient addresses, or email bodies.
- Do not couple password-reset business logic to Resend-specific types.
- Do not send real email from automated tests.
- Do not change public non-enumerating behavior.
- Do not add a production dependency unless explicitly approved.
- Do not modify the existing flow beyond corrections required for safe adapter integration;
  record broader findings for a later action.

#### Done when

- normal startup selects the Resend adapter from validated environment configuration;
- injected fake email delivery still works in HTTP tests;
- adapter tests cover success and relevant failure modes without network access;
- provider errors do not leak secrets, account existence, tokens, or URLs;
- `.env.sample` and README document `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, `APP_BASE_URL`, and
  the optional TTL using placeholders only;
- relevant formatting, lint, type, and automated tests pass;
- the diff remains limited to the production email boundary, configuration/wiring, tests,
  and documentation.

#### Verification

Passed on 2026-09-03:

- `node --test src/infrastructure/email/ResendEmailService.test.js` — 4 tests passed;
  covered configuration failure, payload mapping and successful mocked delivery, provider
  rejection, and transport failure without network access.
- `npm run format:check` — passed.
- `npm run lint` — passed.
- `npm run check:types` — passed.
- `npm test` — 99 tests passed, including the four adapter tests; no test constructs a
  real Resend client or performs Resend network access.
- `TEST_DATABASE_URL=postgresql://localhost/lets_flex_test node --test
--test-reporter=spec test/http/applicationPages.test.js` — 35 tests passed, including
  injected fake delivery, unknown/Google-only non-enumeration, and neutral handling plus
  secret-free diagnostics when delivery fails.
- `git diff --check` — passed.
- Final diff inspection found Action 1 changes limited to the Resend production dependency,
  adapter and runtime wiring, focused tests, environment/README documentation, and action
  tracking. The previously uncommitted password-reset implementation remains present and
  is reserved for Action 2 review.

Not run in this action:

- real Resend delivery, sender-domain verification, delivered-link inspection, and live
  tracking confirmation — deliberately deferred to Action 3 as approved;
- `npm run check:browser-types` and `npm run verify` — Action 1 changed no browser-side
  JavaScript and is not broad/cross-cutting; the required backend checks and focused HTTP
  suite passed separately.

Final approval verification on 2026-09-03 repeated `npm run format:check`, `npm run lint`,
`npm run check:types`, `npm test` (99 passed), the PostgreSQL HTTP integration suite (35
passed), and `git diff --check`; all passed. The first sandboxed HTTP attempt could not
access local PostgreSQL (`EPERM`), and the exact command then passed with approved local
database access.

## Completed actions (continued)

### 2. Review and verify the complete password-reset flow

Status: Completed

Activated on 2026-09-03 when the user resumed the goal and approved implementation.

Approved on 2026-09-03 after final verification. The complete password-reset flow was
reviewed against its security, failure, UI, database, and provider-identity requirements;
the two confirmed security defects were corrected and focused coverage was added.

Expected outcome:

- review the existing uncommitted token, HTTP, UI, rate-limit, and session behavior against
  every security invariant and user story in the goal;
- run focused HTTP integration tests and the full repository verification;
- fix only confirmed correctness, security, accessibility, or integration defects;
- record deployment-order and rollback implications of the schema additions;
- return the complete implementation to `Ready for review` with exact evidence.

Review completed on 2026-09-03. Two confirmed security defects were corrected:

- valid-looking unknown, expired, or consumed tokens are now rejected under the database
  transaction before performing expensive Argon2 password hashing;
- password-reset request diagnostics now discard arbitrary exception messages and emit only
  a stable allow-listed category plus a validated provider request ID when one exists.

Focused coverage was added for password-reset configuration, semantic and accessible reset
forms, per-IP request limiting, secret-free delivery-failure diagnostics, and preservation
of a linked Google identity through a completed local password reset.

#### Security review

- CSRF: the global CSRF middleware protects both reset POST routes; integration coverage
  verifies mutation rejection without a valid token.
- Abuse resistance: reset requests are limited to five attempts per hashed IP key per
  15-minute window, and the sixth attempt is covered without an additional delivery.
  Completion requests validate token shape and database usability before Argon2 work.
- Sessions: completing a reset removes every PostgreSQL session for the owning user in the
  same transaction as password replacement and token invalidation; concurrency and session
  invalidation are covered.
- Sensitive data: only token hashes are persisted. Public responses remain neutral for
  eligible, unknown, Google-only, and delivery-failure cases. Diagnostics exclude emails,
  raw tokens, reset URLs, provider response bodies, and arbitrary exception messages.
- Trust boundaries: request email, reset token, password, and confirmation are validated by
  the established Zod schemas before business use; the completion service also validates
  token shape, and configuration validates TTL and trusted HTTP(S) origin.
- Token lifecycle: tokens use 32 cryptographically random bytes encoded as base64url,
  SHA-256 hash-only persistence, expiry, one-active-token supersession, local-identity
  ownership, single-use consumption, and row locking for replay/concurrency safety.
- Provider identities: password replacement targets only the selected local identity;
  focused HTTP coverage confirms the linked Google subject still resolves to the same user.
- UI/accessibility: reset pages use semantic headings/forms, explicit labels, appropriate
  autocomplete, autofocus, live status/error regions, visible shared focus styles, and hide
  the completion form when the token is invalid. No new motion or viewport-specific layout
  behavior required separate reduced-motion handling.

#### Database deployment, compatibility, and rollback

- Production must receive the additive `password_reset_tokens` and
  `password_reset_request_limits` tables and their indexes before this application version
  serves reset traffic. The previous application version ignores these new tables, so a
  schema-first deployment is backward compatible.
- This repository has no migration runner or additive production migration artifact;
  `db/schema.js` is a destructive reset definition. `db/seed.js` uses
  `process.env.ALLOW_DATABASE_RESET === "true"` as the explicit reset opt-in and separately
  refuses `NODE_ENV=production`. Before any agent-initiated reset, check that opt-in; when
  authorization is absent or ambiguous, ask the user directly. Production must receive the
  equivalent additive DDL through its controlled migration process before Action 3 live
  testing.
- Application rollback is compatible while the new tables remain. Dropping them is not
  required for rollback and would destroy outstanding reset links plus rate-limit state; if
  removal is later desired, wait beyond the configured token lifetime and only remove them
  after the application no longer references them.

#### Verification

Passed on 2026-09-03:

- focused unit/view/adapter command — 17 tests passed before the final suite;
- `npm run verify` — formatting, ESLint, server `checkJs`, browser `checkJs`, and all 102
  deterministic database/unit/browser/view tests passed;
- `TEST_DATABASE_URL=postgresql://localhost/lets_flex_test node --test
--test-reporter=spec test/http/applicationPages.test.js` — all 36 PostgreSQL HTTP
  integration tests passed;
- the focused HTTP suite covers success, hash-only persistence, expiry, malformed and
  unknown tokens, supersession, replay/concurrency, password validation, atomic rollback,
  session invalidation, CSRF, request limiting, non-enumeration, delivery failure, new local
  login, old-password rejection, and linked-Google preservation.

Manual checks not run:

- live Resend delivery, sender/DNS verification, production environment installation,
  tracking confirmation, and delivered `https://paxeri.dev` link inspection belong to
  Action 3;
- responsive visual inspection in a real browser was not run. The reset pages reuse the
  existing responsive auth panel, form, and button components, and their rendered semantic
  contracts are covered by view tests.

Final approval verification on 2026-09-03 repeated `npm run verify` (all checks and 102
tests passed), the PostgreSQL HTTP integration suite (36 passed), and `git diff --check`;
all passed.

## Active action

### 3. Verify live Resend delivery and production configuration

Status: Blocked

Activated on 2026-09-03 with explicit user approval. Live-provider operations remain
limited to the stated verification outcome and must not expose secrets, recipients, reset
tokens, or reset URLs in documentation or command output.

Blocked pending the user-controlled application deployment. The user confirmed the
additive production schema was applied on 2026-09-03 and explicitly prohibited email
delivery, pushes, Render redeployment, and further production-data changes until further
instruction.

Expected outcome:

- Resend reports the chosen `paxeri.dev` domain or subdomain as verified;
- production secrets contain `RESEND_API_KEY`, `AUTH_EMAIL_FROM`, and
  `APP_BASE_URL=https://paxeri.dev`;
- tracking behavior matches the confirmed requirement;
- a deliberate manual reset email reaches a controlled test mailbox from the verified
  sender;
- its link uses `https://paxeri.dev`, expires as configured, and completes one reset;
- no secret, token, or reset URL is exposed in logs or recorded in this document.

Progress on 2026-09-03:

- local configuration was inspected using presence/equality checks only; a Resend API key
  and sender are present, but the local sender does not equal the approved production value
  and local `APP_BASE_URL` is not the production origin, as expected for development;
- no dedicated controlled-recipient environment variable is configured;
- the available Resend key is send-only. A read-only domain-list request returned the safe
  category `restricted_api_key`, so it cannot establish provider-side domain verification
  or tracking settings;
- public DNS contains a Resend DKIM record and Amazon SES SPF/MX records for the approved
  sending subdomain, but public DNS alone does not prove Resend's dashboard verification
  state or tracking configuration;
- `https://paxeri.dev` is live through Cloudflare and Render, but
  `/auth/password-reset/request` redirects to the authenticated application entry point.
  This confirms the reviewed password-reset version is not currently serving that route;
- no email was sent and no production data was changed because a controlled recipient,
  deployed reset route/schema, and provider-dashboard confirmation are not yet available.

Confirmed constraints and remaining prerequisites:

- use only the user-designated controlled test mailbox, supplied at execution time through
  the untracked `AUTH_EMAIL_TEST_TO` environment variable; never hard-code, commit, display,
  log, or record its value;
- do not send any email until the user explicitly authorizes the controlled delivery;
- do not push changes or trigger Render deployment unless explicitly instructed; the user
  owns the push and deployment steps;
- the user confirmed the additive password-reset schema was applied through the controlled
  production migration process on 2026-09-03; do not make further production-data changes;
- after the user deploys, verify that the anonymous reset-request route is live before
  requesting permission for the controlled email test.

## Discoveries and blockers

- The worktree is substantially ahead of the previous action plan: it includes the token
  lifecycle, request and completion flow, UI, rate limiting, session invalidation, fake
  delivery boundary, and HTTP tests even though the former Action 1 prohibited most of that
  work. Preserve it, but do not represent it as approved or completed.
- Action 1 now supplies the normal runtime with the official Resend-backed adapter while
  preserving injected fake delivery for automated tests. Production startup validates the
  required email configuration and enforces `APP_BASE_URL=https://paxeri.dev`.
- The approved sender string is passed to Resend exactly as configured. Whether Resend
  accepts it after domain verification is an Action 3 live prerequisite and was not tested
  against the provider in this action.
- The SDK does not expose per-message open/click tracking flags. The adapter sends no
  tracking or reply-to fields; keeping account/domain tracking disabled and confirming the
  live result remains an Action 3 prerequisite.
- Production hosting, required environment variables, sender-domain verification, and
  disabled tracking are now user-confirmed. Controlled live delivery remains outstanding.
- Action 2 found and fixed pre-validation Argon2 work for unusable tokens and unsafe logging
  of arbitrary password-reset exception messages.
- The repository has no additive production migration mechanism. This does not block code
  verification, but applying the two new tables through a controlled schema-first process
  is a prerequisite for Action 3 and production reset traffic.
- The user confirmed `process.env.ALLOW_DATABASE_RESET` as the source of truth for explicit
  reset opt-in; if it is not clearly enabled, ask before invoking a destructive reset. The
  repository's separate production refusal remains unchanged.
- Action 3's available local Resend credential is restricted to sending and cannot read
  domain status. The user separately confirmed the dashboard shows `auth.paxeri.dev` as
  verified with open and click tracking disabled.
- The production service is confirmed as Render behind Cloudflare and its required
  environment variables and additive password-reset schema are user-confirmed, but the
  live reset route is not deployed. Controlled end-to-end delivery cannot proceed until
  the user deploys the reviewed application.

## Resume here

Wait for the user to commit/push and deploy the reviewed application. Do not send email,
push, deploy, or modify production data. After the user confirms deployment, verify the
public reset route, then request explicit authorization before sending one controlled
email using untracked `AUTH_EMAIL_TEST_TO`.
