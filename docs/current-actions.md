# Current Actions

## Current goal

Make curated media fully reproducible through the disposable development lifecycle:

```text
schema → seed → application ready
```

## Goal status

**Completed** on 2026-09-14. The canonical media implementation and separate conservative cleanup
action are completed and verified.

## Action 1 — Recover and seed canonical catalog media

**Status:** Completed

**Completed:** 2026-09-14

**Purpose:** Reconstruct every approved canonical catalog-media assignment that can be safely
reproduced from repository-controlled source data, while preserving the runtime/admin boundary.

### Verified delta

- Existing compatible behavior: `catalog_key` is already present and constrained for all five
  supported catalog entity types; `entity_media` supports one `primary` row per entity; the guarded
  `schema.js → seed.js` transaction already exists.
- Missing behavior: only five entity assignments were seeded; the reviewed 66-assignment runtime
  collection was ignored and lost on reset; seed validation did not check files, metadata,
  duplicate assignments, or localized media metadata.
- Recovery boundary: the current development DB was already reset, so the provenance record and
  matching local files are the available trustworthy relationship evidence. UUID filenames are not
  used to identify entities. Four of 70 upload files remain excluded: one unassigned reusable file
  and three legacy/deferred files.

### Implementation

- Added `canonicalMediaManifest` with explicit entity type, stable key, deterministic path, role,
  MIME type, dimensions, source, English alt text, and Brazilian Portuguese alt text.
- Copied the 66 reviewed assigned raster assets to source-controlled catalog paths without deleting
  the ignored upload originals. Retained two non-conflicting existing static assignments and
  replaced three overlapping static resolver entries with their reviewed catalog assets.
- Added canonical manifest/file/metadata/duplicate validation and clear missing-key SQL preflight.
- Seeded `media_assets`, `entity_media`, and localized alt-text records through stable-key lookups;
  added unique storage-key protection in the authoritative schema.
- Updated catalog/media tests, application resolver expectations, setup/provenance documentation,
  and this tracking record.

### Verification evidence

- Media/schema/unit tests: 18/18 passed.
- Canonical local test database: 4/4 passed, including 68 assets, 68 assignments, localized
  metadata, key-based relationships, and repeated clean setup.
- Full `npm run verify` passed: format, lint, server/browser type checks, and 410/410 tests.
- Focused HTTP integration passed 4/4 for seeded media in Library, Manage Exercises, Manage Media,
  and direct variant/equipment previews.
- Guarded `npm run db:reset` succeeded twice on the confirmed local development target. Each reset
  produced 68 assets, 68 assignments, 136 localized alt-text rows, zero missing files, and the
  identical stable relationship SHA-256
  `b47d9c191b0ddafa596ca21b33aa3530be90ac5fe4709b4395d1d5743d16a216`.
- `npm run dev` listened successfully; live localhost checks returned 302 for guest bootstrap and
  200 for a seeded catalog media file. No browser executable was available, so browser visual
  verification is not claimed.

### Review notes

- The final diff still needs ordinary human review for the 66 binary catalog assets and the
  intentional replacement of three overlapping static resolver paths.
- The four excluded ignored upload files remain preserved and are not canonical seed data.

### Completion summary

The canonical media workflow was accepted as implemented and verified. No changes to the
implementation or its recovery boundary are included in this completion.

## Action 2 — Audit and conservatively remove obsolete media/database leftovers

**Status:** Completed

**Activated:** 2026-09-14

**Completed:** 2026-09-14

**Purpose:** Audit repository, database, and filesystem artifacts left by superseded
database/media approaches, then remove only artifacts proven unnecessary while preserving the
deterministic workflow:

```text
schema → seed → stable catalog identifiers → canonical media manifest → reconstructed media tables
→ npm run dev
```

**Scope:** Separate cleanup action; no architectural redesign and no new feature work.

### Proposed delta

1. Establish and record a fresh baseline with `npm run db:reset`, deterministic snapshot checks,
   canonical manifest/file counts, actual media table counts, and a successful `npm run dev`
   startup/application check.
2. Inventory migration infrastructure, migration state/tables, stale scripts, tests, docs,
   temporary diagnostics, deprecated manifests/seed mechanisms, duplicate media implementations,
   and schema/seed leftovers. Trace active consumers before classifying candidates.
3. Audit media rows and filesystem files against the current lifecycle. Classify unassigned rows
   and files as active, canonical, deferred, unknown, or orphaned using repository evidence;
   delete only confidently orphaned items and do not remove the four previously excluded files
   without new evidence.
4. If migration infrastructure is proven unused by reset, dev startup, tests, and production or
   deployment paths, remove it cohesively, including stale references and migration-only tests or
   documentation. Preserve anything classified as uncertain.
5. Re-run reset, determinism, startup, media integrity, and the required repository checks;
   inspect the final diff and record any intentionally retained or deferred artifacts.

### Baseline and inventory — 2026-09-14

#### Phase 1 baseline

- Verified the reset target without exposing credentials: `NODE_ENV=development`,
  `ALLOW_DATABASE_RESET=true`, and PostgreSQL `localhost:5432/lets_flex`. `npm run db:reset`
  succeeded in one transaction.
- The fresh database contains 68 `media_assets`, 68 `entity_media` assignments, and 136
  `media_asset_alt_texts` rows. All 68 assets are `curated`; there are zero unassigned assets,
  zero missing media references, zero missing localized-media references, zero invalid polymorphic
  entity references, and zero duplicate `(entity_type, entity_id, role)` groups.
- `canonicalMediaManifest` contains 68 entries. All 68 manifest files exist; 66 files are under
  `public/media/catalog`, and that directory contains exactly those 66 manifest paths.
