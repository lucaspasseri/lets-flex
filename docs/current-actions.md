# Current Actions

## Current goal

Provide consistent starter training structure for Guests and direct authenticated registrations,
and repair the Dashboard weekly-adherence expanded layout without changing ownership or history
boundaries.

## Goal status

Completed on 2026-09-11 after explicit user approval. The preceding goal is committed in
`15225f0`. Actions 1, 2, and 3 are completed; this goal is complete.

## Verified planning evidence

- `createGuest` performs the complete starter workspace transaction: it resolves the global goal and
  starter template, creates the temporary user and owned template copy, then creates the program,
  cycle, training day, and planned workout. `enterGuest` stores program/cycle/day IDs in session
  state after authentication.
- `createOrConvertRegisteredUser` currently creates only an owned copy of the global starter session
  when `guestUserId` is absent. Both local registration and first Google registration call it inside
  their identity transaction; neither currently receives hierarchy IDs for Dashboard session state.
- Guest conversion passes the existing Guest ID, uses `convertActiveGuest`, and skips the direct
  starter-copy branch. Existing HTTP coverage proves Guest-owned session/program ownership survives
  local and Google conversion; it does not yet prove the full direct-registration hierarchy.
- Dashboard data accepts only an owned session-state `programId` as its active-program selection.
  Guest entry supplies it; direct registration does not.
- The adherence partial uses native `details`, a `summary`, and a scroll-owning wrapper around a
  table with `min-width: 28rem`. It lives in a `dashboard__metrics` CSS grid alongside the heatmap.
  Current static inspection identifies an intrinsic-size interaction as a likely direction, but the
  specific overflowing box is not verified until rendered reproduction.

## Confirmed decisions

- Generalize the existing Guest starter path; do not build a separate authenticated starter model.
- A direct account gets an owned copy of the global template. A converting Guest keeps its existing
  ID and owned data; a repeat Google sign-in remains idempotent.
- Do not create, overwrite, or backfill starter structures for existing authenticated accounts.
- Treat the Dashboard table's horizontal region as intentional and keep its data readable; correct
  containment rather than hiding or truncating it.
- Each action stops at its review gate. No deployment, production mutation, push, or commit is
  authorized for this goal.

## Proposed action sequence

### Action 1 — Generalize starter-workspace provisioning for direct registrations

**Status:** Completed

**Purpose:** Give newly created direct accounts the same immediately usable starter program,
cycle/day, owned session, and planned workout that Guests receive, without duplicating Guest data
on conversion.

**Planned scope:**

- Extract or extend the existing starter provisioning sequence so it works with an already-created
  principal inside the current registration/identity transaction.
- Ensure direct local and first-time Google registrations establish the starter program selection in
  authenticated session state; retain existing redirects and session rotation.
- Preserve in-place Guest conversion, active global-template lookup, ownership restrictions, and
  all-or-nothing rollback behavior.
- Add focused unit/HTTP coverage for direct registration's full starter hierarchy, Dashboard
  visibility, conversion non-duplication, and repeat provider sign-in.

**Acceptance criteria:**

- A new direct authenticated user has exactly one appropriate owned starter session, program,
  cycle, scheduled training day, and planned workout.
- The normal Dashboard flow visibly offers that planned workout immediately after registration.
- Guest-to-authenticated conversion retains its prior hierarchy and creates no duplicate starter
  rows; global templates remain unowned and active.
- Registration failures roll back partial starter data, and existing authenticated users are not
  provisioned again.
- Focused tests pass and the action record has verification evidence.

**Implementation summary (2026-09-11):** Extracted the shared starter-workspace transaction into
`createStarterWorkspace`, reused it for Guest and direct registration flows, and carried only the
validated starter `programId`, `cycleId`, and `dayId` through local/Google registration into the
existing session-rotation boundary. Guest conversion still changes the existing principal in place
and reuses its existing session-state selection; no starter rows are created during conversion.
Global template lookup, ownership predicates, identity idempotence, and transaction rollback remain
unchanged.

