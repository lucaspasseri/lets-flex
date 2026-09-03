# Current Goal

## Parent milestone

Let’s Flex tracks training progress, not only training plans.

This broader milestone demonstrates secure multi-provider authentication, production
account recovery, workout-status modeling, analytics and SQL aggregation, data
visualization, and focused workout-session UX.

## Current goal

Complete and verify workout progress tracking and program analytics so an authenticated
user can safely record performed training, rely on its history, and understand progress
through polished, consistent, responsive, and accessible dashboard components.

## Status

Active. Actions 1 through 3 are completed. Action 4 was activated on 2026-09-03 after
the user approved Action 3; analytics implementation has not started.

## Revision requested

The user confirmed that this goal must include both:

- the data collection, aggregation, and components required for workout tracking and
  analytics; and
- deliberate visual improvement of the affected workout and analytics pages rather than a
  merely functional UI.

The revised plan adds explicit analytics implementation and separate visual-polish actions
for workout tracking and analytics.

## Existing implementation under review

The repository already contains:

- `planned`, `in_progress`, `finished`, and `cancelled` workout-session states;
- `planned`, `in_progress`, `performed`, and `skipped` workout-step-log states;
- session start, finish, and cancellation routes and services;
- transactional creation of step snapshots when a workout starts;
- performed-set persistence and step skip/perform routes;
- ownership-filtered repository writes through training day, cycle, program, and user;
- dashboard session controls and workout logging forms;
- program activity heatmap and scheduled-versus-finished weekly chart foundations;
- initial validation, view-model, unit, and HTTP integration coverage.

This goal reviews and extends that implementation without replacing its modular-monolith
architecture or established design system.

## User outcome

An authenticated program owner can start a planned workout, record each exercise as
performed with its actual sets or skipped, finish the workout, and rely on an immutable
history. The dashboard turns that history into useful program-level summaries and trends
presented with strong visual hierarchy and accessible alternatives. Invalid, repeated,
out-of-order, or cross-account actions fail predictably without partial changes.

## Proposed workout lifecycle contract

- A session moves from `planned` to `in_progress`, then to `finished`.
- A planned session may be cancelled; terminal sessions cannot be restarted or rewritten.
- Step results may be recorded only while their owning session is `in_progress`.
- A planned step may become `performed` or `skipped`; recorded terminal results are
  immutable through normal user actions.
- Performing a step stores the step status and its set rows atomically.
- Finishing requires every snapshotted step to be terminal; a legitimately empty started
  session may finish.
- Ownership is derived server-side. Submitted session or step identifiers must never allow
  reads or mutations across program owners.
- Concurrent or repeated submissions must preserve database invariants and return a stable
  application response instead of leaking raw PostgreSQL errors.

## Proposed analytics contract

Analytics are scoped to the authenticated user's selected program and derive from persisted
workout history rather than client-calculated totals.

- Activity: finished workout sessions grouped by their actual completion date.
- Adherence: scheduled sessions and their finished status grouped by scheduled program
  week; cancelled sessions remain distinguishable and are not counted as completed.
- Work performed: performed steps, set count, and completed repetitions derived only from
  terminal performed step logs and their set rows.
- Load volume: `reps × load` only when both values exist, grouped by load unit so kilograms
  and pounds are never summed together.
- Empty/partial data: missing loads or reps do not become zero-valued performance, and empty
  programs render an intentional empty state instead of misleading metrics.
- Ordering and boundaries: program dates and stable database ordering define time buckets;
  analytics must not leak or aggregate another user's records.

These lifecycle and analytics decisions become approved only with the revised action plan.

## Scope

- review and correct session and step state transitions;
- make session start, step performance/skip, and finish writes atomic where required;
- preserve immutable snapshots of planned step data and actual performed sets;
- enforce ownership and parent-child consistency at every read and mutation boundary;
- validate numeric set data and bounded form collections using established Zod patterns;
- implement ownership-scoped SQL aggregation and application data contracts for the
  approved analytics;
- create or refine summary, heatmap, adherence, and workload dashboard components;
- deliberately improve the affected workout and analytics presentation, including visual
  hierarchy, spacing, typography, grouping, status/progress communication, chart framing,
  action emphasis, and all relevant UI states;
