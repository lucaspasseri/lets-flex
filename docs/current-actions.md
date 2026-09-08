# Current Actions

## Current goal

Build and verify a secure, read-only workout-history experience for owned terminal
sessions, with program/date filtering, deterministic pagination, detailed immutable
results, and a polished responsive and accessible presentation.

Goal status: Completed on 2026-09-08 with explicit user approval.

## Status definitions

- `Pending`: proposed but not approved for implementation.
- `Active`: approved and currently being implemented.
- `Ready for review`: implemented and verified; awaiting user approval.
- `Changes requested`: reviewed and awaiting narrowly scoped corrections.
- `Completed`: reviewed, verified, and explicitly approved by the user.

## Confirmed decisions

- History is read-only and contains finished and cancelled sessions only.
- Users can filter by program and date and browse results through server-side,
  deterministic pagination.
- Details expose persisted exercise snapshots, planned prescriptions, performed sets,
  notes, and units where those records exist.
- Ownership isolation must be enforced at the query boundary for lists and details.
- The history UI must be polished, consistent, responsive, keyboard usable, and
  accessible; visual work is part of this goal rather than a later cosmetic add-on.
- Editing, reopening, deletion, export, coaching, personal-record detection, social
  features, third-party integrations, and an analytics redesign are excluded.
- No new production dependency may be added without explicit approval.
- No push, deployment, production reset, or production-data mutation is authorized by
  this plan.

## Approved action sequence

### Action 1 — Define and implement the owned history read model

**Status:** Completed

Activated on 2026-09-04 when the user approved the action plan. Implementation and
verification finished on 2026-09-04. The user approved the verified result on 2026-09-04
after the final deterministic and PostgreSQL gates passed again.

**Expected work:**

- Audit terminal workout, snapshot, note, program, and performed-set persistence and
  identify existing query contracts that can safely be reused.
- Define an explicit and testable timestamp, date-filter, and chronological-ordering
  contract for finished and cancelled sessions while retaining their distinct timing
  context.
- Add typed list, filter, pagination, and detail contracts at the repository and service
  boundaries.
- Implement ownership-scoped list queries with program/date filters, bounded pagination,
  stable ordering, and total/page metadata.
- Implement ownership-scoped detail queries that compose immutable workout snapshots
  and performed-set logs without depending on mutable template data.
- Handle cancelled, sparse, partial, and archived-program cases intentionally.
- Add focused repository and service tests for ownership, ordering, filters, pagination,
  snapshot independence, units, notes, and empty states.
- Inspect the PostgreSQL query plan and existing indexes; document evidence before
  proposing any schema or index change.

**Constraints:**

- Do not add HTTP routes or user-interface implementation in this action.
- Do not change the schema without evidence that it is necessary and a documented safe
  deployment path.
- Do not add a production dependency without explicit user authorization.
- Stop at `Ready for review` after recording verification evidence.

#### History contract and implementation

- The history calendar date is the actual UTC completion date for a finished session and
  the scheduled program date for a cancelled session. Date filters are inclusive and use
  that same status-specific date. Cancelled sessions without a scheduled date remain
  visible in an unfiltered list but sort after dated records and do not match a date range.
- Lists are newest-first by history date, then actual completion timestamp, then descending
  session ID. This deterministic tie-breaker prevents unstable ordering among records with
  equal dates. The service bounds pages to `1..10000` and page sizes to `1..50`, defaults
  to 20 items, and retains the total count on empty out-of-range pages.
- The new `workoutHistory` feature owns explicit list, filter, pagination, detail,
  repository, mapper, and service contracts. The list query returns only `finished` and
  `cancelled` records, applies user ownership in SQL before filters and pagination, and
  calculates only per-page step summaries.
- Detail lookup applies terminal-state and user-ownership predicates in the SQL query. A
  missing, non-terminal, or cross-account session therefore returns the same `null` result
  without loading a foreign row into application memory.
- Detail steps and ordered performed sets come only from `workout_step_logs` and
  `workout_set_logs`. The history query never joins mutable session-step, exercise, or
  variant templates for snapshot-backed content.
- Finished, cancelled, sparse, partially populated legacy, changed-template, and archived-
  template records map to stable application objects with explicit nullable measurements,
  notes, dates, and units.

#### Snapshot discovery and schema decision

