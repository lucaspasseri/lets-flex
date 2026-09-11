# Current Goal

## Parent milestone

Let’s Flex presents a consistent, reliable experience across its user-facing surfaces while the
validated repository frontend Skill governs ongoing UI work.

## Current goal

Evaluate the complete user-facing frontend against the Let’s Flex frontend Skill, preserve surfaces
that are already aligned, and resolve the highest-value consistency, responsive, accessibility, and
recovery gaps through separately approved increments.

## Status

Completed on 2026-09-10. Action 1 was explicitly approved and Completed after final verification.
Action 2 was explicitly approved, implemented, verified, and completed on 2026-09-10 after review.
Action 3 was explicitly approved, implemented, verified, and completed on 2026-09-10 after review.
Action 4 was explicitly approved, implemented, verified, and completed on 2026-09-10 after review.
Action 5 was explicitly approved and completed on 2026-09-10 after final verification. Actions 6 and
7 were explicitly approved, implemented or verified, and completed on 2026-09-10 after review. The
goal outcome was explicitly approved by the user on 2026-09-10.

## Approved user outcome

- Every relevant user-facing area is evaluated against the repository frontend Skill.
- Major inconsistencies and UX gaps are known from repository, test, and rendered evidence.
- Approved high-value problems are addressed incrementally, with approved medium-value refinements
  included only where the evidence justifies them.
- Shared root causes are repaired before page-local symptoms when a bounded shared fix is safe.
- Important flows are verified at representative narrow, pressure, and wide widths, including
  keyboard and interaction behavior where applicable.
- Surfaces that are already aligned remain intentionally unchanged.
- The Let’s Flex frontend Skill remains the governing workflow for ongoing frontend work.

This is not authorization for an application-wide redesign. Existing product identity, architecture,
and established behavior remain the default.

## Delta-first baseline

### Already satisfied

- The repository has a validated Let’s Flex frontend Skill, UI guidelines, a rendered-evidence
  workflow, and an established component/page CSS architecture.
- The Library selected-session detail was already implemented and fully validated through that
  workflow at 390px, 700px, and 1440px, including keyboard tab behavior.
- Application chrome, shared forms, Dashboard and current-workout foundations, day/session
  assignment and cancellation, Progress, and several Library flows already provide compatible
  patterns to preserve and reuse.
- Existing browser-component, rendered-view, view-model, HTTP, CSS-contract, accessibility, and
  repository verification tests provide a substantial regression baseline.
- The approved discovery audit already covered the application inventory and exercised relevant
  live surfaces at widths from 390px through 1320px. Ninety-three focused frontend tests passed with
  zero failures during that audit.

### Reuse

- Reuse the existing EJS, CSS, JavaScript, view-model, route/controller, shared-component, icon, and
  test architecture. Do not add a frontend framework, CSS framework, UI library, or parallel design
  system.
- Reuse the application rail, page containers, buttons, forms, tabs, feedback, modals, and their
  existing semantics whenever they are compatible with the required repair.
- Reuse current authentication, authorization, CSRF, rate-limit, ownership, validation, and
  lifecycle boundaries. Frontend recovery work must not weaken or bypass them.
- Reuse verified aligned surfaces as comparison evidence rather than reimplementing them.

### Repair

- At intermediate application widths, page breakpoints use viewport width while the persistent
  navigation rail reduces the actual content area. Programs, History, Profile, and Library can
  consequently place primary controls or content outside the visible page area.
- Authentication recovery links inherit low-contrast browser-default link styling, and the generic
  tab panel selector leaks panel treatment into the authentication surface.
- Shared modal transitions do not yet honor reduced-motion preferences across all production modal
  consumers.
- Several HTML-oriented global, authentication, CSRF, rate-limit, and stale-mutation failures fall
  out of the application UI into raw text responses instead of a bounded recovery experience.
- Some core-flow page titles and Programs/day hierarchy cues are generic or denser than the task
  requires.

### Add

- Add an application-level HTML recovery surface for eligible 404 and 500 responses and for
  security-preserving HTML error paths that currently return bare text. Browser-facing JSON
  endpoints remain API-like.
- Add final coverage verification that records the evaluated inventory, important states and
  widths, keyboard/interaction checks, intentional non-changes, and explicitly deferred work.

