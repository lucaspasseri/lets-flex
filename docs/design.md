# Let's Flex — Experimental Design Exploration

Status: temporary exploration, 2026-09-14. The three directions below are prototypes for visual
review, not a permanent redesign or an approved design system.

## Current audit

### User-facing inventory

| Surface | Route/view | Useful coverage |
| --- | --- | --- |
| Dashboard | `/` · `views/index.ejs` | onboarding, program state, date navigation, workout, metrics, charts, empty states |
| Programs | `/programs` · `views/programs.ejs` | hierarchy, entity switchers, calendar, create/delete modals |
| Training Day | `/day` · `views/day.ejs` | day navigation, session list, cancel modal, workout entry point |
| Library | `/library` · `views/library.ejs` | tabs, search/filter, master/detail workspace, media, CRUD forms/modals |
| History / Progress | `/history`, `/progress` | filters, result/detail states, metrics, pagination, data-dense reading |
| Profile / auth | `/profile`, `/login`, `/register`, password reset | forms, account actions, feedback, guest/auth states |

### Verified patterns and opportunities

- The dark shell, coral action color, teal success/accent, strong headings, and workout data
  already form a recognizable identity worth preserving.
- Dashboard, Programs, Library, history, and progress frequently stack bordered cards, icon tiles,
  badges, and eyebrow headings. This makes ordinary grouping compete with primary tasks.
- Shared forms, buttons, modal mechanics, application navigation, tabs, accordions, i18n, and
  workout controls have established semantic and keyboard contracts. They are reused unchanged.
- Page-local action recipes and repeated heading treatments make equivalent actions feel less
  consistent than the underlying components. These prototypes test hierarchy before consolidation.
- Responsive behavior is generally strong at small and large widths, but intermediate widths put
  pressure on multi-column workspaces, action rows, media, and long Portuguese labels.
- Media works best as exercise/session context. The experiments use it selectively rather than as
  decoration, and preserve existing media fallbacks and accessible alternatives.
- Empty, selected, feedback, destructive, and form states already have explicit markup; each
  direction changes their emphasis without changing state logic or interaction behavior.

### Recurring components affected by a chosen direction

The experiment surfaces share the application shell, page heading, shared buttons/forms/modals,
media, session cards, workout session component, tabs, and feedback treatments. Direction CSS
styles these existing contracts; it does not replace their EJS, ViewModels, routes, or scripts.

## Stable principles

- Preserve the dark visual foundation and the existing coral, teal, red, and neutral semantic roles.
- Keep mobile-first, fluid responsive behavior and test around 390px, 768px, and 1280–1440px.
- Preserve semantic HTML, visible focus, keyboard interaction, reduced-motion behavior, labels,
  validation, i18n, permissions, CSRF, routes, and existing data contracts.
- Keep the active workout state clear and keep media subordinate to training information.
- Reuse existing shared components and interaction contracts; avoid new frameworks or dependencies.

## Experimental directions

### A — Performance Console

Compact and data-led: reduce decorative containers, sharpen metric scale, use rules and alignment
for grouping, and make the current workout/selected session state scan first. The trade-off is a
less expressive and less promotional feel. Branch: `experiment/ui-performance-console`.

### B — Athletic Editorial

Expressive and premium: create larger typographic moments, purposeful whitespace, and selective
media-led emphasis while keeping controls efficient. The trade-off is more vertical travel and
less information visible at once. Branch: `experiment/ui-athletic-editorial`.

### C — Minimal Training Utility

Restrained and workflow-first: flatten ordinary groups, remove most ornamental chrome, and let
type, spacing, and explicit actions carry hierarchy. The trade-off is less visual signaling for
secondary context. Branch: `experiment/ui-minimal-utility`.

## Approved principles

None yet. Principles move here only after visual review.

## Review contract

Inspect the same populated and empty/selected states in English and Portuguese. At each direction,
check 390px mobile, 768px intermediate, and 1280–1440px desktop for overflow, wrapping, action
priority, media height, over-wide reading areas, focus visibility, keyboard order, and modal/tab
behavior. Browser rendering is not available to this coding environment, so these are exact review
targets rather than claims of captured visual verification.

After review, choose one direction, combine specific ideas, revise a direction, or reject the
experiments. Do not propagate any direction to the remaining pages until that decision is made.
