# Current Actions

## Current goal

Restore canonical starter-workout seed consistency so the authoritative setup path, guest starter
experience, and verification suite agree on the established four-step global session.

**Goal status:** Completed on 2026-09-09. Action 1 is Completed.

## Status definitions

- **Pending approval:** proposed first action that has not been approved for implementation.
- **Pending:** later work whose preceding action has not been completed and approved.
- **Active:** the only action currently authorized for implementation.
- **Ready for review:** implemented and verified; awaiting explicit user approval.
- **Changes requested:** review corrections are authorized for the current action.
- **Completed:** verification evidence was reviewed and the action was explicitly approved.

Only one action may be Active. Approving this plan activates Action 1 and stops at that planning
gate; it does not authorize implementation in the same response. Every implemented action stops
at Ready for review.

## Verified evidence baseline

- `starterWorkoutManifest.js` is a frozen four-step full-body definition: Box Squat, Push Up,
  One-Arm Dumbbell Row, and Glute Bridge, in that order.
- `createStarterWorkoutSeedSql.js` validates four or five unique catalog-backed steps and already
  produces the complete global session and ordered-step SQL.
- `createGuest.js` uses the manifest’s session name to assign that global template to each new
  guest’s starter day.
- `db/catalog.test.js`, `db/seed.test.js`, the generator unit tests, and the guest HTTP tests all
  require the generated four-step contract.
- `db/seed.js` instead contains a handwritten one-step Push Up session block and does not import
  `starterWorkoutSeedSql`.
- Git history verifies that `9c827bf` introduced manifest composition and the complete guest flow.
  The later `691d96a` seed-printing commit replaced it with the old one-step block while adding a
  test asserting that generated seed SQL includes `starterWorkoutSeedSql`.
- `npm run verify` currently passes static checks and 185/187 tests. The two failures are exactly
  the fresh-database starter contents and complete generated-seed SQL assertions.
- The complete PostgreSQL HTTP suite currently passes 56/58. Its two failures are the guest
  four-exercise display and lifecycle expectations caused by the same seed mismatch.
- Reset production refusal, explicit opt-in, runtime, and safe-target tests already pass.
- The working tree contains the completed Programs/training-day goal and a pre-existing
  user-owned `package-lock.json` update. Both must be preserved without unrelated edits.

## Confirmed decisions

- Treat the existing four-step `starterWorkoutManifest` and generator as authoritative. This is a
  verified regression repair, not a choice between equally supported seed definitions.
- Restore composition rather than copying four handwritten step statements into `db/seed.js`.
- Reuse existing tests unless a genuinely uncovered correctness issue appears.
- Do not change schema, migrations, catalog content, manifest exercises, guest lifecycle,
  dependencies, UI, or unrelated completed work.
- Do not reset a development database unless the repository opt-in is present and its exact target
  is confirmed safe and intended. Use the disposable PostgreSQL test database for integration
  verification.

## Proposed action sequence

### Action 1 — Restore canonical starter seed composition and verify the setup path

**Status:** Completed

**Prepared:** 2026-09-09. The user approved the goal outcome, not implementation. Repository and
history inspection narrowed the required delta to one seed composition repair.

**Approved:** 2026-09-09. The user approved the proposed action scope. Per the approval gate, no
implementation or database reset was performed in the approval response.

**Started:** 2026-09-09.

**Ready for review:** 2026-09-09. The canonical composition repair, opted-in local development
reset, fresh-database verification, guest lifecycle coverage, complete HTTP suite, and complete
repository suite all pass.

**Completed:** 2026-09-09. The user approved the repair after reviewing the implementation and
recorded evidence. Approval-gate verification again passed all 187/187 repository tests and the
complete 58/58 PostgreSQL HTTP suite. No further implementation was started.

**Progress:** `db/seed.js` now imports and interpolates the existing validated
`starterWorkoutSeedSql` immediately after `catalogSeedSql`. The divergent handwritten global
session and single Push Up step were removed. No generator, manifest, schema, migration, catalog,
guest lifecycle, dependency, UI, or test contract was changed.

The configured development environment had `ALLOW_DATABASE_RESET=true`,
`NODE_ENV=development`, and the exact local target `postgresql://localhost:5432/lets_flex`.
`npm run db:reset` completed successfully, replacing the disposable development database with the
current schema and canonical seed. Direct post-reset inspection found one active global starter
session with the canonical notes and all four manifest steps in order. Previous local development
contents were discarded by the authorized reset and are not recoverable through this repository
unless an external backup exists.

