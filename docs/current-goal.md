# Current Goal

## Parent milestone

Let’s Flex should provide a clear, reliable starter workout for both temporary guests and
authenticated users without inventing exercise prescriptions or destroying workout history.

## Current goal

Improve starter-workout clarity while allowing Guest and authenticated users to delete their own
Library sessions. Keep planned `workout_sessions` lifecycle behavior separate from reusable Library
`sessions`, protect global templates and historical references, and avoid destroying workout history.

The user clarified that the previous implementation confused a reusable Library `session` with a
planned `workout_session`. The corrected deletion target is the Library session owned by the current
Guest or authenticated user, not the planned workout instance.

## Status

Completed on 2026-09-11 after explicit user approval. Owned starter-session copies are provisioned
for Guests and direct registrations, while the global `Sample Full Body Session` remains protected.

## Verified delta-first baseline

### Already satisfied

- Guest entry provisions a guest, starter program, cycle, training day, and workout-session assignment
  atomically in `src/features/auth/createGuest.js`.
- The assignment references a Guest-owned copy of the shared global `Sample Full Body Session`
  template. The seeded template remains protected by `owner_user_id IS NULL`; it is not the deletion
  target for this goal.
- Planned workout assignments already have a cancellation path at `PATCH /workout_sessions/:id`,
  scoped through the owning program/user. Cancellation preserves the workout row and its history;
  this is not the Library session deletion target.
- Finished and in-progress workout lifecycle rules, step snapshots, and history queries already
  distinguish terminal records from planned work. These boundaries must be reused and preserved.
- The prior action added clear prescribed/bodyweight/unassigned load labels and optional no-load
  logging; those improvements remain in scope and must be preserved.

### Reuse

- Reuse `starterWorkoutManifest`, the canonical seed/reset path, `createGuest`, workout-session
  lifecycle services/repositories, existing ownership predicates, recovery responses, and the
  PostgreSQL HTTP harness.
- Reuse nullable `session_steps.load_value`/`load_unit` semantics for exercises where load has no
  meaning unless investigation proves the domain model cannot express the required distinction.
- Preserve authentication, guest provisioning, CSRF, ownership, status transitions, cancellation,
  history snapshots, and foreign-key protections.

### Verified gaps and unknowns

- The previous implementation did confuse the concepts: it added Dashboard controls and HTTP
  coverage for `workout_sessions` cancellation instead of Library `sessions` deletion.
- The existing Library session model, ownership predicates, route registration, and foreign-key
  references must be inspected before selecting the smallest deletion behavior.

- `starterWorkoutManifest` contains four steps but no load fields, and
  `createStarterWorkoutSeedSql` inserts only name, sets, reps, type, and order. Every seeded starter
  step therefore currently has a nullable load.
- The starter variants are `Bodyweight Box Squat`, `Bodyweight Push Up`, `One-Arm Dumbbell Row`, and
  `Bodyweight Glute Bridge`. The catalog marks the first, second, and fourth as bodyweight variants;
  the row uses a dumbbell. Which starter load, if any, is appropriate must be established explicitly.
- The prior action corrected null-load presentation in Library and workout views; this behavior must
  remain intact while the deletion target is corrected.
- The assigned default workout can be cancelled only while `planned`; the existing Programs/Day
  workflow owns that behavior. Dashboard must not duplicate it. In-progress and terminal assignments
  are intentionally not cancellable.
- `workout_sessions.session_id` uses `ON DELETE RESTRICT`, while workout logs cascade from the
  workout assignment. This supports preserving historical data, but the final removal rule must be
  confirmed against guest and authenticated flows.
- It is unknown whether guest and authenticated users currently receive different UI affordances or
  lifecycle failures for the same planned/started/finished assignment.

## Proposed action sequence

1. **Diagnose starter prescriptions and assignment lifecycle.** Reproduce clean guest and
   authenticated flows, inspect starter seed data and rendered load states, exercise planned,
   in-progress, finished, and history-bearing removal cases, and document the domain rule.
   **Ready for review:** the starter data, Dashboard/Day removal boundary, ownership/status guards,
   foreign-key protection, and remaining product-choice unknown are documented; no code changed.
2. **Correct Library session deletion and preserve valid starter improvements.** Remove the duplicate
   Dashboard planned-workout action, implement owned Library-session deletion for Guest and
   authenticated users, and add regression coverage for access and references.
3. **Complete verification and review.** Run focused HTTP/domain/UI checks, repository verification,
   inspect the final diff, and stop for review. No production data, deployment, push, or commit is
   included.

## Scope

### In scope

- Guest starter workout seed/manifest, nullable load meaning and presentation, Library `sessions`
  ownership/deletion, references, history, and directly related tests.
- The smallest schema/domain change only if repository evidence proves the current model cannot
  represent the required behavior.

### Out of scope

- Dashboard “Remove from plan” duplication, planned-workout redesign, exercise catalog expansion,
  broad UX changes, unrelated lifecycle refactors, deployment, production data, push, or commit.

## Constraints and invariants

- Do not assign artificial loads to bodyweight, mobility, stretching, cardio, or other activities
  where load has no semantic meaning.
- Do not destroy completed workout history. Prefer cancellation or archival/removal from future
  planning when true deletion would invalidate meaningful records.
- Establish the rule from ownership and historical references, not guest status alone.
- Keep guest and authenticated behavior consistent where their ownership and workout state are the
  same; document any intentional difference.
- Follow the disposable development database/reset policy. Do not mutate production.

## Done when

- Starter-session creation and prescriptions are documented with verified evidence.
- Meaningful loads are present where justified, and legitimate no-load steps are clear in the UI.
- The previous `session`/`workout_session` confusion is documented and corrected.
- Guest and authenticated users can delete only their own Library sessions, while global/system
  templates and referenced history remain protected according to repository rules.
- Regression coverage protects starter creation, load presentation, ownership, status, and history
  behavior.
- Required verification passes and the goal reaches Ready for final review before explicit approval.

## Final review assessment

- **Starter-session creation and prescriptions:** Satisfied. The seeded global template remains the
  canonical source, Guests and direct registrations receive owned copies, and nullable-load meaning
  is documented and rendered.
- **Owned Library deletion with protected history/templates:** Satisfied. Owners archive their
  copies; cross-account and global-template deletion remain denied; references and history are
  preserved.
- **Session/workout-session boundary:** Satisfied. Library `sessions` use the owner-scoped archive
  path; planned `workout_sessions` retain their existing lifecycle.
- **Regression coverage and verification:** Satisfied. `npm run verify` passed 227/227 tests and
  `npm run test:http` passed 62/62; the rendered Library flow is covered for owner deletion,
  cross-account denial, and global protection.
- **Intentionally excluded:** production data changes, deployment, push, commit, broad workout
  redesign, and global-template deletion authorization.

## Completion outcome

The goal is complete. Guest and directly registered users receive owned starter-session copies,
Library deletion archives only owned sessions, and global templates, cross-account data, workout
references, and history remain protected. Final verification passed with 227 repository tests and
62 PostgreSQL HTTP tests.

## Resume here

Completed on 2026-09-11. No next goal is approved.
