# Current Actions

## Current goal

Refactor the authenticated application shell into a mobile horizontal header with accessible
expandable navigation and a fixed Passport-inspired tablet/desktop rail, while preserving
Let’s Flex’s routes, account behavior, visual language, and page functionality.

**Goal status:** Completed on 2026-09-08 after explicit user approval. Actions 1, 2, and 3
are Completed.

## Status definitions

- **Pending approval:** proposed work that has not been approved for implementation.
- **Pending:** later work whose preceding action is not yet completed and approved.
- **Active:** the only action currently authorized for implementation.
- **Ready for review:** implemented and verified; awaiting explicit user approval.
- **Changes requested:** review corrections are authorized for the current action.
- **Completed:** verification evidence was reviewed and the action was explicitly approved.

Only one action may be Active. Approving Action 1 authorizes its implementation and no later
action. Each action stops at Ready for review.

## Verified evidence baseline

- The current authenticated `pageShell` renders a top `.page-header`, independently defined
  bottom `.footer` primary navigation, scrollable `.content`, and separate `.overlays` as
  sibling body regions. Body is a three-row grid with the content region owning vertical
  scrolling.
- Header and footer share user/shell locals but not one chrome structure. The header owns the
  logo and profile identity; the footer locally defines all member routes plus conditional
  administrator catalog management. Profile is consequently represented in both regions.
- Every protected page supplies `shell.activeNavigation`; footer tests prove one
  `aria-current="page"` match, no false active state without the contract, and admin-only
  management visibility.
- Dashboard, Library, Profile, Programs, training-day, History, and Progress pages use the
  shared authenticated layout. Login/registration/password-reset controllers explicitly use
  the separate `authShell`, which has no protected navigation and is not part of this shell
  conversion.
- Existing page roots use 68–76rem centered widths and shared horizontal spacing, with some
  internal horizontal scrollers and two page-level sticky panels. Modals are fixed above
  content, live outside `data-page-content`, and already test inertness, Escape, focus trap,
  focus restoration, scroll locking, and transition fallback behavior.
- There is no independent footer/legal/version content. The current footer is entirely the
  primary navigation. The August 2026 footer refactor is historical evidence that the mobile
  bottom navigation and explicit active-route contract were deliberate existing behavior;
  this new goal explicitly changes its presentation while preserving its destinations and
  semantics.
- The live Passport.js source uses a horizontal 100px mobile menu, then a fixed 260px rail at
  768px and 350px rail at 992px. Its navigation is vertically translated near the center,
  switches to normal flow below 750px viewport height, and permits rail scrolling for a
  short large viewport. Its mobile implementation toggles `display` with a non-button div
  and does not supply the required ARIA/focus behavior, so only its spatial model is reused.
- The worktree was clean before planning. No implementation, dependency, database, route, or
  business-logic change has been made for this goal.

## Proposed action sequence

### Action 1 — Establish the unified chrome and accessible navigation interaction

**Status:** Completed

**Purpose:** Create one semantic shell/navigation contract and prove its responsive menu
state behavior before applying the full rail visual treatment.

**Expected work:**

- Refactor `pageShell` and the current header/footer partials into one application chrome
  containing the existing brand, one shared primary-navigation definition, and the existing
  account/profile identity as the lower secondary region. Preserve all route URLs, labels,
  active values, guest/member identity, and administrator-only visibility.
- Render a native menu button with a stable controlled navigation ID, accessible open/close
  name, `aria-expanded`, practical touch target, and a CSS-ready hamburger structure.
- Add a shell browser component through the existing initializer. Implement open/close,
  Escape dismissal, destination-activation close, appropriate focus movement/restoration,
  focus containment, covered-content inertness, locking of the actual `.content` scroller,
  and state normalization when crossing the desktop breakpoint.
- Establish stable initial/enhanced states that do not animate `display`, do not leave
  closed navigation keyboard-accessible, and do not make correctness depend on a transition
  event. Coordinate rather than conflict with the existing modal/overlay contract.
- Add or consolidate focused EJS and browser tests for one navigation source, active and
  administrator states, button/control relationships, all interaction paths, inert/scroll
  behavior, focus restoration, and breakpoint changes.
- Apply only the minimum shell styling required for coherent structural states in this
  action; defer final dimensions, rail composition, and visual polish to Action 2.

**Acceptance criteria:**

- One rendered chrome contains every existing permitted destination exactly once and the
  existing account identity once, with the correct current-page semantics.
- The menu state contract is accessible and deterministic for pointer, keyboard, resize,
  and reduced/no-transition conditions, with focused tests covering success and cleanup.
