# Current Actions

## Current goal

Build and verify a secure, read-only exercise-progress experience from owned immutable
workout history, with explicit identity and date semantics, unit-safe performance trends,
and polished responsive and accessible presentation.

Goal status: Completed on 2026-09-08 after explicit user approval. All four approved
actions are completed.

## Status definitions

- `Pending`: proposed but not approved for implementation.
- `Active`: approved and currently being implemented.
- `Ready for review`: implemented and verified; awaiting user approval.
- `Changes requested`: reviewed and awaiting narrowly scoped corrections.
- `Completed`: reviewed, verified, and explicitly approved by the user.

Only one action may be `Active`. Approval of this plan activates Action 1 but does not
implement it in the same response.

## Confirmed decisions

- Progress is read-only and is derived from performed sets in owned, finished workouts.
- The experience supports program, exercise, and bounded date-range selection through stable
  URLs.
- Actual workout completion dates use UTC.
- Sets, repetitions, load, and volume must reflect recorded values and clearly explain data
  coverage.
- Load and volume remain separated by recorded unit; no silent conversion or cross-unit
  totals are allowed.
- Every visual trend requires an accessible textual or tabular equivalent and non-color
  identification.
- Polished, consistent, responsive, and accessible presentation is part of the goal rather
  than deferred cosmetic work.
- Coaching, forecasts, personal-record detection, goals, social comparison, export,
  integrations, and unrelated redesign are excluded.
- Prefer the existing stack. A new production or browser dependency requires explicit user
  approval.
- No push, deployment, database reset, or production-data mutation is authorized by this
  plan.

## Proposed action sequence

### Action 1 — Define and implement the owned exercise-progress read model

**Status:** Completed

Activated on 2026-09-08 when the user approved the action plan. Implementation and
verification finished on 2026-09-08. The user approved the verified result on 2026-09-08
after the complete deterministic and PostgreSQL-backed gates passed again.

**Expected work:**

- Audit workout-step snapshots, stable template references, performed sets, completion
  timestamps, current program analytics, history read models, and relevant indexes.
- Define and document the exercise-identity contract for current, renamed, archived,
  deleted, and legacy variants, including how selection values and display labels remain
  stable without leaking mutable or foreign data.
- Define the metric contract: UTC date attribution, same-day grouping, deterministic order,
  workout occurrences, recorded sets, completed repetitions, load observations, volume,
  zero/null handling, data coverage, mixed units, and bounded date/point ranges.
- Add typed repository, mapper, and service contracts for owned exercise choices, summary
  data, chronological trend series, and contributing owned workout references.
- Implement ownership-scoped SQL using finished sessions, performed steps, immutable
  snapshots, and performed-set logs as the data source.
- Cover missing, sparse, archived, deleted-reference, renamed-snapshot, mixed-unit,
  incomplete-set, same-day, boundary-date, and foreign-account cases.
- Inspect query plans and index support before proposing a schema or index change.
- Run focused unit and PostgreSQL-backed repository/service verification and record exact
  evidence.

**Constraints:**

- Do not add routes, controllers, EJS, CSS, navigation, or browser behavior in this action.
- Do not modify workout results, templates, or program analytics.
- Do not change the schema without evidence, a compatibility/rollback assessment, and user
  approval if the change expands the approved plan materially.
- Stop at `Ready for review` after verification.

#### Exercise identity and metric contract

- A selectable identity is the exact trimmed `exercise_name` snapshot plus its exact
  trimmed `exercise_variant_name` snapshot when present. The application encodes that pair
  as a canonical reversible base64url key for later stable URLs; the key is not an
  authorization credential, and every lookup still enforces ownership in SQL.
- Renaming a mutable exercise or variant does not rewrite an existing identity. A later
  workout carrying a different snapshot label intentionally starts a separate series.
  Archiving or deleting the source template leaves existing snapshot identities usable even
  after the nullable variant reference is removed. Legacy performed rows without an
  exercise-name snapshot are excluded because they cannot identify an exercise honestly.
- Progress uses only performed steps in owned, finished workouts and attributes each result
  to the workout's UTC completion date. One occurrence combines all matching performed
  steps within one workout. Multiple workouts on the same date remain separate and are
  ordered by completion timestamp and workout-session ID.
- Date boundaries are inclusive. The summary covers the complete filtered range. The
  occurrence list returns the most recent 100 workouts by default, accepts `1..200`, and
  reorders the retained points chronologically for presentation; total and returned counts
  expose truncation explicitly.
