# Current Actions

## Current goal

Improve Entity Presentation Completeness, beginning with muscles associated with exercises.

## Goal status

**Completed.** The goal was approved as a proposed next goal on 2026-09-15; the action plan was
approved on 2026-09-15, and the final-review corrections were approved on 2026-09-15.

## Status definitions

- **Pending:** proposed but not authorized to begin.
- **Active:** explicitly authorized current implementation action.
- **Ready for review:** implementation and required verification are complete; stop for review.
- **Changes requested:** only the requested corrections are authorized.
- **Completed:** explicitly approved after recorded verification.

Only one action may be Active. Approving this plan activates Action 1 and does not authorize later
actions or implementation in the same response.

## Verified investigation baseline

- The Library exercise accordion is the clearest existing exercise-detail surface and already
  renders movement pattern, one primary-muscle tag, and variant details.
- `src/features/exerciseTemplates/queries.js` already performs the relationship query for all
  visible exercise variants, aggregating `exercise_muscles`, `muscles`, and `muscle_roles` with
  localized muscle names.
- `src/features/exerciseTemplates/mapper.js` and the exercise-template types already preserve
  the relationship and mapped role at the domain boundary.
- `src/features/library/createMuscleViewModel.js` is the current lossy boundary: it recognizes
  only role IDs 1 and 7 and stores only one item per recognized role.
- `src/features/media/createMediaResolver.js` and `src/features/media/resolveEntityMedia.js`
  already resolve ID-backed muscle media with localized alt text and safe fallback behavior.
- `src/features/media/loadMediaAssignments.js` does not currently collect muscle candidates, while
  the Library controller already loads all page assignments in one query and passes one resolver
  into the ViewModel.
- Current canonical repository data contains three muscle media entries (chest, abs, abductors),
  despite older provenance documentation describing no muscle assignments.
- Movement patterns, equipment, exercise variants, admin/media pages, workout/session views, and
  existing shared media components were inspected as related surfaces. Their current presentation
  is either already meaningful or outside this focused first delta.
- No browser executable is available for live viewport, keyboard, screen-reader, or rendered
  visual inspection in this environment.

## Proposed action sequence

### Action 1 — Expose complete exercise muscle presentation data

**Status:** Completed

**Activated:** 2026-09-15 after explicit user approval of the action plan.

**Completed:** 2026-09-15 after explicit user approval of the verified changes.

**Implementation complete:** 2026-09-15. The exercise muscle ViewModel now preserves every
relationship, groups roles for presentation, exposes localized role labels, and resolves
muscle media through the existing page-level resolver. The role mapper now supplies stable role
keys, media assignment collection includes deduplicated muscle candidates in the existing query,
and canonical muscle keys are available to the resolver's static fallback. Existing exercise,
variant, movement-pattern, and fallback media behavior remains compatible; Action 2 now renders
the complete collection.

**Verification evidence:**

- Focused Library, media, localization, page ViewModel, and shared media tests: 40 passed, 0
  failed.
- `npm run check:types`: passed.
- `npm run format:check`: passed.
- `npm run lint`: passed.
- `npm run verify`: passed — formatting, lint, server/browser type checks, and 492 tests passed;
  0 failed and 0 cancelled.
- `git diff --check`: passed.
- Live browser, viewport, keyboard, screen-reader, and rendered visual inspection remain
  unavailable because no browser executable is present; those checks belong to the rendering
  action.

**Completion summary:** Completed the data and media-resolution boundary for complete exercise
muscle presentation. Every related muscle is retained with a presentation-ready role group and
localized label, canonical muscle media can be loaded through the existing page-level assignment
query and resolver, and compatibility with existing exercise detail media remains intact. Action 2
has since been implemented and is ready for review.

**Purpose:** Replace the current lossy role-ID projection with a presentation-ready muscle
collection that retains every relationship, localized name, canonical identity needed for media
resolution, and a localized human-readable role label. Extend the existing page-level media
candidate collection to load visible muscle assignments in the same query and attach resolved
canonical media through the existing resolver.

