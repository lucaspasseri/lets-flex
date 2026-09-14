# Current Actions

## Current goal

Canonical Media Promotion: an explicit admin promotion workflow whose canonical image remains
reconstructable through:

```text
schema → seed → canonical media reconstruction → application ready
```

## Goal status

**Completed** on 2026-09-14 after explicit user approval. Actions 1, 2, and 3 are completed. The
prior canonical reconstruction and cleanup goal was completed and is historical evidence; this
goal reopened only the runtime-to-durable promotion gap explicitly requested by the user.

## Verified investigation baseline — 2026-09-14

- Current runtime assignment is `entity_media.role = 'primary'`, with a unique
  `(entity_type, entity_id, role)` constraint. Existing `assignPrimaryMedia` is the reusable
  replacement/idempotency primitive.
- Current reset reconstruction is driven by `canonicalMediaManifest` through `db/mediaSeedSql.js`.
  It uses stable catalog keys and fresh IDs, and currently contains 68 repository-controlled
  assignments.
- Admin uploads and approved generated assets are stored as reusable `media_assets` rows and local
  `public/media/uploads` files. Upload, assign-existing, remove, and candidate approval only affect
  the runtime database assignment; no action updates the canonical manifest or reset source.
- The admin route is already protected by `requireAdmin` and the global CSRF middleware. Existing
  request schemas validate supported entity types, positive IDs, candidate IDs, and localized alt
  text. Existing service transactions preserve old assets when replacing assignments.
- Stable `catalog_key` values exist for all five supported media entity types. Existing management
  option/entity queries still use numeric IDs for the current request, so promotion needs a
  server-side numeric-ID-to-stable-key lookup before writing durable canonical state.
- The local storage abstraction currently supports generated save/remove only. Promotion needs a
  narrow read/copy/existence boundary and deterministic canonical storage keys without exposing
  filesystem paths to domain code.

## Action 1 — Implement durable canonical promotion

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval.

**Ready for review:** 2026-09-14

**Completed:** 2026-09-14 after explicit user approval.

**Purpose:** Extend the existing canonical manifest/seed boundary and local media storage so an
explicit promotion can durably copy an eligible asset, replace the entity's canonical assignment,
and reconstruct the same image after a clean reset.

### Proposed delta

1. Define the single project-controlled canonical data representation and its atomic update boundary
   based on the verified `canonicalMediaManifest`/seed architecture. Preserve existing entries and
   stable keys; do not introduce a second overlay manifest or runtime rewrite of `mediaManifest.js`.
2. Add only the local storage operations required to verify/read the selected asset and write its
   deterministic canonical copy. Keep storage keys behind the application-owned storage boundary.
3. Add stable catalog-key resolution and eligibility checks for entity, asset, source file, metadata,
   and supported type. Preserve old files/assets and fail transactionally if any required step fails.
4. Implement an idempotent promotion use case that atomically updates durable canonical state and
   the runtime primary assignment, replacing only the selected entity's prior canonical assignment.
5. Integrate seed validation/reconstruction and preserve current resolver behavior for all existing
   canonical and fallback media.

### Review evidence required

- Unit/service tests prove validation, stable-key resolution, replacement, idempotency, unrelated
  assignment preservation, file-missing failure, and storage/database rollback behavior.
- A local reset proves the promoted stable relationship and file are recreated from durable state.

### Implementation completed

- Moved the complete 68-entry canonical data source to `data/canonical-media.json`; the existing
  `canonicalMediaManifest` export and resolver remain compatible derived consumers.
- Added `canonicalMediaManifestStore` with current-state reads, serialized updates, and atomic
  same-directory replacement. The web process has an explicit data boundary rather than rewriting
  `mediaManifest.js`.
- Extended the one local storage implementation with bounded `exists`/`read` operations and an
  optional deterministic filename. Promotion uses a content-addressed stable catalog path, leaving
  source uploads and prior canonical files reusable.
- Added `findMediaEntityCatalogRecord` to resolve supported global entities to `catalog_key`, while
  excluding private/unkeyed entities from durable canonicalization.
- Added `promoteMediaToCanonical`, including supported-type/entity/asset/file/MIME/alt-text checks,
  manifest replacement, curated canonical asset creation, unique primary assignment replacement,
  idempotent re-promotion, and manifest/file compensation on database failure.
- Extended canonical seed MIME validation to include the existing PNG/JPEG/WebP upload formats.

### Verification evidence

- Focused media, seed, resolver, storage, manifest-store, repository, and promotion tests passed
  36/36.
- `npm run format:check`, `npm run lint`, and `npm run check:types` passed.
- Full host-permitted `npm test` passed 419/419. The initial sandbox attempt reached 414 passing
  tests but its PostgreSQL suite was blocked by sandbox `EPERM`; the host-permitted retry passed.
- Guarded host-permitted `npm run db:reset` succeeded. Post-reset counts were 68 `media_assets`,
  68 `entity_media` assignments, and 136 localized media rows.
- `git diff --check` passed. No migration, production mutation, remote storage, admin route, or UI
  action was added in this action.

### Review notes

- The promotion service is implemented but not yet reachable from Manage Media; that belongs to
  Action 2 and has not been started.
- A real promotion will create a deterministic file under `public/media/catalog/promoted` and update
  `data/canonical-media.json`; those durable project-state changes must be reviewed and committed
  together before relying on reset reconstruction in a shared/deployed checkout.

