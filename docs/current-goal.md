# Current Goal

## Parent milestone

Let’s Flex gives members a clear, scalable way to discover and reuse the training assets available
to their workspace.

## Current goal

Redesign the Library’s filtering, exercise discovery, and information hierarchy so sessions and
exercises are easy to browse independently, base exercises lead the catalog presentation, and
variants are disclosed only in the context of a selected exercise.

## Status

Completed on 2026-09-09. Actions 1 and 2 were implemented, verified, and explicitly approved. The
Library now separates Session and Exercise discovery, groups variants beneath each base exercise,
and provides independent metadata filters while preserving existing workflows and client-side
architecture. The rejected responsive-form adjustment was reverted exactly, leaving the preceding
form layout intact.

## Approved user outcome

The Library treats discovery as a primary capability rather than one search field over a long
mixed page. Members can clearly choose between sessions and exercises, search and narrow each
content type using its relevant existing metadata, and browse one entry per base exercise before
expanding it to inspect available global and private variants. The result remains responsive,
accessible, consistent with the established design system, and maintainable as the catalog grows.

## Why now

- The user explicitly selected Library filtering and discovery as the next product goal.
- The current server renders sessions first and then one accordion row per visible variant, so the
  canonical 18-exercise/36-variant catalog repeats every base exercise twice before any private
  variants are added.
- One small browser search input controls both sessions and variants even though they are different
  assets with different useful metadata and user intent.
- The repository already exposes movement pattern, muscles, equipment, environment, ownership,
  base/variant names, and session-step metadata. The redesign can use those contracts without a
  schema change or speculative catalog fields.
- The previous Library visual-standardization goal intentionally preserved the product model. This
  goal explicitly reconsiders that hierarchy while reusing its accessible accordion and semantic
  styling work rather than replacing it.

## Delta-first baseline

### Already satisfied

- Library access, global/private visibility, administrator scoping, ownership actions, CSRF,
  validation, and session creation/update/archive behavior are implemented and covered.
- Session summaries and details already form a useful master/detail workspace, including counts,
  movement patterns, muscles, equipment, prescriptions, and ownership-aware actions.
- Exercise rows already expose base name, variant name, movement pattern, equipment, environment,
  muscles, setup instructions, notes, and ownership to the view-model layer.
- The page already uses shared headings, buttons, forms, modals, icons, accordion behavior,
  semantic color variables, focus treatment, reduced-motion handling, and responsive foundations.
- The current repository has no verified catalog-size target, pagination contract, or performance
  evidence requiring immediate database-backed filtering.

### Reuse

- `getLibraryPageData`, its ownership-scoped repository queries, and the existing mappers as the
  source data for this goal.
- The session workspace, base/variant identities, variant-backed form options, global/private
  management actions, and contextual training-day entry behavior.
- The shared accordion and tabs/segmented-navigation patterns where their verified contracts fit,
  plus existing form controls, buttons, icons, empty states, and semantic design tokens.
- Existing view-model, rendered-EJS, browser-interaction, CSS-contract, and PostgreSQL HTTP tests.

### Modify

- Replace the variant-shaped exercise presentation with one base-exercise item containing its
  visible variants and accurate exercise/variant totals.
- Move variant identity, facts, scope, and management actions into the selected base exercise’s
  disclosure instead of repeating the base exercise once per variant in the default list.
- Replace the single cross-content search interaction with clearly separated Session and Exercise
  discovery surfaces and independent filter state.
- Expand searchable session metadata beyond name/movement/muscle to include notes, exercise and
  variant names, and equipment already present in session steps.
- Expand searchable exercise metadata beyond base/variant/movement/equipment names to include
  muscles, environment, setup/notes, and ownership scope where relevant.
- Refine Library layout, control prominence, counts, result messaging, and responsive behavior to
  support the new hierarchy without redesigning unrelated pages.

### Add

- Relevant facet controls using existing metadata: movement pattern, muscle, and equipment for
  exercises; movement pattern, muscle, and equipment for sessions; plus useful exercise scope or
  environment filtering only where the existing data produces a clear option set.
- Predictable combined-filter semantics, clear/reset behavior, live result counts, and a useful
  no-results state for each content type.