## Approved delta actions

1. **Repair application-shell pressure-width responsiveness.** Correct the available-width mismatch
   for Programs, History, Profile, and Library; verify Dashboard’s minor pressure-width discrepancy;
   and protect existing intentional horizontal scrollers.
2. **Repair authentication and recovery-link accessibility.** Give auth links deliberate contrast,
   focus, hover, and target treatment, and isolate authentication panels from generic tab styling.
3. **Complete the shared modal motion contract.** Honor reduced-motion preferences across every
   production modal consumer while preserving focus, inertness, keyboard, and lifecycle behavior.
4. **Introduce an application-level recovery surface.** Render generic, non-sensitive recovery UI
   for eligible global and HTML-oriented authentication, CSRF, and rate-limit errors.
5. **Repair contextual mutation failures.** Keep users in Programs and Library when safe rerendering
   context exists, while preserving status codes, security boundaries, and intentional JSON
   endpoint behavior.
6. **Refine core-flow hierarchy and page identity.** Replace generic page titles and make a bounded
   Programs/day hierarchy refinement without reopening aligned Dashboard or workout surfaces.
7. **Complete final frontend coverage verification.** Recheck the complete user-facing inventory,
   relevant states, keyboard paths, and stress widths; run applicable automated checks; and document
   intentional non-changes and deferred medium- and low-priority findings.

Each action requires explicit approval before implementation and separate review before completion.
Later actions may be narrowed if repository evidence or an earlier shared repair already satisfies
their acceptance criteria.

## Scope

### In scope

- User-facing EJS, CSS, browser interaction, responsive behavior, accessibility, page identity,
  HTML recovery behavior, and the smallest controller/view-model changes needed to render it.
- Dashboard, current workout, Programs/cycles/day, Library discovery/detail/forms/exercises/admin,
  authentication, profile, history, progress, application chrome, shared components, and applicable
  global error paths.
- Focused and cross-cutting tests plus rendered verification proportional to each approved action.

### Out of scope

- A wholesale redesign, new visual identity, frontend framework, CSS framework, UI library, or new
  design system.
- Unrelated backend architecture, database schema or seed changes, migrations, production data,
  deployment, or pushing changes.
- Reworking an aligned surface solely to make every page visibly different.
- Browser-facing JSON errors that are intentionally consumed by client-side code, except where an
  approved action proves their contract is incorrect.

## Constraints and invariants

- Preserve current product identity and reuse existing components and architecture.
- Keep authentication, authorization, CSRF, rate limiting, ownership, validation, lifecycle rules,
  and status semantics intact.
- Recovery messages must be generic where implementation details or sensitive state could leak.
- Preserve modal focus management, keyboard behavior, inertness, and control semantics while adding
  motion preference support.
- Page-level overflow must not hide core actions; intentional component-owned scrollers may remain
  when they are clearly usable.
- Use actual rendered content at representative narrow, pressure, and wide widths. Width lists may
  be narrowed or expanded per surface from evidence, not convenience.
- Do not mutate production data, deploy, or push changes.

## Done when

- The complete relevant user-facing inventory has a recorded evaluation against the frontend Skill.
- Every separately approved high-value finding is implemented and verified.
- Approved medium-value findings are implemented where their evidence and scope remain justified.
- Shared root causes are repaired at the narrowest safe shared boundary.
- Important flows pass rendered verification at applicable narrow, pressure, and wide widths, with
  keyboard, focus, interaction-state, and reduced-motion checks where relevant.
- Applicable focused and repository-wide automated checks pass.
- Aligned surfaces and intentional behavior remain unchanged unless an approved action requires a
  specific delta.
- Deferred findings, remaining unknowns, and intentional exclusions are documented for final review.
- The goal reaches Ready for final review and receives explicit user approval.

## Resume here

Action 1, **Repair application-shell pressure-width responsiveness**, is Completed. Action 2,
**Repair authentication and recovery-link accessibility**, is Completed. Action 3, **Complete the
shared modal motion contract**, is Completed. Action 4, **Introduce an application-level recovery
surface**, is Completed. Action 5, **Repair contextual mutation failures**, is Completed. Action 6,
**Refine core-flow hierarchy and page identity**, is Completed. Action 7 is Completed.
