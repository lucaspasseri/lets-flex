# Current Goal

## Parent milestone

Let’s Flex gives first-time and guest users an immediate, understandable, and visually
confident introduction to planning and completing a workout.

## Current goal

Improve the guest and first-use experience by providing a short, representative starter
workout, presenting stored program-goal identifiers as human-readable labels, and increasing
the existing logo’s visual presence without broad product or visual redesign.

## Status

Completed on 2026-09-09 after explicit user approval. Actions 1, 2, and 3 are Completed and every
`Done when` criterion has recorded verification evidence.

## Completion outcome

New guests now enter an isolated starter program with a realistic four-step workout that flows
through the existing workout and reporting lifecycle. Programs-page goal names are readable while
their persisted identifiers remain unchanged. The established shared logo has greater visual
presence and stronger balanced arms across authenticated and authentication layouts, with live
responsive, focus, reduced-motion, and regression verification complete.

## Approved user outcome

A newly created guest arrives in a private temporary workspace with a startable workout
based on the existing global sample session. That session contains several useful catalog
exercises and behaves like any other workout through start, step logging, completion,
Dashboard, Progress, and conversion to a permanent account. Program goals retain their
existing database identities while all current Programs-page presentations use readable
labels such as `Weight Loss` rather than `weight_loss`. The established Let’s Flex logo is
larger and its two arm shapes are more prominent, while the authenticated mobile header,
responsive rail, short-height layout, and authentication presentation remain balanced and
unclipped.

## Why now

- **Verified user priority:** the user explicitly selected guest onboarding, goal-label
  presentation, and logo presence as one focused first-use improvement.
- **Verified guest gap:** `createGuest` currently inserts only a temporary `users` row.
  There is no guest-specific program, cycle, training day, or planned workout, so the
  Dashboard reached after guest entry shows `NO ACTIVE PROGRAM`.
- **Verified reusable session:** the canonical seed contains one read-only global
  `Sample Full Body Session`, visible to guests and safe to link into an owned training day,
  but it contains only one `Bodyweight Push Up` step.
- **Verified catalog foundation:** the current catalog already provides 18 base exercises
  and 36 distinct global variants, including suitable push, pull, squat, hinge, lunge, and
  rotation choices. No new exercise or variant is needed for the starter workout.
- **Verified presentation defect:** goals are stored as stable identifiers including
  `weight_loss` and `general_fitness`. Both the Create Program select and program switcher
  currently render `goal.name` directly; the submitted form value is the numeric goal ID,
  not the displayed name.
- **Verified logo baseline:** one shared 240×240 inline SVG is used by the authenticated
  chrome and login page. Current wrappers are 3.75rem on mobile, 5.5rem in the normal rail,
  4.5rem in the short-height rail, and 3.5rem on authentication pages. The arm artwork is
  part of the shared SVG, so its prominence can be changed once without creating variants.

## Delta-first baseline

### Already satisfied

- Guest principals are distinct, private, expire after 15 days, are protected by CSRF and
  creation rate limiting, and can be converted in place without losing owned data.
- Sessions, workout sessions, step-log snapshots, set logs, completion rules, Dashboard
  summaries, History, and Progress already support multiple ordered exercise steps.
- Global sessions and global exercise variants are visible to guests, while programs,
  cycles, days, workouts, and private variants remain owner-scoped.
- The Create Program form validates and persists a numeric `goalId`; goal identifiers do
  not need to change for display.
- The shared logo preserves one visual identity across authenticated and authentication
  layouts, includes reduced-motion behavior, and allows SVG overflow.
- The responsive application chrome already owns mobile, tablet/desktop, and short-height
  sizing contracts and has focused structure/style/interaction coverage.

### Reuse

- The canonical `Sample Full Body Session` rather than a duplicated guest-owned template.
- Existing catalog variants, `exercise` step type, session-step ordering, workout snapshot
  creation, logging/lifecycle services, analytics, and ownership constraints.
- Existing guest creation, session rotation, failed-login cleanup, in-place account
  conversion, and cascade deletion boundaries.
