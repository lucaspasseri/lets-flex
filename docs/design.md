# Let's Flex — Classic + Neon theme system

Status: supported application design system, 2026-09-14.

The application has exactly two user-selectable themes. Both use the same EJS components, semantic
HTML, responsive layouts, interaction logic, and accessibility contracts.

## Supported themes

| Theme   | Role     | Visual language                                                                                                                                                 |
| ------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Classic | Default  | The existing dark main appearance with restrained surfaces, coral actions, teal secondary/success states, and neutral borders.                                  |
| Neon    | Optional | Dark blue-tinted surfaces with cyan/blue primary actions, violet secondary accents, intentional gradients, stronger active-state contrast, and restrained glow. |

Classic is the safe fallback for missing, invalid, or unavailable preferences.

## Architecture

- `public/css/theme.css` is the theme boundary. It defines the Classic fallback and the explicit
  `classic` and `neon` semantic token sets for page/surface roles, text, actions, secondary and
  status colors, focus, shadows, and gradients.
- Shared CSS consumes semantic roles such as `--color-page`, `--color-surface`, `--color-action`,
  and `--color-secondary`. Components do not select a palette by theme name.
- The shared head runs a small synchronous resolver before the theme stylesheet and the remaining
  CSS chain. It accepts only `classic` and `neon` from the `lets-flex-theme` storage key, applying
  Classic otherwise. This keeps a saved Neon preference from flashing Classic during first paint.
- `public/js/theme.js` initializes the profile radio group, applies a choice immediately, and
  persists only supported values. Browser storage is intentionally used for guests and members so
  the preference does not require a server route, database field, or migration.
- Theme-specific rules are limited to colors, surfaces, borders, gradients, shadows, glow, and
  related decoration. Existing page/component styles remain the source of layout, spacing,
  responsive behavior, semantics, and state logic.

## Shared visual decisions

- Classic retains the established appearance and remains the default.
- Neon uses the earlier cyan/violet direction from the visual experiment source: cyan is the main
  action/focus treatment, violet is the secondary accent, and success remains a cool subdued teal.
- Neon decoration is shared across application chrome, page surfaces, active states, tabs, buttons,
  search focus, and media frames. The in-progress session trace is shared component decoration and
  disables its animation under `prefers-reduced-motion: reduce`.
- Active states retain explicit existing markup and labels; color and glow reinforce state but do
  not carry meaning alone.
- The later calm/middle-ground palette is rejected. It is not a third theme and is not represented
  in production CSS.

## User-facing inventory

| Surface            | Route/view                                     | Relevant theme coverage                                                                |
| ------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| Dashboard          | `/` · `views/index.ejs`                        | onboarding, program state, date navigation, workout, metrics, charts, and empty states |
| Programs           | `/programs` · `views/programs.ejs`             | hierarchy, entity switchers, calendars, and CRUD modals                                |
| Training Day       | `/day` · `views/day.ejs`                       | day navigation, sessions, cancellation, and workout entry                              |
| Library            | `/library` · `views/library.ejs`               | tabs, search/filter, master/detail workspace, media, and CRUD forms                    |
| History / Progress | `/history`, `/progress`                        | filters, result/detail states, metrics, and pagination                                 |
| Profile / auth     | `/profile`, `/login`, register, password reset | appearance selector, forms, account actions, feedback, and guest/auth states           |

## Accessibility and responsive boundary

The Appearance control is a labelled native radio group with exactly two options. It remains
keyboard-operable and exposes the selected state to assistive technology. Choosing a theme does not
submit a form, redirect, or reset page state. The selector collapses at the existing narrow profile
container breakpoint.

Existing responsive rules remain shared and are not duplicated per theme. Review targets are 390px,
768px, and 1280–1440px, with particular attention to Portuguese wrapping, workspace columns,
media, focus visibility, keyboard order, tabs, modals, and active workout states.

## Verification boundary

Automated coverage includes semantic token boundaries, Classic/Neon values, stylesheet order,
pre-paint resolution, storage fallback, immediate selector switching, persistence, profile rendering,
localization, shared Neon decoration, and reduced-motion session behavior. Repository format, lint,
server/browser type checks, and diff checks are run for the completed goal.

Live browser rendering, keyboard traversal, reload persistence, and viewport inspection remain
unavailable in the current environment because no browser executable is installed. Those checks are
explicit review targets rather than claims of captured visual verification.
