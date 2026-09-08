# Current Actions

## Current goal

Expand the global exercise-template catalog to exactly 18 managed base exercise families
and at least 30 useful global variants while preserving catalog ownership boundaries and
the guarded database workflow.

**Goal status:** Approved on 2026-09-08. The action plan is pending approval; no action is
active.

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
- Disposable databases use guarded reset and seed. Retained databases receive one narrow,
  transactional, safely rerunnable manual data migration; no migration framework or
  catalog synchronization infrastructure is introduced.
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
- `db/schema.js` as the authoritative fresh-database schema and seed.
- The repository's existing manual SQL-migration convention for retained databases.

### Repair

- Admin base-template create/update currently requires equipment even though the schema and
  seeded bodyweight variant allow `equipment_id = NULL`.

### Add

- An exact, validated application-owned manifest for the managed catalog.
- Six-pattern foundational coverage, conservative base-muscle relationships, and useful
  global-variant setup/environment content.
- Authoritative seed rows and one retained-database data migration.
- Focused manifest, validation, database, rendered-view, preservation, and rerun coverage.

### Verified unknown

- Production catalog contents have not been inspected. No action assumes that production
  matches the repository's two-sample seed.

## Proposed action sequence

### Action 1 — Define and validate the canonical catalog manifest

**Status:** Pending

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

### Action 2 — Seed the catalog safely and support no-equipment templates

**Status:** Pending

**Purpose:** Apply the reviewed manifest through the project's existing fresh- and
retained-database paths while fixing the verified nullable-equipment inconsistency.

**Expected work:**

- Populate the authoritative schema seed from the approved manifest without weakening or
  bypassing reset guards.
- Add one narrow, transactional, safely rerunnable manual SQL data migration for retained
  databases.
- Make the migration reuse compatible managed rows, preflight ambiguous conflicts, avoid
  partial writes, and preserve unrelated global rows, private variants, sessions, and
  workout snapshots.
- Allow nullable equipment through admin global-template create/update validation and
  update only directly affected form copy or presentation.
- Add focused tests for fresh seed, migration convergence/rerun/conflict rollback,
  preservation, authorization, and no-equipment behavior.
- Document guarded reset use, migration preflight, deployment order, and rollback.

**Constraints:**

- Never bypass the `ALLOW_DATABASE_RESET=true` or production guards.
- Use reset only against disposable databases under explicit environment permission.
- Do not introduce a migration framework, new dependency, broad schema redesign, or image
  support.
- Do not push, deploy, reset production, or apply the migration to a non-disposable
  database.
- Stop at Ready for review with verification evidence recorded.

### Action 3 — Verify catalog behavior and release readiness

**Status:** Pending

**Purpose:** Demonstrate that the approved catalog works through user and administrative
surfaces and that both database paths satisfy the goal without ownership or history
regressions.

**Expected work:**

- Verify exact managed counts, six-pattern distribution, equipment/use-case coverage,
  muscle coverage, metadata completeness, and absence of exact/normalized duplicates.
- Verify guarded reset acceptance/refusal behavior and retained migration convergence,
  safe rerun, conflict rollback, and preservation properties on disposable PostgreSQL
  fixtures.
- Exercise Library browsing/search, session selection, admin global-only management, and
  owner-scoped private variants through focused rendered or HTTP tests.
- Run the relevant focused tests, deterministic full suite, and PostgreSQL-backed coverage.
- Record commands and results, remaining assumptions, deployment/rollback instructions,
  and intentionally deferred image work.

**Constraints:**

- Do not push, deploy, reset production, or mutate production data.
- Do not treat uninspected production state as verified.
- Stop at Ready for review with evidence mapped to every goal completion criterion.

## Resume here

Review the proposed action sequence. If it is approved, set Action 1 to **Active**, keep
Actions 2 and 3 **Pending**, update this section, and stop without implementing Action 1.
