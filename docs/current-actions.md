# Current Actions

## Current goal

Standardize and refine the Library page—especially Exercise Templates—against the
application's established visual language, and repair the duplicated session exercise
labels and stale Dashboard chart loading status.

**Goal status:** Completed on 2026-09-08 after explicit user approval. Actions 1 and 2 are
Completed.

## Status definitions

- **Pending:** proposed work that has not been approved for implementation.
- **Active:** the only action currently authorized for implementation.
- **Ready for review:** implemented and verified; awaiting explicit user approval.
- **Changes requested:** review corrections are authorized for the current action.
- **Completed:** verification evidence was reviewed and the action was explicitly approved.

Only one action may be Active. Approving this plan activates Action 1 and stops at that
planning gate; it does not authorize implementation in the same response.

## Verified evidence baseline

- The Library already shares the centered page layout, page heading, form fields, buttons,
  modals, icons, palette, and responsive grid primitives used elsewhere. These are reused.
- `findAllForUser` returns one row per visible variant with a distinct variant ID.
  `createSessionFormViewModel` uses that variant ID as the option value but uses the base
  exercise name as its label; multiple variants of one base consequently render repeated
  labels.
- The chart's successful path sets `status.hidden = true`, but the author rule
  `.adherence-chart__status { display: grid; }` overrides hidden rendering. Existing chart
  tests verify the DOM property but not the stylesheet contract.
- Exercise Template CSS targets wrapper/trigger hooks absent from the shared accordion EJS,
  while the detail region points `aria-labelledby` at an ID that is not rendered.
- Exercise Template and Session Workspace styles retain local hard-coded colors and legacy
  aliases that duplicate current semantic variables. Established newer pages consistently
  use semantic surface, border, action, focus, text, success, and danger variables.
- Existing mobile rules already stack facts, actions, forms, and session panels. They are a
  reusable baseline, not permission for a new layout system.

## Proposed action sequence

### Action 1 — Repair session choices and Dashboard chart state

**Status:** Completed

**Purpose:** Correct both reported defects at their source before visual refinement makes
their presentation harder to isolate.

**Expected work:**

- Reproduce and lock the session-option issue with multiple variants belonging to one base.
- Change the session-form projection to produce distinct, variant-aware labels while keeping
  variant IDs as values and preserving create/update, invalid-form, and browser-added step
  behavior.
- Check for actual repeated variant IDs in repository/HTTP evidence; if found, repair their
  upstream source rather than filtering the rendered select.
- Make the Dashboard chart's `loading`, `ready`, and `unavailable` states render mutually
  correctly despite author CSS, retaining the complete weekly disclosure/table and useful
  fallback when Chart.js or series data is unavailable.
- Add focused ViewModel/rendered/browser tests that fail for the current defects and prove
  the corrected success and fallback behavior.

**Constraints:**

- Do not change session persistence identities, catalog ownership, or chart data semantics.
- Do not remove the accessible weekly table or the no-JavaScript/unavailable message.
- Do not begin Library visual standardization in this action except for styling required to
  make the chart state fix correct.
- Stop at Ready for review with exact verification evidence recorded.

**Implemented:**

- Changed the session-form ViewModel projection from repeated base-only labels to
  `Base exercise — Variant`, with `(Private)` appended to owner-scoped variants. Option
  values remain the original variant IDs used by session validation and persistence.
- Added focused ViewModel coverage for multiple variants of the same base, including a
  private variant, and asserted both distinct labels and preserved distinct identities.
- Added an explicit `[hidden]` author rule for the Dashboard chart status. Successful chart
  enhancement can now remove the loading status from layout even though the base status
  rule uses `display: grid`; existing unavailable-state behavior remains visible.
- Extended the existing chart component/style test to lock the CSS hidden-state contract.
  The existing component tests continue to prove ready and unavailable DOM states, and the
  server-rendered weekly disclosure/table was not changed.

**Discoveries and source verification:**

- A read-only run of the application's repository query against the configured local
  development database returned 36 rows and 36 distinct variant IDs, with zero repeated
  IDs and 18 repeated base-label groups. The reported select defect was therefore repeated
  visible labels introduced by the ViewModel projection, not duplicate option identities or
  duplicate database rows.
- Browser-added steps consume the selected option's text and variant value. Updating the
  shared create/update form projection consequently corrects both rendered options and
  client-added step summaries without changing browser logic.
- The chart's server fallback and semantic weekly table remain independent of the enhanced
  canvas, so the fix required only restoring the standard `hidden` layout behavior.

**Security, accessibility, and data-integrity evaluation:**

- No route, authorization, CSRF, validation, ownership, archive, database schema, seed, or
  persistence behavior changed. No database writes or resets were performed.
- Variant IDs remain canonical submitted values. The private marker only disambiguates
  owner-visible choices and does not expose choices outside the repository's existing
  ownership-scoped query.