- The audit confirmed that workout step logs already snapshot the custom step name,
  planned sets, repetitions, load, and unit, but previously retained exercise, variant,
  step-type, and session names only through mutable template relationships. That was not
  sufficient for immutable, meaningful history.
- The schema now adds nullable `session_name`, `step_type_name`, `exercise_name`, and
  `exercise_variant_name` snapshot columns. Workout creation captures the session name,
  start/cancel fills it for legacy planned rows, and atomic start-time step creation captures
  all step identity names alongside the existing prescription snapshot.
- The additive migration backfills the best names currently available for existing rows.
  If a template was renamed before this migration, PostgreSQL cannot reconstruct its
  original historical name; the migration freezes the current value rather than claiming
  unavailable accuracy.
- A `programs (user_id, id)` index fills the missing index at the ownership root. Existing
  unique indexes already support the remaining program hierarchy and per-session step-log
  lookups, so no broader index change was justified.

#### Correctness, security, and scope review

- Ownership is enforced in both list and detail SQL. Program filters remain subordinate to
  the authenticated user predicate, and foreign program/session IDs produce no rows.
- These are read-only services, so CSRF, write transactions, session rotation, rate limits,
  security tokens, and credential handling are not applicable. The services introduce no
  logging and expose no account details beyond owned history data.
- Page and page-size limits are enforced again in the service even though request parsing
  and Zod validation belong to Action 2.
- No HTTP route, controller, EJS view, CSS, browser script, external service, or dependency
  changed. No push, deployment, production reset, or production-data mutation occurred.

#### Database deployment and rollback

- Apply `db/migrations/20260904_workout_history_snapshots.sql` before deploying application
  code that reads the new columns. The migration is transactional, adds nullable columns,
  creates the owner index idempotently, and backfills only missing snapshot values.
- The schema-first order is backward compatible because the previous application ignores
  the added columns. An application rollback should leave the columns and index in place;
  dropping them would discard newly captured snapshots and is neither required nor advised.
- The backfill updates existing workout rows and may take locks proportional to those
  tables, so it should be run in a controlled deployment window and observed before the
  application deployment. `npm run db:reset` is not part of deployment and must not be used
  against production.
- The migration was applied successfully to the designated local test database after the
  schema already contained the new definitions, confirming its idempotent no-op path. No
  production schema or data was touched.

#### Verification

Passed on 2026-09-04:

- focused history unit suite — 4 tests passed for owned SQL parameters, terminal-state
  predicates, date/filter/page mapping, page and page-size bounds, empty pages, immutable
  detail composition, ordered sets, nullable values, notes, units, and indistinguishable
  missing results;
- `npm run verify` — formatting, lint, server type checking, browser type checking, and all
  119 deterministic database/unit/browser/view tests passed;
- `TEST_DATABASE_URL=postgresql://localhost/lets_flex_test node --test
--test-reporter=spec test/http/applicationPages.test.js` — all 47 PostgreSQL-backed tests
  passed, including the new owned terminal history scenario and enhanced atomic snapshot
  assertions;
- PostgreSQL history coverage verified finished-versus-cancelled date attribution, inclusive
  date and program filtering, terminal-only results, cross-account isolation, deterministic
  two-page ordering, empty out-of-range pages with retained totals, archived/renamed template
  independence, sparse cancellations, notes, planned snapshots, performed/skipped steps,
  ordered mixed-value sets, and units;
- `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` on the local test database reported 1.043 ms
  planning and 0.101 ms execution, used `programs_user_idx` at the ownership root, and used
  the existing workout-step-log unique index for page summaries. The tiny fixture naturally
  used sequential scans for empty training-day/session tables; no additional index was
  justified by the access path;
- the additive migration completed successfully against the local test schema with existing
  columns/indexes and zero backfill rows, confirming its guarded idempotent path;
- `git diff --check` passed, and final scope inspection found no route, UI, browser,
  dependency, or production change.

The first sandboxed PostgreSQL run was denied local socket access and cancelled before any
test executed. The first permitted run reached 46 of 47 passing tests and exposed that
direct PostgreSQL `DATE` fields and JSON-aggregated dates used different JavaScript
representations; the mapper was corrected to normalize both to ISO date keys. All focused,
deterministic, and PostgreSQL suites then passed.

