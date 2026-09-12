# Current Goal

## Parent milestone

Let’s Flex should help users recognize and navigate training content quickly while preserving
stable training relationships, ownership boundaries, and the focused strength-training workflow.

## Current goal

### Phase 1 — Build the Media Foundation

Create a clean, predictable, and extensible media foundation so catalog entities can use managed
visual assets without hard-coded image paths or page-specific fallback rules.

## Status

Phase 1 is **Completed** on 2026-09-12. Actions 1–4 are **Completed**.

## Problem being solved

The current implementation has useful curated local assets and a shared initial-letter component,
but media assignments are inferred from normalized names in a static manifest. That prevents
explicit replacement/removal and makes persistent entity ownership of media impossible. The
presentation boundary is shared, while the source of truth is not yet entity data.

## Intended outcome

Catalog entities can resolve optional media through one deterministic, presentation-ready contract.
Assets are reusable database records, assignments are explicit, exercise variants inherit base
exercise media when appropriate, and all missing-media cases remain safe, stable initial fallbacks.
The foundation remains ready for later curation, uploads, localization, or administration without
coupling those workflows to templates.

## Scope

- Audit the current manifest, resolver, shared component, local assets, fallbacks, consuming
  surfaces, duplicated lookup boundaries, and tests.
- Add an additive reusable `media_assets` / `entity_media` persistence model with explicit primary
  assignments and referential integrity for media assets.
- Support exercises, exercise variants, muscles, equipment, and movement patterns as assignable
  entity types. Keep the resolver boundary open for environments without treating the current
  `exercise_variants.environment` string as a relational entity.
- Resolve direct media, variant-to-exercise inheritance, appropriate catalog fallback, and the
  intentional initial-letter fallback deterministically.
- Keep storage access behind an application-owned boundary using storage keys/paths rather than
  embedding provider logic in pages.
- Preserve and reuse the shared media component, add only demonstrated bounded presentation
  variants, and integrate representative Library, Dashboard, Program Day, and workout surfaces.
- Define the accessibility contract for meaningful and decorative media and add focused persistence,
  resolver, rendering, and bounded-layout regression tests.

## Explicitly out of scope

- AI image generation, prompt generation, moderation, or automatic catalog population.
- Admin upload or assignment interfaces, drag-and-drop, bulk media management, or galleries.
- Multiple exercise angles, videos, animation, user workout photos, CDN/image transformation
  infrastructure, or external cloud storage provisioning.
- Replacing every existing initial fallback or redesigning pages around images.
- Artificial environment entities, unrelated catalog redesign, or destructive database resets.

## Verified current baseline

- `src/features/media/mediaManifest.js` contains 12 local SVG assets plus an initial placeholder;
  `resolveMedia.js` matches exercise variants, base exercises, muscles, equipment, movement
  patterns, environments, and categories by normalized names.
- Existing exercise resolution is deterministic: variant asset → base exercise asset → movement
  pattern → environment → category → initial fallback. Localized labels can provide canonical
  matching keys.
- `views/partials/shared/components/media.ejs` is the shared rendering boundary. It supports image
  and initial presentations with informative/decorative semantics, while `mediaFallback.css` bounds
  icon, thumbnail, and exercise frames.
- Media is currently consumed by Library exercise summaries/details/variants, Dashboard and Program
  Day session views, and workout-session headers/current steps/step lists. History and standalone
  catalog pages do not currently render this component.
- The database has persistent exercises, exercise variants, muscles, equipment, and movement
  patterns. `exercise_variants.environment` is a validated string; no persistent environment table
  exists. No media tables or media repositories exist.
- The canonical development/test lifecycle is `schemaSql` followed by `seedSql` when the explicit
  reset safety boundary allows it. Media tables belong to that disposable reset path; this phase
  does not add a media migration or mutate an existing database.

## Confirmed decisions and limitations

- Preserve the current initial-letter fallback and local assets while moving exact entity
  assignments behind persistent records. Existing useful behavior is reused, not discarded.
- Use polymorphic entity assignments with a constrained entity-type contract because the supported
  catalog tables have different foreign-key targets; application validation will verify the target
  entity while media-asset foreign keys remain database-enforced.
- Store stable storage keys and presentation metadata at the media boundary. Locale-specific alt
  text remains a future metadata extension unless the current implementation requires a minimal
  default field now.
- Keep category/environment artwork as fallback context only where the repository has no persistent
  entity model; do not create artificial relationships to satisfy this phase.

## Completion criteria

Phase 1 is ready for final review only when:

1. This goal and the action tracker accurately describe the final implementation and status.
2. A reusable persistent media model supports explicit reusable assignments without image columns on
   catalog tables.
3. The supported entity types can be assigned media and entities without media remain valid.
4. One deterministic resolver returns a presentation-ready contract, including variant inheritance,
   safe missing-media behavior, and intentional fallback metadata.
5. The initial-letter fallback remains stable, compact, network-independent, and accessible.
6. Shared presentation variants have bounded dimensions and do not depend on source proportions.
7. Representative current surfaces use the centralized path without page-local lookup rules.
8. Focused data-layer, resolver, rendering, accessibility, and layout-regression tests pass.
9. Applicable formatting, lint, type, browser-type, database, HTTP, and full checks pass.
10. No AI-generation, admin-management, gallery, bulk-population, or other Phase 2+ scope leaks
    into the implementation.

## Final review matrix

Recorded 2026-09-12 after Action 4 approval:

- **Met:** The goal and action tracker describe the final implementation and statuses.
- **Met:** Persistent reusable media assets and explicit assignments are implemented.
- **Met:** Supported entities can be assigned media and unassigned entities remain valid.
- **Met:** Deterministic resolution, variant inheritance, safe fallbacks, and fallback metadata
  are covered by focused tests and the clean-database check.
- **Met:** Initial fallback behavior remains stable, compact, network-independent, and accessible.
- **Met:** Shared presentation variants are bounded and representative surfaces use the centralized
  resolver path.
- **Met:** Focused data-layer, resolver, rendering, accessibility, and layout-regression tests pass.
- **Partially met:** Formatting, lint, types, browser types, database, and full repository checks
  pass. The complete HTTP suite is 59/64, with five unrelated authentication/progress/history
  lifecycle failures documented in Action 4; focused representative HTTP checks are 3/3.
- **Skipped:** Live browser viewport capture was unavailable because no browser executable exists
  in the environment; repository rendering and responsive regression checks pass.
- **Met:** No migration, bulk population, admin management, gallery, or other Phase 2+ scope leak
  was introduced.

## Goal completion

Completed on 2026-09-12 after final review approval. The approved media foundation includes the
canonical disposable schema/reset/seed path, reusable media assets and explicit assignments,
deterministic entity resolution with safe fallback behavior, centralized representative-surface
presentation, and the recorded verification evidence. The five unrelated HTTP failures and the
unavailable live-browser capture remain documented limitations; no additional scope was introduced.
No next goal is implied by this completion.

## Historical context

Phase 5 translation maintenance and admin tooling was completed and approved on 2026-09-12 before
this goal was opened. Its stable catalog IDs, localization joins, ownership boundaries, migration
safeguards, and shared UI conventions are preserved as implementation context rather than reopened.

## Resume here

Action 1 — Audit and architecture is **Completed**. Action 2 — persistence and deterministic
resolver is **Completed**. Action 3 — shared presentation layer — is **Completed**. Action 4 is
**Completed**. Phase 1 is **Completed**; no next action is active.