- Ready chart status text is removed from both visual layout and the accessibility tree by
  the existing `hidden` attribute. When enhancement is unavailable, the status and complete
  weekly data remain exposed as before.

**Verification evidence:**

- Focused ViewModel, rendered Library/Dashboard, browser interaction, and chart component
  tests — passed 16 of 16.
- Read-only local repository-query verification — 36 rows, 36 distinct variant IDs, zero
  repeated variant IDs, and 18 repeated base-label groups.
- `npm run verify` — passed formatting, lint, server types, browser types, and all 156 tests,
  including canonical disposable PostgreSQL coverage.
- PostgreSQL HTTP application suite — passed all 49 tests, including catalog selection,
  session lifecycle behavior, ownership boundaries, and Dashboard-backed analytics.
- The first full verification attempt stopped at type checking because the new test fixture
  omitted required mapper fields. The fixture was corrected to the complete mapper shape;
  the unchanged production implementation then passed the full verification above.
- `git diff --check` passed before this status update. No dependency, database, unrelated
  visual, deployment, push, or production-data change occurred.

**Completion:** Approved on 2026-09-08. Session exercise choices now expose distinct,
variant-aware labels without changing their persisted identities, and a ready Dashboard
chart correctly hides its stale loading status while retaining accessible unavailable and
weekly-data fallbacks.

### Action 2 — Standardize and refine the Library visual presentation

**Status:** Completed

**Purpose:** Bring Exercise Templates and directly related Library surfaces into the visual
language already demonstrated by the application's established pages and shared components.

**Expected work:**

- Reconcile Exercise Template markup with the shared accordion contract so intended card,
  expanded, focus, and reduced-motion styling targets real elements and accessible IDs.
- Clarify base-family and variant hierarchy without regrouping data or changing ownership,
  archive, edit, private-variant, or selection behavior.
- Align section headings, counts, typography, spacing, surfaces, borders, radii, tags, facts,
  actions, forms, and empty states with existing page/card patterns.
- Replace compatible local hard-coded and legacy color aliases in Exercise Templates and
  directly affected Library surfaces with current semantic variables.
- Preserve and refine the existing natural/mobile layouts; verify representative narrow and
  wide widths, long labels/content, populated and empty states, and personal/admin modes.
- Add or update rendered/component/browser tests for meaningful structure, accessibility,
  responsive, focus, hidden, and reduced-motion contracts. Reuse existing tests rather than
  duplicating coverage.
- Run focused checks, `npm run verify`, and the PostgreSQL HTTP suite; inspect the final diff
  and record any manual visual checks or remaining assumptions.

**Constraints:**

- Prefer existing shared components and semantic variables; add a shared capability only if
  the verified Library need cannot be met cleanly through the existing contract.
- Do not redesign unrelated pages or introduce a new design system, dependency, image
  workflow, database change, or product behavior.
- Preserve authorization, CSRF, validation, ownership, archive, and modal behavior.
- Stop at Ready for review with evidence mapped to every goal completion criterion.

**Implemented:**

- Extended the shared accordion's existing EJS contract with opt-in root, trigger, and panel
  classes plus explicit trigger/panel IDs. Its server-rendered trigger now exposes the
  correct initial `aria-expanded`, and the owned panel provides one real region labelled by
  that trigger.
- Removed the nested Exercise Template panel and nonexistent ARIA reference. Exercise
  Template styles now target the actual shared accordion root, trigger, and panel instead
  of stale hooks.
- Added a bounded accordion transition fallback so open/close state always unlocks and a
  closing panel becomes hidden even when `transitionend` does not fire. Descendant
  transition events no longer complete the accordion accidentally.
- Clarified each card's hierarchy as base exercise, variant name, movement pattern,
  equipment, and private scope where applicable. Variant totals now use accurate singular
  or plural labels, and filtering preserves that terminology while including the visible
  base exercise name in its search source.
- Aligned Exercise Template headings, count badge, surfaces, borders, radii, spacing, facts,
  tags, actions, empty state, focus treatment, and narrow layout with the established
  Programs, Dashboard, Progress, History, and shared-component patterns.
- Replaced Exercise Template hard-coded/local palette values and the directly related
  Session Workspace aliases with the current semantic surface, border, text, action,
  success, danger, and focus variables.
- During the 390px live review, traced horizontal page expansion to the scrollable
  administrator footer navigation's intrinsic width. Added `min-width: 0` to its existing
  grid item so the navigation scrolls internally as designed instead of widening and
  clipping the Library page.

**Accessibility, behavior, and scope evaluation:**

- Accordion controls remain native buttons with keyboard activation and visible focus;
  trigger/panel names, controls, expanded state, hidden state, and reduced-motion behavior
  now share one coherent contract.
