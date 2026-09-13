# Current Actions

## Current goal

### Introduce Stable Catalog Identifiers

Establish deterministic catalog keys for supported global catalog records while retaining the
authoritative `schema → seed` development workflow.

## Goal status

**Completed** on 2026-09-13. Actions 1, 2, and 3 are completed.

## Planning evidence

- **Verified missing identity:** `exercises`, `exercise_variants`, `muscles`, `equipments`, and
  `movement_patterns` have no stable identifier independent of their generated `id` or display
  name.
- **Verified seed boundary:** `db/seed.js` runs static vocabulary, catalog, translations, and the
  starter workout in that order. `createCatalogSeedSql` joins catalog relationships by names;
  Portuguese translations and starter-workout SQL use names as their source identity.
- **Verified relational boundary:** translation rows and persistent media assignments correctly
  store numeric foreign keys. No seeded media assets or assignments exist today. Runtime media
  management's numeric selection is not an external seed/configuration manifest.
- **Verified verification baseline:** `db/catalog.test.js` reapplies `schemaSql` then `seedSql`
  before each canonical-database test and currently validates catalog counts, translations, starter
  workout relationships, and zero seeded media assignments.
- **Verified workflow:** `npm run db:reset` is a protected one-transaction schema-and-seed reset.
  Existing legacy migration tooling is opt-in and is not part of normal setup; no migration is
  authorized for this goal.

## Delta classification

- **Already satisfied / reuse:** authoritative schema/seed reset path, transaction and target
  safeguards, catalog manifest generator, translation seed ordering, numeric relational foreign
  keys, canonical database tests, and unseeded media model.
- **Modify:** the five global catalog table definitions; catalog/static seed source contracts;
  SQL joins and dependent seed manifests that currently identify catalog records by names; and
  canonical setup tests/documentation.
- **Add:** explicit `catalog_key` validation/constraints and deterministic key assertions.
- **Explicitly excluded:** migrations, production upgrades, private-variant keys, runtime media
  resolver changes, and unrelated catalog refactoring.

## Proposed action sequence

### Action 1 — Define stable-key contract and seed sources

**Status:** Completed

**Purpose:** Establish the precise key convention and deterministic source data for the supported
global catalog entities before changing schema or dependent seed SQL.

**Scope:** Extend the catalog/static vocabulary and manifest contracts with explicit stable keys;
validate key format, uniqueness, and global-variant applicability; document the one-way rule that
display/translation names do not define identity; identify exact seed lookups to convert.

**Acceptance criteria:** Every supported seeded entity has a deterministic lowercase kebab-case
key in its source data; the manifest validator rejects missing, malformed, or duplicate keys; the
chosen contract excludes private variants; and focused tests show that key changes are not derived
from translated/display-name behavior.

**Boundaries:** Do not edit the schema, run a database reset, create a migration, alter relational
writes, or activate Action 2.

**Activation (2026-09-13):** The user approved the action plan. Action 1 is the only active
action. Define and validate the stable-key source contract only; do not begin Action 2.

**Implementation (2026-09-13):** Added explicit, immutable-for-identity `catalogKey` source
fields to all 78 global exercises and 129 global variants in `catalogManifest`. Added explicit
`{ catalogKey, name }` source entries for the eight movement patterns, 24 muscles, and 28 equipment
records while preserving the existing name-array interface for current consumers. Keys use
lowercase ASCII kebab-case and are values in the source manifest—not values calculated at runtime
from names or translations. Private variants remain outside this global seed contract.

`validateCatalogManifest` now rejects absent, malformed, duplicate, or vocabulary-mismatched
keys. Focused tests verify the canonical source contract and prove a display-name change leaves an
existing key intact. The next action must convert these identified name-based seed boundaries:
`db/seed.js` static catalog inserts; `createCatalogSeedSql` joins for movement patterns, exercises,
equipment, and muscles; Portuguese translation source lookup; and the starter-workout variant
manifest/lookup. English translation backfill already selects created global rows directly and does
not contain a hard-coded external ID or name manifest.

