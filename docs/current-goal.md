# Current Goal

## Parent milestone

Let’s Flex turns durable workout history into trustworthy progress insight.

## Current goal

Build and verify a secure, read-only exercise-progress experience so authenticated users
can select an exercise from their own immutable workout history, understand how recorded
performance changes over time, and inspect unit-safe trends through polished, responsive,
and accessible visual and textual summaries.

## Status

Completed on 2026-09-08 after explicit user approval. All four approved actions are
completed.

## Completion outcome

Let’s Flex now provides an authenticated, ownership-scoped, read-only exercise-progress
experience derived from immutable finished-workout snapshots and performed sets. Users can
select their own program and historical exercise through stable bounded URLs, inspect exact
chronological counts and coverage, keep load and volume separated by recorded unit, and
follow contributing workout-history links. The server-rendered presentation is polished,
responsive, keyboard usable, and accessible without relying on charts, color, or client
scripting. All approved automated, PostgreSQL-backed, responsive-browser, security, and
scope checks passed, with no schema, dependency, deployment, or production-data change.

## Approved user outcome

An authenticated user can choose a program and an exercise represented in their completed
workouts, apply a bounded date range, and review useful trends derived from performed sets.
The experience clearly distinguishes sets, repetitions, load, and volume; never combines
incompatible units; explains incomplete data; and remains understandable without relying
on a chart, color, or pointer interaction.

## Progress contract

- Progress is read-only and derives from performed step logs and their persisted set rows in
  owned, finished workout sessions.
- Progress dates use each workout's actual UTC completion date, consistent with finished
  workout history.
- Action 1 must define one stable, testable exercise-identity contract for current, renamed,
  archived, deleted, and legacy variants using the persisted variant reference and immutable
  snapshot fields that are actually available.
- Trend points must have deterministic ordering and documented same-day aggregation
  semantics.
- Sets and repetitions are counted only where recorded. Metrics that require repetitions,
  load, or a unit exclude incomplete rows instead of treating missing values as zero.
- Load values and `repetitions × load` volume remain separated by recorded unit. The
  application does not silently convert or combine units.
- Summary and trend labels must describe recorded observations without presenting coaching,
  causal claims, or unimplemented personal-record detection.
- Program, exercise, date-range, and pagination or point-limit inputs must be bounded and
  represented by stable, shareable URLs.

## In scope

- Audit existing workout snapshots, performed-set logs, program analytics, history queries,
  indexes, and UI foundations.
- Define typed contracts for owned exercise choices, summary totals, data coverage, and
  chronological trend series.
- Add ownership-scoped SQL and service boundaries for program/exercise/date-filtered progress
  data without loading another account's rows into application memory.
- Add authenticated read-only routes, validation, controllers, page-data orchestration, and
  view models for the progress experience.
- Provide program, exercise, and date-range controls with predictable empty, invalid,
  unavailable, and sparse-data states.
- Present recorded workout occurrences, sets, repetitions, load, and volume using honest
  unit-aware summaries and trends where the underlying data supports them.
- Provide accessible textual or tabular equivalents for every visualization and useful links
  back to the contributing owned workout-history details.
- Polish the affected pages and direct navigation for hierarchy, consistency,
  responsiveness, keyboard use, reduced motion, and assistive technology.
- Add focused repository, service, validation, view-model, rendered-view, browser, and
  PostgreSQL-backed HTTP coverage.
- Document any justified schema or index change with deployment compatibility and rollback
  guidance before it is applied outside local or test environments.

## Out of scope

- Editing, reopening, deleting, or otherwise mutating workout history.
- Workout recommendations, coaching, forecasting, readiness scoring, or injury guidance.
- Personal-record badges, rankings, goals, achievements, or automated milestone detection.
- Comparing users, social features, sharing, public profiles, or leaderboards.
- Unit conversion or normalization across kilograms, pounds, bodyweight, distance, time, or
  other measurement systems.
- Import, export, wearable, health-platform, or third-party fitness integrations.
- Replacing the existing program-level dashboard analytics or broadly redesigning unrelated
  application pages.
- Adding a production or browser dependency without explicit user approval.

## Correctness and security requirements

- Every progress endpoint requires authentication.
- Program, exercise-choice, contributing-workout, summary, and trend ownership constraints
  are enforced in SQL.
- A foreign, missing, archived-only, or otherwise unavailable selection must not reveal
  another account's program, exercise, workout, or result data.
- Request input is validated and bounded using the established Zod middleware pattern.
- Progress queries and pages are read-only and cannot alter workout, program, exercise, or
  account state.
- Immutable workout snapshots and performed-set logs are the source of truth; mutable
  templates must not rewrite historical labels or measurements.
- Numeric parsing preserves the distinction between zero, missing, invalid, and unavailable
  data and does not produce `NaN`, infinity, or misleading totals.