Final approval verification on 2026-09-04 repeated `npm run verify` (119 tests plus all
formatting, lint, and server/browser type checks), the complete PostgreSQL-backed suite (47
tests), and `git diff --check`; all passed.

### Action 2 — Add the authenticated history HTTP boundary

**Status:** Completed

Activated on 2026-09-04 after the user approved Action 1. Implementation and verification
finished on 2026-09-04. The user approved the verified result on 2026-09-04 after the
deterministic and PostgreSQL gates passed again.

**Expected work:**

- Add authenticated GET routes and controllers for the history list and owned detail.
- Validate path and query input, including program, date, and bounded page values.
- Map repository results into stable list, filter, pagination, and detail page models.
- Preserve selected filters in shareable navigation and pagination URLs.
- Return the same public not-found behavior for missing and cross-account details.
- Add functional semantic EJS views and the smallest navigation entry needed to make
  history discoverable; reserve full visual refinement for Action 3.
- Add HTTP and rendering tests for authentication, ownership isolation, valid and
  malformed filters, pagination boundaries, missing details, escaping, and empty data.

**Constraints:**

- All endpoints remain read-only; do not introduce mutations or mutation controls.
- Do not broaden navigation or redesign unrelated pages.
- Stop at `Ready for review` after recording verification evidence.

#### Implementation and behavior

- Added authenticated `GET /history` and `GET /history/:workoutSessionId` endpoints. The
  router is mounted after the application-wide authentication gate and contains no
  state-changing method or control.
- Added Zod request contracts for optional owned program selection, inclusive ISO start/end
  dates, and pages bounded to `1..10000`, plus positive integer detail IDs. Blank values
  normalize predictably, unknown fields are stripped, impossible dates and reversed ranges
  return structured `400` responses, and omitted pages default to 1.
- Controllers consume only validated path/query data and delegate page composition to the
  history feature. User/profile, owned program choices, list data, and detail data remain
  separate from HTTP and presentation concerns.
- Missing, non-terminal, and cross-account details all pass through the shared
  `ResourceNotFoundError` boundary and return the same `404 Not found` response. A foreign
  or nonexistent numeric program filter produces the same empty owned list and generic
  “Unavailable program” selection without revealing whether that program exists.
- List/detail view models own all labels, formatted UTC dates/times, empty-state copy,
  snapshot titles, result summaries, and URLs. Program/date filters remain in pagination,
  detail, and back links; page 1 is omitted from canonical return links.
- Added functional semantic EJS pages with an explicitly labelled GET filter form, heading
  hierarchy, ordered session/exercise lists, status text, native `time` elements, definition
  lists, table headings/captions for performed sets, first-use/filtered/out-of-range empty
  states, and sparse cancelled-session guidance.
- Snapshot exercise names, prescriptions, performed sets, notes, and units are rendered
  with escaped EJS interpolation. History pages contain no mutation form or action.
- Added History to the primary footer and its active-page contract. The existing grid now
  accommodates five member destinations and six administrator destinations without
  changing unrelated navigation behavior.

#### Correctness, security, accessibility, and scope review

- Authentication is enforced before the history router; repository-level SQL ownership
  from Action 1 remains the authorization boundary beneath both HTTP endpoints.
- GET-only browsing performs no application or database mutation. CSRF protection for new
  history behavior is therefore not applicable; existing global middleware remains
  unchanged.
- Cross-account list filters and detail IDs disclose no names, status, timestamps, notes,
  identifiers, or existence signal. Validation errors contain field guidance only and no
  SQL or account data.
- User-authored session and step notes and snapshot labels are escaped. No history data was
  added to logs or error messages.
- Native forms, labels, selects, date inputs, links, headings, ordered lists, definition
  lists, tables, captions, row/column scopes, and `time` elements provide the functional
  accessibility foundation. Status is always present as text rather than color alone.
- Full responsive styling, visual hierarchy refinement, focus/target inspection, and
  representative browser screenshots remain intentionally assigned to Action 3. Action 2
  added no browser JavaScript, animation, modal, or essential progressive enhancement.
- No analytics redesign, workout mutation, schema change beyond the already approved Action
  1 snapshot work, production dependency, external service, push, deployment, database
  reset, or production-data change occurred.

#### Database deployment and compatibility

- Action 2 adds no schema definition. It reads the snapshot columns completed in Action 1,
  so `db/migrations/20260904_workout_history_snapshots.sql` remains a schema-first
  prerequisite before this combined application work can be deployed.
