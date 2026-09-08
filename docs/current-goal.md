# Current Goal

## Parent milestone

Let’s Flex gives users a useful, trustworthy foundation for building strength-training
sessions.

## Current goal

Expand the global exercise-template catalog from its two-sample baseline to a curated,
non-duplicative foundational strength catalog with well-structured base exercises,
equipment-specific global variants, conservative muscle metadata, and a safe canonical
seed.

## Status

Completed on 2026-09-08 after explicit user approval.

## Completion outcome

The application now provides a validated foundational catalog of 18 base exercise families
and 36 global variants through the canonical reset-first database workflow. The completed
result includes conservative prime-mover metadata, nullable-equipment administration,
regular-user browsing and session selection, preserved global/private ownership boundaries,
strengthened reset safeguards, and verified deterministic and PostgreSQL-backed behavior.

## Approved user outcome

Users can build common resistance-training sessions from a substantially broader global
catalog without first creating private variants. Catalog entries are consistently named,
cover meaningful movement and equipment choices, communicate useful setup context, and
preserve the existing distinction between base exercises, global variants, and owner-scoped
private variants.

## Why now

- **Verified user priority:** the user explicitly selected exercise-template quantity and
  usefulness as the next product outcome.
- **Verified catalog gap:** the authoritative seed and disposable PostgreSQL test database
  contain 2 active base exercises and 2 active global variants. Only `push` and `squat`
  are represented, and neither seeded base has a muscle relationship.
- **Verified reusable foundation:** the schema already provides 8 movement patterns, 24
  muscles, 23 equipment options, 7 muscle roles, archived states, and separate global and
  owner-scoped variants. The Library and session builder already render and consume visible
  variants.
- **Verified focused repair:** admin base-template create/update validation requires
  equipment even though the schema and seeded `Bodyweight Push Up` support no-equipment
  variants.
- **Verified delivery boundary:** guarded reset is the authoritative synchronization path
  for the application's disposable-data development phase.

## Delta-first baseline

- **Already satisfied:** catalog tables and relationships, global/private ownership and
  variant-name indexes, archive behavior, admin authorization, Library rendering/search,
  private-variant management, and session selection.
- **Reuse:** existing reference vocabularies, `Push Up`, `Squat`, their global variants,
  repository/ViewModel boundaries, Library components, reset tests, and PostgreSQL HTTP test
  infrastructure.
- **Repair:** allow nullable equipment at the admin base-template create/update validation
  and presentation boundary.
- **Add:** an exact reviewed catalog manifest, conservative muscle links, variant
  setup/environment content, and authoritative canonical seed data.
- **Unknown:** production catalog contents have not been inspected. No action may assume
  they match the two-sample repository seed.

## Catalog contract

- The managed catalog contains exactly 18 active canonical base exercise families,
  including `Push Up` and `Squat`, and at least 30 active global variants.
- Base coverage includes at least 3 `push`, 4 `pull`, 3 `squat`, 3 `hinge`, 3
  `lunge`, and 2 `rotation` exercises.
- Covered use cases include horizontal and vertical upper-body work, bilateral and
  unilateral knee-dominant work, hip hinges and hip extension, and trunk rotation or
  anti-rotation.
- Variants use meaningful combinations from existing reference data: no equipment or
  bodyweight, barbells, dumbbells, kettlebells, cables or bands, and common machines where
  the base movement remains the same.
- Every managed base has at least one conservative `prime_mover`. Additional roles are
  included only where they apply to the base family rather than one equipment variant.
- Every managed global variant has a distinct canonical name, appropriate nullable
  equipment, a useful setup description, and an environment value.
- Exact and normalized names are unique within the manifest. Existing managed entries are
  enriched rather than duplicated, and semantic near-duplicates are removed during
  manifest review.
- Base exercises describe movement families. Equipment/setup implementations remain
  variants. Global variants retain `owner_user_id IS NULL`; private variants remain owned.

## Database lifecycle contract

- `db/schema.js` defines the authoritative current schema and `db/seed.js` contains the
  complete canonical development seed and reset entry point.
- `npm run db:reset` may run only when `ALLOW_DATABASE_RESET=true`. Missing/false
  permission and the production refusal remain intact and must never be bypassed. The
  command also requires a development/test runtime and a local or explicitly named
  development/test target.
