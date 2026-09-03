# Current Actions

## Current goal

Complete and verify workout progress tracking and program analytics as defined in
`docs/current-goal.md`.

## Status definitions

- `Pending`: proposed or approved as part of the sequence but not active.
- `Pending approval`: prepared scope awaiting explicit user approval.
- `Active`: the only action that may be implemented.
- `Blocked`: cannot proceed without a decision or prerequisite.
- `Changes requested`: implementation exists but requires corrections.
- `Ready for review`: implementation and verification are finished, awaiting user approval.
- `Completed`: explicitly approved by the user.

Only one action may be `Active`. The coding agent may move an action from `Active` to
`Ready for review`; only the user may approve completion or activate the next action.

## Requested plan revision

The earlier proposal covered reliable workout data collection and basic workout UI states,
but explicitly deferred analytics queries and visualization UI. At the user's request, this
revision:

- brings analytics aggregation and dashboard components into the current goal;
- strengthens the workout UI action into a deliberate visual-design and responsive polish
  pass; and
- adds a separate action for polished, accessible analytics presentation.

## Approved action sequence

### 1. Enforce the workout-session lifecycle

Status: Completed

Activated on 2026-09-03 when the user approved the revised action plan. Approved and
completed on 2026-09-03 after final verification confirmed the lifecycle implementation
and recorded evidence.

Expected outcome:

- audit existing session start, finish, and cancellation behavior against the approved
  lifecycle contract;
- enforce allowed transitions in ownership-scoped repository writes;
- keep start-time step snapshot creation atomic and exactly once;
- require all snapshotted steps to be resolved before finish, while allowing an empty
  started session to finish;
- turn expected stale, duplicate, and conflicting requests into stable application errors;
- add focused PostgreSQL coverage for ownership, invalid transitions, rollback, terminal
  immutability, and concurrent starts;
- record any schema changes and their deployment/rollback implications;
- return Action 1 to `Ready for review` and stop.

Constraints:

- do not implement step/set form changes except what is required to make session lifecycle
  enforcement correct;
- preserve existing route shapes and redirects unless a confirmed correctness issue
  requires a focused change;
- do not start analytics or broad dashboard work in this action.

#### Implementation and findings

- Session start retains its transaction and ownership-scoped `planned` predicate. A stale
  or repeated start now becomes an intentional lifecycle conflict instead of dereferencing
  a missing update result.
- The existing partial unique index remains the source of truth for one active session per
  training day. Its expected PostgreSQL conflict is translated into a domain lifecycle
  error after rollback, without returning constraint or SQL details.
- Step snapshots are still inserted in the same transaction as session start. Concurrent
  coverage proves that one start wins, the other rolls back, and only the winning session
  receives exactly one complete snapshot.
- Finish now updates only an owned `in_progress` session and uses an atomic `NOT EXISTS`
  predicate to require every snapshotted step to be `performed` or `skipped`. The predicate
  intentionally allows a started session with no steps to finish.
- Cancellation now updates only an owned `planned` session. Active, finished, and already
  cancelled sessions are unchanged.
- Services distinguish an unavailable owned transition from a missing or unowned resource.
  Controllers return stable `409` messages for lifecycle conflicts, while missing and
  cross-account resources retain the existing indistinguishable `404` response.
- Finished and cancelled sessions reject subsequent normal lifecycle actions without
  changing their state or timestamps.

#### Correctness and security review

- Authentication and global CSRF middleware remain unchanged and continue to guard every
  lifecycle route.
- Ownership remains derived through the workout-to-training-day-to-cycle-to-program chain
  in repository reads and mutations; start, finish, and cancel are all covered against a
  second authenticated user.
- State predicates are present in the mutating SQL, so UI visibility or a preceding read is
  not the enforcement boundary.
- Start and snapshot creation roll back together. Finish and cancel are single atomic
  statements and need no additional multi-write transaction.
- No account data, SQL, constraint names, stack details, or internal identifiers are added
  to public lifecycle-conflict responses.
- Session rotation, credential secrecy, rate limiting, and security tokens are not relevant
  to these authenticated workout-state transitions.

#### Database deployment and compatibility

- No schema definition changed in Action 1. Existing enum/check constraints, the
  `one_active_workout_session_per_training_day` partial unique index, and step-snapshot
  uniqueness already provide the required database primitives.
