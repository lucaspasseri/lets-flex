# Canonical Media Audit

**Investigation date:** 2026-09-15  
**Status:** Ready for review  
**Evidence standard:** conclusions below are marked **Verified** when supported directly by the
current source, schema, seed, or automated tests. No production database, production R2 bucket, or
database reset was used.

## Executive conclusion

The current application has two different meanings of canonical media:

1. **Runtime canonical assignment:** an `entity_media` primary assignment with a non-null
   `canonical_path`, pointing to a `media_assets` row. Admin promotion changes this database state.
2. **Repository canonical seed state:** an entry in `data/canonical-media.json` plus a file under
   tracked `public/media/...`. The reset/seed path recreates only this repository-controlled set.

Admin “Make Canonical” does not update the repository manifest, commit a file, or make a runtime
upload reproducible after a fresh database reset. An R2-backed upload itself remains in R2, so a
reset can leave an orphaned object that the database no longer references.

## Short answers

**Q1 — Existing workouts:** Usually yes, on surfaces that render media. Workout/session steps do
not store a media asset ID, URL, or snapshot. Dashboard and Program Day load current
`entity_media` assignments and resolve each step during every page render. A starter workout will
therefore follow a new base-exercise image when its variant has no direct assignment. If the
variant has its own direct assignment, that variant image continues to win.

**Q2 — New workouts:** Yes, under the same precedence rules. Creating a session or workout copies
the exercise-variant relationship, not a media snapshot.

**Q3 — Variant difference:** Yes. A direct `exercise_variant` assignment wins over the parent
exercise assignment. A variant with no direct assignment inherits the base exercise assignment;
movement-pattern media is considered after both. A session step currently always stores an
`exercise_variant_id`; a base-only request is supported by the resolver but is not the persisted
session-step shape.

**Q4 — Per-session updates:** No. Changing canonical media updates the entity assignment only;
individual `session_steps`, `workout_sessions`, or workout step logs do not need to be updated.

**Q5 — Restart/deploy:** An R2-backed runtime upload and its database relationship survive a
normal restart or deploy, provided the same external database and R2 object remain available. A
local upload is filesystem state and is not deploy-durable on an ephemeral Render filesystem.

**Q6 — `db:reset`:** Repository-seeded canonical media is recreated. Runtime Admin-promoted media
is not recreated because the reset drops the database and seeds only the repository manifest.

**Q7 — `db:reset:sql`:** No `db:reset:sql` script exists in `package.json`. `db:seed:sql` only
prints seed SQL. `db:setup:sql` generates `db/setup.sql`; if that generated SQL is executed, it
has the same fresh-schema/fresh-manifest behavior as `db:reset` and does not restore runtime
promotions.

**Q8 — R2 orphan:** Yes. Database reset does not call the R2 delete operation. An R2 object can
remain physically present while its `media_assets` and `entity_media` rows are gone.

**Q9 — Repository manifest:** No. `promoteMediaToCanonical` deliberately never writes
`data/canonical-media.json`.

**Q10 — Truly durable fresh setup:** The bytes and metadata must be made repository-seedable:
add a stable-key manifest entry, add or otherwise provision the corresponding canonical bytes,
keep both localized alt texts and metadata valid, and ensure the R2 `assets/...` object exists if
production remote reads are enabled. Then a fresh schema plus canonical seed can reconstruct the
database relationship. The current Admin action does not perform those repository or R2-provisioning
steps automatically.

## What “Make Canonical” changes

### Upload first

`createAndAssignUploadedMedia` in `src/features/media/manageMedia.js`:

- writes the bytes through the configured public media storage;
- inserts one `media_assets` row with source `admin-upload`;
- replaces localized alt-text rows;
- upserts the entity’s single `primary` `entity_media` row with `canonical_path = NULL`.

Uploading therefore creates an assigned direct asset, but does not make it canonical.

### Promotion of an R2/object-backed asset

`promoteMediaToCanonical` in `src/features/media/promoteMediaToCanonical.js`:

