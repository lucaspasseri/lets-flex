# Current Actions

## Current goal

Expand the global exercise-template catalog to exactly 18 managed base exercise families
and at least 30 useful global variants while preserving catalog ownership boundaries and
the guarded database workflow.

**Goal status:** Completed on 2026-09-08 after explicit user approval. All three actions are
completed.

## Status definitions

- **Pending:** proposed work that has not been approved for implementation.
- **Active:** the only action currently authorized for implementation.
- **Ready for review:** implemented and verified; awaiting explicit user approval.
- **Changes requested:** review corrections are authorized for the current action.
- **Completed:** verification evidence was reviewed and the action was explicitly approved.

Only one action may be Active. Approving this plan activates Action 1 and stops at that
planning gate; it does not also authorize implementation.

## Confirmed decisions

- The bounded managed catalog target is exactly 18 active base families and at least 30
  active global variants.
- Coverage must include at least 3 push, 4 pull, 3 squat, 3 hinge, 3 lunge, and 2 rotation
  base exercises.
- The existing `Push Up` and `Squat` bases and their global variants are reused and
  enriched rather than duplicated.
- Base exercises represent movement families; equipment and setup implementations remain
  variants.
- Every managed base receives at least one conservative prime mover. Variant-specific
  muscle claims do not belong on the base.
- No-equipment global variants remain valid. The inconsistent admin validation and directly
  affected form copy are repaired without weakening other validation.
- `npm run db:reset` may be used only when `ALLOW_DATABASE_RESET=true`; existing
  missing/false and production refusals remain intact.
- During the disposable-data development phase, guarded reset applies the authoritative
  current schema and complete canonical seed. Ordinary development migrations are removed.
- Image metadata, assets, generation, and UI presentation are excluded from this goal.
- No push, deployment, production reset, or production-data application is authorized.

## Delta-first baseline

### Already satisfied

- The schema separates base exercises from global and owner-scoped private variants.
- Existing reference data provides 8 movement patterns, 24 muscles, 23 equipment options,
  and 7 muscle roles.
- Library browsing, session selection, admin authorization, private ownership, archive
  behavior, ViewModel boundaries, and PostgreSQL HTTP-test infrastructure already exist.
- Reset already requires explicit `ALLOW_DATABASE_RESET=true` and refuses production.

### Reuse

- The two existing active base exercises and two global variants.
- Existing movement-pattern, muscle, equipment, and muscle-role records.
- `db/schema.js` as the authoritative current schema and `db/seed.js` as the canonical seed
  and guarded reset entry point.

### Repair

- Admin base-template create/update currently requires equipment even though the schema and
  seeded bodyweight variant allow `equipment_id = NULL`.

### Add

- An exact, validated application-owned manifest for the managed catalog.
- Six-pattern foundational coverage, conservative base-muscle relationships, and useful
  global-variant setup/environment content.
- Authoritative canonical seed rows.
- Focused manifest, validation, fresh-database, rendered-view, and reset coverage.

### Verified unknown

- Production catalog contents have not been inspected. No action assumes that production
  matches the repository's two-sample seed.

## Proposed action sequence

### Action 1 — Define and validate the canonical catalog manifest

**Status:** Completed

**Purpose:** Settle the exact content and prove it satisfies the approved catalog contract
before any catalog rows are inserted.

**Expected work:**

- Define the exact 18 managed base families and at least 30 global variants in an
  application-owned manifest.
- Explicitly identify the existing bases and variants to reuse and enrich.
- Resolve movement-pattern, equipment, environment, muscle, and muscle-role references
  against the existing vocabulary.
- Assign at least one conservative prime mover to every base and avoid variant-specific
  claims at base level.
- Include useful setup descriptions and canonical names for every managed variant.
- Add validation that rejects unresolved references, missing required metadata, invalid
  distributions, and exact or normalized duplicate names.
- Review the complete manifest for semantic near-duplicates and document intentional
  distinctions.

**Constraints:**

- Do not insert or mutate database rows in this action.
- Do not add image metadata or assets.
- Do not add carry/gait exercises or exercise types requiring unsupported duration,
  distance, pace, or similar metrics.
- Stop at Ready for review with the exact manifest and validation evidence recorded.

**Implemented:**