- The updated application is compatible with the current schema and requires no schema-first
  deployment or data migration. Application rollback does not require database rollback.
- No production database, deployment, reset, reseed, email, or external service was touched.

#### Verification

Passed on 2026-09-03:

- `npm run format:check` — all files matched Prettier formatting;
- `npm run lint` — passed;
- `npm run check:types` — passed;
- `npm test` — all 102 deterministic database/unit/browser/view tests passed;
- `TEST_DATABASE_URL=postgresql://localhost/lets_flex_test node --test
--test-reporter=spec test/http/applicationPages.test.js` — all 39 PostgreSQL HTTP tests
  passed, including four lifecycle/ownership scenarios covering ordered transitions,
  unresolved steps, empty sessions, terminal immutability, exact snapshots, and concurrent
  starts;
- `git diff --check` — passed;
- final source and scope inspection found no schema, step/set form, visual, analytics,
  dependency, or production changes.

The first focused run found an enum cast missing only in test fixture SQL; after correction,
the suite passed. A later combined formatting/database command was denied local PostgreSQL
access by the sandbox and cancelled during setup; the exact approved database command was
rerun separately and all 39 tests passed.

Not run in this action:

- `npm run check:browser-types` and responsive/visual checks — no browser JavaScript, EJS,
  or CSS changed; workout presentation is reserved for Action 3;
- `npm run verify` — this action is backend-scoped, and its required checks, full
  deterministic suite, and focused PostgreSQL suite passed separately.

Final approval verification on 2026-09-03 repeated `npm run format:check`, `npm run lint`,
`npm run check:types`, `npm test` (102 passed), the PostgreSQL HTTP integration suite (39
passed), and `git diff --check`; all passed.

### 2. Make step and set logging atomic and immutable

Status: Completed

Activated on 2026-09-03 with explicit user approval. Implementation and verification
finished on 2026-09-03. Approved and completed on 2026-09-03 after final verification
confirmed the implementation and recorded evidence.

Expected outcome:

- enforce that only planned steps in an in-progress owned session can be performed or
  skipped;
- persist a performed step and all validated, deterministically ordered set rows in one
  transaction;
- ensure skipped steps create no set rows;
- reject repeat, stale, malformed, excessive, and cross-account submissions without partial
  writes or raw database failures;
- verify that planned snapshots and recorded results satisfy the approved analytics
  contract;
- add focused repository/service and PostgreSQL HTTP integration coverage;
- return Action 2 to `Ready for review` and stop.

#### Implementation and findings

- Step lookup and mutation now derive ownership through the workout session, training day,
  cycle, and program chain. Missing and cross-account step identifiers retain the same
  not-found behavior.
- Perform and skip services accept only the requested step identity and authenticated user;
  callers can no longer choose the persisted terminal status.
- The mutating SQL requires both a `planned` step and an `in_progress` parent session. It
  also rejects a step that already has set rows, protecting the terminal result against
  stale, duplicate, and inconsistent writes.
- Performing keeps the terminal step update and every submitted set insert in one database
  transaction. A failed set insert rolls back the status and completion timestamp as well
  as all set rows.
- Set rows retain deterministic one-based order from the validated submitted array. The
  existing schema rejects an empty array, more than 100 rows, invalid numeric values,
  negative or excessive values, and unsupported units before the service writes anything.
- Skipping is one atomic update and creates no set rows. Repeating either terminal action,
  or attempting the other action afterward, returns a stable `409` response without
  changing status, timestamps, or sets.
- Success redirects use the persisted step's parent session rather than trusting the
  submitted session identifier.
- Concurrent perform and skip attempts serialize at the row update: exactly one terminal
  result persists, and the losing request becomes an intentional lifecycle conflict.

#### Correctness and security review

- Authentication and global CSRF middleware remain unchanged on both step-action routes.
- Ownership and active-parent predicates are enforced by the write itself; the preceding
  ownership-scoped read exists only to distinguish not-found from lifecycle conflicts.
- Multi-write perform behavior is transactional. Skip needs no separate transaction
  because it is a single guarded statement.
- Expected stale and repeated submissions return fixed application messages. No SQL,
  constraint names, stack details, account information, or internal identifiers were
  added to public responses.