**Verification evidence:**

- Seed-output, reset-safeguard, and starter generator/manifest tests passed 7/7.
- Fresh disposable PostgreSQL setup tests passed 3/3, including complete catalog, ordered global
  starter workout, and session-store infrastructure.
- Targeted guest starter display and workout/History/Progress lifecycle tests passed 2/2.
- The complete PostgreSQL HTTP suite passed 58/58.
- `npm run verify` passed formatting, lint, server/browser type checks, and all 187/187 repository
  tests. This resolves the only two failures recorded before the action.
- `git diff --check` passed. Final seed diff inspection contains only the generator import,
  interpolation, and removal of the duplicate handwritten block. All completed Programs/day work
  and the pre-existing user-owned `package-lock.json` update remain untouched by this action.

**Purpose:** Remove the sole divergent starter-session definition so fresh databases, printable
seed SQL, guest behavior, and tests consume the same validated manifest.

**Expected work:**

- Import `starterWorkoutSeedSql` in `db/seed.js` and interpolate it after `catalogSeedSql`.
- Remove the handwritten one-step `Sample Full Body Session` and Push Up insert block.
- Confirm the printable `seedSql` is fully resolved and contains the canonical catalog and exact
  manifest-generated starter SQL.
- Run the generator/manifest and reset-safeguard tests, fresh PostgreSQL catalog tests, targeted
  guest starter HTTP tests, the complete HTTP suite, and `npm run verify`.
- Run a development database reset only if the explicit reset opt-in and exact intended local
  target are both available; otherwise record that it was intentionally not run.
- Inspect the final diff for accidental schema, migration, manifest, guest-lifecycle, dependency,
  UI, or unrelated working-tree changes.

**Acceptance criteria:**

- `db/seed.js` has one canonical starter-workout source: `starterWorkoutSeedSql`.
- Generated and executed seed SQL creates exactly one global active starter session with the four
  manifest steps in the correct order and with the correct names, variants, sets, and reps.
- Guest starter display, execution, History, and Progress expectations pass without changing
  their established behavior.
- Reset safety tests, all static checks, all repository tests, the complete PostgreSQL HTTP suite,
  and `git diff --check` pass.
- No schema, migration, catalog, manifest, lifecycle, dependency, UI, or unrelated changes are
  introduced. The action stops at Ready for review.

**Constraints:**

- Do not create a migration or parallel seed representation.
- Do not alter the four-step manifest merely to make a test pass.
- Do not reset production or any unconfirmed database target.
- Preserve completed Programs/training-day changes and the user-owned lockfile update.

## Goal final-review assessment

**Status:** Completed on 2026-09-09. The user approved the final outcome after reviewing the
implementation, fully green verification evidence, scope integrity, and intentionally excluded
work.

- **Single canonical source — satisfied:** `db/seed.js` imports and composes
  `starterWorkoutSeedSql`; the separate handwritten starter session and step definition is gone.
- **Resolved generated SQL — satisfied:** seed-output and generator tests confirm the printable
  SQL includes the complete catalog and exact manifest-generated starter SQL, without unresolved
  interpolation or source imports.
- **Fresh database contents — satisfied:** disposable PostgreSQL setup tests and direct post-reset
  inspection confirm one active global starter session with the four correctly named, configured,
  and ordered manifest steps.
- **Guest experience — satisfied:** targeted and complete HTTP coverage confirms four-exercise
  display, workout execution, History, and Progress without lifecycle changes.
- **Safety and repository verification — satisfied:** reset refusal/opt-in tests remain green;
  formatting, lint, server/browser types, all 187 repository tests, all 58 HTTP tests, and
  `git diff --check` pass.
- **Scope integrity — satisfied:** the implementation diff is limited to `db/seed.js` composition.
  No schema, migration, catalog, manifest, guest lifecycle, dependency, UI, completed prior-goal,
  or user-owned lockfile change was introduced by this goal.

**Unmet criteria:** None.

**Intentionally excluded:** schema and migration work, catalog/manifest redesign, exercise
changes, guest-lifecycle changes, new seed architecture, production or unconfirmed database
operations, dependencies, UI work, and unrelated cleanup.

## Resume here

The current goal and Action 1 are Completed. No next goal or action is approved. Reassess the
repository and the user's priorities before proposing or starting further work.