- The previous application remains compatible after that additive migration. Rolling the
  application back should leave the snapshot columns and owner index in place.

#### Verification

Passed on 2026-09-04:

- focused validation, view-model, rendered-view, and footer suite — 12 tests passed for
  sanitized/defaulted filters, reversed and malformed dates, bounded pages, positive IDs,
  retained filter/pagination URLs, unavailable program filters, first-use/filtered/page
  empty states, snapshot selection, semantic controls/content, escaped text, explicit
  statuses/dates, sparse cancellation, performed-set tables, units, and absence of mutation
  forms;
- `npm run verify` — formatting, lint, server type checking, browser type checking, and all
  128 deterministic database/unit/browser/view tests passed;
- `TEST_DATABASE_URL=postgresql://localhost/lets_flex_test node --test
--test-reporter=spec test/http/applicationPages.test.js` — all 47 PostgreSQL-backed tests
  passed. The owned history scenario now verifies anonymous return-to login redirection,
  valid list/detail rendering, active History navigation, retained URLs, terminal statuses,
  immutable snapshots, ordered sets/units, escaped notes, sparse cancellation, identical
  missing/planned/foreign `404` responses, malformed query/ID `400` responses, foreign
  filter isolation, and out-of-range recovery;
- `git diff --check` passed, and final scope inspection found no history mutation, analytics
  redesign, dependency, browser-script, production, or deployment change.

Not performed in this action:

- manual narrow/large viewport and detailed focus/contrast inspection — the routes and
  semantic functional UI are complete, while the approved responsive visual-polish and
  browser-evidence pass is Action 3.

Final approval verification on 2026-09-04 repeated `npm run verify` (128 tests plus all
formatting, lint, and server/browser type checks), the complete PostgreSQL-backed suite (47
tests), and `git diff --check`; all passed.

### Action 3 — Build and polish the workout-history presentation

**Status:** Completed

Activated on 2026-09-04 after the user approved Action 2. Implementation and verification
finished on 2026-09-04. The user approved the verified result on 2026-09-08 after the
deterministic and PostgreSQL gates passed again.

**Expected work:**

- Refine history list, filters, pagination, status treatments, and detail composition to
  match the established dark interface with a deliberate visual hierarchy.
- Clearly distinguish scheduled and completed timing and finished and cancelled states
  without relying on color alone.
- Present exercises, prescriptions, performed sets, units, and notes at useful reading
  densities on desktop and mobile.
- Implement intentional first-use empty, filtered-no-results, sparse/cancelled, missing,
  and failure states.
- Verify semantic structure, accessible labels, keyboard interaction, visible focus,
  touch targets, reduced motion, and narrow-screen overflow behavior.
- Add or update view and browser checks and capture focused responsive evidence for the
  affected pages.

**Constraints:**

- Keep the visual work scoped to workout history and its direct navigation entry.
- Do not redesign analytics or unrelated shared application surfaces.
- Stop at `Ready for review` after recording verification evidence.

#### Presentation implementation

- Added a history-only stylesheet and refined the list into a clear training-record flow:
  a compact filter panel, responsive session cards, status/timing hierarchy, exercise-result
  summaries, intentional empty states, and balanced pagination. Finished and cancelled
  cards use explicit text plus different marker shapes and border patterns, so their meaning
  does not depend on color.
- Refined detail composition into a status-led session summary followed by numbered exercise
  cards. Planned prescriptions and performed results remain distinct at scan speed, tables
  retain semantic captions and headings, long units and user notes wrap safely, and notes
  receive a consistent callout treatment without changing their content.
- The layout moves from three filter columns and split prescription/results content at large
  widths to stacked controls and content at narrow widths. Performed-set tables are contained
  in labelled, keyboard-focusable horizontal regions rather than widening the page.
- Added deliberate history-specific not-found and temporary-failure pages with a clear route
  back to history. Missing, non-terminal, and cross-account details still produce the same
  generic `404` status and identical response body, and unexpected failures disclose no
  request, account, or database details in the rendered page.
- Refined the direct History footer state with a persistent background treatment in addition
  to its indicator and `aria-current`, and kept every member navigation target at least 44px
  high on the narrow layout.

#### Accessibility, security, and scope review

