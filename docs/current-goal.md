# Current Goal

## Goal: Canonical Media Promotion

### Status

**Completed** on 2026-09-14 after explicit user approval. Actions 1, 2, and 3 are completed.

### Completion outcome

Canonical Media Promotion is complete. Authorized admins can explicitly promote eligible reviewed
media from Manage Media; promotion uses stable catalog identity, deterministic repository-controlled
canonical storage, transactional primary-assignment replacement, idempotency, and durable seed
reconstruction. Authorization, CSRF, validation, localized feedback, reset reproducibility, and
application startup verification are recorded in this document and `docs/current-actions.md`.

No next goal is established by this completion. The repository has documented browser-check
limitations and unrelated HTTP integration failures, but neither implies a required follow-up
priority without user direction.

### Objective

Allow an authorized admin to explicitly promote a reviewed media asset with **Make canonical** so
that it becomes the entity's authoritative primary image, replaces any previous canonical image
predictably, and is reconstructed after:

```text
npm run db:reset → schema → seed → canonical media reconstruction → npm run dev
```

Extend the existing Manage Media workflow and local storage boundary. Do not introduce object
storage, migrations, galleries, user-owned media, or unrelated media redesign.

### Verified current architecture

- `media_assets` stores reusable renderable records with storage key, MIME type, dimensions, source,
  and localized alt text. It has no canonical flag or approval state; existing rows are treated as
  approved renderable assets by the current application boundary.
- `entity_media` is the current runtime assignment table. It permits only `primary` assignments and
  enforces one `(entity_type, entity_id, role)` row, so `assignPrimaryMedia` already replaces an
  assignment transactionally and idempotently. Removing an assignment does not remove its asset.
- `media_generation_candidates` distinguishes pending/rejected/approved generated candidates.
  Approval creates a normal media asset and primary assignment, but does not create durable reset
  state.
- `canonicalMediaManifest` is the source consumed by `db/mediaSeedSql.js`; the seed resolves its
  stable `entityKey`/`catalog_key` values to fresh numeric IDs and reconstructs `media_assets`,
  `entity_media`, and localized alt-text rows.
- Stable `catalog_key` values are available for the five supported global entity types:
  `exercise`, `exercise_variant`, `muscle`, `equipment`, and `movement_pattern`. Global variants are
  restricted to `owner_user_id IS NULL`.
- Admin Manage Media currently supports upload-and-assign, assign-existing, remove-assignment,
  generated-candidate review, and approval. Its routes already use `requireAdmin`, CSRF-protected
  state-changing forms, Zod validation, transactional media services, and clear page feedback.
- The existing local media storage abstraction generates upload keys and removes failed writes, but
  does not yet expose the read/copy or existence operations needed to promote an existing asset into
  repository-controlled canonical media.
- Runtime uploads live under ignored `public/media/uploads`. Their database rows and assignments
  disappear on reset, and the files are not a reliable canonical source. The current source-
  controlled catalog files and manifest entries are the reliable reset boundary.

### Delta classification

- **Already satisfied / reuse:** supported entity validation, stable catalog identifiers, unique
  primary assignment constraint, transactional assignment replacement, local media storage, admin
  authorization, CSRF protection, localized alt text, resolver/fallback behavior, canonical seed
  SQL, and existing Manage Media UI structure.
- **Modify:** canonical manifest representation must support durable promoted entries without the
  web server blindly rewriting `mediaManifest.js`; local storage must support the small promotion
  file operations; the seed must consume the resulting canonical state without numeric IDs.
- **Add:** canonical promotion service, stable-key entity lookup for promotion, explicit route and
  validation, current/assigned/not-canonical UI state, replacement feedback, and focused tests.
- **Repair / safeguard:** verify missing source files and invalid asset/entity combinations fail
  without committing an assignment or deleting files still referenced elsewhere.

### Canonical representation decision

The proposed single durable canonical source is one repository-controlled canonical media data file
containing the complete stable-key manifest. The existing exported `canonicalMediaManifest` remains
the application/seed-facing derived value from that source; it is not a second promotion overlay.
Promotion will copy the selected local asset through the storage boundary to a deterministic
catalog key, update the canonical data atomically, and assign the resulting canonical asset in the
current transaction. Existing source-controlled files remain valid entries. The implementation
must make the write boundary explicit and refuse or clearly report environments where the durable
canonical data/file location is not writable; it must not silently rewrite production application
source.

The existing `mediaManifest` contextual fallback remains a resolver fallback, not an alternative
canonical assignment source. Runtime uploads remain reusable input assets and are not canonical
until explicitly promoted.

### Action 1 implementation

- The 68-entry canonical manifest now lives in the single repository-controlled
  `data/canonical-media.json` source. `canonicalMediaManifest` and the resolver derive from that
  data, while the seed continues to resolve stable keys to fresh IDs.
- `canonicalMediaManifestStore` provides fresh reads, serialized in-process updates, and atomic
  same-directory temporary-file replacement. It is the explicit maintenance boundary for durable
  canonical metadata and does not rewrite `mediaManifest.js`.
- `LocalMediaStorage` now exposes bounded `exists`/`read` operations and deterministic filenames in
  addition to its existing save/remove contract. Promotion copies bytes to a content-addressed
  `/media/catalog/promoted/...` key; prior files and reusable assets remain untouched.