**Verification (2026-09-13):** `node --test
src/features/exerciseCatalog/validateCatalogManifest.test.js
src/features/guests/createStarterWorkoutSeedSql.test.js db/catalogTranslations.test.js` passed
16/16. `npm run format:check`, `npm run lint`, `npm run check:types`, and `git diff --check`
passed. No schema, seed SQL, migration, database reset, production target, or relational-write
change was made.

**Review stop (2026-09-13):** Action 1 is ready for review. Action 2 remains pending and was not
activated or implemented.

**Completion (2026-09-13):** The user approved Action 1 after final focused tests (16/16), format,
lint, type, and diff checks passed. The completed source contract provides explicit keys without
changing schema or seed SQL. Action 2 remains pending and was not activated or implemented.

### Action 2 — Apply keys to schema and seed relationships

**Status:** Completed

**Purpose:** Make stable keys persist through canonical initialization and become the seed-facing
way to resolve catalog rows.

**Scope:** Add constrained/unique `catalog_key` columns to the authoritative schema; populate them
from Action 1 source data; revise catalog relationship, translation, and starter-workout seed SQL
to join on keys and resolve numeric IDs only for foreign-key writes; update focused tests.

**Acceptance criteria:** Clean schema-plus-seed setup populates unique keys for all five entity
types; catalog, translation, and starter-workout relationships resolve through keys; existing
display output and numeric foreign-key storage remain compatible; no migration is added.

**Dependency:** Requires Action 1 completion and explicit approval.

**Activation (2026-09-13):** The user approved Action 2. Apply keys to the authoritative schema
and seed relationships only; do not activate or implement Action 3.

**Implementation (2026-09-13):** Added constrained `catalog_key` columns to the authoritative
schema. Movement patterns, muscles, and equipment require unique non-null keys; exercises and
variants use unique partial indexes with a nullable key so the existing user-created exercise and
variant workflows remain outside the seeded global-catalog contract. All key-bearing columns reject
anything outside lowercase ASCII kebab-case.

The canonical seed now writes static catalog keys and resolves every catalog relationship by key:
exercise → movement pattern, variant → exercise/equipment, and exercise → muscle. Portuguese
translation manifests are keyed by `catalog_key` and join the seeded rows by that key; English
backfill remains a direct select of rows just created. The starter-workout manifest now carries
`variantCatalogKey` and resolves its relational `exercise_variant_id` through that stable key.
Numeric IDs remain only the values inserted into foreign-key columns. No media assets or
assignments are seeded, so no media manifest conversion exists in the current repository.

Updated canonical database coverage to assert complete/distinct keys for all five entity types,
key-based catalog relationships, and key-based starter-workout resolution.

**Verification (2026-09-13):** Focused manifest, translation, starter-workout, and seed tests
passed 22/22. The canonical test database applied the authoritative `schemaSql` then `seedSql`
before each case and passed 3/3 catalog setup tests, including complete/distinct keys and
key-resolved relationships. `npm run format:check`, `npm run lint`, `npm run check:types`, and
`git diff --check` passed. No migration was added; no development database reset, production
target, commit, push, or deployment was performed.

**Review stop (2026-09-13):** Action 2 is ready for review. Action 3 remains pending and was not
activated or implemented.

**Completion (2026-09-13):** The user approved Action 2 after final focused tests (22/22), format,
lint, type, and diff checks passed. The prior canonical schema-to-seed test-database run passed
3/3. Action 3 remains pending and was not activated or implemented.

### Action 3 — Verify reset determinism and document the boundary

**Status:** Completed

**Purpose:** Prove the full schema-to-seed lifecycle is safe and repeatable, then record the
catalog-identity contract for future translation/media seed manifests.

**Scope:** Run the required safe clean reset when a permitted local/development target is
configured; otherwise run canonical test-database setup and record why a development reset is not
safe. Add repeatable key/relationship assertions, run required code checks, inspect the final diff,
and document the stable-key lookup pattern and seed ordering.

**Acceptance criteria:** Verification demonstrates complete and unique keys, valid translation and
starter-workout references, valid foreign keys, and equivalent relationships across repeated clean
setup; docs state that external manifests use keys while relational rows use IDs; the normal
workflow remains schema then seed.