- Native labels, controls, headings, lists, definition lists, time elements, table captions,
  scopes, and links remain the semantic foundation. Result summaries have accessible labels,
  scrollable tables have named regions, decorative marks are hidden, and all custom links,
  cards, table regions, and form controls have visible focus treatment.
- A true 390px browser pass measured no document-level horizontal overflow. Filter and footer
  targets measured at least 44px high, the focused session card exposed a 3px outline, and
  reduced-motion emulation produced a `0s` card transition.
- The history page remains read-only and adds no client script, mutation control, external
  call, dependency, schema change, push, deployment, reset, or production-data operation.
  Existing ownership predicates and escaped EJS interpolation remain unchanged.

#### Verification

Passed on 2026-09-04:

- focused history style, view-model, rendered-view, and footer suite — 11 tests passed for
  stylesheet loading and breakpoints, reduced-motion/focus/target/overflow contracts,
  semantic filters and results, escaped snapshots and notes, performed-set regions, units,
  sparse cancellations, generic recovery states, and active navigation;
- `npm run verify` — formatting, lint, server type checking, browser type checking, and all
  130 deterministic database/unit/browser/view tests passed;
- `TEST_DATABASE_URL=postgresql://localhost/lets_flex_test node --test
--test-reporter=spec test/http/applicationPages.test.js` — all 47 PostgreSQL-backed tests
  passed, including identical rendered `404` responses for foreign, non-terminal, and missing
  history details;
- headless Chrome inspection used a representative 1440x1100 list and true 390x844 CSS
  viewport list/detail fixture. Visual review confirmed the expected desktop density, stacked
  narrow layout, readable timing and status hierarchy, contained tables, notes, fixed footer,
  and non-color cancelled treatment. Chrome reported viewport, document, and body widths of
  390px; a focused card had a 3px outline; all inspected filter/footer controls were at least
  44px high; and reduced-motion emulation removed its transition. Screenshots were kept only
  in an untracked temporary verification directory;
- `git diff --check` passed, and scope inspection found no workout mutation, analytics
  redesign, unrelated page redesign, dependency, production, or deployment change.

Final approval verification on 2026-09-08 repeated `npm run verify` (130 tests plus all
formatting, lint, and server/browser type checks), the complete PostgreSQL-backed suite (47
tests), and `git diff --check`; all passed. The runs emitted `console.log` diagnostics from
an unrelated uncommitted change in `validateRequestQuery.js`; Action 3 did not alter or claim
that change.

### Action 4 — Verify the complete workout-history outcome

**Status:** Completed

Activated on 2026-09-08 after the user approved Action 3. Verification finished on
2026-09-08. The user approved the verified result on 2026-09-08 after the complete
deterministic and PostgreSQL-backed gates passed again.

**Expected work:**

- Exercise finished and cancelled lifecycle fixtures end to end and verify they appear
  correctly in history list, filters, pagination, and detail pages.
- Verify cross-account isolation, missing records, page boundaries, archived or changed
  templates, cancelled and sparse sessions, unit rendering, notes, and HTML escaping.
- Run the complete deterministic suite, PostgreSQL-backed HTTP coverage, focused query
  checks, and responsive browser verification.
- Record exact evidence against every goal completion criterion and identify any
  intentionally excluded or unmet work.
- Document deployment and rollback requirements for any schema change, if one was
  approved and implemented.

**Constraints:**

- Verification must not push changes, deploy the application, reset or reseed
  production, or mutate production data.
- Stop at `Ready for review` for final action approval and goal review.

#### Verification strengthening and outcome

- Extended the PostgreSQL lifecycle scenario so a workout created through the real start,
  perform, skip, and finish HTTP flow must appear in the filtered history list and owned
  detail. The assertions cover snapshot labels, completed and skipped status, mixed load
  units, retained filter navigation, and absence of mutation forms.
- Extended the real cancellation and empty-workout finish flow through history. The
  cancelled detail must explain its lack of results, the empty finished detail must explain
  its lack of exercises, and browsing both records must leave their terminal database states
  unchanged.
- No application behavior changed in this action; the only executable change is stronger
  PostgreSQL-backed acceptance coverage.

#### Goal completion criteria

- **Met — owned terminal browsing and stable order:** repository and PostgreSQL checks
  constrain history by owner and terminal status and verify the documented newest-first
  date/timestamp/ID ordering.