- The stable media relationship snapshot has 68 rows and SHA-256
  `b47d9c191b0ddafa596ca21b33aa3530be90ac5fe4709b4395d1d5743d16a216`.
- After reset, `npm run dev` started and live HTTP checks returned `302` for `/` and `200` for
  `/media/catalog/equipment/barbell.png`. The first sandboxed watcher attempt failed with
  environment `EMFILE`; the host-permitted retry succeeded and was stopped cleanly.

#### Phase 2 inventory and classifications

- **Migration infrastructure — ACTIVE:** `package.json` exposes `db:migrate`; `db/migrate.js`,
  both ordered migration modules, and migration-target tests are referenced by the explicit
  existing-database path. README and database-setup documentation describe that path, while reset
  and normal startup do not invoke it. Retain it; removing it would break a documented consumer
  and its tests. No `schema_migrations` table exists after canonical reset.
- **Database leftovers — OBSOLETE:** the reset database contains an empty `exercises_muscles`
  table with legacy `role` columns. It is not created by `db/schema.js`, has no source-code
  consumers, and is not the active `exercise_muscles` table. Add its explicit drop to the
  authoritative schema so future resets remove the stale state.
- **Database structures — ACTIVE:** `media_assets`, `media_asset_alt_texts`, `entity_media`, and
  `media_generation_candidates` are current application tables. The candidate table is empty after
  reset but remains required by the admin generation/review lifecycle.
- **Canonical filesystem media — CANONICAL:** the 66 catalog files are source-controlled, present,
  and exactly match manifest paths. Root fallback SVGs are active except for the three obsolete
  files identified below. The two root SVGs still in the canonical manifest remain required.
- **Runtime/deferred media — DEFERRED or UNKNOWN, retained:** all 70 ignored
  `public/media/uploads` files remain outside canonical seed data. The 66 reviewed originals are
  documented runtime/deferred copies; the four excluded files remain the documented reusable or
  provenance-unknown/deferred records. The ignored `imagesSample` directory contains four local
  legacy samples, including three byte-identical copies of deferred JPEG uploads; with no tracked
  provenance or active consumer, it remains `UNKNOWN` rather than being deleted conservatively.
- **Obsolete tracked media — ORPHANED:** `public/media/equipment-barbell.svg`,
  `public/media/exercise-bench-press.svg`, and `public/media/movement-push.svg` have no
  production/runtime file consumers; their former static entries now resolve through canonical
  catalog paths. A synthetic `/media/movement-push.svg` value remains in a resolver unit fixture
  and does not load the deleted file. The three files are safe cleanup targets and recoverable from
  version control.
- **Scripts, manifests, documentation, and diagnostics — ACTIVE or RETAINED:** canonical seed/SQL
  printers, media manifest/seed modules, provenance and coverage records, media style guidance,
  and migration documentation all have current consumers or preserve intentional audit evidence.
  No other confidently obsolete tracked diagnostic or duplicate implementation was found.

### Constraints and acceptance criteria

- `npm run db:reset` followed by `npm run dev` remains deterministic and fully functional.
- No cleanup deletion occurs before the baseline and inventory are documented.
- No artifact is removed solely because of its name, UUID filename, or historical association.
- Migration removal is allowed only after proving no active consumer remains.
- Database cleanup follows the authoritative `db/schema.js` and `db/seed.js` lifecycle; no ordinary
  development migration is added.
- Any uncertain candidate remains in place and is documented for review.

### Implementation

- Added `DROP TABLE IF EXISTS exercises_muscles CASCADE` to `db/schema.js`, ensuring the canonical
  reset removes the empty legacy plural exercise-muscle table that was not otherwise recreated or
  consumed.
- Removed the three superseded tracked root SVGs whose static resolver entries were replaced by
  canonical catalog paths. The canonical two root manifest SVGs, fallback artwork, catalog files,
  ignored uploads, deferred samples, migration infrastructure, and active media tables remain.
- Added a focused schema regression assertion for the legacy table cleanup.

### Verification evidence

- Guarded `npm run db:reset` passed after the cleanup and passed again for repeated setup. Both
  post-cleanup resets produced 68 `media_assets`, 68 `entity_media` assignments, 136 localized
  media rows, zero stale `exercises_muscles` tables, and the unchanged stable relationship SHA-256
  `b47d9c191b0ddafa596ca21b33aa3530be90ac5fe4709b4395d1d5743d16a216`.
- All 68 canonical manifest files remain present; `public/media/catalog` still contains exactly
  its 66 manifest files. Final live `npm run dev` startup succeeded, with HTTP `302` for `/` and
  `200` for a seeded catalog PNG. The initial sandbox watcher attempt reported environment
  `EMFILE`; the host-permitted retry succeeded.
- Full `npm run verify` passed: format, lint, server/browser type checks, and 411/411 tests,
  including the new legacy-table regression. `git diff --check` passed.
- No migration files or migration references were removed because the explicit existing-database
  migration path and its tests/documentation remain active. No database migration or production
  mutation was introduced.

### Review notes

- The three deleted SVGs are recoverable from version control and have no production/runtime
  consumers. The synthetic resolver fixture path is intentionally not a file dependency.
- The ignored `public/media/uploads` collection and ignored `imagesSample` directory remain
  retained/deferred; no uncertain or provenance-unknown media was deleted.

### Completion summary

Action 2 was approved after the documented baseline, evidence-based inventory, conservative
cleanup, repeated reset verification, live startup smoke check, full repository verification, and
final diff review. The cleanup preserved the canonical media invariant and removed no uncertain
artifacts. No next action is prepared or activated.

## Resume here

Actions 1 and 2 are completed. The goal is ready for final review; no next action is prepared or
activated.