- verifies the entity and its stable `catalog_key`;
- verifies the selected `media_assets` row and both localized descriptions;
- reads the existing `assets/...` object to compute a content digest;
- does not copy the object and does not create a second `media_assets` row;
- derives `/media/catalog/promoted/<entity-type>-<catalog-key>-<digest>.<extension>` as the
  compatibility path when the assignment has no prior path;
- upserts the one `entity_media` primary row, replacing its `media_asset_id` if needed and setting
  the non-null `canonical_path`.

The previous canonical asset remains in `media_assets`; its old assignment is replaced by the
unique `(entity_type, entity_id, role)` constraint. There is no delete of the previous asset.

### Promotion of a local-path asset

When the selected storage key is not an `assets/...` object key, promotion reads the source,
writes a deterministic file through `canonicalStorage` (normally
`public/media/catalog/promoted`), inserts a new `media_assets` row with source `curated`, and
upserts `entity_media` to that new asset and local path. The originally selected upload asset
remains stored and may become unassigned. If the database transaction fails, the newly copied
local file is compensated; the prior asset is not deleted.

The canonical designation is therefore the assignment’s non-null `canonical_path` plus its
primary relationship—not the `source` string and not a separate canonical table. The schema allows
only the `primary` role and only one primary row per entity. Many reusable `media_assets` can exist,
but an entity has one active primary assignment at a time.

## Resolution and workout propagation

The persisted relationship is associated with an entity (`exercise`, `exercise_variant`, `muscle`,
`equipment`, or `movement_pattern`), never with a session or workout row. `session_steps` stores
`exercise_variant_id`; `workout_sessions` refers to `sessions`; and workout step logs snapshot
labels and performance data but contain no media reference.

The render path is:

```text
session/workout step
  → exercise_variant_id + parent exercise_id from the query joins
  → loadMediaAssignments() during the HTTP render
  → createMediaResolver()
  → resolveStepMedia()
  → resolveEntityMediaFromAssignments()
  → shared media EJS component
  → current media_assets.storage_key URL
```

`resolveEntityMedia.js:getCandidates` orders persistent candidates as:

1. exact `exercise_variant`;
2. parent `exercise`;
3. `movement_pattern`.

If no persistent assignment exists, the static resolver continues with variant/base manifest
matching, movement pattern, environment, category, and finally the initial placeholder. This is a
separate fallback path from the database assignment path.

The controlled regression in
`src/features/media/canonicalMediaLifecycle.test.js` keeps the same step object and resolves A,
then resolves B from a replacement assignment collection. It verifies that no media snapshot is
stored on the step and that a direct variant assignment remains ahead of the changed base asset.
Existing `resolveEntityMedia.test.js`, `resolveStepMedia.test.js`, and
`promoteMediaToCanonical.test.js` cover the corresponding resolver precedence and promotion writes.

## Propagation matrix

| Surface                                 | Uses canonical resolver?           | Existing records update automatically? | Verified notes                                                                                                  |
| --------------------------------------- | ---------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Exercise Library                        | Yes                                | Yes                                    | Library controller loads visible assignments per request; exercise and variant details use the shared resolver. |
| Library session workspace               | Yes                                | Yes                                    | Session steps retain variant IDs and are resolved when the workspace is rendered.                               |
| Admin Manage Exercises                  | Yes                                | Yes                                    | `/admin/exercises` reuses Library presentation with the same assignment loader/resolver.                        |
| Admin Media Management preview          | Yes                                | Yes                                    | Preview reads the current assignment and inherited fallback through `getMediaManagementPage`.                   |
| Starter workout on Dashboard            | Yes                                | Yes                                    | Seeded steps reference variants; base changes propagate when no direct variant assignment overrides them.       |
| Dashboard/current workout               | Yes                                | Yes                                    | `dashboardController` loads assignments for current workout sessions on every render.                           |
| Program Day / training-day workout list | Yes                                | Yes                                    | `dayController` loads session and workout-session step candidates per render.                                   |
| Programs overview                       | No                                 | N/A                                    | Program hierarchy cards do not render exercise media and do not load the resolver.                              |
| User-created workout/session            | Yes on Dashboard, Day, and Library | Yes                                    | Creation copies variant relationships, not media references.                                                    |
| Workout history list/detail             | No                                 | N/A                                    | History renders immutable step/name/performance snapshots and has no media resolver or media include.           |