- Existing protected page content and overlay placement remain structurally intact; auth
  pages, routes, permissions, session state, and business behavior are unchanged.
- Focused tests, formatting, lint, browser types, and server types pass. The action stops at
  Ready for review with the precise remaining visual work recorded.

**Constraints:**

- Do not create separate mobile and desktop navigation definitions or duplicate primary
  navigation in a bottom bar.
- Do not add dependencies or copy Passport.js markup/script behavior.
- Do not begin page-specific layout remediation without rendered evidence.

**Implemented:**

- Replaced the separate authenticated header and footer includes with one
  `applicationChrome.ejs` composition in `pageShell`. The shared chrome now owns the brand,
  one primary navigation list, and one lower account/profile destination; the retired header
  and footer partials and styles no longer leave parallel definitions behind.
- Preserved Dashboard, History, Progress, Programs, Library, Profile, and conditional
  administrator catalog destinations. Profile now appears exactly once as the existing
  current-user/guest account link, including its active-page state and temporary-workspace
  status. The other destinations retain their explicit `shell.activeNavigation` matching.
- Added a native mobile menu button with a stable `application-menu` control relationship,
  synchronized accessible label and `aria-expanded`, a 2.75rem target, visible focus, and a
  three-line icon structure ready for Action 2's final hamburger transformation.
- Added the dependency-free application-chrome browser component through the shared
  initializer. It synchronizes visual, pointer, `inert`, and `aria-hidden` states; moves focus
  into the menu; traps focus across the trigger/menu; closes on toggle, Escape, or destination
  activation; restores focus for dismissal; and normalizes to accessible desktop or closed
  mobile state across the 48rem media query.
- Locks the actual `.content` scroller and makes covered page content inert while mobile
  navigation is open. Cleanup tracks inertness ownership and does not remove background
  restrictions belonging to an open modal.
- Added a minimal responsive chrome foundation using existing semantic tokens. Mobile uses a
  fixed header-connected transform/opacity surface without display animation; desktop keeps
  the same DOM available in a temporary horizontal presentation. Final fixed-rail dimensions,
  vertical balance, hamburger morph, short-height behavior, and visual polish remain exactly
  the approved scope of Action 2.
- Replaced the obsolete Progress test dependency on footer scrolling with the new shared
  content-lock contract. Added focused rendered/style/component coverage and removed the
  superseded header/footer tests with their implementations.

**Accessibility, security, and scope evaluation:**

- Closed mobile navigation is both inert and `aria-hidden`; open navigation is available to
  keyboard and accessibility APIs while obscured content is inert and non-scrollable. Desktop
  removes the mobile-only restrictions rather than relying on CSS to override accessibility
  state.
- Navigation uses native links, the trigger uses a native button, current location retains
  `aria-current="page"`, focus remains visibly styled, and essential open/close state does not
  depend on a transition event. New transitions have an explicit reduced-motion override.
- No authentication, authorization, session, CSRF, validation, route, controller, database,
  or persistence behavior changed. The security-sensitive request controls are therefore not
  applicable to this presentation-only action. Administrator visibility still comes from the
  existing server-owned `isAdmin` boundary.
- Authentication layouts and page content were not redesigned. No dependency, schema, seed,
  migration, development-data reset, push, deployment, or production mutation occurred.

**Verification evidence:**

- Focused application-chrome rendered, CSS, browser-interaction, and affected Progress tests
  passed 13 of 13.
- `npm run verify` passed outside the sandbox: formatting, lint, server types, browser types,
  the canonical PostgreSQL catalog check, and all 166 repository tests passed.
- The first sandboxed `npm run verify` attempt reached the test suite but the canonical
  database hook was denied with `EPERM`; the required escalated rerun above passed completely.
- The PostgreSQL HTTP application suite passed 48 of 49 tests on each of two runs. Its sole
  failure is the pre-existing assertion for `1 finished workout across 1 active day` at
  `test/http/applicationPages.test.js:3298`. Direct `HEAD` inspection proves the unchanged
  Dashboard ViewModel already emits separate `Finished workouts` and `Active days` metrics
  and contains no combined sentence. The same failing test's repository-level analytics
  assertions pass before its stale rendered-text assertion. This unrelated baseline
  discrepancy was not repaired under Action 1.
- HTTP responses rendered the new application chrome successfully throughout the 49-test
  suite, including member, guest, and administrator flows. Authentication page tests also
  passed with the unchanged `authShell`.
- `git diff --check` passed. Source search found no remaining imports or selectors for the
  retired header/footer partials and styles.

**Remaining work for approved later actions:**

