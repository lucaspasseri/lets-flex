# Current Goal

## Parent milestone

Let’s Flex tracks training progress, not only training plans.

This broader milestone demonstrates:

- secure multi-provider authentication;
- production account recovery;
- workout-status modeling;
- analytics and SQL aggregation;
- data visualization;
- focused workout-session UX.

## Current goal

Implement a secure, production-ready password-reset flow for local authentication identities.

## Status

Ready for planning.

External email configuration is partially ready:

- production domain: `https://paxeri.dev`;
- email provider: Resend;
- Resend API key: available as a secret;
- sending-domain verification: must be confirmed;
- final sender address: must be confirmed.

Do not record the API key in this file.

## Completed prerequisites

- Users are provider-neutral application principals.
- Authentication credentials belong to provider-scoped identities.
- Google OAuth is implemented.
- Explicit account linking is implemented.
- A Google-only user can add a password.
- Adding a password enables local login with the account email while preserving the
  same application user ID.
- A password user can link Google.
- A user with both methods can replace the linked Google identity.
- Google identities use Google’s stable `sub`, not email.
- Email equality alone does not merge accounts.

The password-reset implementation must preserve these behaviors.

## User outcome

A user who has a local password identity can request a password-reset email and use
a secure, time-limited, single-use link to choose a new password.

After resetting the password, the user can sign in locally with the same account
email and new password. Any linked Google identity must continue to work and access
the same application user and data.

## User stories

### Request a reset

Given a user with a local password identity,

when the user submits the account email on the forgot-password page,

then the application sends a password-reset email and displays a neutral confirmation.

### Unknown email

Given an email that does not identify a local password identity,

when someone submits it,

then the application displays the same neutral confirmation and does not reveal
whether the account exists.

### Google-only account

Given a user who has only a Google identity and has not added a password,

when someone submits the account email,

then the application displays the same neutral confirmation without automatically
creating a local identity.

An authenticated Google-only user can add a password through the existing account-linking flow.

### Linked account

Given a user with both local and Google identities,

when the local password is reset,

then only the local credential changes. Google sign-in continues to resolve to the
same application user ID.

### Complete a reset

Given a valid, unused and unexpired reset link,

when the user submits a valid new password,

then the local password hash is replaced and the reset token can never be used again.

### Invalid link

Given an invalid, expired or previously used reset link,

when it is opened or submitted,

then the application displays a safe error and offers a way to request another link.

## In scope

- forgot-password page;
- reset-request endpoint;
- neutral response that prevents account enumeration;
- cryptographically secure reset-token generation;
- storage of only the token hash;
- token expiration;
- single-use token enforcement;
- password validation and hashing through existing boundaries;
- password replacement for an existing local identity;
- Resend integration behind an application-owned email boundary;
- password-reset email content;
- production links using `https://paxeri.dev`;
- failure handling;
- reasonable abuse protection;
- focused unit and HTTP integration tests;
- environment-variable documentation.

## Out of scope

- email verification during registration;
- automatically creating a password identity for Google-only users;
- automatic account merging;
- changes to account linking;
- changing the application account email;
- unlinking authentication methods;
- redesigning unrelated authentication pages;
- analytics or dashboard work;
- marketing emails;
- newsletters;
- introducing a general notification system;
- adopting React Email unless the existing implementation clearly requires it and
  the addition is separately approved.

## Security invariants

- Generate reset tokens using a cryptographically secure random source.
- Send the raw token only to the user.
- Store only a one-way hash of the token.
- Never log the raw token.
- Tokens must expire.
- Tokens must be single-use.
- A new request should invalidate or supersede older outstanding tokens for the same
  local identity.
- Passwords must use the existing password-hashing boundary.
- Reset requests must not reveal whether an email or local identity exists.
- A reset token must resolve to a local authentication identity, not only to an email.
- Resetting a password must not modify Google identities.
- Database changes that consume the token and replace the password must be atomic.
- User-facing errors must not expose provider responses or internal details.
- Automated tests must not call Resend.

## Email configuration

Proposed production configuration:

- application URL: `https://paxeri.dev`;
- sending subdomain: `auth.paxeri.dev`;
- proposed sender: `Let’s Flex <account@auth.paxeri.dev>`;
- provider: Resend;
- email type: transactional;
- open and click tracking: disabled for password-reset emails.

Expected environment variables:

- `APP_BASE_URL`
- `RESEND_API_KEY`
- `AUTH_EMAIL_FROM`

Example names and non-secret values may be documented in `.env.example`. The real
API key must exist only in local and deployment secrets.

Before production email can be sent, `auth.paxeri.dev` must be added to Resend and
its generated DNS records must be added in Cloudflare. Domain ownership alone is
not sufficient; Resend must show the sending domain as verified.

## Decisions to confirm during planning

### Token lifetime

Recommended default: 30 minutes.

### Session invalidation

Inspect the current session-store capabilities and decide whether a completed reset
can invalidate the user’s existing authenticated sessions.

Do not expand the implementation substantially without presenting the trade-off first.

### Abuse protection

Inspect the existing application for a rate-limiting mechanism.

Recommend the smallest suitable protection for the request endpoint. Do not add a
production dependency without approval.

### Sender address

Confirm whether to use:

`Let’s Flex <account@auth.paxeri.dev>`

If replies should be accepted, configure a real reply destination separately.

## Done when

- a local user can request and complete a password reset;
- unknown and Google-only emails receive the same neutral request response;
- only hashed reset tokens are stored;
- expired, invalid and reused tokens are rejected;
- consuming a token and replacing the password is atomic;
- the new password works for local login;
- the old password no longer works;
- linked Google login continues to access the same user ID;
- automated tests do not send real email;
- the email provider can be replaced without changing password-reset business logic;
- a production reset email contains a valid `https://paxeri.dev` link;
- relevant checks and integration tests pass;
- skipped checks and remaining production prerequisites are reported.