The “existing records update” column means the next server render resolves current entity media. It
does not mean rows in the workout/session tables are rewritten.

## Persistence matrix

| Asset type                | App restart                                      | Deploy                                                         | DB reset                                                          | Fresh DB                                      | R2 remains                                                               | Git/manifest backed                               |
| ------------------------- | ------------------------------------------------ | -------------------------------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| Seed canonical image      | Yes, with DB rows and referenced bytes available | Yes for tracked files; external R2 object is independent       | Yes, recreated by `mediaSeedSql`                                  | Yes, from schema + seed                       | Only if the `assets/...` object was provisioned; seed does not upload it | Yes: manifest + tracked `public/media/...`        |
| Admin-uploaded image      | Yes while its storage/DB remain                  | Yes when R2-backed; local upload is ephemeral on Render        | DB record/assignment removed; storage is not touched              | No                                            | Yes for R2 unless separately deleted                                     | No: uploads are ignored and not added to manifest |
| Admin-uploaded + promoted | Yes while external DB and R2 remain              | Yes when R2-backed; local canonical copy is not deploy-durable | Runtime rows removed; R2 object or local file may remain orphaned | No unless separately added to repository seed | Yes for R2                                                               | No: promotion does not modify the manifest        |

For repository-seeded media, “R2 remains” is conditional because `db/seed.js` and
`db/mediaSeedSql.js` insert metadata and relationships only; they do not upload the provider-neutral
objects. Production remote reads require `OBJECT_STORAGE_PROVIDER=r2` and derive URLs from the
stored `assets/...` key.

## Reset mechanisms

- `npm run db:reset` executes `db/schema.js` and the complete `db/seed.js` in one guarded
  transaction. The schema drops database media tables; the seed recreates only manifest-backed
  catalog media and the starter workout. It never deletes R2 or local upload files.
- `npm run db:seed:sql` prints the current seed fragment and performs no reset or database write.
- `npm run db:setup:sql` writes `db/setup.sql` from current schema and seed. Executing that SQL
  is equivalent to a fresh schema plus manifest seed; generating it alone changes the file, not a
  database.
- No `db:reset:sql` script is defined.
- `npm run db:migrate` is a separate explicit historical path. Migration `003_canonical_media_paths`
  adds the compatibility column and backfills paths for known manifest assets; it does not make
  later runtime promotions repository-backed.

## Compatibility path and diagnostic discrepancy

`entity_media.canonical_path` is a stable `/media/...` compatibility identity separate from the
provider-neutral `media_assets.storage_key`. Seed entries store their manifest path there. For an
R2-backed runtime promotion, the path is metadata; the resolver serves the existing `assets/...`
object through `mediaUrlResolver`, and no local Render file is written. For a local promotion, the
path names the copied local canonical file.

The current source contains no `canonical_path_missing` error and does not require an existing
compatibility path for object-backed promotion. Git history shows that behavior existed before
commit `302be5d` (“fix canonical promotion without manifest path”): the older implementation
rejected an object-backed asset without an existing manifest path. The current implementation
derives a stable path from the entity catalog key and digest instead. This is a historical
diagnostic discrepancy, not current behavior.

## Architectural classification

### Expected current architecture

- One entity-level primary assignment is intentionally shared by all dynamic consumer surfaces.
- Database reset is a disposable bootstrap operation, not a preservation mechanism for runtime
  content.
- History intentionally uses workout snapshots and currently does not render media.
- Runtime R2 objects are external durable storage, while the database relationship remains the
  source of discoverability and canonical designation.

### Verified limitations / follow-up candidates

- A runtime-promoted R2 object can become orphaned after database reset.
- A runtime promotion is not reproducible from a fresh database because it is absent from the
  source manifest.
- A fresh production setup requires R2 objects to be provisioned separately; the seed validates
  repository files but does not upload R2 bytes.
- The Admin label “durable catalog state” means durable database-plus-object state across restart/
  deploy, not repository-seed durability.

These are documented architectural boundaries for a future, explicitly approved implementation
goal. No redesign or production mutation was performed during this investigation.