- Added an application-owned manifest containing exactly 18 base families and 36 global
  variants. The distribution is 3 push, 4 pull, 3 squat, 3 hinge, 3 lunge, and 2 rotation
  bases.
- Preserved `Push Up`, `Squat`, `Bodyweight Push Up`, and `Barbell Back Squat` as compatible
  managed entries to reuse and enrich in Action 2.
- Resolved all movement-pattern, equipment, environment, muscle, and muscle-role names
  against the repository seed vocabulary. Six no-equipment variants intentionally use a
  nullable equipment reference.
- Assigned one conservative `prime_mover` to each base and supplied a distinct canonical
  name, setup description, and environment for every variant.
- Added deterministic validation for exact counts and pattern distribution, required
  metadata, vocabulary references, prime-mover coverage, and exact or normalized duplicate
  names.
- Recorded the reviewed semantic distinctions among nearby families, including vertical
  pulls, lunge directions, knee-dominant patterns, rotation versus anti-rotation, and hip
  extension variants.

**Verification evidence:**

- `node --test src/features/exerciseCatalog/validateCatalogManifest.test.js` — passed 5 of
  5 tests.
- `npm run format:check` — passed.
- `npm run lint` — passed.
- `npm run check:types` — passed.
- `git diff --check` — passed before this status update; final documentation diff was also
  inspected.
- Full deterministic and PostgreSQL-backed suites were not run because Action 1 is an
  isolated manifest/validation increment with no runtime or database integration. Those
  suites remain explicitly required in Action 3.
- No database reset, row insertion, or other database mutation was performed.

**Completion:** Approved on 2026-09-08. The reviewed canonical manifest establishes 18
base families and 36 global variants with validated vocabulary references, required
metadata, conservative prime movers, exact pattern coverage, duplicate protection, and
documented semantic distinctions. Final focused tests, formatting, lint, type checking,
and diff checks passed.

### Action 2 — Seed the catalog safely and support no-equipment templates

**Status:** Completed

**Purpose:** Apply the reviewed manifest through the canonical fresh-database path while
fixing the verified nullable-equipment inconsistency.

**Expected work:**

- Populate the canonical seed from the approved manifest without weakening or bypassing
  reset guards.
- Allow nullable equipment through admin global-template create/update validation and
  update only directly affected form copy or presentation.
- Add focused tests for fresh schema and seed, reset guards, authorization, and no-equipment
  behavior.
- Document the canonical reset-first development workflow and production boundary.

**Constraints:**

- Never bypass the `ALLOW_DATABASE_RESET=true` or production guards.
- Use reset only against disposable databases under explicit environment permission.
- Do not introduce migration tooling, a new dependency, broad schema redesign, or image
  support.
- Do not push, deploy, reset production, or mutate a non-disposable database.
- Stop at Ready for review with verification evidence recorded.

**Implemented:**

- Added validated catalog SQL generated from the reviewed application-owned manifest to the
  canonical `db/seed.js`. The seed creates exactly 18 managed bases, 36 global variants,
  and 18 conservative prime-mover relationships after `db/schema.js` creates the current
  schema.
- Changed admin create/update validation to map blank or absent equipment to `null` while
  retaining positive-ID validation for nonblank values, the existing muscle/name/movement
  validation, CSRF protection, and admin authorization.
- Updated the existing form control to present `No equipment` as an enabled option and
  describe equipment as optional. No unrelated layout, styling, or interaction changed.
- Documented the disposable reset workflow, canonical seed boundary, and separate
  production authorization requirement.
- Updated one pre-existing workout lifecycle fixture to select its asserted canonical
  variant explicitly instead of relying on arbitrary catalog insertion order.

**Security and data-integrity evaluation:**

- CSRF and administrator authorization remain unchanged on both state-changing admin
  routes. Rate limiting and session rotation are not applicable to this catalog metadata
  change.
- Request input still crosses the existing Zod validation boundary; nullable equipment
  does not relax name, movement, muscle, role, or nonblank equipment-ID validation.
- Reset production refusal and explicit `ALLOW_DATABASE_RESET=true` opt-in remain intact.
- Schema creation, canonical seed data, and administrator creation run in one transaction.
- No secrets, tokens, production catalog contents, or sensitive account data were logged or
  committed.

**Verification evidence:**