**Dependency:** Requires Action 2 completion and explicit approval.

**Activation (2026-09-13):** The user approved Action 3. Verify reset determinism and document the
stable-key boundary only; do not mark the goal completed.

**Implementation (2026-09-13):** Added `docs/catalog-identifiers.md`, documenting the stable-key
contract, supported entity types, nullable user-created exercise/variant boundary, key-to-ID seed
lookup rule, required seed ordering, future media-manifest rule, and preserved `schema → seed`
development workflow. Added an automated canonical test that applies schema and seed twice and
compares a stable-key relationship snapshot rather than generated IDs.

**Verification (2026-09-13):** Confirmed the configured reset target as local/development, with
`ALLOW_DATABASE_RESET=true` and required administrator configuration present, without exposing
connection details. Ran `npm run db:reset` twice against that confirmed development target. The
two independent post-reset snapshots each contained 349 stable-relationship rows with identical
SHA-256 `7e410f312fb71ac1aa351bc6cbf9c9ec5768ac7dc32306775712903b5f45e4bc`.

The canonical test database passed 4/4, including the new repeated-clean-setup assertion. Full
`npm run verify` passed: format, lint, server/browser type checks, and 401/401 tests. The first
sandboxed verification attempt could not reach local PostgreSQL (`EPERM`); the approved rerun with
local-test database access passed fully. No migration, production target, commit, push, or
deployment was performed.

**Review stop (2026-09-13):** Action 3 is ready for review. All planned actions are implemented;
the goal remains in progress pending explicit approval of this final action.

**Changes requested (2026-09-13):** The user reported `POST /admin/media/generate` returning
HTTP 422 for an authenticated administrator submitting `entityType=muscle`, `entityId=14`, a valid
CSRF token, a session-bound request nonce, and an empty `refinement`. This is a targeted review
correction to the existing admin-media work, not a change to the stable-catalog-key outcome.

**Investigation (2026-09-13):** The complete request path is global URL-encoded/multipart body
parsing → global CSRF validation → principal exposure → application authentication →
media-router URL/session state → administrator authorization → generation-body Zod validation →
controller nonce check → generation service/provider. The 422 occurs in generation-body validation:
`muscle` is not in the four supported AI generation entity types. It therefore happens before the
controller checks the nonce or calls the external provider. Empty `refinement` is correctly
normalized to `undefined` by request validation and to `null` by the service. The supplied muscle
form was visible because the media-management view rendered its generation section for every
assignable entity type, despite the documented Phase 5 policy excluding generated anatomy.

**Correction (2026-09-13):** Preserved CSRF, authorization, nonce, entity validation, and the
existing media assignment lifecycle. The media page now derives generation availability from the
generation preset policy; a selected muscle shows an accessible explanation and no generation form
or nonce. Direct/manual requests remain safely rejected by request validation with the explicit
non-sensitive message: “AI generation supports exercises, global variants, equipment, and movement
patterns.” A supported target with `refinement=""` is normalized to no refinement and proceeds
through the injected provider boundary to a private pending-review candidate. Enabling generated
anatomy remains an explicitly excluded policy change.

**Regression coverage and verification (2026-09-13):** Focused schema, service, and rendered-view
tests passed 17/17. The authenticated HTTP regression test passed 1/1 with catalog muscle #14, a
valid CSRF token, a session-bound nonce, and empty refinement: the page does not offer the invalid
form; a direct request receives the explicit 422 validation response; and no candidate is created.
`npm run verify` passed fully: format, lint, server/browser type checks, and 403/403 tests.
`git diff --check` passed. A broad `npm run test:http` run reached the focused media test but had
five unrelated failing assertions elsewhere in that existing suite; the isolated media subtest
passes. No live image-provider request was made, so the verified successful next state uses the
deterministic injected provider in service coverage. Browser-geometry tooling is unavailable in
this environment; the rendered EJS accessibility/interaction contract is covered by the view test,
and no CSS layout or interaction behavior changed.