**Reviewable outcome:** The exercise ViewModel contains all related muscles, role distinctions, and
nullable media without raw role interpretation being required in EJS; existing exercise, variant,
movement-pattern, and fallback media behavior remains unchanged; no N+1 query is introduced.

**Planned verification:** Focused query/repository contract inspection, ViewModel tests for one,
many, mixed-role, and empty relationships, media-candidate/resolver tests for assigned and missing
muscle media, `npm run check:types`, `npm run format:check`, `npm run lint`, and `git diff --check`.

### Action 2 — Render the reusable exercise muscle section

**Status:** Completed

**Depends on:** Action 1 completed.

**Activated:** 2026-09-15 after explicit user approval of the prepared next action.

**Ready for review:** 2026-09-15 after implementing the section and completing focused and
repository checks.

**Completed:** 2026-09-15 after explicit user approval of the verified changes.

**Purpose:** Add the smallest cohesive EJS/CSS presentation using the existing shared media
component and Library exercise-detail structure. Group or distinguish Primary and Secondary
muscles, retain readable treatment for other roles, provide localized labels, and preserve useful
text-only and empty states without making muscles falsely interactive.

**Reviewable outcome:** Personal and administrator Library exercise details show complete muscle
information in English and Brazilian Portuguese with canonical thumbnails when present, safe
missing-media behavior, valid heading/section semantics, no IDs or internal role names in markup,
and responsive/reduced-motion-safe styling consistent with the existing Library.

**Implementation and verification evidence:**

- Replaced the single primary-muscle fact with a semantic, reusable muscle-focus section in the
  existing exercise accordion. It renders every ViewModel group, role label, localized muscle name,
  shared compact media frame, and a text-only empty state.
- Added intrinsic auto-fit muscle-item layout, readable wrapping, role labels that remain
  distinguishable without relying on color, and existing dark-surface/focus/reduced-motion
  conventions without adding new interaction or motion.
- Added English and Brazilian Portuguese section/empty-state copy and focused EJS/CSS contracts.
- Focused rendering, CSS, ViewModel, media, localization, and Library regression tests: 32 passed,
  0 failed.
- npm run format:check: passed.
- npm run lint: passed.
- npm run check:types: passed.
- git diff --check: passed.
- npm run check:browser-types: not run; no browser-side JavaScript changed.
- Live rendered inspection at small, intermediate, and large widths, keyboard behavior, and
  screen-reader output remain unavailable because no browser executable is present.
  **Planned verification:** Focused EJS/ViewModel/i18n rendering tests, CSS contract tests, existing
  Library regression tests, `npm run check:types`, `npm run format:check`, `npm run lint`, and
  `npm run check:browser-types` when browser-side files are touched.

**Completion summary:** Completed the reusable Library exercise muscle section with semantic role
groups, localized labels, shared canonical/initial media, readable empty states, and responsive
intrinsic layout. Existing accordion behavior, exercise actions, media contracts, and dark visual
identity remain intact. Action 3 subsequently completed the final audit and requested corrections.

### Action 3 — Complete audit and final verification

**Status:** Completed

**Depends on:** Action 2 completed.

**Activated:** 2026-09-15 after explicit user approval of the prepared next action.

**Ready for review:** 2026-09-15 after completing the final audit and repository verification.

**Completed:** 2026-09-15 after explicit user approval of the verified changes.

**Changes requested:** 2026-09-15 — refine the Admin Manage Exercises exercise-detail layout for
denser supporting muscle metadata without dropping relationships, and localize muscle-role select
labels in English and Brazilian Portuguese while preserving stable IDs and persisted names.

**Correction ready for review:** 2026-09-15. The requested layout and presentation-boundary
corrections were implemented and verified.

