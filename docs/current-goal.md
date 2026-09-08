# Current Goal

## Parent milestone

Let’s Flex turns durable workout results into history that users can revisit.

## Current goal

Build and verify a secure, read-only workout-history experience so authenticated users
can browse their terminal workout sessions, filter results by program and date, and
inspect immutable workout snapshots and performed results through polished,
responsive, and accessible pages.

## Status

Completed on 2026-09-08 with explicit user approval. All four approved actions and every
`Done when` criterion have passing evidence.

## Completion outcome

Let’s Flex now gives authenticated owners a secure, read-only record of finished and
cancelled workouts. Users can filter and paginate history, inspect immutable exercise and
prescription snapshots alongside performed sets, notes, and recorded units, and navigate
polished responsive pages with intentional empty, sparse, missing, and failure states.

Ownership is enforced in SQL, missing and cross-account details remain indistinguishable,
and browsing cannot mutate terminal results. Final verification passed 130 deterministic
tests, 47 PostgreSQL-backed HTTP tests, the documented desktop/mobile browser checks, and
the additive migration check without touching production.

## Approved user outcome

Authenticated users can browse completed and cancelled sessions chronologically,
filter by program and date, and inspect snapshotted exercises, performed sets, notes,
and units. The experience must preserve ownership isolation and provide stable
pagination, useful empty states, accessible interaction, responsive layouts, and a
polished presentation consistent with the existing application.

## History contract

- History includes terminal `finished` and `cancelled` sessions only. Planned and
  in-progress sessions remain part of the dashboard and workout-tracking flow.
- The first action must define and test one consistent history timestamp, filtering,
  and ordering contract while preserving visible scheduled and completion context.
- Historical exercise names and planned prescriptions come from persisted workout
  snapshots when present, rather than mutable program-template fields.
- Performed results come from persisted workout set logs, including their recorded
  values and units.
- Cancelled sessions may legitimately have no exercise snapshot or performed sets and
  must still render a useful detail state.
- Pagination must be deterministic and bounded; the server must not load an account’s
  full history merely to paginate it in application memory.
- Invalid, empty, and out-of-range filter or page states must have documented,
  predictable behavior.

## In scope

- Audit the existing schema and workout lifecycle to establish the available terminal
  session, snapshot, note, and performed-set data.
- Add typed repository and service contracts for owned history lists and details.
- Enforce account ownership in the data queries used for both lists and details.
- Add authenticated, read-only history routes, controllers, validation, and page view
  models.
- Support server-side filtering by program and date plus deterministic pagination with
  stable, shareable URLs.
- Render history list and detail pages, including navigation needed to discover them.
- Present statuses, dates, exercises, prescriptions, performed sets, notes, and units
  clearly without consulting mutable template data for historical snapshots.
- Polish the affected pages and components for visual hierarchy, consistency,
  responsiveness, empty states, keyboard use, and assistive technology.
- Add repository, service, HTTP, view, and browser-level verification in proportion to
  the behavior and risk.
- Document any necessary schema or index change and its safe deployment and rollback
  procedure before it is applied outside local or test environments.

## Out of scope

- Editing, reopening, deleting, or otherwise mutating terminal workout history.
- Exporting workout history.
- Redesigning the analytics dashboard or changing its metrics.
- Coaching recommendations, personal-record detection, social features, or sharing.
- Third-party workout, health, or fitness integrations.
- A broad site-wide visual or navigation redesign beyond what is needed for history.
- New workout-data capture unrelated to making already persisted history correct.

## Correctness and security requirements

- Every history endpoint requires authentication.
- List and detail ownership constraints are enforced in SQL, not only after rows are
  loaded.
- A missing session and another account’s session are indistinguishable at the public
  detail boundary; list results never reveal another account’s records.
- Path and query input is validated with bounded pagination and predictable date and
  program handling.
- History pages are read-only and do not alter workout, program, or account state.
- Persisted snapshots remain the historical source of truth even when a program or
  template later changes or is archived.
- User-provided notes and labels are escaped in HTML and excluded from sensitive error
  reporting.
- Ordering uses a deterministic tie-breaker so records do not jump or repeat across
  pages.
- No new production dependency may be added without explicit user authorization.

## Visual and accessibility requirements

- Preserve the established dark visual language while giving list, filter, status,
  summary, and detail content a deliberate hierarchy.
- Make scheduled and completed timing, cancelled status, exercise progression, units,
  and notes understandable without relying on color alone.
- Use semantic headings and suitable list, table, definition-list, and time markup.
- Give filters explicit labels, keyboard-operable controls, visible focus states, and
  practical touch targets.
- Provide intentional first-use empty, filtered-no-results, missing-detail, and failure
  states.
- Avoid horizontal page overflow on narrow screens and preserve readable result layouts
  at mobile widths.
- Respect reduced-motion preferences and avoid decorative motion that obstructs use.

## Done when

- An authenticated owner can browse only their finished and cancelled sessions in a
  stable chronological order.
- Program and date filters work with deterministic, bounded pagination and retain
  their state in navigation URLs.
- An owned history detail shows immutable exercise snapshots, planned prescriptions,
  performed sets, notes, and units when recorded, and handles cancelled or sparse
  sessions gracefully.
- Missing and cross-account detail requests share the same non-disclosing result, and
  list queries cannot leak another account’s data.
- Browsing history performs no data mutation and does not depend on mutable templates
  for snapshot-backed historical content.
- The affected pages are visually polished, consistent, responsive, keyboard usable,
  and accessible through semantic markup and non-color status cues.
- Automated coverage demonstrates ownership isolation, filters, ordering, pagination
  boundaries, empty and sparse states, snapshot independence, and safe rendering of
  user-authored text.
- The complete deterministic verification suite, PostgreSQL-backed HTTP coverage, and
  focused browser checks pass with evidence recorded in the action tracker.
- Any schema or index changes have documented deployment and rollback steps; no push,
  deployment, production reset, or production-data mutation occurs without explicit
  authorization.
