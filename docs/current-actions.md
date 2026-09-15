# Current Actions

## Current goal

Audit and expand View Transitions without sacrificing performance or predictability.

## Goal status

**Completed.**

**Approved:** 2026-09-14 after explicit user approval.

**Completed:** 2026-09-14 after explicit approval of the final review.

**Resumed:** 2026-09-14 after explicit approval to activate Action 1. This is a fresh blocked audit;
the earlier approval-gate pause is historical.

## Verified baseline reused

- `public/css/base.css` opts into native cross-document transitions, applies a short root fade,
  defines the Program calendar-day transition class, and disables View Transition animation for
  reduced motion.
- `public/css/components/applicationChrome.css` names the active navigation indicator; Programs,
  Day, Profile, and Library already contain named selected/related elements.
- `public/js/pages/programs/index.js` coordinates a clicked or revealed calendar day using a
  server-provided transition name and the Navigation API when available.
- Tabs in Library and authentication are same-document DOM state changes with keyboard semantics;
  no `document.startViewTransition()` layer exists.
- The shell scrolls `[data-page-content]` rather than the document, and Library also owns a nested
  session-list scroller. No explicit scroll-restoration helper exists.
- No browser executable is available for live visual, Back/Forward, console, performance, or
  duplicate-name inspection. Existing theme behavior and server-rendered architecture are completed
  related work and must be reused, not redesigned.

## Proposed action sequence

### Action 1 — Establish the audited transition contract and regression baseline

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval.

**Completed:** 2026-09-14 after explicit approval of the verified changes.

**Purpose:** Inventory every current transition rule, named element, dynamic name, browser-side
coordination path, shell interaction, redirect boundary, and scroll surface. Classify candidates as
reuse, modify, add, or intentionally exclude; define the smallest safe naming contract and focused
test strategy.

**Reviewable outcome:** The inventory and decision matrix are recorded here, unsafe/ambiguous naming
cases are resolved or explicitly bounded, and focused static/view-model/browser-contract tests cover
the verified baseline. No speculative transition behavior is added.

**Implementation completed:**

- Added `views/viewModels/shared/createViewTransitionName.js` as the shared naming contract. It
  validates controlled prefixes, fails closed for missing identifiers, preserves readable numeric
  IDs, and encodes non-numeric identifiers with a length-prefixed code-point representation so
  unsafe characters cannot become CSS syntax or create delimiter collisions.
- Updated `createDayViewTransitionName` to reuse the contract while preserving the existing
  `program-calendar-day-<numeric-id>` output.
- Added focused naming tests for numeric compatibility, unsafe string encoding, collision resistance,
  missing identifiers, and invalid prefixes.
- Added global View Transition CSS regression assertions for native navigation opt-in, the 100ms root
  transition, and reduced-motion behavior. Added an application-chrome assertion for the single
  named active navigation indicator.

## Action 1 audit inventory and decision matrix

### Current transition surfaces — Verified

| Surface                                                           | Current mechanism                                                                                               | Decision                                                                                         |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Application navigation and other same-origin document navigations | Native cross-document `@view-transition { navigation: auto; }`; root old/new animation is 100ms                 | Reuse the short root transition; inspect named continuity separately                             |
| Primary navigation selection                                      | One `.primary-navigation__indicator.is-active` uses `active-tab-indicator`; pseudo-elements use 160ms           | Reuse; the server-rendered active destination remains authoritative                              |
| Programs program/cycle selection                                  | One current program and one current cycle use static role names                                                 | Reuse as selected-state continuity, not entity identity                                          |
| Programs calendar day → Day header                                | Server-provided `program-calendar-day-<id>` name; click handler and `pagereveal` coordinate source/destination  | Reuse and harden only if the next action finds a concrete defect                                 |
| Day-page current-day rail item                                    | One static `active-day-card` name                                                                               | Reuse as selected-state continuity                                                               |
| Profile picker selection                                          | One current profile card uses `profile-page-user-switcher-item-selected`                                        | Reuse; no new navigation behavior identified                                                     |
| Library session workspace                                         | One current summary and one details element use separate static role names                                      | Reuse as local selected/detail state; do not assign one name to both elements                    |
| Library and authentication tabs                                   | Semantic buttons/panels, ordinary DOM `hidden` and `aria-selected` updates; no `document.startViewTransition()` | Keep ordinary CSS/DOM behavior unless rendered evidence proves a View Transition is better       |
| Library filters/search and page selectors                         | Same-document visibility/value changes or normal GET forms                                                      | No View Transition added; preserve immediate feedback and native form behavior                   |
| History list → detail                                             | Normal cross-document link with a filter/page-aware return URL; no named shared entity                          | High-value candidate for Action 2                                                                |
| Admin media entity selection                                      | Normal GET link to the same management route with selected entity query                                         | Candidate only if a unique source/destination element can be established without competing names |
| POST → redirect, locale/theme changes, auth redirects             | Normal forms and server redirects; no custom browser redirect orchestration                                     | Leave normal and immediate; native navigation enhancement may apply when supported               |