- `npm run format:check` — passed.
- `npm run lint` — passed.
- `npm run check:types` — passed.
- Focused manifest, schema-validation, rendered-form, and reset-guard tests — passed 17 of 17.
- `node --env-file-if-exists=.env.test --test db/catalog.test.js` with approved disposable
  PostgreSQL access — passed the canonical fresh-database manifest-parity test.
- Complete deterministic test command with approved disposable PostgreSQL access — passed
  154 of 154. Its initial sandboxed attempt could not connect to PostgreSQL (`EPERM`); no
  test assertion failed in that attempt, and the identical command passed with access.
- PostgreSQL HTTP suite — passed 48 of 48 after repairing the insertion-order-dependent
  lifecycle fixture discovered by its first run. The first run passed 47 of 48 and produced
  the expected snapshot from a different valid variant, confirming a fixture assumption
  rather than a product defect.
- Guarded `db/seed.js` reset against the explicitly named disposable `lets_flex_test`
  database — passed with `ALLOW_DATABASE_RESET=true`; a read-only query confirmed
  `18|36|18` bases, global variants, and muscle relationships. Existing refusal tests for
  production and missing opt-in also passed.
- `git diff --check` — passed before this status update; the final diff was inspected for
  unrelated changes.
- No retained external database, production database, deployment, or push was performed.

**Completion:** Approved on 2026-09-08 after final verification. The authoritative fresh
schema and seed, nullable-equipment admin boundary, focused presentation copy, and reset
safety documentation satisfy Action 2's accepted scope. The later explicit database-policy
change removed development migrations before final goal approval.

### Action 3 — Verify catalog behavior and release readiness

**Status:** Completed

**Purpose:** Demonstrate that the approved catalog works through user and administrative
surfaces and that the canonical reset path satisfies the goal without ownership or history
regressions.

**Expected work:**

- Verify exact managed counts, six-pattern distribution, equipment/use-case coverage,
  muscle coverage, metadata completeness, and absence of exact/normalized duplicates.
- Verify guarded reset acceptance/refusal behavior and fresh schema/seed parity on a
  disposable PostgreSQL fixture.
- Exercise Library browsing/search, session selection, admin global-only management, and
  owner-scoped private variants through focused rendered or HTTP tests.
- Run the relevant focused tests, deterministic full suite, and PostgreSQL-backed coverage.
- Record commands and results, remaining assumptions, reset safety instructions, and
  intentionally deferred image work.

**Constraints:**

- Do not push, deploy, reset production, or mutate production data.
- Do not treat uninspected production state as verified.
- Stop at Ready for review with evidence mapped to every goal completion criterion.

**Implemented and verified:**

- Added an explicit manifest coverage test for the approved equipment range and the
  horizontal/vertical upper-body, bilateral/unilateral knee-dominant, hinge/hip-extension,
  lunge, rotation, and anti-rotation use cases.
- Added a PostgreSQL HTTP test proving a regular user can browse representative expanded
  variants and select a global catalog variant into an owner-scoped session.
- Reused the existing catalog-search browser test, admin authorization/global-only HTTP
  coverage, private-variant ownership coverage, rendered Library tests, reset refusal
  tests, and canonical seed test rather than duplicating them.

**Goal completion evidence:**

- **Exact reviewed manifest:** manifest validation and fresh-schema parity prove exactly 18
  distinct managed bases and 36 distinct global variants, including the enriched `Push Up`,
  `Squat`, `Bodyweight Push Up`, and `Barbell Back Squat` entries.
- **Coverage contract:** focused tests prove the exact 3 push, 4 pull, 3 squat, 3 hinge, 3
  lunge, and 2 rotation distribution; required equipment categories, use cases, setup and
  environment fields, and one prime mover per base are present.
- **Pre-database validation:** focused negative tests reject unresolved references, missing
  setup or prime-mover metadata, invalid distribution, and exact or normalized duplicate
  names.
- **Guarded reset:** production and missing-opt-in refusal tests pass. The explicitly
  authorized disposable reset succeeded only with `ALLOW_DATABASE_RESET=true` and produced
  18 bases, 36 global variants, and 18 muscle links.
- **No-equipment administration:** schema and PostgreSQL HTTP tests prove blank equipment
  maps to `null` on admin create and update while administrator authorization, CSRF, and
  other validation remain enforced.
