# Current Actions

## Current goal

Verify the Full Scope and Persistence of Canonical Media.

## Goal status

**Completed — 2026-09-15.** The investigation was approved by the user; no follow-up
implementation was activated.

## Action 1 — Trace runtime promotion and assignment state

**Status:** Completed

**Verified:**

- Admin upload creates an external storage object, `media_assets`, localized alt-text rows, and a
  non-canonical direct `entity_media` assignment.
- Object-backed promotion keeps the existing `assets/...` key, derives a stable compatibility path,
  and replaces/upserts the entity’s one primary assignment without creating a second asset row.
- Local promotion copies bytes into the local promoted path and creates a new curated asset row;
  prior assets remain stored.
- The source manifest is read-only runtime bootstrap data and is never updated by promotion.

**Evidence:** `manageMedia.js`, `promoteMediaToCanonical.js`, `mediaRepository.js`, `mediaSql.js`,
`canonicalMediaPath.js`, `mediaManifest.js`, `promoteMediaToCanonical.test.js`, and
`docs/canonical-media-audit.md`.

## Action 2 — Trace session resolution, propagation, and precedence

**Status:** Completed

**Verified:**

- `session_steps` stores `exercise_variant_id`; no session/workout/media snapshot column exists.
- Dashboard and Program Day controllers load current assignments on each render; Library and Admin
  exercise presentation use the same resolver boundary.
- Persistent precedence is direct variant, base exercise, then movement pattern. History does not
  render media, and Programs overview does not load the media resolver.
- The new lifecycle regression proves an unchanged step resolves A before a changed base
  assignment and B afterward, while a direct variant remains first.

**Evidence:** `sessions/queries.js`, `workoutSessions/queries.js`, `resolveStepMedia.js`,
`resolveEntityMedia.js`, `loadMediaAssignments.js`, `dashboardController.js`, `dayController.js`,
`libraryController.js`, `canonicalMediaLifecycle.test.js`, and existing resolver/view tests.

## Action 3 — Trace persistence and reset/seed behavior

**Status:** Completed

**Verified:**

- R2 bytes and external database rows survive normal restart/deploy; local filesystem writes do not
  provide Render deploy durability.
- `db:reset` drops runtime rows and reseeds only `data/canonical-media.json`; it does not touch R2
  or local media files.
- `db:seed:sql` prints seed SQL; `db:setup:sql` generates setup SQL; `db:reset:sql` is absent.
- Runtime-promoted R2 objects can remain orphaned after reset.
- A fresh production setup needs both manifest/database seed state and separately provisioned R2
  objects when remote reads are enabled.

**Evidence:** `package.json`, `db/seed.js`, `db/schema.js`, `db/mediaSeedSql.js`,
`db/printSeedSql.js`, `db/printSetupSql.js`, `db/migrations/003_canonical_media_paths.js`,
`app.js`, storage adapters, `docs/database-setup.md`, seed/media tests, and the audit report.

## Verification record

- `npm test -- --test-name-pattern=...` was attempted for focused promotion/resolution/seed names.
  Non-DB matching tests passed; the command still loaded PostgreSQL suites whose connection hook
  failed with `EPERM` because no local PostgreSQL test database was reachable. Run summary: 497
  passed, 2 failed, 4 cancelled.
- The source/public/view collection passed 479 tests and had 2 environment-only failures because
  `src/interfaces/i18nApplication.test.js` could not bind its test server (`listen EPERM`).
- `npm run check:browser-types` passed; formatting, lint, server type checking, and `git diff --check`
  passed.
- No production or development database reset was run.
- No R2 API call or object mutation was run.
- No browser executable was available; this audit relies on source and automated rendering
  contracts, not live visual inspection.

## Resume here

The audit goal is complete. No next action is activated. Any durability/reconstructability work for
Admin-promoted canonical media requires a separately approved goal.

## Completion record

The user approved the investigation and requested that `docs/canonical-media-audit.md` remain the
reference for verified behavior. No architectural changes were implemented as part of this goal.