- Action 2 owns the fixed 260/350px-inspired rail, exact content offset, vertically balanced
  navigation and lower account region, short-height scrolling, final hamburger morph, and
  polished responsive motion.
- Action 3 owns live cross-page review and the requested viewport/interactive-resize matrix.
  No manual layout claim is made from Action 1's source and automated checks alone.

**Completion:** Approved on 2026-09-08 after final verification passed formatting, lint,
server and browser type checks, the canonical PostgreSQL catalog check, and all 166 repository
tests. Action 1 established the unified chrome and accessible responsive menu-state foundation;
the visual rail treatment remains pending under Action 2.

### Action 2 — Implement the coordinated mobile header and fixed responsive rail

**Status:** Completed

**Purpose:** Give the unified chrome its final Let’s Flex visual treatment and responsive
layout using Passport-inspired proportions and motion.

**Expected work:**

- Introduce shared shell sizing/layering tokens and transform the chrome at approximately
  48rem into a fixed left rail, starting near 16.25rem and increasing near the existing large
  breakpoint toward 21.875rem when the content balance supports it.
- Offset the content scroller exactly once, preserve centered page max widths and shared page
  padding, and keep overlays/modals above the shell without horizontal viewport overflow.
- On mobile, present a compact horizontal header and a large header-connected navigation
  surface. Animate the menu button and surface with explicit transform/opacity transitions
  in the requested ranges; avoid `transition: all` and display animation.
- On tablet/desktop, place the brand at the top, vertically balance primary navigation when
  height permits, and place account/profile content at the bottom. Add compact spacing and
  rail scrolling for wide-short viewports so links and account content never overlap or clip.
- Preserve current palette, typography, logo, radii, shadows, focus treatment, active state,
  and icon conventions. Add a comprehensive reduced-motion override for new movement.
- Retire obsolete header/footer styling and remove only directly superseded shell workarounds.
  Add CSS/rendered contracts for widths, offsets, overflow containment, short-height behavior,
  explicit transition properties, active/focus states, and reduced motion.

**Acceptance criteria:**

- Mobile and desktop visibly read as the same chrome transforming, with no duplicated nav,
  hidden content, double padding, horizontal page scrollbar, rail overlap, or clipped
  short-height controls.
- Account/profile placement replaces the prior footer-only presentation coherently, and no
  nonexistent footer content is invented.
- Motion and reduced-motion behavior meet the goal and do not affect essential state changes.
- Focused tests plus formatting, lint, server types, and browser types pass. The action stops
  at Ready for review before cross-page live validation.

**Constraints:**

- Reference dimensions may be tuned only from rendered Let’s Flex evidence and must be
  documented if changed.
- Do not redesign individual page content or alter the established auth shell.

**Implemented:**

- Reworked the authenticated shell into a mobile header/content grid and, from 48rem, a
  two-column viewport grid that reserves the rail width exactly once. The chrome is fixed in
  the reserved column while `.content` owns the complete second column with `min-width: 0`;
  no content margin or duplicate padding offset was introduced.
- Applied the 16.25rem reference rail at the tablet boundary. Delayed the 21.875rem expansion
  from Passport's 62rem reference to 75rem because Let’s Flex's verified Dashboard and
  Library content contracts are denser: at 1024px a 350px rail would leave only 674px,
  whereas retaining 260px leaves 764px for their existing responsive layouts.
- Changed the same chrome DOM into a vertically composed rail: brand at the top, primary
  navigation centered in the available height, and the existing account/profile link at the
  bottom. Active navigation uses both text/background treatment and a non-color shape marker;
  long labels wrap within the rail.
- Added a short-height desktop contract below 46.875rem/750px. It reduces brand and link
  dimensions, moves navigation to normal top-aligned flow, and keeps the entire menu/account
  column vertically scrollable with a stable scrollbar gutter so controls cannot overlap.
- Polished the compact mobile header and header-connected menu using existing semantic
  surfaces, borders, shadows, focus color, logo, and account presentation. The menu retains
  Action 1's inert-compatible transform/opacity visibility states.
- Completed the hamburger-to-close morph with explicit opacity and transform transitions.
  Menu motion uses only opacity, transform, and delayed visibility; interactive color changes
  name their properties, and the reduced-motion query removes all newly introduced chrome
  transitions. No `transition: all` or display animation was added.
- Added focused CSS contracts for the medium/large widths, fixed rail, single grid offset,
  overflow containment, short-height mode, scrolling, hamburger morph, and reduced motion.
  No page-specific CSS, auth-shell markup, route, behavior, dependency, or database code was
  changed in this action.