- `promoteMediaToCanonical` validates the supported entity, stable catalog key, asset metadata,
  source file, MIME type, localized alt text, and deterministic destination. It writes the manifest,
  creates a curated canonical asset, replaces the target's unique primary assignment transactionally,
  and compensates the manifest/file when the database write fails. Re-promoting the current
  canonical asset is idempotent.
- The seed accepts the existing validated upload formats (`png`, `jpeg`, `webp`) in addition to the
  existing SVG contract, so a promoted local asset remains reconstructable after reset.

### Constraints

- Use the existing schema → seed lifecycle; do not add a migration for this development-phase
  workflow.
- Preserve the current five supported entity types, stable-key seed lookups, localized metadata,
  resolver inheritance/fallback behavior, uploads, assignment/removal, candidate review, and
  existing auth/CSRF protections.
- Keep one local storage implementation and expose only operations needed by promotion. Keep domain
  logic independent of `public/media/...` paths so a later R2/S3 implementation can replace local
  storage without redesigning promotion rules.
- Do not delete an old file or reusable database asset merely because it is no longer canonical.
- Do not implicitly promote on upload, assignment, or candidate approval; promotion must be an
  intentional admin action.
- Do not add remote providers, image transformations, galleries, user-owned media, or unrelated
  layout cleanup.
- Stop at **Ready for review** after implementation and verification. Do not mark this goal or its
  action complete without explicit user approval.

### Planned actions

1. Implement the durable canonical data representation, local storage operations, stable entity
   resolution, transactional/idempotent promotion service, and seed/reconstruction integration.
2. Extend Manage Media with explicit **Make canonical** controls and visible canonical,
   assigned-but-not-canonical, and unassigned states plus entity/image-specific success feedback.
3. Add focused unit, repository, HTTP, authorization, CSRF, replacement, idempotency, stable-key,
   file-integrity, and reset-reconstruction coverage; run the full verification matrix and record
   manual/browser limitations.

### Action 3 implementation and verification

- Added HTTP-boundary coverage for admin authorization, CSRF, invalid input, successful canonical
  promotion, entity/image-specific feedback, durable assignment replacement, and manifest persistence.
- `npm run verify` passed with 422/422 automated tests. The focused canonical HTTP test passed 1/1;
  the broader HTTP file also contains five unrelated pre-existing failures, which were documented
  in `docs/current-actions.md` and left unchanged.
- Two guarded development resets produced identical seeded counts and relationship hash, and the
  development server started successfully with `GET /` returning `302`.
- No browser executable or visual browser tool was available, so representative-width visual,
  keyboard, and assistive-technology checks remain explicitly unperformed.

### Final acceptance-criteria comparison

- **Admin promotion and safe rejection:** Satisfied by the protected route, validation/controller
  coverage, service tests, and focused HTTP assertions for non-admin, CSRF, invalid, and successful
  requests.
- **One predictable canonical primary with idempotent replacement:** Satisfied by the transactional
  promotion service and replacement/idempotency tests; prior reusable assets and unrelated
  assignments remain preserved.
- **Stable reconstruction identity:** Satisfied by stable catalog-key resolution, manifest tests,
  and seed reconstruction coverage without relying on transient numeric IDs.
- **Reset and startup reconstruction:** Satisfied by the canonical database tests, two identical
  guarded reset snapshots, and successful development startup. The focused HTTP test also verifies
  the durable manifest/assignment boundary.
- **Single canonical representation:** Satisfied; the implementation uses the repository-controlled
  canonical data source and existing seed path without a competing flag, manifest, or runtime source
  rewrite.
- **Existing media and application behavior:** The full automated suite passed 422/422. The broader
  HTTP file still has five unrelated pre-existing failures, documented in `docs/current-actions.md`;
  they were not changed or attributed to this goal.
- **Relevant automated and manual verification:** Relevant automated checks passed. Browser visual,
  keyboard, and assistive-technology checks were unavailable and remain explicitly unperformed.
- **Tracking documentation:** Satisfied; both current-goal and current-actions records contain the
  final decisions, evidence, limitations, and review status.

### Final review notes

The approved scope is complete. The remaining browser walkthrough is an environment limitation,
and the five unrelated HTTP failures are intentionally excluded from this goal. No production
database mutation, migration, remote storage, gallery, user-owned media, or unrelated redesign was
introduced.

### Acceptance criteria

- An admin can explicitly promote an eligible reviewed asset to canonical for each supported entity
  type; non-admins and malformed/unsupported/missing entities or assets are rejected safely.
- Exactly one canonical primary image exists per entity; replacement is predictable, idempotent, and
  preserves unrelated assignments and reusable prior assets.
- Promotion uses stable entity identity for durable state and does not depend on transient numeric
  IDs during reconstruction.
- The selected canonical image and relationship survive a clean `npm run db:reset` and normal app
  startup through the existing seed/reconstruction path.
- No competing canonical flag, manifest, seed system, or runtime source rewrite is introduced.
- Existing media upload, assignment, removal, approval, localized alt text, resolver/fallback,
  Library, Manage Exercises, Dashboard/workout, authorization, CSRF, and reset behavior remains
  intact.
- Relevant automated checks pass; the Manage Media workflow is manually verified where browser
  tooling is available, with unavailable visual checks explicitly documented.
- `docs/current-goal.md` and `docs/current-actions.md` reflect the final decisions, evidence,
  verification, and review status.

### Explicit exclusions

Cloudflare R2/S3 or another remote provider, CDN architecture, image transformations, automatic
generation changes, galleries, user-owned media, broad schema redesign, ordinary migrations,
production mutation/deployment, and automatic continuation into another goal.