- **Met — filters and bounded pagination:** validation, query, view-model, and HTTP checks
  cover program/date filtering, inclusive boundaries, page limits, deterministic ties,
  retained URLs, foreign program IDs, and empty out-of-range pages.
- **Met — immutable result detail:** unit and PostgreSQL checks render snapshotted exercise
  identity and prescriptions, performed sets in stable order, nullable values, notes, and
  per-set units without joining mutable template tables.
- **Met — non-disclosing ownership boundary:** list ownership is enforced in SQL; foreign,
  planned, missing, and cross-account detail requests expose identical generic results.
- **Met — read-only behavior:** history routes expose GET only and no mutation controls. The
  lifecycle acceptance check confirms history browsing leaves finished and cancelled states
  unchanged.
- **Met — polished accessible presentation:** semantic rendered-view checks and repeated
  browser inspection cover headings, labels, lists, definition lists, tables, captions,
  time elements, non-color status cues, visible focus, 44px targets, reduced motion,
  responsive composition, and intentional empty/failure states.
- **Met — automated risk coverage:** focused, deterministic, and PostgreSQL suites jointly
  cover ownership, filters, ordering, pagination, snapshots, lifecycle-created history,
  archived/renamed templates, sparse records, escaping, notes, sets, and units.
- **Met — deployment and rollback documentation:** the additive transaction must be applied
  before the application. The previous application tolerates the added nullable columns and
  index; application rollback should leave them in place to retain captured snapshots.

No approved completion criterion remains unmet. Editing, deletion, reopening, export,
analytics redesign, coaching, personal records, sharing, integrations, and a broad site
redesign remain intentionally excluded.

#### Final verification

Passed on 2026-09-08:

- focused history query, validation, view-model, rendered-view, and style suite — 15 tests
  passed;
- complete PostgreSQL-backed HTTP suite — all 47 tests passed, including the strengthened
  finished and cancelled lifecycle-to-history paths, terminal-state preservation, ownership,
  filters, pagination, immutable snapshots, mixed units, escaping, sparse states, and
  indistinguishable missing results;
- `npm run verify` — formatting, lint, server type checking, browser type checking, and all
  130 deterministic database/unit/browser/view tests passed;
- additive migration against `lets_flex_test` — completed transactionally with all four
  columns and the owner index already present, zero backfill updates, and a successful
  commit, confirming its idempotent path;
- headless Chrome final pass — a 1440px list and true 390px detail both had document widths
  equal to their viewports. The narrow detail retained a 3px table-region focus outline,
  inspected targets were at least 44px high, reduced-motion transition duration was `0s`,
  and visual inspection found no clipping or unintended page overflow;
- `git diff --check` passed, and scope review found no production dependency, external call,
  push, deployment, reset, or production-data mutation.

Final approval gate on 2026-09-08: `npm run verify` passed all 130 tests, the complete
PostgreSQL-backed HTTP suite passed all 47 tests, and `git diff --check` passed.

The first PostgreSQL attempt was combined with a formatting command and therefore lost the
previously approved sandbox command match; connection setup was denied and all 47 tests were
cancelled before execution. The exact approved command was rerun separately and all 47
passed.

#### Deployment prerequisite and worktree note

- Apply `db/migrations/20260904_workout_history_snapshots.sql` successfully before deploying
  application code. Running the application first can produce the observed generic workout-
  history failure because the queries require the new snapshot columns. Do not use
  `npm run db:reset` for deployment.
- Unrelated `console.log` diagnostics in `src/interfaces/middleware/validateRequestQuery.js`
  appeared during the initial verification and were removed independently from this action
  before the final gate. The final `npm run verify` passed again against the resulting clean
  middleware, and no change to that file remains in the goal diff.

## Discoveries to resolve during Action 1

- Choose and document the combined history date semantics for finished versus cancelled
  sessions based on the persisted lifecycle timestamps.
- Confirm whether existing indexes support the approved ownership, filtering, ordering,
  and pagination contract at expected scale.
- Confirm which existing snapshot columns remain authoritative when the source program
  or template changes after a session becomes terminal.

## Resume here

The goal is completed. No action is active. Keep these completed goal and action records in
place until the user explicitly approves a proposed next goal; only then replace them with
the approved goal and a proposed action sequence whose first action is `Pending`.
