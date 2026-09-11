# Current Actions

## Current goal

Improve the default starter workout session assigned to a Guest user and establish consistent
session-removal behavior for guest and authenticated users without inventing prescriptions or
destroying workout history.

## Goal status

All three actions and the goal are Completed as of 2026-09-11 after explicit user approval. No
deployment, production-data mutation, push, or commit is in scope.

## Status definitions

- `Pending approval` — scope is prepared but implementation is not authorized.
- `Active` — explicitly approved and currently being implemented.
- `Changes requested` — review corrections are authorized for the current action only.
- `Ready for review` — implementation and recorded verification are complete; stop for approval.
- `Completed` — verification evidence was reviewed and the action was explicitly approved.
- `Pending` — sequenced but not yet prepared for implementation approval.

## Verified planning evidence

- `createGuest` atomically provisions the guest hierarchy and assigns a Guest-owned copy of the
  shared global starter template to the Guest's `workout_sessions` row.
- The starter seed manifest has four exercises and no load fields; seed SQL therefore leaves every
  starter `session_steps.load_value` and `load_unit` null.
- Three starter variants are explicitly bodyweight catalog variants; the dumbbell row requires an
  explicit prescription decision rather than an invented value.
- The prior action now provides semantic labels for null loads and optional no-load logging; those
  improvements are retained.
- Planned workout assignments use `PATCH /workout_sessions/:id` to cancel. There is no true DELETE
  route, and cancellation is limited to planned assignments owned through the user's program.
- The session-template foreign key restricts deletion, and workout logs/history must remain intact.
- Library `sessions` already have owner-scoped visibility and an archive path. The corrected change
  adds an explicit delete operation without using the planned-workout cancellation route.

**Diagnosis outcome:**

- The previous Action 2 implementation added a Dashboard planned-session cancellation affordance;
  this was the wrong entity and has been removed. Planned-workout cancellation remains available
  through the existing Programs/Day workflow.
- Library session deletion is owner-scoped. Owned `sessions` rows are archived so their cascaded
  `session_steps` and any `workout_sessions` references remain valid.
- The seeded starter query confirms all four steps have `load_value = NULL` and `load_unit = NULL`.
  Bodyweight Box Squat, Bodyweight Push Up, and Bodyweight Glute Bridge have no equipment; One-Arm
  Dumbbell Row uses Dumbbell equipment. The current UI omits the load line for all four rather than
  explaining no external load or prescribing a row load.
- `workout_sessions.session_id` has `ON DELETE RESTRICT`; workout logs cascade from the assignment,
  and history queries retain finished/cancelled records. True deletion would conflict with the current
  data-integrity boundary.
- **Verified root-cause boundary:** the previous implementation confused reusable Library `sessions`
  with planned `workout_sessions`; the corrected action targets the Library entity and preserves the
  existing planned-workout lifecycle.

**Evidence and verification:**

- Read-only seed/FK queries confirmed the four null starter loads, Library ownership, session-step
  cascade, and `workout_sessions.session_id ON DELETE RESTRICT`.
- The prior Dashboard cancellation regression was removed as out of scope; the existing Programs/Day
  cancellation and history tests remain valid.
- No application code, production data, deployment, push, or commit was changed.

## Confirmed decisions

- The corrected deletion target is an owned Library `session`, not a Guest-owned planned workout
  assignment or the shared global template.
- This goal preserves starter prescription clarity while adding the requested Library deletion
  behavior; planned-workout lifecycle remains an existing Programs concern.
- Do not manufacture loads for exercises that legitimately have none.
- Do not delete meaningful workout history.
- One action is implemented at a time and stops at its review gate.

## Proposed action sequence

### Action 1 — Diagnose starter prescriptions and assignment lifecycle

**Status:** Completed

**Implementation approval:** Explicitly approved by the user on 2026-09-10.

**Started:** 2026-09-10 after explicit approval of the action plan.

**Ready for review:** 2026-09-10 after diagnosis and disposable local reproduction.

**Review approval:** The user explicitly approved the diagnosis on 2026-09-10.

**Completion summary:** The starter assignment and load gaps are verified, the Dashboard/Day removal
boundary is documented, and history-safe lifecycle constraints are established. Action 2 can now
implement only the supported correction.

**Completion summary:** Starter prescriptions, nullable-load rendering, ownership/status guards, and
history behavior are verified. The apparent inability to remove the Guest default assignment is not
a database deletion failure: the planned assignment can be cancelled from the Day page, while the
Dashboard does not expose that action. In-progress and terminal assignments are intentionally not
cancellable and remain in history.

Determine how the starter assignment is seeded and rendered, which exercises require a meaningful
load, how null loads should be communicated, and why the Guest default assignment appears
undeletable. Reproduce clean Guest and authenticated flows across planned, in-progress, finished,
cancelled, and history-bearing states where applicable. Compare ownership, route affordances, status
guards, foreign keys, and history preservation before selecting a repair.