- **User and ownership behavior:** PostgreSQL HTTP coverage proves regular-user Library
  visibility and session selection for expanded global variants, admin global-only
  management, and owner-scoped private variants. The browser test proves catalog search
  remains functional without an admin session workspace.
- **Release verification:** `npm run verify` passed all 155 tests plus formatting, lint,
  server type checking, and browser type checking. The PostgreSQL HTTP suite separately
  passed all 49 tests. The canonical database test passed 1 of 1 and focused manifest
  tests passed 6 of 6.
- **Database policy:** repository guidance records the canonical schema-to-seed reset path,
  explicit reset opt-in, and production safety boundary.
- **Scope controls:** no images, dependency, migration tooling, broad redesign, push,
  deployment, external database mutation, or production reset/data mutation occurred.

**Remaining assumptions and manual gates:**

- Production catalog contents remain uninspected and unknown. No production database change
  is authorized by the development reset policy.
- No manual visual browser pass was required because the only presentation change reuses
  the established select control and is covered by rendered HTML assertions. No deployment
  was attempted.
- Exercise imagery remains intentionally deferred and outside this goal.

**Completion:** Approved on 2026-09-08. Final verification covered the catalog, canonical
fresh-database path, no-equipment behavior, ownership, and release-readiness criteria. The
exact post-policy verification results are recorded below.

## Database-policy update

The user explicitly replaced the retained-data delivery decision before final goal approval.
Repository inspection verified that neither standalone development migration was used by
startup, CI, npm scripts, deployment configuration, or a migration runner, and their final
state already existed in the authoritative current schema/seed. The migration files,
migration-only tests, and obsolete delivery document were therefore removed. Static seed
data was moved out of the schema definition and consolidated in `db/seed.js`, preserving the
reviewed catalog and all existing reference and sample data. The ambiguous `npm run seed`
alias was removed so `npm run db:reset` is the one obvious database setup command.

**Post-policy verification evidence:**

- The configured reset target was inspected without exposing credentials and confirmed as
  `NODE_ENV=development`, `ALLOW_DATABASE_RESET=true`, localhost database `lets_flex`, with
  required administrator inputs present.
- `npm run db:reset` — passed against that confirmed local development database after the
  policy and safety changes. The command applied schema, canonical seed, and administrator
  creation once in one transaction.
- A read-only post-reset query confirmed 6 step types, 8 movement patterns, 7 goals, 24
  muscles, 23 equipment rows, 7 muscle roles, 18 active bases, 36 active global variants,
  18 exercise-muscle links, 1 global sample session and step, and 1 administrator. Variant,
  muscle-link, and session-step orphan counts were all zero.
- Reset refusal coverage now also proves that non-development/test runtimes and ambiguous
  remote targets fail before connecting, in addition to the existing production and missing
  opt-in refusals.
- `npm run verify` — passed formatting, lint, server types, browser types, and all 155 tests,
  including the canonical PostgreSQL database setup test.
- PostgreSQL HTTP suite — passed 49 of 49 tests against `lets_flex_test`, including expanded
  catalog browsing/selection, administration, private ownership, and workout snapshots.
- Repository search found no remaining references to either removed migration file, its
  migration-only test path, or the obsolete catalog delivery document. `git diff --check`
  passed and the final diff was inspected.

## Final goal review

- **Completed behavior:** the authoritative schema and canonical seed produce the reviewed
  18-base, 36-global-variant catalog with conservative muscle metadata; admin
  create/update accepts nullable equipment; regular users can browse and select the
  expanded catalog; ownership and historical boundaries remain intact.
- **Done-when comparison:** every criterion in `docs/current-goal.md` is satisfied by the
  evidence recorded under Action 3 and the database-policy update, including catalog
  structure and validation, guarded reset behavior, admin and regular-user paths,
  deterministic and PostgreSQL-backed verification, and scope controls.
- **Unmet criteria:** none.
- **Intentionally excluded:** image support, carry/gait and specialized exercise expansion,
  broad Library redesign, migration tooling or a new dependency, deployment, push, and all
  production reset or data application remain outside the completed implementation.
- **Remaining external gate:** any production database change requires separate explicit
  authorization and a future persistent-data policy; the development reset flag grants
  neither.

## Resume here

The goal and all three actions are **Completed**. No next goal is approved or strongly
implied by the verified repository state and the user's latest stated priorities. Keep
`docs/current-goal.md` as the completed record until the user selects a new direction.
