# Catalog Identifiers

Global catalog records use `catalog_key` as their stable application identity. Database `id` values
remain relational implementation details and must not be embedded in seed manifests, translation
maps, or media manifests.

## Key contract

- Keys are explicit source values, not generated at runtime from names or translations.
- Keys use lowercase ASCII kebab-case, for example `barbell-bench-press`.
- A key remains unchanged when a canonical display name or localized translation changes. Changing a
  key represents a catalog-identity change.
- Exercises and exercise variants may have a null key only when created outside the seeded global
  catalog. Every globally seeded exercise and variant has a populated, unique key.
- Movement patterns, muscles, and equipment are seeded global catalog records and require a
  non-null, unique key.

| Entity                   | Persistent field                | Seed source                         |
| ------------------------ | ------------------------------- | ----------------------------------- |
| Exercises                | `exercises.catalog_key`         | `catalogManifest`                   |
| Global exercise variants | `exercise_variants.catalog_key` | `catalogManifest`                   |
| Muscles                  | `muscles.catalog_key`           | catalog vocabulary and `db/seed.js` |
| Equipment                | `equipments.catalog_key`        | catalog vocabulary and `db/seed.js` |
| Movement patterns        | `movement_patterns.catalog_key` | catalog vocabulary and `db/seed.js` |

## Seed lookup rule

Catalog-dependent source data contains a stable key. Seed SQL resolves that key to a database ID
only at the final relational insert.

```text
translation/media/starter manifest key
        ↓
catalog table.catalog_key
        ↓
database id
        ↓
foreign-key row
```

The canonical seed order is:

```text
static catalog vocabulary
  → exercises and variants
  → exercise-muscle relationships
  → translations
  → starter workout
```

The catalog and relationship seed generator uses keys for exercise, movement-pattern, equipment,
and muscle joins. Portuguese translation maps and the starter-workout manifest use keys directly.
English translations are derived from the already-created canonical rows, so they do not contain a
separate source lookup manifest. The canonical curated media manifest currently contains 70
entity-specific assets and assignments across all five supported media entity types. It uses the
same `entityType + catalogKey → entity id` boundary; environment and category artwork remains
static fallback media because those concepts are not `entity_media` entities. Runtime/admin uploads
remain outside this seed manifest unless they are deliberately promoted into canonical media.

## Development setup

`db/schema.js` and `db/seed.js` remain the authoritative development setup path:

```text
schema → seed → application ready
```

No migration is required or created for this catalog-key workflow. A reset is permitted only through
the repository's existing guarded local/development/test database checks. The reset recreates and
seeds catalog media assignments in the same transaction, so a clean rebuild does not depend on
previous numeric IDs or existing database state.
