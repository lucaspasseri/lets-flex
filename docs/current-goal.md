# Current Goal

## Parent milestone

Let’s Flex gives users a coherent, trustworthy, and polished interface for building and
using strength-training sessions.

## Current goal

Refactor the authenticated application shell into one coordinated responsive system:
a compact horizontal header with accessible expandable navigation on mobile, and a fixed
Passport-inspired left rail containing brand, primary navigation, and account/secondary
content on tablet and desktop.

## Status

Completed on 2026-09-08 after explicit user approval. Actions 1, 2, and 3 are Completed.

**Outcome:** The authenticated application now uses one responsive chrome: an accessible
header-connected navigation menu on mobile and the same brand, destinations, active state,
and account identity in a fixed 260px/350px tablet/desktop rail. Live review found no
shell-caused overflow or overlap at the requested viewports, interaction and reduced-motion
contracts are covered, and final verification passed all 49 HTTP tests and all 169 repository
tests.

## Approved user outcome

The authenticated application chrome feels like one layout changing form across viewport
sizes. Mobile presents the Let’s Flex brand on the left and a semantic menu button on the
right; opening it reveals every permitted primary destination in a large header-connected
surface. At the established tablet/desktop boundary, the same brand, navigation, active
state, and account information form a fixed left rail while page content occupies the
remaining viewport. The app retains its own palette, typography, icons, routes, permissions,
profile behavior, and component conventions.

The Passport.js site is a spatial and interaction reference only. Its branding, colors,
content, code, non-semantic trigger, display-based menu toggle, and incomplete accessibility
behavior are not implementation requirements.

## Delta-first baseline

### Already satisfied

- `views/layouts/pageShell.ejs` is the single authenticated layout entry point for
  Dashboard, Programs and training days, Library and administrator catalog management,
  History, Progress, and Profile.
- Every protected page supplies an explicit `shell.activeNavigation` value. The existing
  navigation renders `aria-current="page"` for exactly one matching destination and exposes
  administrator catalog management only when `isAdmin` is true.
- The shared header already renders the Let’s Flex logo and the current user or guest
  identity as a profile link. All six member destinations and the conditional administrator
  destination already exist and have stable route semantics.
- The application already has semantic color, surface, spacing, focus, and shadow tokens;
  a reduced-motion baseline; a shared browser-component initializer; and tested modal
  patterns for Escape handling, background inertness, focus movement/restoration, and
  scroll locking.
- The page shell deliberately owns viewport scrolling through `body > .content`, keeps
  overlays outside `data-page-content`, and gives major page roots bounded centered widths
  with shared horizontal spacing. The previous Library goal repaired narrow footer overflow.
- Authentication entry and password-reset pages intentionally use `authShell.ejs` before an
  authenticated principal exists. They already provide their own coherent full-viewport
  layout and do not render protected navigation.

### Reuse

- The `pageShell` composition point, `shell.currentUser`, `shell.activeNavigation`,
  `isAdmin`, existing route/view-model contracts, and current navigation destinations.
- The existing logo, user avatar, semantic tokens, focus styles, shared component bootstrap,
  and browser-test conventions.
- The tested modal interaction techniques where their mechanics are applicable to a
  full-screen mobile menu, without turning navigation into a modal component.
- Existing page max-width and horizontal-padding contracts, internal table/rail scrolling,
  overlays, and page-specific sticky elements unless live verification proves a shell
  compatibility defect.
- Passport.js’s verified layout proportions: a 48rem/768px rail breakpoint, approximately
  16.25rem/260px medium rail, approximately 21.875rem/350px large rail, vertically balanced
  navigation, and a compact/scrolling fallback for short desktop viewports.

### Modify

- Replace the three-sibling top-header/content/bottom-navigation arrangement with one
  application chrome whose header, navigation, account region, and content have a shared
  responsive layout contract.
- Move the existing navigation definition out of the footer-only presentation so one DOM
  source serves the mobile menu and desktop rail. Preserve labels, URLs, administrator
  visibility, active-route semantics, and current profile behavior.
- Replace the mobile bottom primary-navigation bar with the requested header-connected menu.
  The current footer contains no independent legal, version, or secondary copy, so retaining
  it would duplicate the same primary navigation. The existing profile identity becomes the
  lower account/secondary region in the rail and mobile menu; no filler content is invented.
- Change the authenticated body/content layout from three rows to a mobile header/content
  composition and a tablet/desktop fixed-rail/content composition. Keep the content scroller,
  overlay positioning, page max widths, and shared page padding coherent.
- Rework header/footer styles into application-shell styles using current semantic tokens.
  Remove obsolete header/footer rules and page-level compensation only when direct evidence
  shows the new shared contract supersedes them.

### Add

- A native menu button with an accessible name, `aria-expanded`, and `aria-controls`, plus a
  CSS hamburger-to-close treatment with practical touch sizing and visible focus.
- A dependency-free browser shell component that opens and closes the mobile navigation,
  closes on Escape and destination activation, restores focus when appropriate, constrains
  keyboard focus, prevents interaction with covered content, locks the actual application
  content scroller, and normalizes state when crossing the rail breakpoint.