### CSS and JavaScript behavior — Verified

- Transition CSS currently lives in `public/css/base.css`, with the active navigation indicator rules
  in `public/css/components/applicationChrome.css` and the Program/Day-specific rules in
  `public/css/pages/programs.css` and `public/css/pages/day.css`.
- Named elements currently include `active-tab-indicator`, `programs-page-program-selected`,
  `programs-page-cycle-selected`, `active-day-card`, `profile-page-user-switcher-item-selected`,
  `library-page-session-summary-current`, and `library-page-session-details`. Program calendar/day
  headers use the dynamic `program-calendar-day-<id>` family.
- `public/js/pages/programs/index.js` is the only transition-coordination script. It removes prior
  inline names before setting the clicked calendar item and uses `pagereveal` plus
  `window.navigation.activation.from.url` when available. No `document.startViewTransition()` call,
  transition promise, or transition-dependent application state exists.
- The fixed application chrome remains part of the normal shell and the active indicator is the only
  named chrome element. Its accessibility state is still controlled by server-rendered
  `aria-current`; animation is not required for correctness.
- Global reduced-motion CSS disables cross-document navigation and all View Transition pseudo-element
  animation. Unsupported View Transition APIs therefore retain ordinary browser navigation.

### Scroll and redirect findings — Verified / Unknown

- The document has `html, body { overflow: hidden; }`; vertical page scrolling belongs to
  `body > .content`, while the Library session list owns a separate bounded scroller. This means
  document-level native history restoration does not by itself prove restoration of the app content
  scroller.
- Day-page JavaScript uses instant horizontal `scrollIntoView` for the current rail item and smooth
  arrow scrolling; this is an existing orientation behavior, not global vertical restoration.
- No explicit `history.scrollRestoration`, `sessionStorage` position state, or global restoration
  manager exists. Native Back/Forward behavior for the inner scroller remains **Unknown** without a
  live browser check.
- New top-level links, filters, forms, mutations, and redirects have no custom scroll or transition
  coordination and will remain so unless a targeted case is demonstrated.

## Action 1 verification evidence

- Focused transition, naming, CSS, Day view-model, and calendar view-model tests: **14/14 passed**.
- `npm run check:types`: **passed**.
- `npm run format:check`: **passed**.
- `npm run lint`: **passed**.
- `git diff --check`: **passed**.
- No browser executable is available, so live transition rendering, duplicate-name console warnings,
  Back/Forward restoration, focus during animation, and jank remain manual checks for the later
  verification action.

**Completion summary:** Established the transition inventory and decision matrix, added the shared
safe naming contract, preserved the existing day-name output, and added focused regression coverage.

### Action 2 — Implement high-value cross-document continuity

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval.

**Ready for review:** 2026-09-14 after implementation and focused verification.

**Completed:** 2026-09-14 after explicit approval of the verified changes.

**Completed:** 2026-09-14 after explicit approval of the verified changes.

**Purpose:** Add only audited shared-element transitions that connect the same logical entity across
server-rendered views, prioritizing a real list/detail path such as workout history. Harden existing
Programs/Day and active-navigation transitions only where Action 1 identifies a concrete defect or
missing contract.

**Reviewable outcome:** Stable sanitized names are supplied by view models, unique in each rendered
document, visually restrained, and covered by rendering/static tests. Unrelated entity changes,
mutations, authentication redirects, and ordinary top-level navigation remain immediate or use the
existing root transition.

**Implementation completed:**

- Added `viewTransitionName` to workout-history list items and the workout-history detail view model,
  reusing the shared naming contract with the stable `history-session-<id>` family.
- Applied the name to exactly one source history card and one destination history summary, with the
  existing filter/page-aware return URL unchanged.
- Added a scoped `.history-session` View Transition class with a restrained 240ms interpolation,
  clipped snapshots, and preserved rounded surfaces. No client-side navigation or redirect
  orchestration was introduced.
- Added rendering, view-model, and CSS regression assertions for the list/detail pairing and name.

**Deliberately deferred:**

- Admin media selection remains deferred because its same-page source/destination composition needs
  a separate duplicate-name and rendered-layout check.
- Programs/Day and active-navigation behavior is reused unchanged because Action 1 found no concrete
  defect requiring reopening it.
- Tabs, filters, mutations, authentication redirects, and ordinary top-level navigation remain on
  their existing CSS/DOM or native navigation paths.

## Action 2 verification evidence

- History rendering, history view-model, history CSS, and shared naming tests: **14/14 passed**.
- `npm run check:types`: **passed**.
- `npm run check:browser-types`: **passed**.
- `npm run format:check`: **passed**.
- `npm run lint`: **passed**.
- `git diff --check`: **passed**.
- Live visual transition timing, Back/Forward behavior, duplicate-name console warnings, and jank
  remain unavailable because no browser executable is installed.

**Completion summary:** Added restrained, stable history list/detail continuity through the shared
server-rendered naming contract and left unrelated navigation, tabs, mutations, redirects, and
scroll behavior unchanged.

### Action 3 — Resolve tabs, scroll, redirect, and accessibility boundaries