**Acceptance criteria:**

- Verified starter seed and rendered load behavior are recorded.
- The reported removal failure is reproduced or its specific missing evidence is documented.
- Guest and authenticated lifecycle differences are verified rather than assumed.
- A narrow implementation delta is prepared without changing code speculatively.

### Action 2 — Correct Library session deletion and preserve valid starter improvements

**Status:** Completed

**Implementation approval:** Explicitly approved by the user on 2026-09-10.

**Started:** 2026-09-10 after explicit approval of the prepared next action.

**Review approval:** The user explicitly approved the completed changes on 2026-09-10.

**Correction review approval:** The user explicitly approved the manual-acceptance correction on
2026-09-11.

**Changes requested:** Verify authenticated ownership after a Library session is started. If the
session is user-owned, expose and complete the same archive path used for Guests while preserving
global-template protection. If the manual path uses a global template, document that distinction and
verify the correct user-owned authenticated flow rather than weakening global ownership rules.

**Changes requested (2026-09-11):** Verify why an authenticated user cannot delete the default
Library `Sample Full Body Session`. Establish whether the selected row is the protected global
template or an owned starter copy, and report the verified boundary before expanding deletion
authorization or changing the UI.

**Changes requested (2026-09-11):** Do not authorize deletion of the global template. Instead,
provision a user-owned `Sample Full Body Session` copy for direct registrations, preserve the
existing Guest copy through conversion, and prove the actual Library deletion flow for each owner
while retaining cross-account denial and global-template protection.

**Correction result (2026-09-11):** New local and Google registrations now resolve the active
global starter template and copy it, with all session steps, inside the existing account and identity
transaction. Guest conversions do not create a second copy because they retain the Guest principal's
ID and owned starter session. A failed template lookup or copy rolls the registration transaction
back, so no partial authenticated account is committed.

**Library-flow verification:** A direct local registration receives an owned four-step
`Sample Full Body Session`; selecting that row in Library renders the owner-only Delete action. A
different authenticated user receives 404 on the delete request. The owner archives the copy through
the same CSRF-protected delete form, and the global template remains `owner_user_id IS NULL` and
unarchived. The existing Guest and Guest-to-local/Google conversion regressions confirm that Guest
ownership is retained without a duplicate copy. New Google registration receives exactly one owned
copy, including on repeated Google sign-in.

**Security and data-integrity review:** Existing CSRF protection, signup rate limiting, request
validation, generic authorization failures, session rotation, and secret-handling behavior are
unchanged. No schema or migration change is needed; creation and identity attachment remain atomic,
and deletion still archives owned sessions to preserve workout references and history.

**Correction verification:** `npm run test:http` passed 62/62; `npm run verify` passed format,
lint, application types, browser types, and 227/227 tests. `git diff --check` passes. No production
data, deployment, push, commit, or database reset was performed.

**Review approval (2026-09-11):** The user explicitly approved the changes. Action 2 is complete;
Action 3 remains Pending and was not activated or implemented.

**Prior diagnosis (superseded by the correction above):** A directly registered authenticated user
previously received no starter copy: registration created only the user and authentication identity.
The seed creates
`Sample Full Body Session` as the shared global row (`owner_user_id IS NULL`). The Library view
shows its delete action only when `session.ownerUserId === currentUser.id`, and the `DELETE
/sessions/:sessionId` repository predicate uses the same owner check; therefore the UI hides the
action and a direct deletion attempt returns 404. This is intentional global-template protection,
not a started-workout or authentication failure. A Guest who becomes authenticated retains the
Guest-owned copy and can archive it; an authenticated user can likewise archive any owned Library
session, including one with an in-progress reference.

**Correction verification:** The PostgreSQL HTTP suite passed 62/62. The named `Sample Full Body
Session` regression confirms that the authenticated Library hides its delete action, a started
reference remains in progress after a denied delete, and the global template remains unarchived.
`npm run format:check`, `npm run lint`, and `git diff --check` pass.

**Correction result:** The authenticated-owned started-session flow exposes the Library delete action,
archives the owned session, preserves the in-progress workout reference, and removes the session from
the normal Library list. An authenticated user starting the shared global template has no delete
action and receives the protected 404 response; this is the expected global-template boundary and
explains the reported manual difference when that template was selected.

**Changes requested:** Manual acceptance reproduced that a Guest's seeded starter session is backed
by the shared global template (`owner_user_id IS NULL`), so the Library UI correctly hid the delete
action but did not satisfy the required Guest removal behavior. Keep the global template protected,
make the Guest starter assignment use an owned copy, and verify that deleting the started/referenced
copy archives it and removes it from that Guest's normal Library list without changing Programs/Day
cancellation.

**Correction completion:** Guest provisioning now copies the active global starter template into an
owned session within the existing transaction. Library deletion archives owned sessions (including
unreferenced ones), and the visibility query suppresses the corresponding global duplicate after a
user-owned copy is archived.