- Mobile menu transitions based on transform and opacity, safe shell transitions where they
  clarify the responsive relationship, and a reduced-motion path. Essential state changes
  must not depend solely on transition events.
- Fixed medium and large rail widths, correct main-content offset, bottom account placement,
  vertically balanced primary navigation, and short-height compaction/rail scrolling.
- Focused rendered, CSS-contract, and browser-component coverage for the shared shell,
  permissions, active state, menu state, keyboard behavior, scroll/inert behavior,
  focus restoration, breakpoint normalization, and reduced motion.

### Unknown until implementation review

- The exact final visual balance of 260px and 350px rails in Let’s Flex’s denser application
  pages. The reference values are a verified starting point, not mandatory final dimensions.
- Whether the day and Library sticky panels, modal overlays, wide analytics/history tables,
  and long administrator navigation label need bounded shell-compatibility corrections.
  Source inspection identifies the risk but does not prove a defect.
- Whether all representative pages remain visually balanced at 375px, 390px, 768px, 1024px,
  1440px, and 1440×700 after the shell changes. This requires live rendered verification
  and interactive breakpoint resizing.
- No numeric contrast audit tooling has yet been identified. Changed colors should reuse the
  already established semantic palette, with manual state review recorded.

## Scope

### In scope

- Authenticated `pageShell` markup and its shared brand, navigation, account/footer, content,
  and overlay placement.
- Header/navigation/footer EJS and CSS consolidation; a small browser shell component using
  existing initialization patterns; focused tests for structure and interaction.
- Responsive mobile header/menu and fixed tablet/desktop rail, including active navigation,
  administrator visibility, guest/account identity, short-height behavior, motion, and
  reduced motion.
- Shared content-offset, scroll, overflow, and layering behavior across every protected page
  using the shell.
- Narrow compatibility corrections to individual pages only when rendered evidence proves
  the shared-shell refactor requires them.
- Live responsive review at the requested widths and a wide-short viewport, including menu,
  active route, footer/account transformation, content alignment, sticky elements, overlays,
  and cross-breakpoint resizing.

### Out of scope

- Changes to routes, permissions, authentication/session behavior, business logic, database
  schema/data, or navigation destinations.
- Applying protected application chrome to unauthenticated login, registration, or password
  reset pages; their existing `authShell` remains separate unless later evidence and explicit
  approval establish a product requirement.
- Passport.js branding, palette, typography, logo, text, code, dependencies, search/social
  tooling, or its inaccessible menu implementation.
- New global/footer content, new product features, unrelated page redesign, broad
  accessibility remediation, or a new design system/framework.
- New runtime dependencies, database reset/migration work, push, deployment, or production
  mutation.

## Correctness and accessibility requirements

- One maintained navigation definition preserves all current member/admin destinations,
  visibility rules, URLs, and explicit active state in both responsive presentations.
- The mobile trigger is a native button with a clear accessible name, `aria-expanded`, and a
  valid `aria-controls` relationship. Open and closed navigation states agree across DOM,
  visuals, pointer input, and accessibility APIs.
- The menu closes on Escape and destination activation, restores focus after dismissal,
  contains keyboard focus while it obscures the page, prevents background interaction and
  content scrolling, and returns to a stable closed state across breakpoint changes.
- The fixed rail never covers content. Shell and page widths do not produce horizontal page
  overflow, duplicate horizontal padding, clipped controls, or inaccessible short-height
  navigation/account content.
- Existing modal background-inertness, focus trapping, fixed overlay layering, page-level
  scrolling, active route transitions, sticky elements, and route behavior remain correct.
- Motion uses explicit transform/opacity (and only necessary layout-property) transitions,
  avoids `transition: all`, remains modest, and is removed or greatly shortened for
  `prefers-reduced-motion: reduce`.
- Navigation, account, and menu controls retain practical touch targets, visible focus, text
  wrapping, contrast, native link/button behavior, and semantic header/nav/main/footer
  landmarks where appropriate.

## Done when

- Mobile renders a polished horizontal header and accessible expandable primary navigation;
  tablet/desktop renders the same chrome as a fixed left rail with lower account/secondary
  content and short-height fallback.
- Main content is correctly offset from the rail, keeps one predictable padding/max-width
  contract, and has no shell-caused horizontal overflow or overlap.
- All existing routes, active states, administrator visibility, current-user/guest profile
  behavior, overlays, modals, forms, charts, tables, and sticky elements remain functional.
- Footer-only navigation has been coherently transformed rather than duplicated, and no
  unnecessary footer copy or dependency has been added.
- Menu and shell motion use the specified techniques and have a verified reduced-motion path.
- Focused component/rendered/style tests pass; `npm run verify` and the PostgreSQL HTTP suite
  pass because this is a broad cross-cutting UI change.
- Live review records 375px, 390px, 768px, 1024px, 1440px, and approximately 1440×700,
  interactive resizing in both directions, member/guest/admin states where practical, menu
  keyboard/pointer behavior, and document/content overflow measurements.
- Remaining page-specific visual issues are recorded as separate future candidates rather
  than expanding this goal beyond shell compatibility.
