# Current Goal

## Goal: Make curated media fully reproducible through `schema → seed`

### Status

**Completed** on 2026-09-14. The canonical media source and seed reconstruction and the separate
conservative cleanup action are implemented, verified, and accepted as completed. The cleanup did
not reopen or redesign the media implementation.

### Objective

After:

```sh
npm run db:reset
npm run dev
```

the disposable development database must contain every approved, recoverable canonical catalog
media assignment needed by Library, Manage Exercises, Manage Media, and exercise/session surfaces.
Canonical media must be repository-controlled and deterministically recreated without migrations or
previous numeric database IDs.

### Verified baseline and recovery decision

- The supported persistent media entity types are `exercise`, `exercise_variant`, `muscle`,
  `equipment`, and `movement_pattern`. The schema permits only `primary` assignments and enforces
  unique `(entity_type, entity_id, role)` relationships; numeric entity IDs are polymorphic and
  therefore validated by seed preflight.
- Stable `catalog_key` values already exist for all five catalog types and are the seed lookup
  contract. Global exercise variants are filtered to `owner_user_id IS NULL`.
- The existing development database was already reset and now contains only the five previous
  seed assignments. It is not a trustworthy recovery source for the former runtime rows.
- The source-controlled provenance record documents 66 reviewed assigned raster assets and the
  matching 70-file ignored upload collection. Four files are excluded: one reviewed but unassigned
  reusable asset and three legacy assets with unknown/deferred provenance or unsuitable legacy
  assignments. Relationships are taken from the provenance record, not inferred from UUID names.

### Implemented architecture

- `canonicalMediaManifest` is the single source for 68 canonical assignments: the 66 recovered
  reviewed assignments plus the non-conflicting static `exercise_variant:barbell-bench-press` and
  `muscle:chest` assignments. The three overlapping original static entries now resolve to their
  reviewed catalog assets rather than creating conflicting primary assignments.
- Recovered raster files are source-controlled under `public/media/catalog/{exercises,
exercise-variants,equipment,movement-patterns}` with stable-key filenames. Runtime uploads remain
  ignored under `public/media/uploads`.
- The seed validates supported entity types, stable keys, local files, metadata, localized alt
  text, duplicate paths, duplicate primary assignments, and roles before generating SQL. SQL then
  resolves each key to the fresh numeric row, inserts `media_assets`, `entity_media`, and localized
  alt-text rows in the existing transaction, and fails clearly for missing catalog references.
- Environment and category artwork remains contextual resolver fallback media and is not seeded as
  `entity_media`. Runtime uploads, pending/rejected candidates, and incomplete provenance do not
  enter the canonical seed automatically.

### Verification evidence

- `npm run db:reset` succeeded twice against the confirmed disposable local development target.
  Both resets produced 68 assets, 68 assignments, 136 localized alt-text rows, zero missing files,
  and identical stable relationship SHA-256
  `b47d9c191b0ddafa596ca21b33aa3530be90ac5fe4709b4395d1d5743d16a216`.
- Full `npm run verify` passed: format, lint, server/browser type checks, and 410/410 tests.
- Focused HTTP integration passed 4/4 for seeded media in Library, Manage Exercises, Manage Media,
  and direct variant/equipment previews. Live `npm run dev` listened successfully; localhost guest
  bootstrap returned 302 and a seeded catalog PNG returned 200.
- No browser executable was available, so no browser visual verification is claimed. Rendered HTTP
  output and direct file/database checks cover the available acceptance path.

### Done when

- A fresh schema plus canonical seed recreates all manifest assets and assignments with no numeric ID
  dependency, and repeated clean setup produces the same stable relationship snapshot.
- Missing files, missing catalog keys, invalid metadata, and duplicate/conflicting assignments fail
  loudly and transactionally.
- Seeded media includes valid repository files and localized metadata and resolves through the
  existing resolver/view-model paths used by application and admin surfaces.
- `npm run db:reset` succeeds on the confirmed disposable local target and `npm run dev` starts
  without database/media errors.
- Library, Manage Exercises, and Manage Media are verified through the strongest available HTTP or
  rendered-output checks; unavailable browser checks are documented rather than claimed.
- Required checks pass, the final diff is reviewed, and no migration, production mutation, push, or
  deployment is introduced; the approved repository commit is the only version-control mutation.

### Explicit exclusions

Private/user-created catalog variants, runtime promotion workflows, contextual environment/category
entity modeling, uncertain legacy assets, production upgrades, deployment, and external provider
media generation remain outside this goal.

### Completion

Completed on 2026-09-14 after Action 1 (canonical media reconstruction) and Action 2 (conservative
leftover cleanup) were approved. The canonical `schema → seed → application ready` workflow is
deterministic, the obsolete database/media artifacts were removed conservatively, and all recorded
verification criteria passed. The user-authorized repository commit is the final version-control
step; no push or deployment is included.