- Trend ordering and same-day grouping use deterministic tie-breakers.
- User-authored labels and notes are escaped in HTML and excluded from sensitive error
  reporting.
- No new production dependency, external service, push, deployment, database reset, or
  production-data mutation occurs without explicit authorization.

## Visual and accessibility requirements

- Preserve the established dark, focused visual language and reuse existing controls,
  cards, typography, status treatments, and navigation patterns where practical.
- Give the selected exercise, date scope, primary trend, unit context, data coverage, and
  contributing sessions a clear hierarchy instead of presenting every value equally.
- Use semantic headings, forms, labels, descriptions, time elements, tables or lists, and
  links; use ARIA only where native semantics are insufficient.
- Charts must have accessible names, non-color series cues, readable legends where needed,
  and an equivalent textual or tabular representation of their values.
- The core insight and navigation must remain usable if optional chart scripting fails or is
  unavailable.
- Empty, partial, mixed-unit, no-load, invalid-filter, missing-selection, loading where
  applicable, and temporary-failure states must be intentional and honest.
- All controls must be keyboard operable with visible focus and practical touch targets.
- Narrow layouts must avoid page-level horizontal overflow while preserving readable labels,
  tables, charts, and values.
- New or changed motion must respect reduced-motion preferences and cannot be required for
  essential behavior.

## Dependency constraint

Prefer server-rendered HTML, existing CSS and browser utilities, and the chart foundation
already present in the application. Any new production or browser dependency requires
explicit approval before it is added.

## Done when

- An authenticated owner can select only their available program/exercise history and apply
  a bounded date range through a stable URL.
- Exercise identity, UTC date attribution, same-day grouping, ordering, null handling, and
  unit handling are explicitly defined and covered by tests.
- Owned finished workout data produces accurate chronological occurrences, set and
  repetition summaries, and separately grouped load and volume trends without combining
  units or inventing missing measurements.
- Renamed, archived, deleted, legacy, sparse, mixed-unit, and no-load history has predictable,
  non-misleading behavior.
- Foreign and unavailable selections disclose no cross-account data, and links to
  contributing workouts remain ownership scoped.
- Browsing progress performs no data mutation and does not depend on mutable templates for
  snapshot-backed historical content.
- The affected experience is polished, consistent, responsive, keyboard usable, and
  accessible, with non-color cues and a textual or tabular equivalent for each chart.
- Focused automated tests cover ownership, filters, boundaries, deterministic ordering,
  identity semantics, nulls, zeroes, mixed units, escaping, empty states, and rendering.
- The complete deterministic suite, PostgreSQL-backed HTTP coverage, and representative
  small/large viewport and keyboard checks pass with evidence recorded.
- Any schema or index change has a safe, documented deployment and rollback path; no push,
  deployment, production reset, or production-data mutation occurs without explicit
  authorization.

## Final review assessment

- Authenticated owners can select only programs and snapshot-backed exercises represented in
  their finished history, then apply bounded dates and point limits through stable GET URLs.
- Canonical exercise identity, UTC attribution, same-day and deterministic ordering, null
  and zero handling, immutable snapshot behavior, and unit separation are documented and
  verified.
- Chronological occurrences and exact performed-step, set, repetition, load, volume, and
  coverage values are presented without combining units or inventing missing measurements.
- Renamed, archived, deleted-reference, legacy, sparse, mixed-unit, and no-load histories
  have predictable tested behavior. Missing, unavailable, and foreign selections disclose
  no cross-account data, and contributing-history links remain ownership scoped.
- The read-only server-rendered experience is polished, responsive, keyboard usable, and
  accessible without depending on color, charts, client scripting, or pointer interaction.
- Focused coverage includes ownership, filters, boundaries, deterministic ordering,
  identity, incomplete and zero measurements, mixed units, escaping, empty states, CSS, and
  rendered output. Representative 390px and 1440px browser checks also cover hierarchy,
  overflow, keyboard order, visible focus, touch targets, and contrast.
- No schema or index change was needed, so deployment and rollback requirements are
  unchanged. No dependency, external service, push, deployment, production reset, reseed,
  or production-data mutation occurred.

No approved `Done when` criterion remains unmet. Intentionally excluded work remains the
documented coaching, forecasting, personal-record, goal, social, sharing, unit-conversion,
integration, export, and unrelated-redesign scope.

Final Action 4 approval verification on 2026-09-08 repeated `npm run verify` (144 tests plus
all formatting, lint, and server/browser type checks) and the complete PostgreSQL-backed
HTTP suite (48 tests); both passed. The recorded 390px/1440px visual, overflow, keyboard,
touch-target, and contrast evidence remains applicable because no implementation changed
after that inspection.