**Completion summary:** The duplicate Dashboard planned-workout action was removed, owned Library
session deletion was implemented for Guest and authenticated users, reference and ownership
protections were verified, and the valid starter load/logging improvements were preserved.

**Changes requested:** Remove the duplicate Dashboard `Remove from plan` implementation and its
dedicated tests. Investigate and implement deletion of the current user's Library `sessions` for
Guest and authenticated users, including ownership, global-template protection, references, and
history behavior. Preserve the valid load-label and no-load logging improvements.

Implement only the corrected delta: Library session deletion for Guest and authenticated owners,
with existing data-integrity rules preserved, while retaining the valid starter load/logging work.
Add regression coverage for Library deletion and access boundaries.

**Implementation summary:**

- Confirmed the previous change confused Library `sessions` with planned `workout_sessions`. Removed
  the Dashboard `Remove from plan` button, modal, view-model contract, responsive CSS, and dedicated
  regression test. Existing Programs/Day planned-workout cancellation is unchanged.
- Added an owner-scoped `DELETE /sessions/:sessionId` path exposed from selected Library session
  details for Guest and authenticated owners. Global/system sessions and another user's private
  sessions remain protected by the repository predicate and return a generic not-found response.
- Owned Library sessions are archived on removal, preserving the `workout_sessions.session_id
ON DELETE RESTRICT` boundary and historical records. Archived owned copies no longer appear in the
  normal Library list, and the matching global template remains protected.
- Preserved the valid prescribed/bodyweight/unassigned load labels, optional no-load logging, and
  numeric load/unit validation improvements.

**Regression coverage:**

- Unit/view-model/browser coverage verifies owner-only delete presentation, delete-form route setup,
  referenced-session archive behavior, and the preserved load/logging contracts.
- HTTP coverage verifies Guest deletion after starting the starter workout, authenticated archival,
  cross-account denial, global-template protection, and existing planned-workout lifecycle/history.

**Correction verification:** The transactional starter-copy path, started/referenced Guest deletion
regression, authenticated-owned started archival flow, global-template protection, and full
verification all pass.

**Verification evidence:**

- Focused domain/view/browser suite: 31 passed, 0 failed.
- PostgreSQL HTTP integration suite: 62 passed, 0 failed, 0 cancelled; the started Guest starter
  deletion flow, authenticated archival flow, ownership denial, and global-template protection all
  pass.
- `npm run verify`: format, lint, application types, browser types, and full suite passed;
  227 tests passed, 0 failed, 0 cancelled.
- Library UI review covers the selected-session destructive action and existing modal/keyboard
  contract; no Dashboard duplicate remains. No production data, deployment, push, or commit was
  changed.

### Action 3 — Complete verification and review

**Status:** Completed

**Implementation approval:** Explicitly approved by the user on 2026-09-10.

**Started:** 2026-09-10 after explicit approval of the prepared next action.

**Review pass started:** 2026-09-11 after explicit approval of the prepared next action.

**Verification completion:** 2026-09-11.

**Review approval:** The user explicitly approved final verification on 2026-09-11.

**Current activation:** The user explicitly approved Action 3 on 2026-09-11. Rerun final
verification against the current worktree and inspect its scope before returning it for review.

**Ready for review (2026-09-11):** Final verification passed. The worktree remains limited to the
approved Library deletion, owned starter-session provisioning, regression coverage, and tracking
documentation; no unrelated implementation, production mutation, deployment, push, or commit was
performed.

**Review approval (2026-09-11):** The user explicitly approved the final verification. Action 3 is
complete and the goal is Ready for final review.

**Completion summary:** Final verification was rerun after the manual acceptance correction. The
repository checks, complete PostgreSQL HTTP suite, full test suite, formatting, lint, type checks,
final diff check, and worktree scope review all passed. No remaining runtime unknowns were identified
within this goal's scope.

**Verification evidence:**

- `npm run verify`: format, lint, application types, browser types, and full suite passed; 227 tests
  passed, 0 failed, and 0 cancelled.
- `npm run test:http`: 62 passed, 0 failed, and 0 cancelled, including the started Guest starter
  deletion and authenticated archival scenarios.
- `git diff --check` passed and the final worktree contains only the approved implementation,
  regression coverage, tracking documentation, and archived prior-goal records. No production data,
  deployment, push, or commit was performed.

**Current verification evidence:** `npm run verify` passed with 227 tests, 0 failed, and 0
cancelled. `npm run test:http` passed with 62 tests, 0 failed, and 0 cancelled. `git diff --check`
passed after the final tracking update.

Run focused tests, format, lint, types, relevant browser checks, applicable full verification, inspect
the final diff, and record any remaining runtime unknowns. No production mutation, deployment, push,
or commit is authorized by this goal.

## Resume here

All actions and the goal are Completed. No next goal or action is approved.