- Recorded-set counts include every persisted set row. Repetition-derived values include
  only integer values within the existing accepted `0..10000` range. Load-derived values
  include only finite values in the existing accepted `0..1000000` range with a non-empty
  trimmed unit. Volume includes only rows satisfying all three requirements. Coverage counts
  preserve the distinction between recorded, complete, incomplete, zero-valued, and invalid
  legacy rows.
- Maximum observed load and `repetitions × load` volume are grouped by the exact trimmed
  recorded unit. Units are neither converted nor combined. Zero repetitions and zero volume
  remain valid observations; absent or non-finite numeric output maps to `null`, never
  `NaN` or infinity.

#### Read-model implementation

- Added an `exerciseProgress` feature with explicit identity, choice, filter, summary,
  occurrence, unit-series, raw-row, and service contracts.
- The choice query returns only immutable identities represented by owned performed history,
  with distinct workout counts and earliest/latest completion dates.
- The progress query applies user, program, terminal state, performed state, snapshot
  identity, and date predicates before aggregation. It returns full-range summary and
  coverage data, unit-separated measurements, a bounded chronological occurrence series,
  and owned workout-session references for future history links.
- Mapper defenses normalize PostgreSQL bigint/numeric/date representations, reject malformed
  identities and unusable rows, preserve nullable measurements, and derive unit-separated
  presentation series from the bounded occurrence records.
- Invalid keys fail before database access. Missing, foreign, or unavailable identities all
  return `null`; an available identity with no rows inside the selected dates returns an
  explicit empty progress result.

#### Correctness, security, and scope review

- Ownership is enforced from `programs.user_id` through the complete program, workout,
  step, and set join path. Foreign program IDs return no choices or progress and reveal no
  snapshot label, measurement, workout ID, or existence signal.
- Queries are read-only. CSRF, write transactions, session rotation, rate limiting, and
  credential/token handling are not applicable to this feature boundary.
- Progress does not join mutable exercises, variants, session steps, or sessions for
  snapshot identity or historical results. User-authored snapshot labels are returned as
  data only; HTML escaping belongs to the Action 2 presentation boundary.
- No route, controller, validation middleware, EJS, CSS, browser script, program-level
  analytics, workout mutation, external service, or dependency changed. No push,
  deployment, database reset, or production-data operation occurred.

#### Database and query-plan assessment

- No schema or migration change is needed. Existing relationship indexes support the owned
  traversal: `programs_user_idx`, the cycle/program unique index, the workout/training-day
  unique index, the workout-step/session unique index, and the workout-set/step unique index
  all appeared in the inspected plan.
- `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` on the representative local PostgreSQL fixture
  reported 1.344 ms planning and 4.82 ms execution. The plan used index, index-only, and
  bitmap index scans across the ownership and child relationships. Small fixture tables also
  used expected sequential scans; no additional snapshot/date index is justified by this
  evidence.
- Application deployment and rollback requirements are unchanged by Action 1.

#### Verification

Passed on 2026-09-08:

- focused exercise-progress suite — all 4 tests passed for canonical/reversible identity
  keys, owned SQL parameters and predicates, bounded point limits, typed numeric/date
  mapping, full-range summaries, occurrence truncation, chronological unit series, empty
  filtered ranges, and indistinguishable invalid/unavailable selections;
- focused PostgreSQL scenario — passed against the real schema with current, renamed,
  archived, deleted-reference, and missing legacy snapshots; exact inclusive UTC dates;
  multiple steps and workouts on one date; sparse no-set occurrences; incomplete, zero, and
  excessive legacy numeric rows; `Kilograms` and `Libra` kept separate; deterministic
  truncation; and foreign-program isolation;
- complete PostgreSQL-backed HTTP suite — all 48 tests passed;
- `npm run verify` — formatting, lint, server type checking, browser type checking, and all
  134 deterministic database/unit/browser/view tests passed;
- read-only `EXPLAIN ANALYZE` inspection passed with the plan evidence recorded above;
- `git diff --check` passed, and scope inspection found no schema, route, UI, dependency,
  mutation, external-service, push, deployment, reset, or production-data change.

Final approval verification on 2026-09-08 repeated `npm run verify` (134 tests plus all
formatting, lint, and server/browser type checks), the complete PostgreSQL-backed suite (48
tests), and `git diff --check`; all passed.