**Purpose:** Verify the full acceptance matrix and record the broader entity audit. Confirm that
movement patterns, equipment, variants, and muscles are classified as already presented, reused,
or future work; do not implement unrelated gaps. Run the relevant focused tests followed by the
repository verification matrix and inspect the final diff.

**Reviewable outcome:** The exercise muscle presentation is regression-safe, localized,
accessible, responsive by source and available rendered evidence, and the goal document records
remaining manual-browser limitations and intentionally deferred entity work.

**Audit classification and acceptance comparison:**

- Muscles: completed Modify/Add work; every relationship is retained, grouped roles and localized
  labels are rendered, canonical/initial media uses the existing resolver, and empty or
  media-missing states remain usable.
- Movement patterns: Already satisfied and reused; the existing Library fact, search metadata,
  and filters remain intact.
- Equipment: Already satisfied and reused; existing variant facts, bodyweight fallback, search
  metadata, and filters remain intact.
- Exercise variants: Already satisfied and reused; existing variant details, media inheritance,
  ownership actions, and administrator/private behavior remain intact.
- Explicitly deferred: standalone entity pages, broad related-entity expansion, new media lookup
  mechanisms, AI-generated muscle imagery, and generic entity-framework abstractions.
- Done-when criteria are met by the recorded ViewModel, EJS/CSS, localization, focused regression,
  and full-suite evidence. Muscle items emit no muscle IDs or internal role keys; existing
  accordion and variant IDs remain only for their established interaction contracts.

**Final verification evidence:**

- npm run verify: passed — formatting, lint, server/browser type checks, and 497 tests passed;
  0 failed, 0 cancelled, and 0 skipped.
- git diff --check: passed; final changed files remain within the approved entity-presentation
  scope plus the required goal/action records and regression tests.
- No browser executable is available, so live 390px, intermediate, and 1280–1440px rendering,
  keyboard behavior, and screen-reader output remain unavailable and are explicitly recorded.

**Final-review correction evidence:**

- The inefficient layout was caused by dense role-group content being stacked as separately padded
  muscle items in the exercise-detail flow, making the supporting metadata visually tall. The
  correction keeps every relationship but presents each role as a compact labelled row with
  wrapping muscle chips, followed by variants and existing actions. It uses intrinsic sizing and
  a natural single-column role layout at the existing 45rem container-pressure breakpoint; no
  fixed card heights or hidden data were introduced.
- `src/features/muscleRoles/presentation.js` is now the shared presentation boundary for stable
  role keys, grouping, and localized labels. The exercise ViewModel and Admin create/edit form
  ViewModel reuse it; form option values remain the original role IDs and persisted names are not
  changed.
- Focused correction tests passed: 24 passed, 0 failed, 0 cancelled, and 0 skipped, including
  English and Brazilian Portuguese form-select rendering, stable option values, detail rendering,
  and responsive CSS contracts.
- Manual browser review is still required for rendered visual density, long translated labels,
  keyboard/screen-reader behavior, and the requested one/two-muscle, many-role, multi-variant,
  Portuguese/English, and narrow-viewport cases because no browser executable is available here.

**Completion summary:** The approved entity-presentation behavior and requested final-review
corrections were implemented and approved. Library/Admin exercise details expose every related muscle with
localized role labels, compact semantic grouping, canonical or initial media, safe empty states,
and responsive intrinsic layout. The Admin create/edit role select uses the same localized role
presentation boundary while preserving stable IDs and persisted names. Existing movement-pattern,
equipment, variant, media, accordion, ownership, and security behavior was preserved; final
verification passed, with live-browser inspection explicitly unavailable.

**Planned verification:** Focused tests, `npm run format:check`, `npm run lint`, server/browser
type checks as applicable, `npm run verify`, PostgreSQL-backed HTTP tests when required by the
changed data path, `git diff --check`, and final diff/documentation inspection.

## Resume here

Goal completed on 2026-09-15 after explicit user approval. No next goal is established; reassess
from repository evidence and the user's stated priorities before proposing one.