**Status:** Ready for review

**Activated:** 2026-09-14 after explicit user approval.

**Ready for review:** 2026-09-14 after implementation and focused verification.

**Purpose:** Verify the native-first scroll behavior of the inner shell and implement minimal
drill-down restoration only where justified. Keep tabs and filters on ordinary CSS/DOM behavior when
that is simpler; add missing focus-visible and reduced-motion safeguards where touched. Confirm that
redirects, fixed chrome, scrollbars, and focus do not depend on transition completion.

**Reviewable outcome:** Browser Back/Forward, ordinary return links, new top-level navigation, long
Library/Admin surfaces, unsupported APIs, JavaScript failure, and reduced motion all have explicit
fallback behavior and focused automated coverage where feasible.

**Implementation completed:**

- Added a history-page-only scroll enhancement that stores the `[data-page-content]` position in
  `sessionStorage` only for primary activation of a history detail link, keyed by the current list
  path and query. It restores once after the explicit `#history-results-heading` return link, a
  Back/Forward navigation entry, or a bfcache `pageshow`; invalid or unavailable storage leaves
  navigation unaffected.
- Kept native scroll behavior as the default: the helper does not change
  `history.scrollRestoration`, does not preserve positions globally, and consumes stale snapshots
  without restoring them on ordinary top-level navigation.
- Added the explicit history return anchor and retained filters/page in the detail back link. The
  script is a progressive enhancement loaded through the existing page script slot and has no
  transition-completion dependency.
- Kept Library/authentication tabs on semantic ordinary DOM/CSS updates, shortened their existing
  background-color transition to 160ms, and added visible keyboard focus plus reduced-motion
  transition safeguards.
- Confirmed that redirects, forms, fixed chrome, and scrollbar behavior remain server/native and do
  not depend on a View Transition promise or JavaScript redirect.

## Action 3 verification evidence

- Focused history scroll, tabs, history CSS, history rendering, and history view-model tests:
  **14/14 passed**.
- `npm run check:browser-types`: **passed**.
- `npm run check:types`: **passed**.
- `npm run format:check`: **passed**.
- `npm run lint`: **passed**.
- `git diff --check`: **passed**.
- No browser executable is available, so live viewport rendering, keyboard focus during native
  transitions, Back/Forward behavior in the actual inner scroller, console warnings, and runtime
  performance/jank remain unavailable for manual verification.

**Completion summary:** Added narrowly scoped history drill-down scroll restoration with native and
failure-safe fallbacks, explicit return anchoring, and focused coverage. Preserved ordinary semantic
tab behavior while adding focus and reduced-motion safeguards; redirects, fixed chrome, scrollbars,
and navigation remain independent of transition completion.

### Action 4 — Verify, document, and prepare final review

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval.

**Ready for review:** 2026-09-14 after final verification and documentation.

**Completed:** 2026-09-14 after explicit approval of the verified changes.

**Purpose:** Run focused tests followed by formatting, lint, type, browser-type, and applicable full
verification. Perform rendered viewport, keyboard, Back/Forward, console, and performance checks if
a browser becomes available; otherwise record the limitation. Update this record with final files,
exclusions, evidence, risks, and future enhancements.

**Reviewable outcome:** Every Done-when criterion has explicit evidence, skipped checks are labelled,
and the goal reaches Ready for final review without being marked complete.

## Action 4 verification evidence

- `npm run verify`: **passed** after rerunning with local development/test database access:
  formatting, lint, server type checks, browser type checks, and **479/479 tests passed**.
- Focused transition, history, tabs, rendering, view-model, and scroll-restoration tests: **14/14
  passed**.
- `git diff --check`: **passed**.
- Final review confirmed the change set is limited to transition naming, history continuity, tab
  safeguards, regression coverage, and goal documentation; no schema, migration, authentication,
  redirect, or routing changes were introduced.
- The initial sandboxed full-suite attempt could not reach the local database (`EPERM`); the
  permitted local-database retry passed all database setup tests and the complete suite.
- No browser executable is installed. Live viewport rendering, native transition timing, keyboard
  focus during animation, Back/Forward behavior in the inner scroller, duplicate-name console
  warnings, and runtime performance/jank remain explicitly unavailable.

## Done-when comparison

- Transition inventory and intentional exclusions: **satisfied in Actions 1–3**.
- Safe stable naming contract with focused coverage: **satisfied**.
- Audited history list/detail continuity with fast native fallback: **satisfied**.
- Semantic tabs and simple filters remain ordinary DOM/CSS behavior: **satisfied**.
- Native-first, targeted scroll restoration without stale top-level reuse: **satisfied**.
- Reduced motion, unsupported APIs, JavaScript failure, keyboard access, and focus fallback: **covered
  by implementation and automated/static checks; live browser behavior unavailable**.
- Focused/full verification and final documentation: **satisfied**, with browser limitation recorded.

## Resume here

Action 1 is **Completed**. Action 2 is **Completed**. Action 3 is **Completed**. Action 4 is
**Completed**. The goal is **Completed** as of 2026-09-14.