### Action 2 — Add the authenticated progress HTTP boundary and functional page

**Status:** Completed

Activated on 2026-09-08 after the user approved Action 1. Implementation and verification
finished on 2026-09-08. The user approved the verified result on 2026-09-08 after the
complete deterministic and PostgreSQL-backed gates passed again.

**Expected work:**

- Add authenticated GET route, query validation, controller orchestration, and explicit
  page-data/view-model contracts for the progress experience.
- Validate and bound program, exercise, date-range, and any pagination or point-limit input
  with predictable canonical behavior.
- Render a semantic functional page with selection controls, summaries, trend data, coverage
  explanations, contributing-workout links, and accessible non-chart equivalents.
- Add intentional first-use, no-selection, no-results, partial-data, mixed-unit,
  unavailable-selection, not-found, and temporary-failure states.
- Add a direct discoverability path using the established member navigation pattern without
  redesigning unrelated navigation.
- Preserve indistinguishable behavior for missing and cross-account resources and escape all
  user-authored content.
- Add validation, controller, view-model, rendered-view, and PostgreSQL-backed HTTP tests.

**Constraints:**

- Keep the page read-only and expose no mutation form or endpoint.
- Implement semantic, accessible functionality here; reserve deliberate visual composition
  and responsive refinement for Action 3.
- Do not add a dependency or external call without explicit approval.
- Stop at `Ready for review` after verification.

#### HTTP boundary and stable selection contract

- Added authenticated `GET /progress` routing after the established authentication guard,
  query validation, controller orchestration, and explicit page-data and page-view-model
  contracts. No progress mutation route was added.
- Program IDs are positive integers, exercise identities must be canonical Action 1 keys,
  dates must be real ISO calendar dates in inclusive ascending order, and point limits are
  bounded to `1..200` with a default of 100. Unknown query fields are stripped and invalid
  input receives the established structured 400 response.
- The program selector, exercise/date/limit selector, and clear-date action use native GET
  navigation. Their stable URLs retain only applicable validated selections; choosing a new
  program intentionally clears exercise-specific filters.
- Page-data orchestration loads the current profile and owned program, choice, and progress
  data through the existing feature boundaries. It never treats an encoded exercise key as
  authorization.

#### Functional semantic presentation

- Added a server-rendered progress page with a single page heading, labelled native forms,
  summary and coverage definition lists, exact unit-separated measurements, chronological
  occurrence rows, and links to the contributing owned workout-history details.
- The complete accessible trend is a semantic table rather than chart-dependent output.
  Workout dates use `time` elements, unit names accompany every load and volume value, and
  the horizontally scrollable table region is keyboard focusable and labelled.
- The page distinguishes no programs, choose program, unavailable program, no exercises,
  choose exercise, unavailable exercise, and no filtered results. Partial set coverage,
  mixed units, sparse occurrences, and bounded-result truncation are communicated from the
  read-model counts instead of inventing missing values.
- A generic status page provides safe recovery for missing profiles and temporary failures.
  Controller error reporting records only the error class and does not include request
  filters, snapshot labels, account data, or database details.

#### Discoverability, security, and scope

- Added `Progress` to the established authenticated footer navigation and its current-page
  contract, with the smallest grid adjustment needed for six member or seven administrator
  destinations. Deliberate visual composition and responsive refinement remain Action 3.
- Missing and foreign programs or exercises render the same generic unavailable states.
  Ownership continues to be enforced in SQL, contributing history routes apply their own
  ownership checks, and EJS escapes user-authored snapshot labels.
- The page contains no POST, PATCH, or DELETE form. PostgreSQL-backed verification confirms
  an attempted POST is rejected by the shared CSRF boundary and leaves terminal workout
  counts unchanged.
- No dependency, browser script, schema, migration, external call, push, deployment,
  database reset, or production-data operation was added or performed.

#### Verification

Passed on 2026-09-08:

- focused exercise-progress, validation, view-model, rendered-view, and navigation suite —
  all 15 tests passed;
- complete PostgreSQL-backed HTTP suite — all 48 tests passed, including authenticated and
  anonymous access, owned program/exercise selection, exact date and point-limit URLs,
  summary and coverage values, separate `Kilograms` and `Libra` output, contributing owned
  history links, unavailable foreign resources without disclosure, malformed query
  rejection, and read-only behavior;