**Accessibility, security, and scope evaluation:**

- Native link/button semantics, visible focus, practical control sizes, current-page
  semantics, administrator visibility, and Action 1's keyboard/inert/scroll state behavior
  remain unchanged. Active state is not communicated by color alone.
- Modals retain their existing fixed 1000 layer above the chrome's named layer 99. The
  overlay sibling remains outside page content and is assigned to the content grid column
  without changing modal markup or behavior.
- Authentication, authorization, session, CSRF, validation, routes, controllers, database,
  and persistence are unaffected. No new security-sensitive boundary applies.
- Live cross-page and viewport verification was deliberately not claimed here; it remains
  the approved scope of pending Action 3.

**Verification evidence:**

- Focused application-chrome rendered/style/browser-interaction and affected Progress tests
  passed 15 of 15.
- `npm run verify` passed outside the sandbox: formatting, lint, server types, browser types,
  the canonical PostgreSQL catalog check, and all 168 repository tests passed.
- `git diff --check` passed, and final diff inspection found Action 2 changes limited to the
  shared chrome stylesheet, its focused tests, and active-goal records.
- The PostgreSQL HTTP application suite was not rerun in Action 2 because Action 3 explicitly
  owns final live and HTTP cross-page validation. Its recorded baseline remains 48 of 49 with
  the unrelated stale Dashboard rendered-text assertion documented under Action 1.

**Remaining work for the approved later action:**

- Action 3 owns live review at every requested viewport, interactive breakpoint resizing,
  role/state coverage, real overflow measurements, sticky and modal layering checks, and any
  evidence-based compatibility repairs. Action 2 makes no live-layout completion claim.

**Completion:** Approved on 2026-09-08 after final verification passed formatting, lint,
server and browser type checks, the canonical PostgreSQL catalog check, and all 168 repository
tests. The authenticated shell now has its coordinated mobile presentation and fixed
responsive rail; live cross-page validation remains pending under Action 3.

### Action 3 — Verify and repair shell compatibility across pages and viewports

**Status:** Completed

**Purpose:** Validate the shared contract in the real application and make only evidence-based
compatibility corrections required to complete the goal.

**Expected work:**

- Review Dashboard, Library personal/admin, Profile, Programs, training days, History detail
  and list/status states, and Progress results/status states in a local browser. Include forms,
  charts, wide tables, long content, empty/light-content states, sticky panels, and modals.
- Verify 375px, 390px, the 768px breakpoint vicinity, 1024px, 1440px, and approximately
  1440×700. Resize interactively across the breakpoint in both directions and record actual
  document/body/content widths and scroll behavior.
- Exercise hamburger animation, all open/close paths, focus containment/restoration, active
  states, member/guest/admin visibility, rail footer/account positioning, background
  inertness, content scroll lock, modal layering, and reduced motion where tooling permits.
- Repair only reproduced shell-compatibility defects at their shared source. If a page-local
  change is necessary, record the evidence and keep it narrowly scoped; document unrelated
  visual inconsistencies as future candidates.
- Run focused regression tests, `npm run verify`, the PostgreSQL HTTP application suite, and
  `git diff --check`; inspect the final diff for unrelated changes and record any manual
  limitation or remaining risk.

**Acceptance criteria:**

- All requested viewport and interaction checks have recorded evidence with no shell-caused
  overlap, page overflow, layout flash, broken fixed/sticky element, or inaccessible control.
- Every Done-when criterion in `current-goal.md` is mapped to code, automated evidence, and
  live evidence or is explicitly reported unmet.
- Full repository and PostgreSQL HTTP verification pass. The action and goal stop at their
  respective review gates for explicit user approval.

**Constraints:**

- Do not treat visual review as authorization for unrelated page redesign or feature work.
- Do not reset or mutate development data solely to manufacture screenshots unless separately
  authorized and required; prefer existing roles/states and rendered-test coverage.

**Requested corrections:**

- On 2026-09-08, investigate the remaining Dashboard HTTP failure from current production
  behavior and data semantics. If production is correct, update only the smallest relevant
  fixture and/or expectation, run the affected test, full HTTP suite, `npm run verify`, and
  `git diff --check`, then return Action 3 to Ready for review without completing it.

**Implemented and repaired:**

- Performed a live authenticated shell audit across Dashboard, History, Progress, Programs,
  Library, administrator Library, and Profile at 375×812, 390×844, 768×900, 1024×900,
  1440×900, and 1440×700. The 42 page/viewport combinations had no document, body, or
  content overflow and retained the expected 260px or 350px rail offset on desktop.
