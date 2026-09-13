# Current Goal

## Parent milestone

Let’s Flex should help users recognize and navigate training content quickly while preserving
stable training relationships, ownership boundaries, and the focused strength-training workflow.

## Current goal

### Phase 2 — Build Admin Media Management

Expose the existing media foundation through a secure, small admin workflow so authorized
administrators can review, create, assign, replace, and remove media for supported catalog entities.

## Status

Phase 2 is **Completed** on 2026-09-12.

Manual UX review identified and the completed Action 5 corrections resolved focused refinements in
the Admin Media Manager: the previous mixed entity select did not scale for fast catalog discovery,
and success feedback was styled as an error. The goal is complete with the documented automated
verification and limitations.

## Problem being solved

Phase 1 added reusable media assets, explicit primary assignments, deterministic inheritance, and a
shared presentation contract, but no product workflow can manage those records. Administrators
currently cannot tell whether an entity’s visible media is direct, inherited, or fallback, and they
cannot safely upload or change an assignment through the application.

## Intended outcome

Administrators can manage supported catalog media from the existing admin area. Uploads become
validated reusable assets through an application-owned storage boundary; assignments use the Phase
1 repository and resolver; replacement preserves reusable assets; removal restores inheritance or
fallback; localized accessibility metadata follows the existing English/Portuguese architecture;
and normal user-facing layouts and authorization boundaries remain unchanged.

## Scope

- Audit and reuse the Phase 1 media schema, repository, resolver, shared component, supported entity
  contract, and fallback behavior.
- Add admin-only server operations for safe raster-image upload, existing-asset selection,
  assignment/replacement, assignment removal, and localized alt metadata.
- Integrate management into the existing admin/catalog navigation with entity selection and a clear
  direct/effective/fallback status and representative preview.
- Validate entity existence, supported roles and MIME/content/size constraints server-side; preserve
  CSRF protection and `requireAdmin` for every mutation.
- Verify normal surfaces resolve admin changes for exercises, exercise variants, equipment, muscles,
  and movement patterns without page-local media lookup rules.

## Explicitly out of scope

- AI generation, recommendations, moderation, automatic population, bulk management, galleries,
  multiple angles, video, animation, cropping/editing, CDN transformations, or user media.
- Artificial environment entities; `exercise_variants.environment` remains a string fallback
  context.
- Permanent physical asset deletion in this phase unless safe reference checks are demonstrably
  simple and necessary; removing an assignment must not delete a reusable asset.
- External cloud-storage provisioning or a new production dependency without explicit approval.
- Redesigning unrelated admin or user-facing pages, changing normal media dimensions, or changing
  catalog ownership/permission behavior.

## Verified current baseline and delta

- **Reuse:** Phase 1 `media_assets` / `entity_media`, `mediaRepository.js`, ID-backed resolver,
  shared `media.ejs`, bounded media CSS, supported catalog IDs, and deterministic fallback order.
- **Reuse:** existing `requireAdmin`, session CSRF middleware, admin Library and translation routes,
  EJS/page-shell structure, shared form/button/modal components, and i18next locale contract.
- **Add:** admin media routes/controllers/view models, upload/storage boundary, operation validation,
  localized media metadata persistence, and focused authorization/upload/assignment tests.
- **Modify:** media asset schema/repository only where localized metadata or upload provenance needs
  it; existing admin navigation and catalog entry points to expose the workflow; integration tests
  to prove resolver behavior after mutations.
- **Preserve:** direct assignment precedence, variant-to-exercise inheritance, movement/context/
  initial fallback, entity ownership boundaries, compact layouts, and disposable schema-plus-seed
  lifecycle. No current environment entity is invented.

## Confirmed decisions and limitations

- Accept PNG, JPEG, and WebP raster images only unless repository evidence establishes a safe SVG
  sanitization path; do not trust client filenames, MIME types, or storage paths alone.
- Use generated storage keys and a small local application-owned storage adapter compatible with the
  existing stable storage-key contract. Normal pages continue to consume resolver metadata, not
  upload paths.
- Prefer reusable existing assets when practical. Replacement changes only the assignment; asset
  deletion is a separate concern and is deferred by default.
- Store one shared asset with localized English and Portuguese alt text rather than duplicating
  locale-specific files. Missing localized text follows an explicit locale-to-English/default-alt
  fallback.
- Keep the development database lifecycle authoritative in `db/schema.js` and `db/seed.js`; do not
  add a migration or reset production data.
- No live browser executable was available during the Phase 1 audit; Phase 2 UI verification must
  record that limitation if it remains.

## Completion criteria

Phase 2 is ready for final review only when:

1. This goal and its action tracker describe the real implementation and review status.
2. Admin-only GET and mutation routes manage supported entity assignments through Phase 1 services.
3. Valid raster uploads create reusable assets with generated safe keys and validated dimensions;
   invalid type, size, filename/path, and malformed-content cases fail safely server-side.
4. Existing assets can be selected where supported; replacement leaves prior reusable references
   intact; removal leaves no broken image state.
5. Direct, inherited, and fallback media are visibly distinguished in the admin UI with a preview.
6. English/Portuguese localized alt metadata persists and follows deterministic fallback behavior.
7. Guests and non-admin authenticated users cannot access management pages or mutations, including
   direct HTTP requests; CSRF rejection remains effective.
8. Admin changes resolve correctly on representative normal surfaces, including variant inheritance
   after removal, with stable bounded layouts.
9. Focused unit, repository, view, browser, and HTTP tests cover authorization, validation,
   assignment/replacement/removal, reuse, localization, integrity, and resolver integration.
10. Applicable format, lint, type, browser-type, database, HTTP, and full checks are recorded with
    limitations; no AI or unrelated scope has leaked in.

## Historical context

Phase 1 media foundation and Phase 5 translation maintenance/admin tooling were completed and
approved on 2026-09-12. Their stable catalog IDs, localization joins, ownership boundaries, CSRF
and authorization safeguards, media resolver, shared UI conventions, and documented verification
limitations are preserved as implementation context rather than reopened wholesale.

## Resume here

Action 1 — Verify foundation and design the admin workflow is **Completed**. Action 2 — Admin media
domain operations — is **Completed**. Action 3 — Admin management UI — is **Completed**.
Action 4 — End-to-end resolver integration — is **Completed**. Action 5 — Verification and cleanup
— is **Completed** after the entity-selection and feedback corrections.

**Completion (2026-09-12):** The user approved the Phase 2 goal after all ten completion criteria
were compared against the implementation and verification evidence. Admin media management is
complete, including secure raster upload, reusable assignment/replacement/removal, localized alt
metadata, resolver integration, scalable entity selection, and explicit success/error feedback.
Known limitations remain documented: live browser verification was unavailable, and five unrelated
existing HTTP assertions continue to fail.