- Existing goal rows and numeric form submission contract.
- Existing Programs-page ViewModels as the presentation boundary for goal labels.
- The shared logo partial, logo stylesheet, chrome sizing variables, breakpoints, and
  reduced-motion rules.

### Modify

- Expand the canonical sample session from one exercise to a short ordered full-body
  sequence using existing global variants and realistic sets/reps.
- Change guest creation from a bare user insert to an atomic starter-workspace operation
  that creates one owned program, one current training day within a starter cycle, and one
  planned workout linked to the shared sample session. Initialize the authenticated session
  selection so the post-entry Dashboard resolves that workout immediately.
- Format goal names when Programs-page presentation models are built, including the Create
  Program options and existing-program metadata, while preserving raw names and goal IDs at
  persistence boundaries.
- Increase the logo wrappers where the chrome and authentication layout can accommodate it
  and enlarge/emphasize both existing arm shapes within the shared SVG composition.

### Add

- Focused canonical-seed and HTTP coverage for the starter template, per-guest hierarchy,
  initial Dashboard selection, workout start, ordered step snapshots, step performance or
  skipping, finish behavior, analytics/progress compatibility, isolation, cleanup, and
  conversion preservation.
- A small reusable presentation formatter for underscore-delimited identifiers, with
  focused coverage for single- and multi-word goal values.
- Responsive logo contracts and recorded rendered checks at representative mobile,
  tablet/desktop, large, and short desktop sizes.

### Explicitly reconsider

- The earlier authentication contract deliberately described generated guests as
  “minimal.” This goal explicitly changes that first-use decision: guest identity remains
  minimal, but each guest now receives a small owned starter hierarchy so the workout flow
  is demonstrable immediately.
- The completed application-chrome goal preserved the existing logo size and artwork. This
  goal explicitly reopens only logo scale and arm prominence; its navigation, layout model,
  palette, and interaction decisions remain established behavior.

### Unknown until rendered review

- The final safe wrapper dimensions and arm scale/stroke balance cannot be established from
  CSS and SVG source alone. They require rendered checks at mobile, normal rail, large rail,
  authentication, and wide-short layouts.
- No browser automation dependency is installed. Existing live-review tooling may be used
  if available; otherwise the remaining manual viewport check must be reported explicitly
  rather than presented as automated verification.

## Starter-workout contract

- The existing `Sample Full Body Session` remains the single global read-only starter
  template; its `owner_user_id` remains null.
- The template uses only active global variants already present in the canonical catalog.
  It gains several additional steps spanning lower-body, push, pull, and hinge work, with
  contiguous unique ordering and realistic prescriptions. The final sequence should remain
  approximately four to five exercises and should not attempt to be exhaustive.
- Guest entry creates one guest-owned starter program using the existing
  `general_fitness` goal, one bounded starter cycle containing today’s training day, and one
  planned workout linked to the global sample template. It does not clone the session,
  exercise, or variant rows.
- Guest principal and owned hierarchy creation are atomic. A missing canonical goal,
  session, or required variant fails without leaving a partial guest. Failure to establish
  the web session still removes the newly created guest and all cascaded starter data.
- The newly authenticated session selects the starter program/cycle so `/` resolves the
  current training day and planned workout without a separate setup flow.
- Starting the workout creates one ordered snapshot log per template step through the
  existing start transaction. Existing per-step perform/skip, set-log, finish, Dashboard,
  History, Progress, guest cleanup, and account-conversion behavior remain authoritative.

## Goal-label contract

- Database goal names and IDs remain unchanged.
- Presentation converts underscore-delimited identifiers to title-cased words:
  `weight_loss` becomes `Weight Loss` and `general_fitness` becomes `General Fitness`.
- Both current goal-name consumers—the Create Program select and program switcher metadata—
  use the same small formatter at the ViewModel/presentation boundary.
- Create Program option values remain numeric goal IDs, invalid submitted selections remain
  visible through the existing form-state behavior, and validated submissions persist the
  selected existing goal row.

## Logo contract