- The persisted set contract preserves nullable repetitions and load values and keeps load
  units on each row, allowing later analytics to omit incomplete volume inputs and avoid
  combining kilograms with pounds.

#### Database deployment and compatibility

- No schema definition changed in Action 2. Existing step status, set value/unit, and
  per-step set-order constraints already provide the required durable primitives.
- The application remains compatible with the current schema. No migration, production
  database action, deployment, reset, reseed, or external service operation is required.
- Application rollback requires no database rollback; terminal workout history written by
  this version remains valid under the existing schema.

#### Verification

Passed on 2026-09-03:

- `npm run format:check` — all files matched Prettier formatting;
- `npm run lint` — passed;
- `npm run check:types` — passed;
- `npm test` — all 103 deterministic database/unit/browser/view tests passed, including
  validation coverage for empty and excessive set collections;
- `TEST_DATABASE_URL=postgresql://localhost/lets_flex_test node --test
--test-reporter=dot test/http/applicationPages.test.js` — all 44 PostgreSQL HTTP tests
  passed, including ordered mixed-unit sets, skip-without-sets, parent identity, inactive
  parent, ownership isolation, repeat/cross-terminal attempts, transactional rollback, and
  concurrent perform-versus-skip coverage;
- `git diff --check` — passed before the final tracking update;
- final source and scope inspection found no schema, EJS, CSS, browser JavaScript,
  dependency, analytics, or production changes.

The rollback test intentionally forces a PostgreSQL set-insert failure and confirms the
HTTP request fails without persisting a terminal step or any sets. The first full HTTP run
passed but its verbose output exceeded the tool display limit; the same complete suite was
then rerun with the dot reporter and exited successfully.

Not run in this action:

- responsive, keyboard, and visual checks — no presentation code changed; workout visual
  work remains reserved for Action 3;
- `npm run verify` — the action's applicable static checks, full deterministic suite, and
  complete PostgreSQL HTTP suite passed separately.

Final approval verification on 2026-09-03 repeated `npm run format:check`, `npm run lint`,
`npm run check:types`, `npm test` (103 passed), the complete PostgreSQL HTTP integration
suite (44 passed), and `git diff --check`; all passed.

### 3. Polish the workout-tracking experience

Status: Completed

Activated on 2026-09-03 after the user approved Action 2. Implementation and verification
finished on 2026-09-03. The user approved the verified result on 2026-09-03 after final
verification repeated the full deterministic and PostgreSQL HTTP suites.

Expected outcome:

- align dashboard workout controls, status markers, forms, and feedback with the enforced
  lifecycle;
- deliberately improve hierarchy, spacing, typography, progress communication, set-entry
  layout, action grouping, and emphasis while preserving the established visual language;
- cover planned, active, finished, cancelled, empty, validation-error, success, and
  stale/conflict states without exposing unavailable actions;
- preserve safe submitted set values and show errors with the relevant controls;
- verify semantic structure, accessible names, keyboard/focus behavior, adequate targets,
  non-color status communication, reduced motion, and small/large viewport layouts;
- add focused view-model, rendered-view, browser behavior, and HTTP coverage;
- return Action 3 to `Ready for review` and stop.

Constraints:

- visual changes are limited to affected workout-tracking surfaces and shared components
  they directly depend on;
- do not redesign unrelated pages or implement analytics in this action.

#### Implementation and findings

- The workout view model now exposes presentation-ready state for planned, active,
  finished, cancelled, empty, inconsistent, validation-error, and lifecycle-conflict
  cases. Templates do not infer lifecycle permissions.
- Progress now counts both performed and skipped steps as resolved, while retaining the
  separate performed percentage for existing consumers. The native progress element is
  accompanied by visible completed, skipped, and remaining counts.
- Planned sessions expose only start, active sessions expose only the next planned step or
  finish when every step is resolved, and terminal sessions expose no mutation controls.
  An empty active session now correctly offers finish, matching the backend lifecycle.
- Session state has a visible text label, state-specific accent, and explicit terminal or
  empty-state copy. Every step includes visible position and status text in addition to a
  distinct icon, so state does not depend on color.
- The current step is visually promoted above supporting history. Set entry uses labelled
  fieldsets, explicit optional/required labels, numeric input constraints, clearer action
  grouping, and one full-width add-set control.