- Guarded reset recreates the schema and applies the complete seed in one transaction and
  is the expected synchronization path for disposable development databases.
- Historical development migrations are not required and no migration runner, catalog
  command, or synchronization framework is added.
- No catalog data is applied to production without separate explicit authorization.

## Image-support decision

Image support is not part of this goal. Repository inspection found no catalog image fields
or established exercise-image convention. Variant-level imagery is the most accurate
future option because setup, equipment, environment, and notes already live together
there, but a coherent implementation would require image metadata, a schema change,
local assets, UI work, accessibility/fallback behavior, and asset quality/licensing review.
That would make this catalog increment unnecessarily large.

If separately approved later, prefer versioned local assets under
`public/images/exercise-variants/` and nullable `image_path`/`image_alt` fields on
`exercise_variants`. Render images only when metadata exists and preserve the complete
text card as fallback. Base images can misrepresent variants; muscle illustrations require
anatomy orientation/highlight and source/license metadata; equipment images lack a verified
benefit sufficient to justify 23 assets and new detail UI.

## In scope

- Define and review the exact managed manifest before inserting rows.
- Reuse and enrich the two existing sample bases and variants.
- Add the catalog to the authoritative canonical seed and guarded-reset path.
- Repair no-equipment admin validation and directly affected form copy.
- Verify Library visibility, session selection, admin global-only management, and private
  and historical data preservation.
- Add focused manifest, validation, database, rendered-view, and PostgreSQL-backed coverage.
- Document the reset-first development workflow and its production safety boundary.

## Out of scope

- Image metadata/assets/generation or Library image presentation.
- Private-variant redesign or promotion into global data.
- Carry/gait expansion and duration, distance, pace, heart-rate, or other required metrics.
- A comprehensive isolation, rehabilitation, mobility, Olympic-lifting, or sport-specific
  library.
- Coaching, prescriptions, technique guarantees, medical guidance, video, localization, or
  external content services.
- Broad Library redesign, schema normalization, a migration framework, or a new dependency.
- Push, deployment, production reset/application, or non-disposable database mutation
  without separate explicit authorization.

## Correctness and security requirements

- Manifest references resolve to approved vocabulary and every entry satisfies the catalog
  contract before database work.
- Catalog application creates no exact or normalized managed duplicates.
- Workout snapshots are never rewritten by application behavior.
- Private variants remain owner-scoped and unchanged.
- Admin mutations remain authorization protected and validated.
- No-equipment support does not weaken name, ID, muscle, ownership, or relationship
  validation.
- Reset and seed operations are transactional and honor existing guards.
- No secrets, sensitive account data, or production catalog content are logged or committed.

## Assumptions and approved planning judgments

- **Unknown:** production applicability requires later inspection or explicit
  user-authorized execution because production catalog contents are uninspected.
- **Approved planning judgment:** 18 bases and 30-plus variants are the bounded first
  increment. Exact content remains subject to Action 1 review before row insertion.
- **Approved deferral:** variant imagery is a possible separate goal, not an implicit later
  action in this goal.
- **Explicitly reconsidered delivery decision:** while the application has no data that must
  be preserved, guarded reset is the only schema synchronization path and development
  migrations are removed. A persistent-data workflow requires a later explicit policy
  change.

## Done when

- The reviewed manifest contains exactly 18 distinct managed bases and at least 30 distinct
  global variants, including/enriching the existing entries without duplication.
- Six in-scope patterns, stated use cases, equipment categories, content fields, and
  prime-mover coverage meet the catalog contract.
- Manifest validation rejects missing references, invalid metadata, and exact or normalized
  duplicate names before database work.
- Guarded reset produces the exact catalog only with `ALLOW_DATABASE_RESET=true`; production,
  non-development/test runtime, and ambiguous remote-target refusals are verified.
- No-equipment global templates can be created and updated through the admin boundary
  without weakening authorization or other validation.
- Regular users can browse/select expanded global variants while global/private management
  boundaries remain intact.
- Focused tests, the deterministic suite, PostgreSQL-backed coverage, and the authorized
  local development reset pass with the canonical schema and seed path.
- No image work, dependency, broad redesign, push, deployment, production reset, or
  production-data mutation occurs.
