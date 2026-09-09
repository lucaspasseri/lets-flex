# Current Actions

## Current goal

Redesign Library discovery around clearly separated sessions and base exercises, progressively
disclosed variants, and relevant client-side filtering built from existing catalog metadata.

**Goal status:** Completed on 2026-09-09. Actions 1 and 2 are Completed.

## Status definitions

- **Pending approval:** proposed first action that has not been approved for implementation.
- **Pending:** later work whose preceding action has not been completed and approved.
- **Active:** the only action currently authorized for implementation.
- **Ready for review:** implemented and verified; awaiting explicit user approval.
- **Changes requested:** review corrections are authorized for the current action.
- **Completed:** verification evidence was reviewed and the action was explicitly approved.

Only one action may be Active. Approving this plan activates Action 1 and stops at that planning
gate; it does not authorize implementation in the same response. Every implemented action stops at
Ready for review.

## Verified evidence baseline

- `getLibraryPageData` concurrently loads every visible session with all nested steps and every
  visible exercise variant, plus equipment, movement, muscle, role, and step-type reference data.
- `findVisibleForUser` scopes sessions to active global templates or the current owner;
  `findAllForUser` scopes exercises to active bases and active global/current-owner variants.
- The exercise query returns one row per variant, ordered by base and variant name. The ViewModel
  maps each row to its own accordion, so the same base metadata and muscle set are repeated.
- The canonical manifest contains 18 base exercises and 36 global variants. Private variants can
  add more repeated rows for a member or guest.
- The single `librarySearch` input hides both `[data-search-session-item]` and
  `[data-search-exercise-item]` elements on each keystroke and rewrites their two counts. There are
  no facets, clear action, filtered-empty state, URL filter state, or section-specific controls.
- Session search indexes only session name, movement patterns, and muscles even though loaded steps
  include base exercise, variant, equipment, and session notes. Exercise search indexes base name,
  variant name, movement pattern, and equipment but omits loaded muscles, environment, setup/notes,
  and scope.
- Session and exercise presentation already have accessible, responsive shared-component styling.
  The recently completed Library visual goal repaired accordion IDs, focus, expanded/hidden state,
  reduced motion, semantic tokens, and long-content/mobile behavior; that work is reused.
- Session form options require the full visible variant list and persist distinct variant IDs. The
  administrator and personal variant forms also derive choices/actions from the same full data.
- No repository evidence establishes a near-term target above the current catalog or demonstrates
  current query, payload, DOM, or filtering latency. Server-side filtering is therefore not a
  verified requirement for this action plan.

## Confirmed decisions

- Treat sessions and exercises as separate discovery intents with independent controls and result
  state, not one mixed search result set.
- Present one item per base exercise by grouping the existing variant-shaped mapper results at the
  Library ViewModel boundary; do not change the repository query or the flat data used by forms.
- Keep all variants collapsed by default and expose them through the base exercise’s existing
  accessible disclosure pattern. A filter may narrow which variants count as matches, but it must
  not flatten them back into default top-level rows.
- Use existing movement pattern, muscle, equipment, environment, ownership, name, notes, and setup
  metadata. Do not add schema or seed fields for this redesign.
- Retain client-side filtering for the verified current scale. Reconsider server search/pagination
  only with measured performance or an approved scale requirement that justifies the wider
  route/query/form-data architecture.
- Preserve personal/admin scope, variant IDs, selected-session URLs, contextual session creation,
  all create/edit/archive behavior, and the completed shared accordion/accessibility work.

## Proposed action sequence

### Action 1 — Group Library exercises by base exercise and disclose variants progressively

**Status:** Completed

**Approved:** 2026-09-09. The user approved the proposed action scope. Per the approval gate, no
implementation was performed in the approval response.

**Started:** 2026-09-09.

**Ready for review:** 2026-09-09.

**Completed:** 2026-09-09. The user approved the verified grouped base-exercise presentation,
progressive variant disclosure, preserved form/action identities, responsive styling, and recorded
test evidence.

**Purpose:** Correct the exercise hierarchy at the ViewModel and rendered-component boundary before
building filters whose result identity depends on that hierarchy.

**Expected work:**

- Add a grouped exercise projection that emits one base item per exercise ID with shared movement
  and muscle metadata, an ordered visible-variant collection, separate exercise/variant totals, and
  the filter metadata needed by the later discovery action.
- Keep the underlying `data.exerciseTemplates` array flat for session-form options and create/update
  form contracts; do not introduce a parallel repository or duplicate query.