- `npm run verify` — formatting, lint, server type checking, browser type checking, and all
  142 deterministic database/unit/browser/view tests passed;
- `git diff --check` passed. Scope inspection confirmed that no schema, dependency,
  mutation, external-service, push, deployment, reset, or production-data change occurred.

Action 3 retains representative narrow/large viewport, keyboard, contrast, touch-target,
focus, overflow, and deliberate presentation verification; Action 2 establishes the
semantic and no-script-accessible baseline those refinements will enhance.

Final approval verification on 2026-09-08 repeated `npm run verify` (142 tests plus all
formatting, lint, and server/browser type checks), the complete PostgreSQL-backed HTTP suite
(48 tests), and `git diff --check`; all passed.

### Action 3 — Polish the accessible exercise-progress presentation

**Status:** Completed

Activated on 2026-09-08 when the user approved Action 2. Implementation and verification
finished on 2026-09-08. The user approved the verified result on 2026-09-08 after the
complete deterministic and PostgreSQL-backed gates passed again.

**Expected work:**

- Establish a deliberate hierarchy for exercise identity, filters, primary trend, unit
  context, summary metrics, coverage, and contributing workouts within the established dark
  design language.
- Present unit-separated series with readable labels, legends where needed, non-color cues,
  and accessible textual or tabular equivalents.
- Ensure the primary insight and navigation remain available if optional visualization
  scripting fails or is unavailable.
- Refine empty, sparse, mixed-unit, no-load, invalid, unavailable, and temporary-failure
  states so each communicates an honest next step.
- Verify semantic structure, accessible names, keyboard operation, focus visibility, touch
  targets, contrast, reduced motion, long labels/values, and page-level overflow.
- Add focused style, rendered-view, and browser checks and inspect representative large and
  narrow viewports.

**Constraints:**

- Keep visual changes scoped to exercise progress and its direct navigation entry.
- Do not redesign the program-level dashboard, workout history, or unrelated shared pages.
- Do not add a chart or browser dependency without explicit user approval.
- Stop at `Ready for review` after verification.

#### Presentation hierarchy and states

- Added a progress-specific stylesheet, loaded through the existing main stylesheet, that
  extends the dashboard and history visual language with restrained accent gradients,
  bordered dark surfaces, established typography, and consistent form and action controls.
- The data-scope card separates program selection from exercise/date/result filters and
  explains stable URLs. On narrow screens the forms collapse into one column and primary
  controls become full width without changing their semantic order.
- The selected immutable exercise snapshot is the results hero. Workout occurrences receive
  primary numeric emphasis, while performed steps, sets, and repetitions remain legible
  supporting metrics rather than competing equally.
- Coverage and exact-unit panels use numbered shapes plus text, so their distinctions do not
  depend on color. Mixed units remain separate cards with explicit maximum-load, volume, and
  observation context; no-load content retains its honest textual state.
- Empty, unavailable, filtered-empty, not-found, and temporary-failure states use the same
  deliberate state-card pattern and clear next action. No loading state was added because
  all content is server rendered and no asynchronous browser operation exists.

#### Responsive and accessible behavior

- The chronological table remains the complete primary insight with its accessible caption.
  At narrow widths only its labelled, keyboard-focusable region scrolls horizontally; the
  page itself remains contained. Dates, session links, performed work, units, and coverage
  remain available without JavaScript, color, or pointer interaction.
- Long exercise, program, session, and unit values wrap or remain contained. The selected
  exercise metadata pill is bounded and wraps without expanding the page.
- Progress links, recovery actions, filter controls, the table region, and contributing
  history links use established visible focus treatments. Primary controls retain practical
  44-pixel minimum heights; narrow footer navigation becomes internally scrollable with
  usable item widths instead of shrinking labels or causing page overflow.
- No animation was introduced. Existing shared reduced-motion behavior remains effective,
  and the progress stylesheet retains an explicit reduced-motion boundary for future-safe
  table presentation.
- No chart or browser script was added: the page is complete when scripting is unavailable,
  so no chart fallback, legend, or new dependency is necessary.

#### Verification

Passed on 2026-09-08:

- focused progress CSS, rendered-page, view-model, and footer suite — all 11 tests passed for
  stylesheet loading, responsive breakpoints, internal table overflow, focus selectors,
  touch-target sizing, long-value containment, numeric presentation, non-color markers,
  semantic hierarchy, safe empty/recovery states, no-script output, and navigation;
