# Current Goal

## Parent milestone

Let’s Flex remains reliable in production and gains a reusable, evidence-based frontend design
workflow that helps future AI-assisted UI work extend the product intentionally.

## Current goal

Stabilize the known resolved-workout cancellation error, then audit the current frontend, define a
Let’s Flex-specific frontend workflow, validate it on one representative surface, and refine it
before regular adoption.

## Status

Completed on 2026-09-10 after explicit user approval. Actions 1 through 5 were separately approved
and completed with their required verification. The resolved-workout cancellation experience is
stabilized, the frontend audit and repository-scoped workflow are established, and the workflow was
validated and refined from rendered product evidence.

## Approved user outcome

- Attempting to cancel or delete a resolved workout session no longer produces an application-level
  failure experience. The intentional lifecycle restriction remains enforced, is communicated as
  an expected state, and is reflected accurately by the UI.
- The existing Let’s Flex frontend is audited before broad visual work, with its implicit design
  language, inconsistencies, responsive behavior, accessibility patterns, and generic-looking
  tendencies documented from repository and rendered evidence.
- A project-specific frontend workflow or Skill complements the repository instructions and guides
  future work on hierarchy, reuse, responsive design, accessibility, restraint, motion, and visual
  verification.
- The workflow is tested on one contained, representative surface and refined from the result
  before it becomes the default frontend reference.

## Delta-first baseline

### Already satisfied

- The workout-session domain permits cancellation only from `planned`; the service checks the
  current owned state and the repository repeats the `planned` predicate in its ownership-scoped
  update.
- Missing or unowned workout sessions remain indistinguishable through the existing not-found path,
  while known invalid lifecycle transitions use `WorkoutSessionLifecycleError`.
- Authentication, validated route input, CSRF protection, and ownership-scoped reads and writes
  already protect the cancellation route.
- Existing PostgreSQL HTTP coverage proves valid planned cancellation, rejection of active and
  finished cancellation attempts with `409`, and terminal-state immutability.
- The repository already has shared EJS buttons, forms, modals, tabs, accordions, icons, application
  chrome, view-model boundaries, page/component CSS, browser-component tests, and several focused
  responsive CSS contracts.
- `docs/ui-guidelines.md` already records the established dark palette and baseline rules for reuse,
  accessibility, interaction states, responsive design, and motion.
- Completed workout-tracking, analytics, application-chrome, Library discovery, and Library form
  goals provide recent evidence of established behavior that should be audited and reused rather
  than reimplemented.

### Reuse

- `cancelWorkoutSession`, the ownership-scoped workout-session repository, and
  `WorkoutSessionLifecycleError` remain the enforcement boundary for cancellation.
- The day controller/view-model/template flow and shared feedback, button, modal, and session-card
  patterns are the likely integration points for a designed conflict response and accurate action
  visibility.
- Existing view-model/rendered-view and PostgreSQL HTTP tests can be extended for the regression.
- The current EJS/CSS/browser architecture, shared components, page-specific styles, UI guidelines,
  and completed visual work form the evidence base for the audit and workflow.

### Repair

- The day-page workout-session view model currently creates a delete trigger and cancellation modal
  for every non-cancelled session, including `in_progress` and `finished` sessions, even though only
  `planned` sessions may be cancelled.
- The cancellation controller catches the expected lifecycle error but sends a bare `409` text
  response. This preserves integrity but replaces the application UI with the reported error text,
  which is experienced as a crash rather than a designed conflict state.
- Existing tests protect backend immutability but do not assert that resolved day-page sessions omit
  the invalid delete action or that a stale cancellation rerenders an intentional user-facing page
  state.

### Add

- An evidence-based frontend audit covering representative pages, shared components, responsive
  ranges, interaction states, accessibility patterns, and visual inconsistencies without changing
  visual code.
- A reusable Let’s Flex-specific frontend workflow or Skill that complements rather than duplicates
  `AGENTS.md` and `docs/ui-guidelines.md`.
- One contained validation implementation selected from audit evidence, with explicit UX baseline,
  preserved behavior, applicable workflow principles, and multi-viewport/accessibility verification.
- A post-validation evaluation and any evidence-supported refinements needed before adopting the
  workflow for future frontend goals.

## Scope

### In scope

- A small, regression-protected cancellation repair that preserves the planned-only domain rule,
  safely handles stale/direct submissions, and does not invite cancellation for a known resolved
  session.
- A representative audit of Dashboard, Programs/cycles/days, Library, workout interfaces, forms,
  application chrome, modals, accordions, buttons, surfaces, empty states, responsive layouts,
  motion, and accessibility where repository or rendered evidence makes them relevant.
- A repository-appropriate workflow artifact for future frontend work.
- One contained frontend implementation used to validate the workflow, followed by evaluation and
  refinement.

### Out of scope

- Removing or weakening workout lifecycle validation.
- A broad workout-session lifecycle redesign unless direct evidence makes it necessary for
  correctness, security, authentication, or data integrity.
- Redesigning pages during the audit or applying the eventual workflow across the entire
  application at once.
- Replacing working custom components, the EJS/CSS/browser architecture, or the styling system for
  convenience.
- Introducing a frontend framework, styling system, production dependency, schema change,
  migration, database reset, deployment, push, or production-data mutation.
- Unrelated cleanup or visual changes outside the selected validation surface.

## Correctness, security, and accessibility requirements

- Only an owned `planned` workout session may be cancelled, and the mutating SQL remains the final
  guard against stale or concurrent requests.
- Valid cancellation continues to work; active, finished, cancelled, missing, and unowned records
  remain unchanged by invalid attempts.
- Expected lifecycle conflicts expose no SQL, stack, constraint, account, or internal identifier
  details.
- Existing authentication, authorization, validated-input, CSRF, and session behavior remain intact.
- The day page does not expose a destructive cancellation action when the known session state makes
  that action invalid, while the server still handles stale/direct submissions safely.
- The frontend workflow preserves semantic HTML, keyboard operation, visible focus, labels and
  accessible names, non-color state communication, contrast, and reduced-motion behavior where
  applicable.
- Meaningful UI changes are inspected at small, intermediate, and large widths for overflow,
  wrapping, alignment, hierarchy, interaction state, and keyboard behavior.

## Approved sequence

1. Repair the resolved-workout cancellation experience and stop for review.
2. After approval, audit the frontend and propose evidence-based design principles without changing
   visual code.
3. After approval, create the project-specific frontend workflow or Skill.
4. After approval, select one representative surface from audit evidence and validate the workflow
   with one cohesive implementation.
5. After approval, evaluate the result, refine the workflow where evidence supports it, and prepare
   the goal for final review.

Each action is separately reviewable. Completing or approving one action does not authorize the
next action.

## Done when

- Resolved-workout cancellation no longer produces the reported failure experience and is covered by
  focused regression tests, while valid cancellation and all lifecycle protections remain correct.
- The current frontend audit documents the product’s implicit design language, inconsistencies,
  responsive/accessibility behavior, and generic-looking patterns from direct evidence.
- A Let’s Flex-specific frontend workflow or Skill exists and complements the broader repository
  workflow.
- One contained representative surface has validated the workflow through implementation and
  rendered inspection.
- The workflow has been evaluated and refined based on that validation before regular adoption.
- Applicable focused checks, repository verification, PostgreSQL HTTP regressions, responsive and
  keyboard inspection, and final diff inspection pass for the actions that require them.
- No broad unrelated redesign, architecture replacement, dependency, database, deployment, push, or
  production-data change is introduced.