- Safe submitted set values remain populated beside their field errors. Rendering is
  bounded to 100 rows, and a rejected empty collection returns with one usable blank row.
- Dynamic set behavior moved from an inline script into the shared browser-component
  initializer. It preserves at least one row, enforces the 100-row UI limit, reindexes
  names, IDs, labels, errors, and descriptions, focuses a newly added or neighboring row,
  and announces add/remove results through a polite live region.
- Start, finish, skip, and perform controls expose a submission-pending label and disabled
  state after valid submission without making normal form submission depend on JavaScript.
- Expected dashboard lifecycle conflicts now rerender the dashboard as a focused `409`
  alert instead of degrading to a plain-text page. Validation failures use the same
  designed feedback region while retaining field-level associations.
- Shared form controls now emit `aria-describedby` only when a corresponding hint or error
  exists. This removes broken references from the workout fields and benefits their direct
  shared dependency without changing control behavior.
- Browser inspection found that the later-loaded library workspace reused the generic
  `.session-step` selector and overrode the dashboard row layout. Workout step selectors
  are now scoped to `.session-component`, restoring the intended desktop and compact
  layouts without redesigning the library.

#### Accessibility, security, and scope review

- Native headings, lists, progress, forms, fieldsets, legends, buttons, inputs, and selects
  provide the primary semantics. ARIA is limited to live feedback, alert state, current
  step, and existing icon labelling needs.
- Error feedback receives programmatic focus after navigation. Add/remove controls manage
  focus predictably, icon-only remove buttons have row-specific accessible names, and all
  changed controls retain visible shared focus styling.
- Visible controls meet the changed component's 2.75rem target size. At compact widths,
  set fields become a single column and primary/secondary actions become full width.
- Existing CSRF, authentication, validated-input, ownership, and atomic lifecycle
  enforcement remain unchanged. The rerendered conflicts use fixed application messages;
  submitted values continue to be EJS-escaped, and no SQL or account details are exposed.
- New motion was not introduced. The existing step transition is disabled under
  `prefers-reduced-motion`, and all behavior remains available without transitions or
  browser JavaScript.
- No analytics query, chart, unrelated page redesign, dependency, schema, or production
  change was included.

#### Database deployment and compatibility

- No database definition or persisted data contract changed in Action 3. No migration,
  production database action, reset, reseed, or deployment step is required.
- The UI consumes the lifecycle and set contracts completed in Actions 1 and 2. Application
  rollback has no database rollback requirement.

#### Verification

Passed on 2026-09-03:

- `npm run verify` — formatting, lint, server type checking, browser type checking, and all
  108 deterministic database/unit/browser/view tests passed;
- focused browser-component tests — 3 passed for bounded/reindexed rows, live
  announcements, focus movement, loading state, responsive rules, target size, and reduced
  motion;
- focused dashboard view-model/render tests — 5 passed for progress semantics, planned,
  active, finished, cancelled, empty, validation-error, preserved-value, and
  action-visibility states;
- `TEST_DATABASE_URL=postgresql://localhost/lets_flex_test node --test
--test-reporter=dot test/http/applicationPages.test.js` — all 45 PostgreSQL HTTP tests
  passed, including HTML lifecycle conflicts, empty active-session finish, preserved
  invalid set values, and no-write validation behavior;
- `git diff --check` — passed;
- local headless Chrome rendered and visually inspected the populated active-workout state
  at 1440×1500 and 500×2400. Computed layout checks reported no horizontal overflow,
  all 15 visible controls at least 36 CSS pixels in both dimensions, and the intended
  three-column desktop/two-column compact step layouts;
- palette contrast calculations produced 15.79:1 for primary text, 7.70:1 for muted text,
  10.47:1 for action text, 9.02:1 for success text, and 7.73:1 for primary-button text
  against their relevant base surfaces.

The first post-change HTTP run exposed test fixtures whose exercise steps lacked the
variant relationship required by the real dashboard query; the fixtures were corrected
and the complete suite passed. The browser viewport audit then exposed and verified the
fix for the cross-component `.session-step` cascade collision described above.

Not performed:

- no production browser, user account, deployment, production data, or external service
  was used; visual checks used a local deterministic component fixture and headless Chrome;