- Verified the guest mobile shell separately. The administrator state exposes its permitted
  catalog destination, while the shared member destinations and active state remain correct.
  The canonical development data does not provide a separate non-admin member account, so
  ordinary member destinations were exercised through the administrator account and their
  role boundary remains covered by rendered and HTTP tests.
- Exercised mobile opening, Escape dismissal, focus movement, background inertness, content
  scroll locking, breakpoint resizing in both directions, the short-height rail, the Library
  sticky panel, modal layering, and reduced motion. The 1440×700 account region remained
  reachable inside the scrolling rail; the modal layer remained above the chrome.
- Made focus restoration deterministic by treating the menu trigger as the dismissal target
  even if opening is initiated without a preceding browser focus transfer. Added a window
  resize synchronization fallback for environments where media-query change notification is
  delayed. Both repairs preserve the existing media-query and modal ownership contracts.
- Added focused regression coverage for the unfocused-trigger Escape path and resize-event
  fallback. No page-local layout, route, permission, auth-shell, database, or product behavior
  required repair.
- Corrected the shared HTTP lifecycle fixture's calendar boundary without changing the
  production Dashboard or its assertions. The fixture now spans both PostgreSQL's local
  `CURRENT_DATE` and the UTC calendar date used by activity analytics, while its training day
  remains scheduled on local today. This preserves the intended positive heatmap scenario at
  every ordinary local/UTC date boundary.

**Live evidence and limitations:**

- Mobile open state reported `aria-expanded=true`, exposed/non-inert navigation, inert page
  content, locked content scrolling, and focus inside the menu. Escape returned focus to the
  trigger. Returning below the breakpoint restored the closed, hidden, inert mobile state;
  desktop removed mobile-only accessibility restrictions.
- Measured desktop rails were exactly 260px at 768px and 1024px, and 350px at 1440px; content
  began at the same x-coordinate. Stable scrollbar gutters reduced the usable body/content
  edge by 15px on vertically scrolling pages without causing horizontal overflow.
- Reduced-motion transition durations resolved to zero. At 1024px the Library sticky region
  remained between the rail and viewport edges. Modal z-index 1000 remained above chrome
  z-index 99 and its open state made page content inert.
- The headless host emitted display-link errors, so live animation-frame observation of modal
  focus movement was unreliable; the unchanged modal component's automated focus, trap,
  restoration, inertness, and transition-fallback tests passed. Dynamic training-day and
  history-detail routes were unavailable in the canonical seed, while their shared shell and
  route behavior remain covered by the HTTP suite.

**Verification evidence:**

- Requested-correction verification on 2026-09-08: the affected Dashboard lifecycle HTTP
  test passed 1 of 1, then the complete PostgreSQL HTTP suite passed all 49 tests.
- Focused application-chrome rendered, modal, style, browser-interaction, and affected
  Progress tests passed 18 of 18; browser type checking passed.
- Final `npm run verify` passed formatting, lint, server types, browser types, the canonical
  PostgreSQL catalog check, and all 169 repository tests.
- Investigation verified that the summary sentence and one-workout heatmap cell remain the
  intended production output when the actual completion date falls inside the program
  calendar. The failure occurred because a one-day fixture used PostgreSQL-local today for
  its calendar while analytics groups `finished_at` by UTC date; after 21:00 in São Paulo,
  the workout correctly fell on the following UTC day and outside that synthetic calendar.
- `git diff --check` passed. The requested correction changes only the HTTP fixture's date
  range; no production file, assertion, route, database schema, or application behavior was
  changed for the correction.

**Done-when mapping:**

- The mobile header/menu, fixed responsive rail, lower account region, and short-height
  fallback are implemented in the one shared chrome and verified live.
- Exact rail offsets and zero shell-caused overflow were measured at every requested width;
  existing modal/sticky behavior and protected destinations remained functional in live or
  automated coverage.
- Footer-only navigation was retired rather than duplicated. Motion uses transform/opacity
  with a zero-duration reduced-motion path, and no runtime dependency was added.
- Focused and full repository verification pass, including all 49 PostgreSQL HTTP tests; all
  Action 3 acceptance criteria now have passing evidence.

**Completion:** Approved on 2026-09-08 after the requested Dashboard investigation corrected
only the clock-boundary-sensitive HTTP fixture. The affected test passed 1 of 1, the complete
HTTP suite passed 49 of 49, `npm run verify` passed all 169 repository tests and checks, and
`git diff --check` passed. Live shell compatibility is verified at every requested viewport.

## Resume here

The goal and all three actions are **Completed**. No next goal has been approved; reassess from
current repository evidence and the user's priorities before proposing or beginning further
work.
