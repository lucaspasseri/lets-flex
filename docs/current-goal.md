# Current Goal

## Parent milestone

Let’s Flex should help people recognize and navigate training content quickly while preserving
stable catalog ownership boundaries across translations, media, seeds, and future catalog systems.

## Current goal

### Introduce Stable Catalog Identifiers

Give supported global catalog entities deterministic, immutable-for-identity `catalog_key` values
without changing the authoritative development setup workflow:

```text
schema → seed → application ready
```

Seed/configuration data must use catalog keys to locate records. PostgreSQL numeric IDs remain the
relational identity used only when inserting foreign-key rows.

## Status

**Completed** on 2026-09-13. Actions 1, 2, and 3 are completed. No further
catalog-identifier action remains active.

## Verified current baseline

- `db/schema.js` is the authoritative schema and `db/seed.js` runs the canonical setup as one
  transaction: schema, seed, and administrator creation. `npm run db:reset` is the supported
  guarded entry point; it requires an explicitly safe local/development/test target.
- `exercises`, `exercise_variants`, `muscles`, `equipments`, and `movement_patterns` have numeric
  identity and canonical display fields but no key/slug/code-like stable identifier.
- `catalogManifest` has 78 bases and 129 global variants; its SQL generator currently joins
  relationships by display names. Static movement-pattern, muscle, equipment, and role seed rows
  also have names but no programmatic identifiers.
- Translation seed data is ordered after catalog creation and stores proper numeric foreign keys,
  but its Portuguese source maps and English generation identify catalog records through canonical
  names. The starter-workout manifest and seed SQL likewise locate global variants by name.
- Persistent media stores numeric `entity_id` values appropriately for database relationships.
  There is no seeded media manifest/assignment today. Media-management and candidate workflows
  server-resolve live catalog records by numeric IDs, so they are runtime/UI boundaries rather than
  external seed manifests to convert in this goal.
- `db/catalog.test.js` canonically applies `schemaSql` then `seedSql` before each integration case;
  it already checks catalog, translation, and media-table state. Its expected catalog data is
  name-oriented today.
- A legacy, opt-in migration runner exists for historical translations, but normal development
  setup does not invoke it. This goal must not add a migration or make that runner a prerequisite.

## Scope

- Add a constrained, unique `catalog_key` to global exercises, global exercise variants, muscles,
  equipment, and movement patterns.
- Define deterministic, lowercase kebab-case seed keys in the catalog/static source data; catalog
  keys are independent of translated and display names.
- Change catalog, translation, starter-workout, and future seed-facing lookup contracts that rely
  on display names to use stable keys, resolving numeric IDs only for relational inserts.
- Test clean schema-to-seed initialization, key completeness/uniqueness, ordering, and equivalent
  seeded relationships across repeatable clean setups.
- Record the identifier convention and the preserved schema-to-seed workflow.

## Explicitly out of scope

- Migrations, migration-runner redesign, production database mutation, or a data-preserving
  upgrade path.
- Changing numeric database foreign keys, media resolver precedence, user-created/private variant
  identity, application-visible catalog names, translations, or unrelated product behavior.
- Backfilling an already-running non-disposable database outside the authorized reset workflow.
- Commit, push, deployment, or production infrastructure changes.

## Decisions and constraints

- `catalog_key` is the proposed field name. It is the stable application/catalog identity and is
  distinct from database `id`/foreign keys.
- The key convention is lowercase ASCII kebab-case. Key changes mean catalog identity changes;
  display-name or translation edits must not alter a key.
- Global exercise variants receive keys. Private/user-owned variants remain outside this seeded
  global catalog contract and must not be assigned a falsely global identity.
- Schema changes must update `db/schema.js`, seed sources, and focused tests; no migration will be
  created. A safe local/development reset must be run when configured and authorized by the
  repository safeguards.

## Completion criteria

This goal is ready for final review only when:

1. The five supported global catalog entity types have populated, unique, appropriately constrained
   stable keys immediately after canonical seed setup.
2. Seed-facing catalog references use stable keys rather than generated IDs or translated/display
   names; relational writes still use resolved numeric IDs.
3. Translation and starter-workout seed ordering remains referentially safe, and any catalog media
   seed data (if introduced later) has a documented stable-key lookup boundary.
4. A clean, guarded development/test `schema → seed` initialization is verified, with repeatable
   equivalent catalog relationships and valid foreign keys.
5. No migration is added or required, no production data is changed, and current tracking records
   accurately describe the decision and verification.

## Final review summary

- **Criterion 1 — satisfied:** clean canonical setup populates complete, unique constrained keys
  for all five supported global catalog entity types.
- **Criterion 2 — satisfied:** catalog, translation, and starter-workout seed references use stable
  keys and resolve numeric IDs only for relational writes; display behavior remains compatible.
- **Criterion 3 — satisfied:** translation and starter-workout ordering remains safe. No catalog
  media seed manifest was introduced; the documented future boundary requires stable-key lookup.
- **Criterion 4 — satisfied:** two guarded development resets produced identical 349-row stable
  relationship snapshots, and the canonical test database passed its repeated clean-setup checks.
- **Criterion 5 — satisfied:** no migration or production mutation was performed, and tracking
  records document the implementation and verification.

Full `npm run verify` and the focused admin-media regression passed. Real provider-backed equipment
generation remains operationally unavailable until an authorized `OPENAI_API_KEY` is configured;
the application now returns a safe HTTP 503 in that environment, while deterministic provider
coverage verifies the successful pending-candidate lifecycle. Private-variant identity, generated
anatomy, runtime media resolver precedence, production upgrades, and deployment remain excluded.

## Completion

The goal was completed on 2026-09-13. Supported global catalog entities now have deterministic,
constrained `catalog_key` values; catalog, translation, and starter-workout seed references resolve
through those keys while relational writes retain numeric foreign keys; and repeatable guarded
`schema → seed` setup is verified and documented. No migration or production data change was made.

## Resume here

All planned actions and completion criteria are approved. No next goal has been selected.