- Change Exercise Templates markup so the collapsed row describes the base exercise and its variant
  count, while expansion reveals the global/private variants with their equipment, environment,
  setup, notes, scope, and existing per-variant actions.
- Move exercise-level administrator archive behavior to one unambiguous base-level action while
  keeping global variant edit and private variant update/archive actions attached to the correct
  variant IDs.
- Update the section count and empty state to describe base exercises and variants accurately in
  personal and administrator modes.
- Adapt existing semantic styles for grouped variant cards, long content, action placement, focus,
  hidden state, reduced motion, and the established narrow layout; do not redesign the overall
  Library discovery shell yet.
- Add focused ViewModel/rendered/browser/CSS tests for grouping, ordering, counts, disclosure IDs,
  ownership scope/actions, empty state, and preservation of the flat form option source.

**Acceptance criteria:**

- The canonical global catalog renders 18 collapsed base-exercise rows and reports 36 variants;
  each base is rendered once and every visible variant appears once inside its parent disclosure.
- A member’s private variant joins only its base exercise and retains its private label, edit form,
  archive form, CSRF field, and canonical variant ID. Foreign and archived variants remain absent.
- Administrator mode exposes only global variants, one base-level archive action, and the existing
  create/edit flows with their current route identities.
- Session create/update options remain complete, variant-aware, and backed by the original flat
  mapper data.
- Focused checks, `npm run format:check`, `npm run lint`, server/browser type checks, relevant HTTP
  tests, and `git diff --check` pass. The action stops at Ready for review.

**Constraints:**

- Do not implement the new section switcher or filter controls in this action.
- Do not change repository SQL, schema, seed/catalog contents, visibility rules, persistence,
  dependencies, or shared accordion behavior unless direct evidence proves a grouped-card contract
  cannot be correct without a narrowly scoped shared fix.
- Preserve unrelated working-tree changes and stop at the review gate.

**Implemented delta:**

- Grouped the existing flat exercise-template mapper rows at the Library ViewModel boundary, keyed
  by base exercise ID, while leaving the original flat array intact for session create/update
  options and all form contracts.
- Rendered one collapsed accordion per base exercise with an accurate variant count and moved each
  visible variant's identity, equipment, environment, setup, notes, scope, and actions into an
  ordered nested list inside that disclosure.
- Preserved per-variant global edit and private owner update/archive actions with their canonical
  IDs and CSRF fields; administrator archive now appears once for the base exercise.
- Added separate base-exercise and variant totals to the ViewModel and retained those totals when
  the existing interim client-side search hides grouped items. The section switcher and expanded
  filter redesign remain exclusively in Action 2.
- Added grouped-list styling for hierarchy, readable nested facts/actions, long content, and the
  existing responsive breakpoint without changing the shared accordion implementation.

**Discoveries:**

- No query, schema, seed, dependency, or route change was needed: grouping is correct at the
  presentation boundary and the flat mapper data remains available to forms.
- The existing ownership calculation could classify a global variant as owner-private when both
  the actor and owner IDs were null. The grouped projection now requires an authenticated actor
  identity before exposing private-owner presentation or actions.
- Bodyweight variants have no equipment record, so the grouped equipment summary now supplies the
  existing user-facing `Bodyweight` concept instead of silently omitting those variants.

**Verification evidence:**

- `npm run verify` passed: formatting, lint, server types, browser types, and all 190 repository
  tests passed with 0 failures, cancellations, or skips.
- `npm run test:http` passed against the local disposable test database: all 58 HTTP integration
  tests passed with 0 failures, cancellations, or skips. This includes canonical catalog counts,
  regular-user global/private rendering, administrator scoping/actions, and CSRF-protected flows.
- Focused grouped-ViewModel, rendered-EJS, browser-interaction, CSS-contract, and Library page tests
  pass, including the canonical 18-base/36-variant projection and preservation of flat session-form
  options.
- Live personal and administrator Library review at 1440px and 390px confirmed one base row per
  exercise, nested progressive disclosure, correct 18/36 global totals, private variants joining
  their base for the owner, expected administrator action counts, and no horizontal overflow.
- `git diff --check` passes. Final diff inspection found no repository SQL, schema, seed,
  dependency, shared-accordion, deployment, push, or production-data changes.

### Action 2 — Build independent Session and Exercise discovery/filter experiences

**Status:** Completed

**Approved and started:** 2026-09-09. The user explicitly approved the prepared next action for
implementation.

**Ready for review:** 2026-09-09.

**Completed:** 2026-09-09. The user approved the independent Session and Exercise discovery
experience, grouped variant-aware filtering, responsive/accessibility treatment, preserved Library
workflows, and the exact restoration of the pre-attempt exercise-variant form layout. Approval-gate
verification passed before completion.

