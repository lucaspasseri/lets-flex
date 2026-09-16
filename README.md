# LETS FLEX

I am improving my skills as a web developer, learning Fullstack Javascript with [TOP](https://www.theodinproject.com/lessons/node-path-nodejs-deployment)

## Deploy

You can [see my fitness app](https://lets-flex.onrender.com/) on Render.

## Configuration

Copy `.env.sample` to `.env` for local development and set:

- `NODE_ENV=development` for the local application and guarded database reset.
- `DATABASE_URL` to the PostgreSQL connection string.
- `DATABASE_SSL=true` when the server requires verified TLS.
- `SESSION_SECRET` to a long, random value. The application will not start without it.
- `SESSION_MAX_AGE_MS` to the session-cookie lifetime; the default is 15 days.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL` for Google OAuth.
- `APP_BASE_URL` to the trusted public HTTP(S) origin used to build password-reset links.
- `PASSWORD_RESET_TTL_MS` to the reset-link lifetime; the default is 30 minutes.
- `RESEND_API_KEY` to a Resend API key kept only in local or deployment secret storage.
- `AUTH_EMAIL_FROM=Let’s Flex account@auth.paxeri.dev` to the Resend-verified sender.
- `GUEST_TTL_DAYS=15` and `GUEST_CLEANUP_BATCH_SIZE=100` for generated guests.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD` when running the explicit database setup.
- `ALLOW_DATABASE_RESET=true` only when deliberately resetting development data.
- `ALLOW_DATABASE_MIGRATION=true` only when deliberately applying an existing-database migration.
- `ALLOW_PRODUCTION_DATABASE_MIGRATION=true` as a separate explicit confirmation for a reviewed
  production migration; this never authorizes reset.
- `ALLOW_PRODUCTION_DB_RESET=I_CONFIRM_PRODUCTION_DB_RESET` only for a deliberate production
  reconstruction, together with `PRODUCTION_DATABASE_RESET_MODE=reset-and-restore`; keep both unset
  normally.

The component playground is available outside production only.

## Database

The application is currently in a disposable-data development phase. `db/schema.js`
is the authoritative current schema, while `db/seed.js` is the one canonical seed
and reset entry point for reference data, the exercise catalog, 70 canonical catalog-media
assignments, global samples, and
the initial administrator. `npm run db:reset` applies the latest schema and complete
seed in one transaction, producing a usable database without replaying historical migrations.
`npm run db:seed:sql` prints the canonical seed SQL, and `npm run db:setup:sql` prints the latest
schema followed by that seed for intentional clean-database provisioning.

The normal local flow is:

```sh
npm run db:reset
npm start
```

The reset command is the repository's guarded equivalent of `schema → seed`: it leaves no
required startup initialization or manual SQL step for the application to perform.

The repository-controlled manifest and `public/media/catalog/` files define the reset/bootstrap
canonical baseline. Runtime canonical promotions are persisted in the database assignment
(`entity_media.canonical_path`) and keep their provider-neutral asset key; they do not edit the
manifest or depend on Render's local filesystem. Runtime/admin uploads under ignored
`public/media/uploads/` remain outside the seed unless they are explicitly curated into the
manifest.

Canonical media durability commands are explicit and read-only by default:

```sh
# Verify the production baseline without changing R2 or PostgreSQL.
CANONICAL_MEDIA_TARGET=production \
npm run media:baseline:provision -- --mode=verify

# Run the combined repository-baseline and private-registry preflight.
npm run media:durability:preflight

# Run the disposable PostgreSQL recovery rehearsal locally when its R2 environment is configured.
npm run media:recovery:rehearsal
```

Existing R2 objects are adopted as authoritative and are never overwritten or deleted by baseline
verification/provisioning. Byte differences from the repository source are warnings only. Missing
objects fail `verify` and may be created by an explicitly confirmed `apply`; configuration,
authentication, permission, bucket, and other provider failures remain fatal. The manually
dispatched `Canonical Media Recovery Rehearsal` workflow performs the same read-only production
R2 preflight, then restores the validated registry snapshot into an ephemeral PostgreSQL service.
The rehearsal validates both R2 configurations before making a request and prints categorized,
secret-safe diagnostics when its preflight fails; a 70-object missing count can indicate a wrong
media bucket as well as genuinely absent objects and must be investigated before any repair.

Existing databases use `npm run db:migrate` with `ALLOW_DATABASE_MIGRATION=true`; production also
requires `ALLOW_PRODUCTION_DATABASE_MIGRATION=true`. Migrations are additive and transactional,
while fresh/reset databases use the latest schema and seed directly. Do not run reset for
production, and do not run migration commands without verifying the exact target and reviewed
deployment plan.

The generic reset command refuses to run when `NODE_ENV=production`, even when the production
confirmation variables are present. Production reconstruction is available only through the
separate `npm run production:prepare` wrapper, which requires both exact values
`PRODUCTION_DATABASE_RESET_MODE=reset-and-restore` and
`ALLOW_PRODUCTION_DB_RESET=I_CONFIRM_PRODUCTION_DB_RESET`. Development reset requires
`ALLOW_DATABASE_RESET=true` and also requires `NODE_ENV=development` or
`NODE_ENV=test` and a localhost target or database name explicitly marked as development,
local, or test. Before using that opt-in, verify that `DATABASE_URL` identifies the intended
disposable database.
For ordinary development schema changes, update the current schema and canonical
seed as needed, run the authorized reset, verify the result, and run relevant tests. For a
non-disposable database, add and review a versioned migration instead of resetting it.

The administrator email is normalized and its environment-provided password is
hashed with the same Argon2id service used by Passport authentication. The hash
is stored on a local authentication identity; no credentials or provider tokens
are stored in the administrator's user row.

Each guest entry creates a distinct, minimal database identity that expires after
15 days. Run `npm run guests:cleanup` from a daily scheduled job to remove one
bounded batch of expired guest identities and their owned data.

Application users and sign-in methods are stored separately. `users` is the
principal referenced by roles and owned resources; `auth_identities` contains
provider-scoped credentials. Local identities use the normalized account email as
their subject. Google identities use Google's stable `sub` value and are never
linked or merged based only on matching email addresses.

## Authentication and production deployment

The app uses Passport LocalStrategy and Google OAuth 2.0, `express-session`, and
PostgreSQL-backed sessions through `connect-pg-simple`. Production must use Node
22 and provide `DATABASE_URL`, `SESSION_SECRET`, and the other runtime settings
from `.env.sample`. Keep `trust proxy` enabled on Render so secure cookies work.

Create a Google OAuth web client and register an authorized redirect URI that
exactly matches `GOOGLE_CALLBACK_URL`:

- Local development: `http://localhost:3000/auth/google/callback`
- Render: `https://lets-flex.onrender.com/auth/google/callback`

Set the Render environment variable to the HTTPS URL for the deployed service.
Only the `profile` and `email` scopes are requested. Google access and refresh
tokens are used only during authentication and are not persisted.

Do not add `ALLOW_DATABASE_RESET` to Render and do not use `npm run db:reset` as
the service start or pre-deploy command. Use `npm start` for the web service and
schedule `npm run guests:cleanup` daily. Changing `SESSION_SECRET` invalidates
all existing sessions.

### Production object storage handoff

Production R2 setup is manual and must use a bucket, access key, and public media domain that are
separate from development. In Render, set `OBJECT_STORAGE_PROVIDER=r2`, a production-scoped
`R2_BUCKET_NAME`, `R2_ENDPOINT`, `R2_REGION=auto`, the bucket-scoped R2 access-key secrets, and
`MEDIA_PUBLIC_URL` to the complete HTTPS custom domain attached to that production bucket.

The bucket name identifies R2 storage only. Browser URLs append the provider-neutral object key to
`MEDIA_PUBLIC_URL`, for example:

```text
assets/<UUID>.<extension>
https://<production-media-domain>/assets/<UUID>.<extension>
```

Never derive the public hostname from the bucket name or R2 endpoint. Do not put
`R2_DEVELOPMENT_BUCKET_NAME`, `R2_SMOKE_TEST_CONFIRMATION`, or `ALLOW_DATABASE_RESET` in Render.
Create the production bucket, least-privilege access key, custom domain, and DNS/TLS configuration
manually in Cloudflare, then verify the domain and bucket pairing before deployment. No production
resource is created or changed by repository commands.

The manually triggered production deployment workflow runs this gated sequence:

```text
GitHub Actions: verify → durability preflight → production:prepare → Render deploy hook
Render: npm install → node server.js
```

GitHub Actions replaces the unavailable Render Pre-Deploy phase for this project. The separate
`Canonical Media Recovery Rehearsal` workflow uses production R2 only for read-only preflight and
restores the validated private registry snapshot into an ephemeral PostgreSQL service. See the
[production deployment guide](docs/production-deployment.md) for the GitHub `production`
Environment variables/secrets and the [controlled reconstruction checklist](docs/production-recovery-checklist.md)
for the one-time reset procedure. After a controlled reset is validated, remove or disable both
production reset guards from that GitHub Environment. The deployment guide also covers the
baseline verification command, recovery rehearsal, and exact manual acceptance test.

Argon2id is smoke-tested with `npm run check:argon2`; CI runs the same check on
Ubuntu 22.04 with Node 22 before deployment.

Password reset is available only to accounts that already have a local identity.
Reset tokens are opaque, stored only as SHA-256 hashes, expire after 30 minutes by
default, and are single-use. Issuing a link invalidates the identity's earlier
active link. Completing a reset updates the Argon2id password, consumes every
active reset token for that identity, and removes that user's PostgreSQL sessions
in one transaction. Requests are limited to five per IP per 15-minute window.

Password-reset email is sent through Resend. Production startup requires
`RESEND_API_KEY`, `AUTH_EMAIL_FROM`, and `APP_BASE_URL=https://lets-flex.paxeri.dev`; missing or
invalid configuration stops startup without printing secrets. Keep open and click
tracking disabled for the sending domain in Resend. Password-reset messages do not set
a reply-to address. Delivery failures retain the same non-enumerating public response,
and no development mode prints tokens or reset URLs. Automated tests inject fake or
mocked email clients and never contact Resend.

## Tests

Run the deterministic unit and browser suite with `npm run verify`. HTTP integration
tests require a disposable PostgreSQL database whose name contains `test` and are
run separately:

```sh
TEST_DATABASE_URL=postgresql://localhost/lets_flex_test npm run test:http
```

The integration suite resets that database before every scenario and skips when a
safe `TEST_DATABASE_URL` is not configured. It never uses `DATABASE_URL` directly.

## Me

**Lucas Passeri**