- provide semantic, keyboard-accessible, non-color-only, responsive presentations and
  accessible text summaries or alternatives for visualized data;
- add focused repository/service, transformation, view-model, rendered-view, browser, and
  PostgreSQL HTTP integration coverage;
- document schema and deployment compatibility if database definitions change.

## Out of scope

- predictive recommendations, coaching advice, personal-record detection, or comparative
  social rankings;
- arbitrary reporting builders, data export, or third-party fitness integrations;
- changing training-plan, cycle, day, session-template, exercise, or variant authoring
  except where a confirmed tracking or aggregation defect requires it;
- timers, rest notifications, live synchronization, offline mode, or autosave;
- reopening or editing completed workout history;
- unrelated authentication, profile, email, navigation, or site-wide redesign work.

## Correctness and security requirements

- Every mutation and analytics read must require an authenticated owner and retain
  applicable CSRF protection for writes.
- A resource outside the current user's program boundary must behave as not found and must
  remain excluded from both mutations and aggregates.
- State-transition predicates must be enforced in the write that performs the transition,
  not only by a preceding read or UI visibility.
- Multi-row mutations must use transactions and roll back completely on failure.
- Finished, cancelled, performed, and skipped records must not be silently rewritten by
  duplicate or stale form submissions.
- Timestamps must agree with lifecycle state and remain stable after terminal transitions.
- Starting a workout must snapshot its template steps exactly once.
- Recorded set order must be deterministic and unique within a step; invalid numeric data,
  unsupported units, and excessive row counts must be rejected before persistence.
- Analytics must define denominators, date attribution, null handling, cancellation
  handling, and load-unit grouping explicitly and test them at boundary dates.
- Expected conflicts must map to intentional application behavior without exposing SQL,
  internal identifiers, or stack details to users.
- Database constraints should protect durable invariants that cannot safely rely on UI or
  service code alone.

## Visual design and accessibility requirements

- Preserve Let’s Flex’s dark, focused, energetic visual language and established palette.
- Reuse and extend shared EJS components, controls, icons, spacing, typography, and status
  markers where practical.
- Give workout progress, the current task, primary actions, and key analytics a clear
  hierarchy; avoid presenting every card or number with equal visual weight.
- Treat workout entry, completed states, summaries, charts, empty states, validation,
  loading, success, stale/conflict, and destructive actions as designed states.
- Use semantic forms and native controls with clear labels, accessible names, visible
  focus, adequate target sizes, and validation associated with the relevant fields.
- Never communicate status, chart series, or intensity through color alone.
- Give each chart a meaningful heading, explanation, legend where needed, and an accessible
  textual summary or equivalent data representation.
- Prevent unavailable transitions through both server enforcement and accurate disabled or
  absent controls.
- Ensure set-entry controls and analytics remain readable without horizontal page overflow
  at representative small and large viewport sizes.
- Respect reduced-motion preferences for any new or changed motion, and do not make
  essential behavior depend on animation or external chart-script success.

## Dependency constraint

Prefer the existing stack and chart foundation. Any new production or browser dependency
requires explicit user approval before it is added.

## Done when

- the approved session and step lifecycle is enforced atomically by the backend;
- cross-account, stale, repeated, and out-of-order actions cannot alter workout history or
  contaminate analytics;
- starting creates one stable step snapshot, performing stores validated ordered sets, and
  skipping stores no performed sets;
- a workout cannot finish with unresolved steps, while an empty started workout can finish;
- completed and cancelled history remains immutable through normal actions;
- ownership-scoped SQL produces the approved activity, adherence, performed-work, and
  unit-safe load-volume metrics with explicit, tested semantics;
- workout and analytics components provide a polished, consistent visual hierarchy and
  complete responsive states rather than a merely functional presentation;
- visualizations have accessible names, non-color cues, and text or data alternatives;
- focused automated tests cover success, ownership, invalid transitions, rollback,
  repetition/concurrency, aggregation boundaries, null/unit handling, and presentation;
- the full required verification passes, including representative responsive and keyboard
  checks, with any deployment implications recorded.