**Verification evidence (2026-09-11):** `npm run format:check` passed; `npm run lint` passed;
`npm run check:types` passed; `npm run check:browser-types` passed; `npm test` passed with 227
tests, 0 failed, and 0 cancelled; `npm run test:http` passed with 63 tests, 0 failed, and 0
cancelled; `git diff --check` passed.
HTTP coverage now verifies direct local and Google hierarchy creation, Dashboard planned-workout
visibility, Guest local/Google conversion without duplicate starter rows, global-template protection,
and rollback when starter provisioning cannot resolve its canonical session. The first sandbox-only
test attempts were blocked by PostgreSQL `EPERM`; the same suites passed with the approved local
test-database permission. No schema change, database reset, production mutation, deployment, push,
or commit was performed.

**Review approval (2026-09-11):** The user explicitly approved the completed Action 1 changes.
Action 1 is complete; Action 2 remains pending and was not activated or implemented.

### Action 2 — Repair the weekly-adherence disclosure layout

**Status:** Completed

Reproduce the expanded state with long representative data, measure the constrained layout at the
actual failure width, then make the smallest accessible CSS/markup correction using the existing
analytics panel and table scroll region. Verify expanded/collapsed layout and reading order at
~390px, the measured intermediate width, and ~1280px.

**Implementation summary (2026-09-11):** Preserved the native `details`/`summary` disclosure and
the existing horizontal table-scroll behavior. Added `min-width: 0` to the disclosure grid item
and its scroll-owning region so the table's deliberate `28rem` minimum cannot contribute an
uncontained intrinsic width to the surrounding Dashboard grid. Added static CSS regression
assertions for both containment boundaries.

**Verification evidence (2026-09-11):** `node --test
public/js/components/adherenceChart/adherenceChart.test.js` passed 3 tests; `npm run
format:check` passed; `npm run lint` passed; `npm run check:types` passed; `npm run
check:browser-types` passed; `npm run test:http` passed with 63 tests, 0 failed, and 0
cancelled; `git diff --check` passed. The HTTP suite verifies the rendered Dashboard analytics
scenarios and existing disclosure markup. No browser engine is installed in this workspace, so
post-change pixel/geometry checks at ~390px, the intermediate pressure width, and ~1280px could
not be executed; native semantics, focus styling, reading order, and reduced-motion behavior were
left unchanged. This limitation is recorded for review rather than treated as rendered proof.

**Review approval (2026-09-11):** The user explicitly approved the changes and manually verified
the rendered-width behavior in a real browser. That user-performed verification satisfies the
remaining rendered-width acceptance criterion because a browser engine was unavailable in this
workspace. Action 2 is complete.

### Action 3 — Complete verification and review

**Status:** Completed

Run the relevant focused checks, `npm run format:check`, `npm run lint`, required type/browser
checks, applicable HTTP coverage, and `npm run verify`; inspect the final diff and record rendered
responsive evidence. No production mutation, deployment, push, or commit is included.

**Verification evidence (2026-09-11):** The focused adherence-chart test passed 3/3. `npm run
verify` passed formatting, lint, application types, browser types, and all 227 repository tests
(227 passed, 0 failed, 0 cancelled) when rerun with approved local PostgreSQL access. The first
sandbox-only `npm run verify` attempt reached the database tests but was cancelled by PostgreSQL
`EPERM`; it was not treated as passing. `npm run test:http` passed all 63 HTTP tests (0 failed,
0 cancelled). `git diff --check` passed, and the final diff was inspected for unrelated changes.
The user manually verified the Dashboard disclosure's rendered-width behavior in a real browser;
this satisfies the remaining rendered evidence for Action 2 because no browser engine was
available in the workspace. No schema change, database reset, production mutation, deployment,
push, or commit was performed.

**Review approval (2026-09-11):** The user explicitly approved Action 3. All three actions are
complete, and the current goal was ready for final review.

**Goal approval (2026-09-11):** The user explicitly approved the current goal. The goal is
complete. The user also explicitly authorized committing the approved changes; no push or
deployment was requested.

## Resume here

Actions 1, 2, and 3 are completed. The current goal is **Completed**. No next goal is approved;
request user direction before preparing another goal.
