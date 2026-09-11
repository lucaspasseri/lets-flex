# Current Goal

## Parent milestone

Let’s Flex should give every new user a clear, usable first workout without weakening ownership,
authentication, or historical-workout boundaries.

## Current goal

Provide the same meaningful starter training structure to direct authenticated registrations that
Guests receive, while preserving the existing Guest-to-account conversion behavior. Repair the
Dashboard weekly-adherence disclosure so expanded data stays contained and readable at supported
viewport widths.

## Status

Completed on 2026-09-11 after explicit user approval. The preceding starter-session and Library
goal was committed as `15225f0` before this plan was prepared. Actions 1, 2, and 3 are completed.

## Verified delta-first baseline

### Already satisfied

- `createGuest` atomically creates a Guest principal, owned copy of the active global starter
  session, program, cycle, training day, and planned workout session. `enterGuest` records that
  hierarchy in authenticated session state, allowing the Dashboard to select and render the
  scheduled workout immediately.
- The direct-registration path (`createOrConvertRegisteredUser`) already creates an owned copy of
  the active global starter session within the same transaction as identity creation. The global
  `Sample Full Body Session` remains shared (`owner_user_id IS NULL`) and protected.
- Guest conversion changes the existing principal in place. Its user ID and owned session/program
  data remain unchanged, and the direct-registration-only starter-copy branch is skipped.
- The Dashboard resolves its active program exclusively from session-state `programId`; without it,
  it renders no active program even when an owned Library session exists.
- The adherence details are semantic native `details`/`summary` markup. The table has a deliberate
  `28rem` minimum width inside `.analytics-table-scroll`, which owns horizontal overflow. The
  Dashboard card is a grid item with `min-width: 0`.

### Reuse

- Reuse the starter manifest, the Guest provisioning repositories and transaction sequence,
  `createOrConvertRegisteredUser`, `establishAuthenticatedSession`, existing ownership predicates,
  and the PostgreSQL HTTP harness. Generalize the starter hierarchy rather than maintaining a
  second authenticated-only implementation.
- Reuse the existing Dashboard analytics panel, native disclosure, scroll-region semantics, and
  visual tokens. Correct the layout where its available width is constrained rather than replacing
  the table or creating a separate mobile component.

### Modify

- Direct local and first-time Google registrations must receive the full starter hierarchy and its
  selection state, not just an owned Library-session copy.
- Registration/identity boundaries must carry only the necessary starter selection information to
  session establishment while preserving existing return contracts and session rotation.
- The expanded adherence disclosure needs a responsive containment correction supported by
  rendered evidence at its actual failure width.

### Add

- Regression coverage for a direct authenticated registration's program/cycle/day/owned-session/
  planned-workout structure and visible Dashboard workout, plus Guest-to-authenticated conversion
  proof that no duplicate starter data is created.
- Focused layout/interaction coverage and rendered checks for expanded adherence data at small,
  intermediate, and large widths using long representative content where applicable.

### Unknowns to resolve within the relevant action

- The precise nested element that contributed the disclosure's minimum inline size was not measured
  in this workspace. The user manually verified the repaired rendered-width behavior in a real
  browser, satisfying the responsive acceptance criterion without changing the existing semantic
  disclosure or scroll-region contract.

## Proposed action sequence

1. **Generalize starter-workspace provisioning for direct registrations.** Extract or extend the
   Guest starter hierarchy path so a new direct local or Google account receives one owned starter
   session, program, cycle, scheduled training day, planned workout, and Dashboard selection in the
   existing transaction. Preserve Guest conversion in place, global-template ownership, idempotent
   provider sign-in, and existing user-owned structures. Add focused unit/HTTP regression coverage.
2. **Repair the weekly-adherence disclosure layout.** Reproduce the expanded Dashboard state with
   representative long data; identify the constrained element; apply the smallest responsive
   correction using the existing analytics/table-scroll system; and add relevant regression
   coverage. Inspect mobile (~390px), the measured intermediate pressure width, and desktop
   (~1280px), including disclosure keyboard/focus behavior.
3. **Complete verification and review.** Run focused domain, HTTP, browser, and UI checks, then the
   required repository verification; inspect the final diff and record rendered-width evidence. Do
   not deploy, reset production data, push, or commit this goal.

## Scope

### In scope

- New-account starter hierarchy provisioning, authenticated session selection, its transactional
  ownership/idempotence boundaries, and directly related regression tests.
- Dashboard weekly-adherence disclosure structure/styles and directly related UI/browser tests.

### Out of scope

- Backfilling or overwriting existing authenticated users' programs, globally owning templates,
  workout-history redesign, a broad Dashboard redesign, schema migrations unless repository
  evidence proves one is necessary, deployment, production data, push, or commit.

## Constraints and invariants

- Never duplicate starter data when a Guest converts, and never change that Guest's ownership ID.
- Do not recreate starter data for an authenticated user who already has training structure.
- Keep the global starter template global and protected; only user copies are owned.
- Keep registration/identity creation and starter provisioning atomic. Preserve CSRF, rate limits,
  generic account-conflict responses, session rotation, validation, and secret handling.
- Keep long adherence data readable without allowing it to overflow or widen surrounding Dashboard
  layout. Preserve native disclosure semantics, visible focus, reduced-motion behavior, and the
  existing dark visual system.
- Do not reset or mutate production data. Development reset is not currently authorized.

## Done when

- A new Guest and a new direct authenticated user each receive a usable owned starter hierarchy
  with a planned workout visible through the normal Dashboard flow.
- Guest conversion preserves exactly the existing starter data and ownership, without a duplicate.
- Global templates and existing authenticated users' own training structures remain untouched.
- The expanded weekly-adherence disclosure remains contained and readable at small, intermediate,
  and desktop widths.
- Regression coverage and required verification pass, and the goal reaches Ready for final review
  before explicit approval.

## Final review assessment

- **Starter hierarchy for new Guests and direct registrations:** Satisfied. Both flows receive an
  owned starter session, program, cycle, training day, and planned workout, with Dashboard selection
  state established for direct registrations.
- **Guest conversion without duplication:** Satisfied. Local and Google conversion retains the
  existing principal and owned hierarchy; regression coverage confirms no duplicate starter rows.
- **Global-template and existing-user protection:** Satisfied. The global starter remains unowned and
  protected, and existing authenticated users are not backfilled or overwritten.
- **Responsive weekly-adherence disclosure:** Satisfied. The containment correction preserves native
  disclosure semantics and intentional table scrolling; the user manually verified rendered-width
  behavior in a real browser because no browser engine was available in the workspace.
- **Regression coverage and required verification:** Satisfied. Focused browser tests, `npm run
verify` (227/227), `npm run test:http` (63/63), formatting, lint, type checks, browser types, and
  final diff checks passed. The initial sandbox-only database attempt failed with `EPERM` and was
  rerun successfully with approved local PostgreSQL access.
- **Intentionally excluded:** production data changes, development database reset, deployment, push,
  schema migration, and broad Dashboard or workout-history redesign. The user separately authorized
  the final commit after approving the goal.

## Completion outcome

The goal is complete. New Guests and direct authenticated registrations receive the same owned
starter hierarchy without duplicating Guest data during conversion, and the Dashboard adherence
disclosure remains contained while preserving its native semantics and intentional table scrolling.
Required automated verification passed, the user supplied the remaining real-browser verification,
and the approved changes are committed by the requested final step. No production mutation,
deployment, push, or database reset was performed.

## Resume here

Actions 1, 2, and 3 are completed. The current goal is **Completed** on 2026-09-11. No next goal is
approved; request user direction before preparing another goal.