**Changes requested:** 2026-09-09. Improve only the responsive presentation of the final
exercise-variant creation form around the 600px range, including nearby mobile/tablet widths.
Correct cramped or oddly stretched controls, spacing, alignment, wrapping, and label/input
readability without changing form behavior or redesigning the feature.

**Superseded correction:** 2026-09-09. A purpose-specific responsive field grid was implemented for
the shared personal/administrator variant form. The user rejected its presentation and requested
that it be reverted rather than revised.

**Changes requested (revert):** 2026-09-09. The user rejected that responsive-form adjustment and
requested an exact restoration of the preceding form layout. Revert only the form-specific markup,
breakpoint rules, and focused assertions from the latest attempt; preserve all unrelated Library
work and make no replacement design.

**Revert completed:** 2026-09-09. Removed only the rejected form-specific class, its 46rem/34rem
grid overrides, and the assertions introduced for those rules. Restored the preceding shared
three-column form-grid markup and its existing 30rem full-width submit treatment. No form fields,
labels, actions, submission behavior, or unrelated Library discovery code changed in this revert.

**Purpose:** Make discovery a primary, responsive Library capability with controls and result
feedback tailored to each content type.

**Expected work:**

- Introduce a clear Session/Exercise section switcher for personal Library mode, retaining Sessions
  as the initial context and selecting it whenever a `sessionId` is being viewed. Keep administrator
  mode focused on Exercise discovery without an irrelevant Session option.
- Place a visibly labelled search/filter surface inside each content section rather than above the
  whole page. Reuse the shared tabs or navigation interaction only after verifying its IDs,
  selected state, keyboard behavior, and rendered-content needs fit this page.
- Sessions: search names, notes, base exercises, variants, movement patterns, muscles, and equipment;
  offer movement, muscle, and equipment facets derived from visible session metadata.
- Exercises: search base/variant names and relevant descriptive metadata; offer movement, muscle,
  and equipment facets, with environment or ownership scope only when their available options are
  useful in the current mode.
- Apply case-insensitive AND semantics across query and selected facets. At exercise level, retain a
  base result when base metadata or a qualifying child variant matches and ensure variant-specific
  criteria identify only the relevant variants inside the disclosure.
- Provide independent result/total counts, clear-all controls, and accessible filtered-empty
  feedback. Preserve ordinary content empty states and restore all scoped content on reset.
- Ensure filtering does not mutate URLs, submit forms, cross session/exercise state, or disturb the
  selected session/detail link. Preserve usable server-rendered content if enhancement is absent.
- Refine the Library layout and control density for wide and narrow screens using existing design
  tokens/components, visible focus, accessible labels/state, no color-only meaning, and reduced
  motion.
- Replace the current one-input filtering module with focused, testable state/filter functions and
  add browser tests for search fields, facet combinations, grouped-variant matches, counts, reset,
  no-results, section independence, keyboard switching, and admin mode.
- Run focused ViewModel/rendered/browser/CSS/HTTP checks, `npm run verify`, the complete PostgreSQL
  HTTP suite, representative wide/narrow manual or equivalent layout review, and final diff checks.

**Acceptance criteria:**

- Personal Library clearly separates Session and Exercise discovery; administrator Library exposes
  the improved Exercise controls without personal content.
- Searchable attributes and filter options are derived only from visible repository-backed data,
  and query/facet combinations return correct base-exercise or session counts.
- Matching a variant or equipment retains its base exercise without restoring a top-level row per
  variant; unrelated child variants are not represented as matches.
- Session and exercise queries, facets, counts, reset actions, and no-results messages operate
  independently and remain keyboard/screen-reader understandable.
- Contextual session creation, selected-session navigation/details, global/private visibility,
  ownership actions, forms/modals, and invalid-form state pass regression coverage.
- Representative personal/admin, populated/empty, filtered/unfiltered, narrow/wide, long-content,
  focus, and reduced-motion review is recorded with no horizontal overflow.
- `npm run verify`, the complete PostgreSQL HTTP suite, and `git diff --check` pass. The action stops
  at Ready for review.

**Constraints:**

- Do not move filtering into route/query/repository code absent new measured evidence that
  invalidates the approved client-side decision. Record that evidence and request a scope decision
  before introducing server pagination or asynchronous APIs.
- Do not add dependencies, schema/catalog fields, unrelated shared-component redesign, deployment,
  push, or production-data work.
- Preserve the Action 1 grouped projection and all existing security/data-integrity boundaries.

