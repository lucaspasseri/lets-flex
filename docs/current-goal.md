# Goal: Improve Entity Presentation Completeness

## Goal status

**Completed.**

**Started:** 2026-09-15 after the user explicitly approved this proposed next goal.

**Completed:** 2026-09-15 after the user explicitly approved the final-review corrections.

**Outcome:** Exercise details now present complete localized muscle relationships with compact,
role-grouped metadata, media fallbacks, and responsive intrinsic layout. Admin create/edit muscle
role selects use the shared English/Portuguese presentation boundary while preserving stable IDs
and persisted names. Existing movement-pattern, equipment, variant, media, accordion, ownership,
and security behavior was preserved. Live browser review remains a documented manual follow-up.

## Objective

Improve how existing domain entities are represented in the user-facing application so important
data does not exist only in the database or administration interfaces.

The first cohesive scope is the exercise-to-muscle relationship. A user inspecting an exercise
must be able to understand which muscles it trains, the role of each muscle, and—when canonical
media exists—see that media in the same exercise context.

## Approved user outcome

Exercise presentation surfaces where exercise details already appear provide a compact, reusable
muscle section that communicates:

- each related muscle's localized name;
- its role in the exercise, with important roles such as Primary and Secondary distinguishable;
- canonical muscle media when available;
- usable text-only presentation when media is absent or muscle information is unavailable.

The implementation establishes a predictable related-entity presentation pattern that can later be
reused for equipment, movement patterns, and exercise variants without introducing a generic entity
framework or standalone muscle pages.

## Existing relevant capabilities — Verified

- The Library is the clearest current exercise-detail surface. Its exercise accordion detail view
  already presents movement pattern, primary-muscle information, and exercise variants.
- The exercise-template query already aggregates `exercise_muscles` with `muscles` and
  `muscle_roles`, including localized muscle names, role IDs, role names, and descriptions, in the
  repository boundary without presentation-specific controller or view queries.
- The exercise-template mapper preserves the complete aggregated muscle relationship, including
  the mapped role.
- Before Action 1, `createMuscleViewModel` projected only one hard-coded primary role and one
  hard-coded secondary role, so several muscles and other valid roles were not represented in the
  UI; Action 1 replaces that lossy boundary with the complete collection.
- The shared ID-backed media resolver and `createMediaResolver` already support `muscle` entities,
  localized alt text, persistent assignments, and safe initial fallbacks.
- Before Action 1, the Library media-assignment loader collected exercise, variant, and
  movement-pattern candidates but not muscle candidates; Action 1 now includes muscles in that
  existing page-level collection.
- Exercise variants, equipment, and movement patterns already have meaningful Library presentation
  and remain audit/follow-up concerns unless the muscle section demonstrates a directly shared
  presentation boundary.
- No browser executable is available in the current environment; live responsive, keyboard,
  screen-reader, and rendered visual verification will need to be recorded as unavailable or
  manually verified later.

## Verified gaps / delta classification

- **Modify:** Replace the lossy muscle ViewModel projection with a presentation-ready collection
  that preserves all related muscles and their roles without exposing internal IDs or requiring EJS
  to interpret role IDs.
- **Modify:** Extend the existing Library media-candidate collection so visible muscles are loaded
  in the same assignment query and resolved through the existing media boundary.
- **Add:** Render a compact exercise muscle section that groups or distinguishes important roles,
  includes canonical media when resolved, and handles empty or media-missing states safely.
- **Add:** Add focused data/ViewModel/template/localization/media regression tests, including
  multiple muscles, primary and secondary roles, no-muscle data, localized labels, and missing
  canonical media.
- **Explicitly defer:** Standalone muscle pages, broad equipment/movement-pattern/variant
  presentation expansion, new media lookup mechanisms, AI-generated muscle imagery, and generic
  entity-framework abstractions.

## Scope and constraints

In scope: the existing exercise-detail presentation surfaces, their repository/query and mapper
boundaries where required, the existing canonical media resolver, the reusable EJS/CSS presentation
pattern, English and Brazilian Portuguese localization, and focused plus repository verification.

Preserve the server-rendered Express + EJS architecture, existing Library accordion/navigation and
View Transition behavior, responsive layout, theme semantics, accessibility, ownership/actions,
CSRF and validation boundaries, and the existing media fallback contract. Avoid N+1 queries and do
not add production dependencies.

## Done when

- An exercise with one or several muscles presents every relationship with a localized name and
  presentation-ready role label.
- Primary and secondary muscles are visually distinguishable where those roles exist; valid other
  roles remain usable rather than silently disappearing.
- Canonical muscle media is resolved through the existing media boundary and uses localized alt
  text when available.
- Missing canonical media, missing muscle relationships, and optional/null data do not break or
  visually degrade exercise presentation.
- Raw database IDs and internal role identifiers are absent from user-facing markup.
- English and Brazilian Portuguese labels are covered by tests and use the existing i18n system.
- Focused tests, formatting, lint, type checks, relevant automated tests, and the repository
  verification matrix pass; unavailable live-browser checks are explicitly recorded.
- The broader audit records movement patterns, equipment, exercise variants, and muscles as either
  already presented, safely reusable, or future follow-up work without silently expanding scope.

## Out of scope

- OpenAI API integration or AI image generation.
- New object-storage architecture, media schema redesign, or large migrations.
- Dedicated `/muscles/:id` pages or standalone interfaces for every entity.
- Unrelated exercise, session, workout, navigation, or visual redesign work.

## Historical context and discrepancy

The completed 2026-09-08 Library presentation goal established the current exercise accordion,
detail facts, variant presentation, and the initial primary-muscle tag. This goal explicitly
reconsiders and expands only that incomplete muscle presentation behavior; it does not reopen the
completed Library redesign wholesale.

Some older media provenance notes describe muscle media as absent, while the current repository
manifest contains canonical assignments for chest, abs, and abductors. The repository and tests are
authoritative for the current implementation; the discrepancy is recorded rather than silently
reconciled.

## Final-review correction evidence

The requested Admin Manage Exercises correction is implemented in the shared exercise-detail
surface: role groups remain explicit, all muscles remain present, and the supporting metadata now
uses compact intrinsic rows with wrapping chips before the existing variants and actions. The
existing container-pressure breakpoint naturally stacks role labels and muscle lists on narrower
content widths without fixed heights.

Muscle-role select labels now reuse the shared muscle-role presentation boundary in both exercise
detail and Admin create/edit form ViewModels. English and Brazilian Portuguese labels are localized
at presentation time, while submitted role IDs and persisted names remain unchanged. Focused and
full verification passed; live browser review remains unavailable in this environment and is
explicitly required before final completion.
