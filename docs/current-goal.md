# Goal: Verify the Full Scope and Persistence of Canonical Media

## Goal status

**Completed — 2026-09-15.** The audit was approved by the user. No production database,
production R2 bucket, or destructive reset was used.

## Objective

Verify and document the actual current behavior of canonical media after an Admin upload is promoted
to canonical. The investigation covers request flow, entity/variant precedence, existing workout
propagation, application surfaces, restart/deploy persistence, database reset behavior, repository
manifest seeding, and the canonical compatibility path.

## Verified outcome

- Canonical runtime state is an entity-level `entity_media` primary assignment with a non-null
  `canonical_path`; there is no separate canonical-media table.
- Session and workout records store exercise-variant relationships, not media snapshots. Dashboard,
  Program Day, Library, and Admin media/exercise presentation resolve current assignments during
  each render. Programs overview and History do not consume exercise media.
- Resolver precedence is direct variant, parent exercise, then movement pattern, followed by static
  fallback sections and the initial tile.
- R2-backed promotion reuses the existing `assets/...` object and updates the database assignment;
  local-path promotion writes a local canonical compatibility file and creates a curated asset row.
- Previous media assets remain stored; the entity’s one primary assignment is replaced/upserted.
- `db:reset` and an executed generated setup SQL recreate only the repository manifest seed. Runtime
  promotion does not update `data/canonical-media.json`; an R2 object can survive as an orphan.
- The current source no longer emits or requires `canonical_path_missing`; that was historical
  behavior before commit `302be5d`.

The detailed report, lifecycle diagram, propagation matrix, persistence matrix, code evidence, and
architectural classification are in [docs/canonical-media-audit.md](canonical-media-audit.md).

## Scope constraints

- Investigation and focused verification only; no media architecture redesign.
- Do not reset production or delete production R2 objects.
- Do not introduce migrations solely for this audit.
- Preserve current functionality and document implementation follow-ups separately.

## Verification evidence

- Added `src/features/media/canonicalMediaLifecycle.test.js` for unchanged-step dynamic resolution
  and variant-over-base precedence.
- Existing promotion, entity-resolution, step-resolution, seed, schema, storage, controller, and
  rendered-surface tests were inspected and used as evidence.
- Focused media, resolver, promotion, seed, and reset-guard tests passed: 28 passed, 0 failed.
- Browser-side type checking passed. The non-PostgreSQL source/public/view collection reached 479
  passed and 2 failed because the i18n application suite could not bind its test server (`listen
EPERM`); no application assertion failed.
- The repository-wide test command was attempted, but PostgreSQL-backed suites failed at their
  connection hook because no local test database was reachable; other suites reported 497 passed,
  2 failed, and 4 cancelled in that run. No database reset was attempted.
- Live browser inspection was not needed for a behavior-only audit and no browser executable was
  available.

## Done when

- [x] The meaning and database effects of “Make Canonical” are documented.
- [x] Existing workout/session propagation and dynamic render resolution are answered with source
      and focused test evidence.
- [x] Application-surface propagation and variant/base precedence are documented.
- [x] Restart/deploy, reset, fresh-database, R2-orphan, and repository-manifest behavior are
      separated explicitly.
- [x] Reset command variants are distinguished, including the absent `db:reset:sql` script.
- [x] The compatibility-path diagnostic discrepancy is reconciled against current source and git
      history.
- [x] Actual architectural limitations are separated from future implementation candidates.
- [x] User review confirms the audit answers the requested questions; durability work remains a
      separate, unapproved goal.

## Completion record

The user approved the investigation and requested that `docs/canonical-media-audit.md` remain the
reference for verified behavior. No architectural changes were implemented as part of this goal.
The durability/reconstructability gap identified by the audit was intentionally left for a
separate goal and was not activated here.

## Historical context

The previous completed goal was Entity Presentation Completeness. Its implementation remains in
the repository; this audit reuses its media resolver and rendered-surface evidence without
reopening that goal’s UI work.
