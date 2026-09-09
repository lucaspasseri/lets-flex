# Current Goal

## Parent milestone

Let’s Flex has one trustworthy, reproducible database setup path whose canonical development data
matches the application behavior and tests that consume it.

## Current goal

Restore canonical starter-workout seed consistency so a fresh database contains the established
four-step guest starter session and the repository verification suite is green.

## Status

Completed on 2026-09-09. Action 1 was implemented, verified, and explicitly approved, and the user
approved the final goal outcome.

## Completion outcome

`db/seed.js` now composes the established validated `starterWorkoutSeedSql` instead of a divergent
handwritten one-step definition. Generated seed SQL, fresh development/test databases, guest
provisioning, and guest workout/reporting behavior agree on the canonical ordered four-step global
starter session.

The explicitly opted-in local development database was reset to the repaired canonical setup.
Formatting, lint, server/browser type checks, all 187 repository tests, all 58 PostgreSQL HTTP
tests, reset safeguards, and `git diff --check` passed. No schema, migration, manifest, catalog,
guest-lifecycle, dependency, or UI behavior was changed by this goal.

## Approved user outcome

`db/seed.js` composes the existing validated starter-workout SQL instead of maintaining a divergent
handwritten session definition. Fresh test/development databases, generated seed SQL, guest
provisioning, and their existing tests agree on the same ordered four-step global starter session.

## Why now

- **Verified repository-wide blocker:** `npm run verify` passes formatting, lint, both type checks,
  and 185/187 tests. Its only failures are the starter seed composition mismatch.
- **Verified user approval:** after completing the Programs UX goal, the user approved seed
  consistency as the next goal outcome.
- **Verified regression:** commit `9c827bf` established the frozen four-step manifest and composed
  `starterWorkoutSeedSql` into `seedSql`. Commit `691d96a`, while adding printable seed SQL,
  replaced that composition with handwritten one-step Push Up SQL but added a test requiring
  `starterWorkoutSeedSql` to remain included.
- **Verified product dependency:** guest creation resolves the global session by the manifest’s
  name, and guest lifecycle tests expect all four ordered steps through workout execution,
  History, and Progress.
- **Why this is the strongest next candidate:** it is the only currently verified failing
  repository contract. Repairing it restores the canonical setup path and removes all known test
  failures without expanding product scope.

## Delta-first baseline

### Already satisfied

- `db/schema.js` is the authoritative current schema and requires no change.
- `db/seed.js` already provides the guarded, transactional reset entry point and composes the
  complete exercise catalog.
- `starterWorkoutManifest.js` defines the intended global session name, notes, and four ordered
  steps; its validation requires four or five unique active catalog variants with positive sets
  and reps.
- `createStarterWorkoutSeedSql.js` already generates the complete global session and ordered step
  SQL from that manifest and catalog.
- Existing unit, seed-output, fresh-PostgreSQL, and HTTP tests already specify the required seed
  and guest-lifecycle behavior. No parallel test contract is needed.
- Production refusal, explicit reset opt-in, runtime checks, and safe-target checks are already
  implemented and tested.

### Reuse

- The existing `starterWorkoutSeedSql` export as the sole starter-session seed representation.
- Existing `db:seed:sql`, canonical database setup tests, manifest/generator tests, guest HTTP
  tests, and `npm run verify`.
- The current reset safety boundary and disposable test database; no migration path is needed.

### Repair

- Replace the divergent handwritten one-step session block in `db/seed.js` with the established
  `starterWorkoutSeedSql` composition.

### Add

- No product behavior or new abstraction is required. Add test coverage only if implementation
  reveals a gap not already covered by the existing seed, catalog, generator, and guest tests.

## Scope

### In scope

- The smallest `db/seed.js` composition repair needed to restore the manifest-generated starter
  session.
- Verification of generated SQL, fresh test-database contents, guest starter creation/lifecycle,
  and the complete repository suite.
- A development reset only if `ALLOW_DATABASE_RESET=true` is already set and the exact configured
  target is independently confirmed as the intended local/development database; otherwise report
  it as not run.

### Out of scope

- Schema changes, migrations, new seed architecture, catalog or manifest redesign, changing the
  four exercises, or altering guest provisioning/lifecycle semantics.
- Preserving disposable development data, production data operations, deployment, dependencies,
  UI work, or unrelated test cleanup.
- Modifying the completed Programs/training-day work or the pre-existing user-owned
  `package-lock.json` update.

## Correctness and safety requirements

- The canonical session remains global, active, uniquely named, and composed only from active
  global catalog variants.
- Step names, variants, sets, reps, and order exactly match `starterWorkoutManifest`.
- `seedSql` remains fully resolved and printable with no import text or template placeholders in
  its output.
- Reset production refusal and explicit local/development opt-in safeguards remain unchanged.
- Do not run a development database reset without the repository opt-in and exact safe-target
  confirmation. PostgreSQL integration tests may reset only the configured disposable test
  database.
- Preserve all unrelated working-tree changes.

## Done when

- `db/seed.js` composes `starterWorkoutSeedSql` and contains no separate handwritten starter
  session/step definition.
- Generated seed SQL includes the complete catalog and exact four-step starter workout with no
  unresolved interpolation.
- A fresh disposable PostgreSQL test database contains one global active starter session with the
  four manifest-ordered steps.
- Guest creation exposes the four-exercise session and its established workout/reporting flow
  passes.
- Reset safeguards remain green; formatting, lint, server/browser type checks, the complete unit
  suite, the complete PostgreSQL HTTP suite, and `git diff --check` pass.
- Final diff inspection confirms only the approved seed composition, tracking documentation, and
  any genuinely necessary focused tests changed for this goal.