**Review stop (2026-09-13):** The requested correction is ready for review. Action 3 remains the
only action; do not mark it completed or activate any additional work without explicit approval.

**Changes requested — supported equipment generation (2026-09-13):** The user reported the same
HTTP 422 from `POST /admin/media/generate` for `entityType=equipment`, `entityId=14`, a valid CSRF
token, a session-issued nonce, and empty refinement. This must be treated as a separate supported-
target investigation, not as the intentionally unsupported-muscle case. Keep Action 3 in changes-
requested status until equipment reaches the deterministic provider boundary and persists a pending
candidate in HTTP regression coverage.

**Investigation (2026-09-13):** The exact payload parses successfully: Zod returns
`{ entityType: "equipment", entityId: 14, requestNonce, refinement: undefined }` with no issues.
Equipment #14 exists in the configured local development catalog as `Dip Bar` (`catalog_key`
`dip-bar`). The UI, nonce issuance, Zod schema, prompt preset map, and service all list equipment
as supported. CSRF executes before authentication and route validation; the 422 proves the supplied
token passed because CSRF failure is 403. After Zod and the session nonce check, the controller calls
the service. The configured local environment has no `OPENAI_API_KEY`, so lazy provider setup throws
`MediaGenerationError` code `not_configured`. The controller currently renders every generation
domain failure as HTTP 422, which misleadingly presents provider configuration unavailability as a
validation error. No provider request or candidate creation occurs in this condition.

**Correction (2026-09-13):** Added one shared media-generation policy module, used by the admin
page, Zod schema, and prompt/service path. Its source of truth lists exactly global exercise, global
exercise variant, equipment, and movement pattern; its tests assert that the preset map cannot drift
from that list. Application construction accepts deterministic generation dependencies only for
tests; normal runtime still lazily constructs the configured OpenAI provider. The controller now
maps `not_configured`, invalid configuration, and provider unavailability to HTTP 503; rate limiting
to 429; provider rejection/invalid provider bytes to 502; and genuine entity/refinement validation
errors to 422. No secret, CSRF, authorization, validation, nonce, supported-type rule, or candidate
lifecycle behavior was weakened.

**Regression coverage and verification (2026-09-13):** Focused policy, schema, controller,
service, and rendered-view tests passed 21/21. The focused authenticated HTTP admin-media test
passed 1/1 using the actual rendered CSRF token and equipment #14 nonce: `equipment:14` with empty
refinement passes Zod and nonce validation, calls the deterministic provider once with the
`equipment-editorial` preset, persists a `pending_review` candidate, and redirects successfully
instead of returning 422. Replayed and mismatched nonces return 409 without another provider call;
the muscle direct-request regression retains its explicit 422; the existing guest/user/missing-CSRF
assertions preserve authorization and CSRF coverage. `npm run verify` passed fully: format, lint,
server/browser type checks, and 405/405 tests. `git diff --check` passed.

**Operational finding:** The configured development environment has no `OPENAI_API_KEY`. A real
equipment request there now reaches the service and returns the safe HTTP 503 configuration message
instead of a misleading 422; it cannot create a live candidate until an authorized key is supplied.
No live or paid provider request was made during this correction.

**Review stop (2026-09-13):** The supported-equipment correction is ready for review. Action 3
remains the only action; do not mark it completed or activate additional work without explicit
approval.

**Completion (2026-09-13):** The user approved the supported-equipment correction. Action 3 now
satisfies its acceptance criteria: the stable-key catalog and relationship snapshot is repeatable
across clean setup, translation and starter-workout references remain valid, the stable-key seed
boundary is documented, and the canonical `schema → seed` workflow is preserved. The targeted
authenticated equipment-generation regression and full `npm run verify` passed before approval.
No migration, production mutation, commit, push, or deployment was performed. The configured
development environment still has no `OPENAI_API_KEY`; real equipment generation therefore safely
returns HTTP 503 until an authorized key is supplied, while deterministic provider coverage proves
the successful pending-candidate lifecycle.

## Resume here

All planned actions and completion criteria are approved. The goal was completed on 2026-09-13; no
next action or replacement goal has been activated.