- `npm run verify` — formatting, lint, server type checking, browser type checking, and all
  144 deterministic database/unit/browser/view tests passed;
- complete PostgreSQL-backed HTTP suite — all 48 tests passed, including the rendered
  progress route against owned immutable history and existing security boundaries;
- headless Chrome inspection used a representative populated, sparse, mixed-unit, long-label
  fixture at emulated 390px and 1440px widths. At 390px, document `scrollWidth` and
  `clientWidth` were both 390px while the table alone exposed 768px of internally scrollable
  content within a 292px region. At 1440px, document widths were both 1440px and the table
  fit its 1069px region without scrolling;
- real Tab traversal at both widths reached program, exercise, date and limit controls,
  submit and clear actions, the table region, and contributing history links in document
  order. Relevant custom controls and links exposed visible focus, mobile primary controls
  measured at least 44px high, and mobile history links measured 45px high in the long-label
  fixture;
- palette contrast calculations reported 15.79:1 for primary text on the page, 6.99:1 for
  muted text on surfaces, 10.47:1 for action text on surfaces, 7.73:1 for dark text on action
  backgrounds, and 9.02:1 for success accents on the page;
- visual screenshot inspection at both representative sizes confirmed clear hierarchy,
  readable mixed-unit cards, honest sparse data, contained long labels, and the intended
  desktop-to-single-column adaptation. `git diff --check` also passed.

No data contract, route behavior, schema, dependency, mutation, external service, push,
deployment, database reset, or production-data operation changed in Action 3.

Final approval verification on 2026-09-08 repeated `npm run verify` (144 tests plus all
formatting, lint, and server/browser type checks), the complete PostgreSQL-backed HTTP suite
(48 tests), and `git diff --check`; all passed. The recorded 390px/1440px visual, overflow,
keyboard, touch-target, and contrast evidence remained applicable because no implementation
changed between that inspection and approval.

### Action 4 — Verify the complete exercise-progress outcome

**Status:** Completed

Activated on 2026-09-08 when the user approved Action 3. Implementation and verification
finished on 2026-09-08. The user approved the verified result on 2026-09-08 after the
complete deterministic and PostgreSQL-backed gates passed again.

**Expected work:**

- Exercise a real owned workout lifecycle through performed sets, finish, progress
  aggregation, filters, visual summaries, accessible alternatives, and contributing-history
  links.
- Verify cross-account isolation, missing/unavailable selections, exact date boundaries,
  deterministic same-day ordering, renamed/archived/deleted references, sparse and legacy
  data, zero/null values, mixed units, escaping, and read-only behavior.
- Run the complete deterministic suite, PostgreSQL-backed HTTP coverage, focused query
  checks, and representative responsive and keyboard browser verification.
- Record criterion-by-criterion evidence against the current goal and identify any unmet or
  intentionally excluded work.
- Document deployment and rollback requirements for any approved schema or index change.

**Constraints:**

- Verification must not push changes, deploy the application, reset or reseed production,
  or mutate production data.
- Stop at `Ready for review` for final action approval and goal review.

#### Complete lifecycle and security verification

- Strengthened the PostgreSQL-backed end-to-end scenario so one owned workout created
  through the application flows through performed mixed-unit sets, a skipped step, finish,
  the exercise-progress service, a stable filtered progress URL, and contributing workout
  history. The scenario asserts the immutable snapshot identity, UTC finish date, exact
  summary counts, complete measurement coverage, and separately calculated `Kilograms` and
  `Libra` maximum-load and volume values.
- The rendered selected-program and selected-exercise pages expose only snapshot-backed
  owned choices and data. The exact-date filter includes its boundary; an out-of-range date
  renders the intentional no-results state. The complete semantic table includes unit-safe
  values and owned history links without a chart, mutation form, or progress mutation
  endpoint.
- Attempts to mutate the terminal session remain rejected, and a repeated progress read is
  byte-for-byte equivalent at the service contract. Existing focused and PostgreSQL tests
  cover foreign and unavailable selections, malformed and bounded filters, renamed,
  archived, deleted-reference and legacy snapshots, deterministic same-day ordering,
  sparse and no-set occurrences, incomplete and zero measurements, mixed units, escaping,
  and read-only behavior.

#### Final presentation correction