- The current circular core, lettering, neon ring, opposing red/blue arms, animation, and
  overall composition remain recognizable; this is a refinement, not a new logo.
- Both arm shapes receive the same proportional prominence treatment and remain balanced
  around the center mark.
- Authenticated mobile, normal tablet/desktop rail, large rail, short-height rail, and login
  presentation may adjust their existing wrappers only as needed for greater presence.
- The enlarged mark must not clip, overlap the menu trigger or rail divider, widen the
  viewport, create horizontal scrolling, or produce excessive header/rail height.
- Existing focus visibility and reduced-motion behavior remain correct.

## Scope

### In scope

- Canonical sample-session rows in `db/seed.js` and focused canonical-seed verification.
- Guest starter-workspace creation and initial session selection through existing
  authentication, ownership, and workout boundaries.
- Directly affected guest, conversion, cleanup, Dashboard, session lifecycle, and Progress
  tests.
- A reusable goal-label presentation formatter and both verified goal display sites.
- Shared logo SVG/CSS and narrowly required chrome/auth wrapper sizing.
- Responsive rendered review and focused markup/style tests for the changed logo.
- A guarded local development reset when the configured target is confirmed disposable and
  `ALLOW_DATABASE_RESET=true`, as required by repository policy.

### Out of scope

- New exercise, variant, goal, or other catalog records; duplicated guest session templates;
  schema changes; migrations; or migration infrastructure.
- Starter content for existing registered accounts, multiple starter programs, onboarding
  tours, coaching, exercise technique guidance, or an exhaustive training plan.
- Changes to workout lifecycle semantics, analytics formulas, ownership/authorization,
  guest lifetime, rate limits, account conversion, or cleanup policy.
- Renaming stored goal identifiers or changing goal selection from numeric IDs.
- Navigation, shell-layout, page, typography, palette, component, or logo redesign outside
  the bounded prominence adjustments.
- New dependencies, push, deployment, production reset, or production-data mutation.

## Correctness, security, and data-integrity requirements

- Guest creation remains CSRF protected, rate limited, session-rotated, and isolated by a
  generated guest user ID. No additional sensitive data is collected or logged.
- Guest and starter hierarchy writes succeed or roll back together. Ownership joins continue
  to prevent another guest from reading or mutating the starter program and workout.
- Expired-guest cleanup and failed session-establishment cleanup remove the starter hierarchy
  through existing foreign-key cascades; account conversion retains it under the same user
  ID.
- The shared global session and variants remain unowned and unduplicated. Workout start uses
  existing immutable snapshot rows so later template changes cannot rewrite workout history.
- Goal formatting is output-only. Request validation continues to accept only the existing
  positive goal ID contract and controllers continue to consume validated input.
- The canonical development seed remains authoritative. No ordinary development migration is
  introduced, and production is never reset or mutated under development authorization.
- Changed UI retains semantic links/controls, accessible names, visible focus, practical
  mobile spacing, and reduced-motion behavior.

## Done when

- A fresh canonical database contains one global sample session with the reviewed short,
  ordered, non-duplicative catalog-based workout.
- Two independently created guests each receive exactly one private starter hierarchy linked
  to the same global session, and their initial authenticated selections resolve only their
  own current program/day/workout.
- A fresh guest can start the planned workout; every intended step is snapshotted in order,
  steps can be performed or skipped, the workout can finish, and Dashboard, History, and
  Progress continue to reflect the resulting data correctly.
- Guest cleanup, failed-session cleanup, and permanent-account conversion retain their
  established security and data-lifecycle guarantees.
- Create Program and existing-program metadata display readable goal labels while option
  values and persisted goal IDs remain unchanged.
- The enlarged shared logo and more prominent arms render without clipping, overflow,
  overlap, alignment regression, or excessive chrome height on representative mobile,
  tablet/desktop, large, wide-short, and login layouts.
- Focused tests, `npm run verify`, the PostgreSQL HTTP suite, applicable guarded reset, final
  diff inspection, and `git diff --check` pass, with any unavailable manual check reported
  rather than assumed.
