# Goal: Audit and Expand View Transitions Without Sacrificing Performance or Predictability

## Goal status

**Completed.**

**Approved:** 2026-09-14 after explicit user approval.

**Completed:** 2026-09-14 after explicit approval of the final review.

**Resumed:** 2026-09-14 after explicit approval of Action 1. This is a fresh blocked audit after
the earlier approval-gate pause.

## Primary objective

Improve visual continuity across the server-rendered Express + EJS application by using View
Transitions intentionally for navigation, selected states, high-value shared entities, and
appropriate drill-down returns. Preserve fast normal navigation, progressive enhancement,
accessibility, reduced-motion behavior, and the existing server-rendered architecture.

## Existing relevant capabilities — Verified

- `public/css/base.css` enables native same-origin cross-document transitions with
  `@view-transition { navigation: auto; }` and gives the root transition a short 100ms duration.
- Global reduced-motion CSS disables navigation transitions and animation of View Transition
  pseudo-elements.
- The application chrome already names the active navigation indicator so the selected item can
  move between primary destinations when native cross-document transitions are supported.
- Programs already use stable day names derived from numeric IDs, with a small browser enhancement
  that coordinates the Programs calendar item with the Day page header.
- Programs and Day pages already use named selected states for program, cycle, and current-day
  continuity. Profile selection and Library session selection/details also have named states.
- Tabs are semantic and keyboard-oriented, but their selection currently uses ordinary DOM updates;
  there is no `document.startViewTransition()` implementation.
- The application uses an inner `[data-page-content]` scroll container and also has nested Library
  session-list scrolling. Day-page JavaScript currently restores only the horizontal position of
  the selected day rail.
- No explicit `history.scrollRestoration`, `sessionStorage` scroll state, or global scroll manager
  exists. No POST/redirect flow has custom transition orchestration.
- No browser executable is available in the current environment, so live rendering, Back/Forward,
  console, jank, and duplicate-name inspection require honest manual verification when a browser is
  available.

## Delta classification

### Already satisfied / reuse

- Native cross-document transition opt-in, root fade, reduced-motion fallback, active navigation
  indicator, and existing Programs/Day selection transitions remain the baseline.
- Existing EJS shells, view models, browser component initialization, semantic tabs, and native
  links/forms remain the implementation architecture.

### Modify / Add

- Record a complete transition inventory and decision matrix in the active action record, including
  intentional exclusions and known browser limitations.
- Establish and test a small naming contract for stable entity transitions, including uniqueness,
  identifier sanitization, and safe fallback behavior.
- Add only high-value shared-element continuity that is supported by the audit, prioritizing a
  genuine list/detail relationship such as workout history; avoid animating unrelated entities.
- Verify and, only where justified, add targeted scroll restoration for drill-down returns without
  preserving scroll globally or changing new top-level navigation semantics.
- Keep same-document tabs, filters, mutations, and simple selected-state changes on ordinary CSS/DOM
  transitions unless evidence shows a View Transition materially improves orientation.
- Add focused regression coverage and document performance/accessibility behavior.

## Scope and constraints

In scope: global and page-specific View Transition CSS, stable transition names and their view-model
contracts, selected navigation/entity continuity, high-value server-rendered list/detail navigation,
targeted scroll behavior, tab motion decisions, reduced-motion handling, focused tests, and this
goal/action documentation.

Preserve authentication, authorization, i18n, forms, server redirects, fixed application chrome,
workout behavior, responsive layouts, semantic tab behavior, and the completed Classic + Neon theme
system. Do not add React, client-side routing, a global SPA layer, a large animation dependency, or
custom JavaScript redirects solely to animate navigation. Do not animate every state change or
preserve scroll on every navigation.

## Done when

- The existing View Transition implementation is fully inventoried, including cross-document
  behavior, named elements, CSS, JavaScript coordination, fixed chrome interaction, and known
  limitations.
- A small, tested naming contract prevents duplicate or unsafe entity names and is reused by any
  new shared-element transition.
- High-value continuity is implemented only for audited candidates; major navigation remains fast,
  selected navigation remains correct, and deliberate non-transition decisions are recorded.
- Tabs and simple filters retain semantic behavior and use ordinary CSS/DOM motion where that is
  the simpler choice.
- Scroll restoration is native-first and, if needed, limited to demonstrated drill-down cases;
  new top-level navigation does not inherit stale positions.
- Reduced motion, unsupported View Transition APIs, JavaScript failure, keyboard access, and focus
  behavior retain safe fallbacks.
- Focused tests, formatting, lint, type checks, browser-type checks, and the applicable full suite
  pass, with unavailable browser/database checks reported honestly.
- `docs/current-goal.md` and `docs/current-actions.md` record the final implementation, exclusions,
  verification evidence, and future enhancements without silently expanding scope.

## Intentionally excluded unless separately approved

- Client-side routing or partial-page navigation.
- Global scroll preservation or a general-purpose scroll framework.
- View Transitions for every tab, filter, form mutation, authentication redirect, or POST → redirect
  flow.
- Decorative page slides, long entrance sequences, expensive filters, or large snapshot animations.
- Live browser inspection in this environment until a browser executable is available.

## Completion outcome

The application now has an audited, safe View Transition naming contract; restrained history
list/detail continuity; native-first targeted drill-down restoration; ordinary semantic tab behavior
with focus and reduced-motion safeguards; and documented fallback behavior for redirects, unsupported
APIs, JavaScript failure, fixed chrome, and scroll surfaces. Full automated verification passed with
479/479 tests. Live browser inspection remains the only recorded limitation.