**Implemented delta:**

- Replaced the page-wide search field with independent, visibly labelled Session and Exercise
  discovery surfaces. Each owns its query, relevant facets, live result count, clear action, and
  filtered-empty state.
- Added a personal-library Session/Exercise tab switcher using the established shared keyboard tab
  behavior. Sessions remain the initial selection, including selected-session URLs; administrator
  mode renders Exercise discovery directly without an irrelevant tab list.
- Expanded session search to loaded names, notes, base exercises, variant names, setup/variant
  notes, environment, movement, muscle, and equipment metadata. Movement, muscle, and equipment
  facets are derived from the visible session collection.
- Added base-aware Exercise filtering across movement and muscle plus variant-aware query,
  equipment, environment, and ownership scope. A base remains once when a child matches, while
  nonmatching child variants are hidden and the base/variant result totals show the filtered
  relationship.
- Derived every facet option from the already ownership-scoped ViewModels and omitted facets with
  fewer than two available values. Bodyweight is represented explicitly where an equipment record
  is absent.
- Moved personal/global variant creation below Exercise discovery so finding existing content is
  the primary interaction, while preserving all form, modal, URL, ownership, and CSRF contracts.
- Added responsive discovery-panel and tab styling with semantic tokens, visible focus, live/empty
  feedback, explicit hidden-state behavior, and reduced-motion handling.

**Discoveries:**

- The shared tabs behavior fits the required click and Arrow/Home/End keyboard interactions, but
  its usual server-rendered hidden panel would make Exercise content unavailable if JavaScript
  failed. The Library therefore renders both sections as ordinary content by default, hides the tab
  list, and applies the tabbed presentation only when the page enhancement initializes.
- Variant criteria must be evaluated against one child at a time. Combining a query match from one
  variant with an equipment match from another would produce a false base result; the client
  evaluator now requires all variant-level criteria to match the same child.
- The catalog and page payload remained responsive at the verified scale. No evidence invalidated
  the approved client-side filtering decision, so routes, repositories, SQL, schema, seed, and
  dependencies remain unchanged.

**Verification evidence:**

- Focused ViewModel, rendered-EJS, browser-interaction, CSS-contract, and grouped-projection checks
  passed: 18 tests with 0 failures. Coverage includes independent state, search/facet AND
  semantics, same-child variant matching, counts, clear/reset, no-results, personal/admin markup,
  server-rendered fallback, ownership actions, and flat session-form options.
- `npm run verify` passed: formatting, lint, server types, browser types, and all 195 repository
  tests passed with 0 failures, cancellations, or skips.
- `npm run test:http` passed against the local disposable test database: all 58 HTTP integration
  tests passed with 0 failures, cancellations, or skips, including Library personal/admin scoping,
  contextual creation, selected-session behavior, forms, ownership, and CSRF regressions.
- Live personal review at 1440px confirmed the Session-first workspace and the filtered Exercise
  hierarchy; at 390px the selected Exercise panel reported 1 of 18 bases and 1 of 36 variants with
  only one qualifying nested variant, correct tab state, and document width equal to viewport
  width.
- Live administrator review confirmed no Library tab list, one Exercise query, and query results of
  4 of 18 bases/8 of 36 variants at both 1440px and 390px, with no horizontal overflow.
- The explicitly local disposable `lets_flex_test` database was reset to the canonical schema and
  seed for browser review. No development or production database was changed.
- `git diff --check` passes. Final diff inspection found no repository query, route, schema, seed,
  dependency, shared-tab implementation, deployment, push, or production-data change.
- Revert verification passed: the focused rendered-EJS, CSS-contract, and browser-interaction tests
  passed 13 of 13; repository inspection confirmed the rejected class and 46rem/34rem rules are
  absent, the original shared three-column class is present, and the prior 30rem submit rule is
  restored.
- `npm run verify` passed again with all 195 repository tests, and `npm run test:http` passed all 58
  PostgreSQL HTTP tests with no failures, cancellations, or skips. `git diff --check` and final diff
  inspection confirmed the broader Library hierarchy, filtering, tabs, forms, and actions remain
  present.
- Approval-gate verification passed on 2026-09-09: `npm run verify` completed all formatting, lint,
  server/browser type, and 195 repository tests; `npm run test:http` completed all 58 PostgreSQL
  HTTP tests, with no failures, cancellations, or skips.

## Resume here

The goal and both actions are Completed. The user explicitly approved the goal on 2026-09-09 after
reviewing the final behavior and verification evidence. Keep this completed record in place until
the user explicitly approves a proposed next goal; do not start follow-up implementation.
