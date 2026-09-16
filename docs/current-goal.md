# Goal: Conditional Production Database Reset and Canonical Registry Restore

## Goal status

**Completed — 2026-09-16.**

## Objective

Provide a safe Render Pre-Deploy Command that performs a destructive production database
reconstruction only when `PRODUCTION_DATABASE_RESET_MODE=reset-and-restore` is explicitly set.
Normal deployments must leave PostgreSQL, the private canonical registry, and media assignments
unchanged.

## Verified implementation

- `npm run production:prepare` invokes `scripts/production-prepare.mjs`; the normal build command
  remains unchanged.
- Missing or empty reset mode exits successfully without constructing or calling reset dependencies.
- Unexpected non-empty reset values fail safely before any destructive operation.
- Enabled mode requires `NODE_ENV=production`, a non-local/non-development-looking PostgreSQL URL,
  administrator configuration, and explicit separate media/registry R2 configuration.
- Registry preflight runs before reset and returns an in-memory validated snapshot.
- The existing `resetAndSeedDatabase` implementation reuses `db/schema.js`, complete `seedSql`,
  and canonical registry restoration; it receives the preflight snapshot and explicit production
  authorization rather than duplicating reset logic.
- Strict post-restore verification compares every snapshot entry with the materialized catalog,
  media asset, localized alt text, canonical path, and primary assignment.
- Registry recovery is read-only with respect to R2; no registry writes or deletes occur.

## Completion criteria

- [x] Dedicated production preparation command and Node orchestration module exist.
- [x] Exact sentinel opt-in and safe disabled behavior are tested and documented.
- [x] Production guards prevent non-production or development-looking targets from resetting.
- [x] Preflight failure is proven not to invoke reset.
- [x] Existing schema/seed/reset and canonical recovery implementations are reused.
- [x] Validated registry state is restored and strictly verified after reset.
- [x] Critical failures return non-zero from the CLI entry point.
- [x] Render usage and post-reset flag removal are documented.
- [x] Production mutation was not performed during implementation or verification.

## Final review evidence

- `npm run verify` passed formatting, lint, server/browser type checks, and all 533 tests.
- Focused production-preparation and canonical recovery verification tests passed.
- The disabled CLI path was manually exercised successfully; an invalid opt-in failed safely.
- No production database reset or production R2 write/delete was performed.

All completion criteria above are satisfied. Intentional exclusions are limited to Render
Dashboard mutation, production destructive verification, registry redesign, manifest promotion,
orphan cleanup, migrations, build integration, and runtime resolver changes.

The goal was approved on 2026-09-16. The production preparation command, guarded reset/restore
orchestration, strict verification, tests, and deployment documentation are complete.

## Deliberate non-goals

No Render Dashboard mutation, production reset, production R2 test writes/deletes, registry redesign,
manifest promotion, orphan cleanup, migration, build integration, or runtime media resolver change
is included.
