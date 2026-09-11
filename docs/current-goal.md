# Current Goal

## Parent milestone

Let’s Flex should help users recognize and navigate training content quickly while preserving
its focused strength-training workflow and supporting the broader exercise catalog.

## Current goal

Add a reusable curated visual-media system across Let’s Flex so exercises and related training
concepts can be recognized through meaningful imagery instead of text alone, with reliable
inheritance and intentional fallbacks.

## Status

Action 1 was completed on 2026-09-11 after explicit user approval. Action 2's selected-session
exercise-item media placement correction was approved and completed on 2026-09-11. Action 3's
focused workout visuals were approved and completed on 2026-09-11. Action 4's final accessibility,
responsiveness, and performance verification was approved and completed on 2026-09-11. The current
goal was approved and completed on 2026-09-11. Live browser inspection remains unavailable in
this workspace and is recorded as a verification limitation.
The previous starter-workspace goal was completed and approved.

## Verified delta-first baseline

### Already satisfied

- The exercise catalog manifest is centralized under `src/features/exerciseCatalog/` and already
  describes base exercises, variants, movement patterns, prime muscles, equipment, and
  environments. The catalog currently includes both strength and broader movement entries.
- Library data is loaded through `src/features/library/getLibraryPageData.js`, mapped into
  Library view models, and rendered through the existing session workspace and exercise-template
  partials. Search, filtering, accordion behavior, ownership boundaries, and nullable equipment
  and environment values already have implementation and test coverage.
- Dashboard current-workout data is assembled by the Dashboard view-model layer and rendered
  through the existing workout-session component. Program Day data is assembled separately by
  the Day view-model layer. These are reusable integration boundaries for resolved media.
- Existing UI guidance establishes the dark palette, semantic coral/teal roles, native semantics,
  responsive inspection at small/intermediate/large widths, visible focus, reduced motion, and
  intentional overflow behavior.
- The repository is in the disposable-development-data phase; the requested curated assets do
  not require a schema change or migration.

### Reuse

- Reuse catalog/domain identifiers and labels as resolver inputs; do not duplicate catalog data in
  templates or page-specific lookup tables.
- Reuse Library SQL queries, repository boundaries, view-model composition, session workspace
  partials, exercise-template partials, workout-session components, and Day components.
- Reuse existing image loading, layout, color, typography, focus, and reduced-motion conventions
  where compatible. Add only the media-specific contract and presentation rules required by the
  new imagery.
- Reuse the existing automated test style: focused feature/view-model tests, EJS/HTTP coverage,
  browser interaction tests, CSS contract tests, and repository verification commands.

### Add

- A typed/JSDoc media contract, curated manifest, resolver, asset conventions, and intentional
  fallback behavior under `src/features/media/` and `public/media/`.
- Representative local assets covering strength, cardio/running, warm-up, mobility, stretching,
  cooldown, muscles, equipment, movement patterns, and environments, with one primary image per
  entity for this iteration.
- Media metadata at presentation boundaries for Library exercise/variant browsing and selected
  session details, then for Dashboard/current-workout and Program Day/session context.
- Focused automated tests for exact matches, exercise variant-to-base inheritance,
  category/environment fallback, missing media, placeholder behavior, and integration preservation.
- Responsive, accessible, reserved-space, lazy-loading, and asset-failure verification for the
  touched surfaces.

### Explicitly out of scope

- Database media tables or migrations, user uploads, external media management, image editing,
  galleries, multiple images per entity, or administrative media interfaces.
- A complete unique image for every existing catalog row before the reusable system ships.
- Replacing textual labels or metadata, redesigning the application around imagery, or broad
  frontend token/component cleanup unrelated to media.
- Changes to search/filter semantics, accordion semantics, ownership or authorization boundaries,
  workout history behavior, or production/deployment data.

## Confirmed decisions

- Media is curated application-owned catalog content for this goal.
- Exercise resolution follows predictable inheritance: exercise variant, base exercise,
  movement/environment/category fallback, then an intentional generic placeholder.
- Equivalent fallback rules may be used for muscles, equipment, environments, and movement
  patterns. Every supported entity must resolve to safe presentation metadata, including when its
  dedicated asset is absent or cannot load.
- One primary image per entity is sufficient for the first iteration. The contract may carry
  dimensions or aspect-ratio metadata, entity type, alt text, source, and `isFallback`.
- Images complement meaningful text. Workout interfaces remain focused and lightweight; active
  exercises receive the clearest visual aid, while history/progress imagery is deferred unless
  direct evidence shows material recognition benefit.

## Scope

### In scope

- Reusable media manifest/resolver and local asset conventions.
- Representative catalog coverage and reliable fallback behavior.
- Library exercise/variant browsing and selected-session detail integration.
- Dashboard/current-workout and Program Day/session-context integration where recognition improves
  the task.
- Accessibility, responsive layout, performance, asset-failure behavior, and regression tests for
  the changed surfaces.

### Out of scope

- Database schema changes, user-managed media, media management, galleries, broad redesign,
  exhaustive catalog artwork, unrelated accessibility remediation, and deployment.

## Done when

- A reusable catalog-media contract, manifest, resolver, and local asset conventions exist.
- Representative assets cover the required exercise and training concepts, with intentional
  fallback behavior for unsupported or missing dedicated media.
- Library exercise/variant and selected-session interfaces use resolved media without coupling
  templates to lookup logic and without changing search, filters, accordion behavior, textual
  metadata, nullable fields, or ownership boundaries.
- Dashboard/current-workout and Program Day/session interfaces use focused media where it improves
  exercise recognition without becoming image-heavy.
- Missing or failed assets never create broken image presentation or prevent page use.
- Informative alt text, decorative treatment, reserved layout space, sensible loading behavior,
  aspect ratios, responsive density, keyboard behavior, focus, and reduced-motion expectations are
  verified at small, intermediate, and desktop widths.
- Relevant automated checks pass, the final diff is inspected, and any unavailable browser or
  asset-verification capability is recorded explicitly.

## Constraints

- Preserve the existing modular-monolith architecture and JavaScript/checkJs conventions; do not
  introduce TypeScript, React, a CSS framework, or a production dependency for image handling.
- Keep media resolution outside EJS and page-specific browser scripts.
- Prefer optimized local formats and sensible dimensions; avoid unnecessarily large source assets.
- Do not reset databases, mutate production data, deploy, push, or commit unless explicitly
  authorized later.

## Historical context

- The completed prior goal established the starter workspace and Dashboard disclosure behavior.
- Commit `e4c8901` expanded the strength catalog and improved Library sessions; its centralized
  catalog manifest and current Library boundaries are the primary compatible foundation for this
  goal.

## Resume here

Action 1 is **Completed**. Action 2 is **Completed** after approval of the selected-session
exercise-item media placement correction. Action 3 is **Completed** after approval of the focused
workout visuals. Action 4 is **Completed** after final verification. The current goal is
**Completed** on 2026-09-11. No next goal is approved; request user direction before preparing
another goal.
