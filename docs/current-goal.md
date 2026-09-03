# Current Goal

## Parent milestone

Let’s Flex tracks training progress, not only training plans.

This broader milestone demonstrates secure multi-provider authentication, production
account recovery, workout-status modeling, analytics and SQL aggregation, data
visualization, and focused workout-session UX.

## Current goal

Complete and verify production-ready password-reset email delivery through Resend for
the existing local-identity password-reset flow.

## Status

Paused on 2026-09-03 at the user's request. Action 1 is completed; Action 2 remains pending
approval and no further implementation is active.

The worktree contains an uncommitted password-reset implementation. It is implementation
evidence, not an approved or completed action. The next action must preserve it and add
only the missing production email-delivery configuration and adapter.

## Current implementation state

The uncommitted implementation currently provides:

- request and completion pages, routes, validation, and CSRF protection;
- a neutral request response for local, unknown, and Google-only emails;
- cryptographically random, opaque reset tokens with only SHA-256 hashes persisted;
- a configurable 30-minute default lifetime through `PASSWORD_RESET_TTL_MS`;
- one active token per local identity, expiry checks, and single-use consumption;
- atomic password replacement, token invalidation, and PostgreSQL session invalidation;
- reset links built from a validated `APP_BASE_URL`;
- database-backed request limiting of five attempts per IP per 15-minute window;
- an application-owned `sendPasswordReset` boundary, an in-memory fake for tests, and an
  intentionally failing unconfigured production implementation;
- HTTP integration coverage for success, non-enumeration, expiry, malformed and unknown
  tokens, replay/concurrency, password validation, session invalidation, and transaction
  rollback;
- UI and README/environment documentation for the implemented flow.

This state has not yet been accepted under the active-action workflow. Its full verification
status must be established separately; the current documentation-only task does not verify
or modify the implementation.

## User outcome

A user with an existing local password identity can request a time-limited, single-use
password-reset link delivered through Resend, choose a new password, and sign in locally
with it. A linked Google identity continues to resolve to the same application user and
data.

Unknown and Google-only emails receive the same neutral response and do not cause local
identity creation.

## Remaining scope

- implement a Resend adapter behind the existing application-owned email boundary;
- wire that adapter into normal application startup while preserving dependency injection
  for automated tests;
- send a transactional Let’s Flex password-reset message containing the generated reset
  URL, its expiry, and guidance for an unrequested reset;
- validate required email configuration without logging or exposing secrets;
- document safe local and production configuration;
- handle Resend rejection and transport failures with a neutral user response and
  useful secret-free server-side diagnostics;
- verify that automated tests never call Resend;
- verify delivery from the approved `paxeri.dev` sending identity and that the delivered
  link uses `https://paxeri.dev`.

## Out of scope

- email verification during registration;
- automatically creating a password identity for Google-only users;
- automatic account merging or changes to account linking;
- changing account email or unlinking authentication methods;
- unrelated authentication redesign or refactoring;
- marketing email, newsletters, or a general notification system;
- replacing the existing token, request, completion, rate-limit, or session-invalidation
  implementation unless review or verification finds a correctness or security defect;
- adopting a general email templating framework unless separately approved.

## Security and failure requirements

- Keep `RESEND_API_KEY` only in local/deployment secret storage. Never commit, render,
  return, or log it.
- Keep the raw reset token and full reset URL out of logs and provider-error diagnostics.
- Preserve generic request responses so account existence and provider failures cannot be
  distinguished by user-visible content.
- Automated tests must use a fake or mock and must not make network requests to Resend.
- Validate `APP_BASE_URL` as a trusted absolute HTTP(S) origin; production must use
  `https://paxeri.dev`.
- Validate the configured sender before attempting delivery.
- Treat non-success provider responses and transport failures as delivery failures; expose
  no provider body or internal details to the requester.
- Record only secret-free diagnostic context needed to operate the integration, such as a
  stable error category and provider request ID when safely available.
- Preserve the existing token guarantees: cryptographically secure generation, hash-only
  storage, expiration, single use, supersession, local-identity ownership, and atomic
  password replacement.
- Do not modify linked Google identities.
- Automated coverage must include adapter success, provider rejection, transport failure,
  configuration failure, and request-flow non-enumeration on delivery failure.
- A real Resend delivery is a deliberate manual production/staging verification, not an
  automated test.

## Email configuration

Confirmed:

- provider: Resend;
- owned domain: `paxeri.dev`;
- production application origin: `https://paxeri.dev`;
- email type: transactional;
- a Resend API key is available and must remain outside the repository.

Required environment variables:

- `APP_BASE_URL` — non-secret public origin; `https://paxeri.dev` in production;
- `PASSWORD_RESET_TTL_MS` — optional positive lifetime in milliseconds; currently defaults
  to `1800000` (30 minutes);
- `RESEND_API_KEY` — required secret for the production adapter;
- `AUTH_EMAIL_FROM` — required Resend-verified sender in mailbox or display-name format.

Only placeholders or non-secret examples belong in `.env.sample` and README documentation.
The real API key belongs in local `.env` and deployment secret configuration and must not
be pasted into planning documents, commits, logs, tests, or chat.

## Confirmed implementation decisions and external prerequisites

- Use the official Resend Node.js SDK as a production dependency.
- Configure the sender as `Let’s Flex account@auth.paxeri.dev` through `AUTH_EMAIL_FROM`.
- Do not configure reply-to yet.
- Keep open and click tracking disabled for password-reset emails.
- Read the API key from `RESEND_API_KEY`.
- Fail production startup clearly when required email configuration is missing.
- Keep automated tests isolated through fake or mocked clients; they must never contact
  Resend.
- Preserve neutral public responses for unknown accounts and delivery failures, and keep
  tokens, API keys, reset URLs, and sensitive account information out of diagnostics.
- Production reset links use the configured `APP_BASE_URL=https://paxeri.dev` origin.
- Add the chosen root domain or subdomain to Resend, publish the exact DNS records Resend
  supplies, and confirm Resend reports it as verified before live delivery testing.
- Confirm where production is deployed and where its secrets are managed. Existing planning
  mentions Render, but the repository does not establish that as current fact.

## Done when

- the existing secure password-reset behavior remains intact and its relevant checks pass;
- eligible local accounts receive a password-reset email through Resend;
- unknown and Google-only accounts retain the same neutral response;
- the Resend implementation remains behind the application-owned email boundary;
- configuration is environment-based, validated, and documented without secrets;
- provider and configuration failures are safe, observable, and covered by tests;
- automated tests make no real Resend calls;
- a manual delivery from the verified sender succeeds;
- the delivered reset URL uses `https://paxeri.dev` and successfully completes a reset;
- skipped checks and remaining deployment prerequisites are reported.