- Long base, variant, equipment, and setup content wraps rather than being truncated in the
  changed cards. Mobile facts, actions, and private forms retain their existing stacked
  behavior and 2.75rem shared control targets.
- Empty, populated, personal, administrator, global, and owner-private rendered states are
  covered. Global/private management actions and ownership filtering remain unchanged.
- No route, controller, validation, authorization, CSRF, modal, archive, persistence,
  schema, seed, dependency, or catalog-data implementation changed. The live review used
  the normal configured local administrator session without exposing its credentials.
- The footer containment rule is the only shared-page styling delta beyond the accordion;
  it was required by the observed Library overflow and preserves the footer's existing
  horizontal-scroll design.

**Verification evidence:**

- Focused accordion, Library browser/style, rendered personal/admin/empty-state, and footer
  tests — passed 15 of 15 before full verification.
- `npm run verify` — passed formatting, lint, server types, browser types, and all 161 tests,
  including canonical disposable PostgreSQL coverage.
- PostgreSQL HTTP application suite — passed all 49 tests, including global catalog
  administration, regular-user browsing/selection, private ownership, CSRF, session
  lifecycle, and analytics behavior.
- Live local Chrome review at 1440×1000 and 390×844 covered personal and administrator
  modes, expanded and collapsed cards, long setup content, global edit/archive actions,
  the Library form/section rhythm, and the fixed footer navigation. Recorded document/body
  widths were 1440/1425px at the wide viewport and 390/390px at the narrow viewport, with
  no horizontal page overflow after the containment fix.
- CSS contract tests cover semantic-token use, real accordion hooks, focus, hidden panels,
  the 45rem responsive layout, reduced motion, and footer containment. Component tests
  cover transition-event and fallback completion.
- Remaining visual assumption: an owner-private card was verified through the same rendered
  markup and responsive CSS contract rather than by creating private catalog data during
  the live browser pass. No automated numeric contrast audit was available; changed colors
  reuse the established semantic palette.
- `git diff --check` passed before this status update. Temporary local server and headless
  browser processes were stopped; screenshots remain outside the repository in
  `/private/tmp` and are not product artifacts.

**Completion:** Approved on 2026-09-08. Exercise Templates now use the shared accordion's
real accessible structure, established semantic styling and hierarchy, accurate variant
language, reliable interaction state, and verified wide/narrow layouts while preserving
personal and administrator behavior.

## Final goal review

### Completed behavior

- New/update session exercise choices use unambiguous base-and-variant labels while retaining
  canonical variant IDs and private ownership cues.
- A successfully enhanced Dashboard chart hides its stale loading status; unavailable and
  no-JavaScript paths retain useful status text and complete weekly table data.
- Exercise Template cards expose valid accordion relationships, reliable open/close state,
  clear base/variant hierarchy, semantic-token styling, consistent facts/tags/actions, and
  responsive long-content handling.
- Related Library section, Session Workspace token, filtering/count, empty-state, and footer
  containment details now align with the application's established visual patterns.

### Done-when comparison

- **Two source defects:** satisfied by the Action 1 repository-query diagnosis, ViewModel
  label repair, chart hidden-state repair, and focused success/fallback tests.
- **Shared component and tokens:** satisfied by the single shared accordion trigger/panel
  contract, repaired IDs/ARIA, removed nested panel, semantic Exercise Template palette,
  and removal of stale local hooks and aliases.
- **Visual consistency:** satisfied by the reviewed hierarchy, typography, spacing,
  surfaces, count badge, controls, actions, empty state, expanded/collapsed cards, and
  narrow/wide behavior without redesigning unrelated pages.
- **Personal/admin boundaries:** satisfied by rendered global/private states and the passing
  PostgreSQL authorization, administration, ownership, and selection coverage.
- **Automated verification:** satisfied by all 161 repository tests, all 49 PostgreSQL HTTP
  tests, formatting, lint, server/browser type checking, and final diff checks.
- **Representative layout review:** satisfied by the recorded local Chrome passes at
  1440×1000 and 390×844, including long content and the repaired zero-overflow mobile shell.
- **Scope controls:** satisfied; no dependency, database/schema/seed, product-model, broad
  redesign, push, deployment, or production-data change was introduced.

### Unmet criteria and intentionally excluded work

- **Unmet criteria:** none.
- Owner-private presentation was verified through rendered markup and the same responsive
  CSS rather than by inserting private catalog data solely for a screenshot. Changed colors
  reuse established semantic variables; no separate numeric contrast tool was available.
- New design systems, exercise imagery, catalog expansion, unrelated-page redesign,
  deployment, push, and production-data work remain intentionally excluded.

## Resume here

The goal and both actions are **Completed**. Keep these files as the completed record until
the user explicitly selects another goal; no next goal is strongly implied by the verified
repository state and current priorities.