- Focused grouped-projection and browser-filter tests that verify base-level results and matching
  variants without conflating exercise and session state.

### Architectural decision: keep filtering client-side for this goal

The current canonical catalog contains 18 base exercises, 36 global variants, 8 movement patterns,
24 muscles, and 23 equipment records. Library forms already require the complete visible variant
set, while session details are already loaded for the master/detail workspace. Moving filtering to
PostgreSQL now would require new validated URL state, query composition, result paging, and a
separate way to keep complete form options available; it would not remove the existing full-data
requirement without a broader asynchronous form/data redesign.

For the verified current scale, grouping reduces the default exercise list from one row per variant
to one row per base exercise, and isolated client-side filters provide immediate interaction with
the data already delivered. Server-side filtering or pagination should be reconsidered when
measured HTML/DOM size, query duration, page load, or interaction latency becomes unacceptable, or
when the product establishes a catalog/session scale that cannot reasonably be loaded as one page.
That future architecture is not inferred as part of this goal.

## Scope

### In scope

- Personal Library session/exercise separation and administrator exercise-catalog discovery.
- Grouped base-exercise projection with progressively disclosed visible variants.
- Independent search and metadata filters for sessions and exercises, including counts, clearing,
  and filtered-empty behavior.
- Directly supporting ViewModel/type, EJS, browser JavaScript, and Library CSS changes.
- Preservation of selected-session deep links, contextual session creation, global/private scope,
  and all existing create/edit/archive workflows.
- Representative personal/admin, populated/empty, filtered/unfiltered, narrow/wide, keyboard, and
  reduced-motion verification.

### Out of scope

- Schema, seed, migration, catalog-content, ownership, authorization, or persistence changes.
- New metadata solely for filtering, fuzzy-search infrastructure, server pagination, asynchronous
  catalog APIs, or a new frontend framework/dependency.
- Redesigning session creation, exercise administration semantics, Programs, Dashboard, History,
  Progress, Profile, application navigation, or unrelated shared components.
- Deployment, push, production-data operations, or speculative optimization without measurements.

## Correctness and accessibility requirements

- A base exercise appears once in the default exercise results; all visible global/private variants
  remain reachable inside its disclosure, and hidden/archived/foreign variants remain excluded.
- Filtering uses predictable case-insensitive AND semantics across the entered query and selected
  facets. A base exercise remains a result when its base metadata or at least one visible variant
  satisfies the active criteria; variant-specific filtering must not expose unrelated variants as
  matches.
- Session filtering and exercise filtering do not change each other’s result set or count.
- Search fields and selects have persistent visible labels, clear accessible names, keyboard and
  focus behavior, and native semantics where possible. Section switching and exercise disclosure
  expose correct selected/expanded state.
- Result counts and no-results feedback are understandable without color and announced when
  appropriate; clearing filters restores the full scoped result set.
- Existing links, modal triggers, submitted variant IDs, ownership cues/actions, CSRF fields, and
  invalid-form reopening behavior remain intact.
- Changed layouts remain usable at representative small and large viewports without horizontal
  overflow, and changed motion respects reduced-motion preferences.

## Done when

- Personal Library presents distinct Session and Exercise discovery areas; administrator mode
  presents the same improved grouped Exercise discovery without personal sessions or variants.
- The canonical catalog initially renders 18 base-exercise results rather than 36 global variant
  rows, with accurate exercise and variant totals and variants available on expansion.
- Session and exercise search cover the verified relevant metadata, and their facet combinations,
  counts, reset controls, and no-results states behave independently and correctly.
- The client-side decision is preserved without repository/query/schema churn, and any observed
  performance evidence that contradicts it is recorded before expanding scope.
- Personal/admin, ownership, session selection, contextual creation, create/edit/archive, empty,
  keyboard/focus, reduced-motion, and responsive contracts pass focused and HTTP regression tests.
- `npm run verify`, the complete PostgreSQL HTTP suite, representative narrow/wide review, and
  `git diff --check` pass, with skipped or manual checks reported explicitly.
- Final diff inspection confirms no unrelated redesign, dependency, database, deployment, push, or
  production-data change.