## Action 2 — Add explicit Manage Media promotion UX

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval.

**Ready for review:** 2026-09-14

**Completed:** 2026-09-14 after explicit user approval.

**Purpose:** Extend the selected-entity editor rather than creating a parallel admin surface.

### Proposed delta

- Show whether the selected asset is canonical, assigned but not canonical, or unassigned.
- Add an intentional **Make canonical** form only when the selected/reviewed asset is eligible and
  not already canonical. Re-promoting the current canonical asset shows its state instead.
- Preserve existing upload/assign/remove/candidate-review semantics; uploading or assigning alone
  must not promote an asset.
- Use existing shared controls, labels, focus states, CSRF fields, authorization, validation errors,
  and page feedback. Success must identify the affected entity/image and say it is now canonical.
- Verify responsive hierarchy and keyboard/accessibility states at representative widths where a
  browser is available.

### Implementation completed

- Added the protected `POST /admin/media/canonical` route with the existing admin and CSRF
  middleware, a positive-ID/supported-entity request schema, and application-local promotion
  dependency injection.
- Extended the selected Manage Media view model with the current canonical manifest entry, direct
  assignment state, canonical eligibility, and reusable-asset labels for `Canonical`, `Assigned ·
not canonical`, and `Unassigned`.
- Added a separate, intentional **Make canonical** form for eligible non-canonical direct assets.
  Canonical assets show their durable state; incomplete metadata or unsupported types do not expose
  the promotion action; upload, assign, remove, and candidate-review forms remain separate.
- Added entity/image-specific canonical success feedback, canonical failure rendering, responsive
  state-panel styling, focus-compatible shared controls, and English/Brazilian Portuguese locale
  resources.

### Verification evidence

- Focused schema, controller-feedback, translation-resource, and Manage Media rendering tests passed
  20/20, including eligible promotion, canonical-state replacement, unassigned/assigned labels,
  and CSRF-bearing form rendering.
- `npm run format:check`, `npm run lint`, `npm run check:types`, and `git diff --check` passed.
- Full host-permitted `npm test` passed 422/422. The initial sandbox test run could not connect to
  local PostgreSQL because of sandbox `EPERM`; the host-permitted run completed successfully.
- No browser executable or visual browser tool was used in this action, so manual representative-
  width and keyboard walkthroughs are not claimed. The rendered template and existing responsive
  CSS contract tests passed.

### Completion summary

Action 2 is accepted as implemented and verified. The protected Manage Media workflow now exposes
an explicit, localized, accessible canonical-promotion action while preserving all existing media
management operations. Action 3 is now the active separately gated verification work.

## Action 3 — Verify end to end and prepare review

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval.

**Ready for review:** 2026-09-14

**Completed:** 2026-09-14 after explicit user approval.

**Purpose:** Prove the requested behavior without reopening completed media reconstruction work.

### Proposed delta

- Add focused repository, service, validation, controller, template, and HTTP coverage for admin
  authorization, CSRF, invalid inputs, replacement, duplicate prevention, idempotency, stable keys,
  and unrelated assignments.
- Run `npm test`, `npm run verify`, guarded `npm run db:reset`, repeated reset/determinism checks, and
  `npm run dev` startup/application checks on the confirmed disposable local target.
- Exercise the Manage Media workflow manually if browser tooling is available; otherwise document
  the exact unperformed visual/keyboard checks and do not claim them.
- Inspect the final diff for unintended source/data/file mutations, update both tracking documents,
  set the active action to **Ready for review**, and stop for explicit approval.

### Implementation completed

- Added focused HTTP coverage for the canonical route, including admin authorization, CSRF rejection,
  invalid input feedback, successful promotion, entity/image-specific success feedback, durable
  primary-assignment replacement, and manifest persistence at the HTTP boundary.
- Added an injected manifest-store read boundary for the Manage Media page so the HTTP test verifies
  the same durable canonical state used by the promotion controller instead of relying on a process
  global.

### Verification evidence

- `npm run verify` passed: formatting, lint, browser type checks, application type checks, and the
  full automated suite passed 422/422.
- The focused canonical HTTP test passed 1/1. The broader `test/http/applicationPages.test.js` run
  also passed the canonical test, while five unrelated pre-existing scenarios failed (Google profile
  validation/OAuth callbacks, exercise progress aggregation, workout history snapshots, owned
  workout analytics, and planned cancellation/empty started session); none were changed by this
  action.
- Two guarded `npm run db:reset` runs against the configured disposable development database both
  succeeded. Both read-only snapshots reported 68 media assets, 68 entity-media assignments, 78
  exercises, 28 equipment records, and relationship hash
  `958f0ee91a82a3135892377a586543bb2220d210280cf79c56fe990825aaccd4`.
- `npm run dev` started on `http://localhost:3000`; a local `GET /` returned `302`, and the server
  was stopped cleanly. `git diff --check` passed.
- No browser executable or visual browser tool was available. Representative-width visual review,
  keyboard walkthrough, and assistive-technology checks remain unperformed and are not claimed.

### Completion summary

Action 3 is accepted as implemented and verified. The canonical promotion workflow has focused
HTTP-boundary coverage and the complete repository verification evidence is recorded above. The
five unrelated broader HTTP integration failures and unavailable browser walkthrough remain
explicitly documented and were not silently folded into this goal.

## Resume here

The Canonical Media Promotion goal is **Completed**. No follow-up goal is active; reassess the
repository and user priorities before proposing another goal.