- Real-browser inspection found that a short contributing-history link inherited only a
  15-pixel line box even though a long wrapping link happened to meet the touch-target
  requirement. Progress-table history links now use an inline-flex 44-pixel minimum height,
  with a focused stylesheet regression assertion. No other shared or unrelated page was
  redesigned.

#### Criterion-by-criterion assessment

- Owned program and exercise choices, bounded dates and point limits, and stable shareable
  URLs are implemented and verified.
- Canonical and reversible snapshot identity, actual UTC completion dates, deterministic
  occurrence ordering, same-day semantics, null and zero handling, and unit separation are
  documented in the contracts and covered by focused and PostgreSQL tests.
- Finished owned history produces exact chronological occurrence, performed-step, set, and
  repetition counts plus load and volume series separated by unit. Missing measurements are
  reported through coverage rather than invented as zero.
- Renamed, archived, deleted-reference, legacy, sparse, mixed-unit, and no-load histories
  have explicit, non-misleading results and test coverage.
- SQL enforces ownership for choices and progress; contributing history performs its own
  ownership check. Missing and foreign selections share unavailable behavior and disclose
  no cross-account data.
- Progress is read-only and derives historical identity and measurements from immutable
  workout snapshots and performed set logs rather than mutable templates.
- The server-rendered experience is polished, responsive, keyboard usable, and accessible.
  Its semantic table is the complete non-color, no-script presentation, so no chart
  equivalent or client dependency is required.
- Focused, deterministic, PostgreSQL-backed, browser, touch-target, focus, overflow, and
  contrast checks all pass as recorded below. Every approved `Done when` criterion is met.
- No schema or index change was justified or made, so deployment and rollback requirements
  are unchanged. No push, deployment, production reset, reseed, or production-data mutation
  occurred.

#### Verification

Passed on 2026-09-08:

- focused exercise-progress feature, validation, view-model, rendered-view, stylesheet, and
  footer suite — all 17 tests passed;
- `npm run verify` — formatting, lint, server type checking, browser type checking, and all
  144 deterministic database/unit/browser/view tests passed;
- complete PostgreSQL-backed HTTP suite — all 48 tests passed, including the strengthened
  owned lifecycle through exercise progress and history, exact boundary and mixed-unit
  assertions, terminal immutability, cross-account isolation, and the established
  authentication and mutation protections;
- representative headless Chrome checks at 390px and 1440px confirmed no page-level
  horizontal overflow. At 390px the 768px table remained inside its 292px independently
  scrollable region; at 1440px it fit its 1069px region;
- real Tab traversal at both widths followed program, exercise, date and limit controls,
  show and clear actions, the table region, and both history links in logical order with
  visible focus. Mobile controls measured 44px or 48px high and both short and long history
  links measured at least 44px after the correction;
- contrast remained 15.79:1 for primary text on the page, 6.99:1 for muted text on surfaces,
  10.47:1 for action text on surfaces, 7.73:1 for dark text on action backgrounds, and
  9.02:1 for success accents on the page;
- `git diff --check` passed. Scope inspection found no change to `package.json`,
  `package-lock.json`, or `db/schema.js` and no external call, push, deployment, reset,
  reseed, or production-data operation.

No approved completion criterion remains unmet. Intentionally excluded work remains the
goal's documented coaching, forecasting, personal-record, goal, social, sharing, unit
conversion, integration, export, and unrelated-redesign scope. Production deployment and
manual production verification were neither required nor authorized.

Final approval verification on 2026-09-08 repeated `npm run verify` (144 tests plus all
formatting, lint, and server/browser type checks) and the complete PostgreSQL-backed HTTP
suite (48 tests); both passed. Action 4 is completed with the full owned workout-to-progress
lifecycle, security boundaries, exact aggregation, accessible presentation, responsive
browser behavior, and scope constraints verified.

## Discoveries to resolve during Action 1

- Decide whether persisted variant IDs, snapshot exercise/variant names, or a documented
  composite/fallback key define continuity when templates are renamed, archived, deleted, or
  absent in legacy rows.
- Decide the most useful truthful trend grain when multiple performed instances of the same
  exercise occur on one UTC completion date.
- Confirm which load and volume summaries remain meaningful with multiple recorded units and
  incomplete set rows.
- Confirm whether existing ownership and history indexes support the proposed filters and
  chronological series at expected scale.

## Resume here

The current goal is completed. Wait for explicit approval of the proposed next goal before
replacing `docs/current-goal.md` or resetting this action plan; do not begin planning or
implementation yet.