- analytics presentation checks remain intentionally reserved for Action 5.

Final approval verification on 2026-09-03 repeated `npm run verify` (108 passed), the
complete PostgreSQL HTTP suite (44 passed), and `git diff --check`; all passed. The
previously recorded responsive, visual, target-size, and contrast evidence remained
applicable because the implementation was unchanged during the approval check.

### 4. Implement ownership-scoped analytics data and SQL aggregation

Status: Active

Activated on 2026-09-03 after the user approved Action 3. Implementation has not started.

Expected outcome:

- define typed application contracts for activity, adherence, performed-work, and load-volume
  analytics;
- implement ownership-scoped SQL aggregation from workout sessions, immutable step
  snapshots, and set logs instead of loading all history for client-side counting;
- attribute activity to completion date and adherence to scheduled program week;
- keep cancelled sessions distinct, handle empty/partial values intentionally, and separate
  load volume by unit;
- produce stable chronological buckets and deterministic totals at program/date boundaries;
- add focused repository/service/transformation and PostgreSQL integration coverage for
  ownership, empty programs, cancellations, boundary dates, null values, and mixed units;
- document query assumptions, indexes, and any schema/deployment implications;
- return Action 4 to `Ready for review` and stop.

### 5. Build and polish the analytics presentation

Status: Pending

Expected outcome:

- create or refine program summary, activity heatmap, adherence trend, and workload
  components using the approved server-side analytics contracts;
- establish a deliberate information hierarchy so primary progress signals, supporting
  context, and detail are visually distinct;
- improve chart framing, labels, legends, spacing, typography, responsive composition, and
  empty/loading/error states within the established dark visual system;
- provide semantic headings, accessible chart names, non-color series/intensity cues, and
  useful textual summaries or equivalent data representations;
- keep essential analytics understandable when the chart script is unavailable;
- verify keyboard/focus behavior, contrast, reduced motion, and representative small/large
  viewport layouts;
- add focused view-model, rendered-view, browser, and HTTP coverage;
- return Action 5 to `Ready for review` and stop.

Constraints:

- do not add a production or browser dependency without explicit user approval;
- do not expand into predictive coaching, personal-record detection, arbitrary reports, or
  unrelated dashboard redesign.

### 6. Verify the complete tracking and analytics outcome

Status: Pending

Expected outcome:

- exercise an owned workout from planned through recorded steps and finished state, then
  verify its contribution to every approved analytics component;
- verify cross-account isolation, stale/repeated actions, transaction rollback, terminal
  immutability, aggregation boundaries, and accessible fallback behavior end to end;
- run the full repository verification and representative responsive/keyboard checks;
- inspect the final data, component, and visual changes for cohesion and unrelated scope;
- document deployment order, backward compatibility, rollback considerations, skipped
  checks, and intentionally deferred analytics;
- compare the result with every goal criterion and return Action 6 to `Ready for review`.

Constraints:

- do not push, deploy, reset, reseed, or otherwise modify production systems or data unless
  the user explicitly authorizes that separate step.

## Discoveries to validate

- Current session finish and cancellation writes appear ownership-scoped but do not restrict
  the prior session status in the mutation itself.
- Current step updates appear ownership-scoped but do not constrain the parent session or
  prior step status, so terminal results may be rewritable.
- Current performed-step persistence is transactional, but repeating it can collide with
  unique set-order constraints after the step status has already been targeted.
- Existing heatmap and weekly chart data are derived in application memory from all program
  sessions; the revised plan must assess correctness and replace that approach with scoped
  SQL aggregation where appropriate.
- Existing charts provide a useful foundation, but their metric semantics, accessible
  alternatives, failure states, and deliberate visual hierarchy require verification.
- Existing automated coverage exercises some ownership behavior, but complete lifecycle,
  rollback, repetition/concurrency, aggregation, responsive, and accessibility contracts
  remain to be established.

These observations are planning hypotheses, not completed findings. Each action must verify
them against the repository and tests before changing behavior.

## Resume here

Implement only Action 4: define analytics contracts, replace in-memory program analytics
with ownership-scoped SQL aggregations, add focused aggregation coverage, and document
query and schema implications. Return Action 4 to `Ready for review` and stop. Do not begin
Action 5 presentation work or Action 6 final integration.
