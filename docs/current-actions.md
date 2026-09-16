# Current Actions

## Current goal

Conditional Production Database Reset and Canonical Registry Restore.

## Action 1 — Inspect and compose existing reset/recovery APIs

**Status:** Completed

Verified that `db/seed.js` was the authoritative schema/seed reset entry point and already
performed canonical registry preflight and restoration. The implementation delta was limited to
exporting a reusable guarded reset function and allowing the production command to pass its
validated snapshot; no parallel reset or registry implementation was created.

## Action 2 — Add strict production preparation command

**Status:** Completed

Added `npm run production:prepare` and `scripts/production-prepare.mjs`. The command accepts only
`PRODUCTION_DATABASE_RESET_MODE=reset-and-restore`; missing/empty mode is a successful no-op and
unexpected values fail safely. Enabled mode validates production identity, a non-local target,
administrator settings, and separate explicit R2 media/registry configuration before preflight.

## Action 3 — Orchestrate snapshot recovery and verification

**Status:** Completed

Preflight runs before any reset call, its validated snapshot remains in memory, and that snapshot
is passed into the existing reset-and-seed/recovery transaction. Strict read-only verification then
checks every snapshot entry's catalog identity, media object key, metadata, canonical path, alt
text, and primary assignment. Stage failures are converted to a non-zero CLI exit without logging
credentials or database connection strings.

## Action 4 — Test and document deployment behavior

**Status:** Completed — goal approved 2026-09-16

Added focused orchestration tests for disabled, invalid, successful ordering/snapshot preservation,
preflight failure, reset failure, verification failure, and production-guard failure. Updated
`.env.sample`, database and registry operations documentation, and this goal/action record. No
production database or R2 resources were mutated.

## Verification evidence

Verified with `npm run verify`: formatting, lint, server/browser type checks, and all 533 tests
passed. The focused production-preparation tests and strict recovery verifier tests also passed.
The CLI disabled path was manually exercised and made no database or registry calls; an invalid
value failed at configuration. No production database or R2 resources were mutated.

## Completion summary

Action 4 and the goal were approved on 2026-09-16. All four actions are complete; no further
implementation action is prepared or activated.

## Resume here

Goal completed; no next action is prepared or activated.
