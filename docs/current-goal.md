# Goal: Integrate the strongest media experiment ideas into one refined branch

## Goal status

**Approved — action plan pending approval**

## Objective

Create a curated integration branch directly from untouched `main`. Selectively reimplement the
successful ideas from the three media experiments without merging or modifying those reference
branches:

- `ui-media-insights` for purposeful History and Progress media;
- `ui-media-atmosphere` for the Dashboard workout-session header only;
- `ui-media-forward` for the Day current-exercise presentation, refined at intermediate widths.

The result must feel like one coherent interface while preserving the existing canonical media
resolver, localization, fallbacks, themes, accessibility, responsive behavior, workout logging,
session state, ownership rules, navigation, View Transitions, History behavior, and Progress
calculations.

## Verified baseline and delta

### Existing relevant capabilities

- `main` already contains the shared canonical media partial, resolver precedence, initial
  fallbacks, and localized/accessibility-safe media contracts.
- `main` retains conservative Dashboard, Day, History, and Progress layouts with their existing
  behavior and tests.
- `ui-media-forward`, `ui-media-atmosphere`, and `ui-media-insights` are independent descendants
  of `main`, each documenting its implementation and tradeoffs.
- The insights branch provides the verified data path for History representative media from the
  first performed exercise snapshot and Progress media from the selected exercise context.
- The atmosphere branch provides the verified Dashboard session-header composition, while its Day
  composition was manually rejected for responsive instability.
- The forward branch provides the verified Day current-exercise hierarchy, but its intermediate
  widths were manually judged too compressed.

### Required delta

- Create `ui-media-integration` directly from `main`; do not merge any experiment branch.
- Selectively port or reimplement the insights data/view/template contracts for History and
  Progress.
- Selectively port or reimplement the atmosphere session-header treatment for the Dashboard only.
- Selectively port or reimplement the forward current-exercise treatment for Day, adding an
  intentional intermediate-width layout that preserves comfortable logging controls and readable
  exercise information.
- Perform a focused visual consistency pass across the four affected surfaces without forcing
  identical media layouts.
- Add or update focused rendering/responsive tests only where the integrated contracts require
  coverage.
- Add `docs/media-integration.md` documenting selected sources, rejected ideas, refinements,
  compromises, and intentionally omitted reusable ideas.

## Explicitly rejected or excluded

- Do not import the atmospheric Day-page implementation; it was unstable across reviewed widths.
- Do not carry the experiments' incidental Programs or Library styling into the integration unless
  a supporting change is required for a selected surface's coherence.
- Do not redesign unrelated pages, alter media-selection precedence, add hard-coded media URLs, or
  introduce new fitness calculations.
- Do not merge the integration branch into `main`.

## Completion criteria

- [ ] `ui-media-integration` exists as a direct curated descendant of `main`.
- [ ] History uses representative media tied to actual performed workout data.
- [ ] Progress uses media tied to the selected exercise/context without changing calculations.
- [ ] Dashboard uses the atmospheric workout-session header treatment with readable foreground
      content in Classic and Bold Neon Performance themes.
- [ ] Day uses the media-forward current-exercise treatment without importing atmospheric Day
      styling, and intermediate widths preserve readable content and comfortable logging controls.
- [ ] Missing media still uses the shared fallback contract; localization and accessibility remain
      intact.
- [ ] The affected pages share a coherent visual language while retaining purpose-specific layouts.
- [ ] Focused tests cover the integrated media resolution/fallback/rendering boundaries.
- [ ] `npm run verify` passes on the final integration branch.
- [ ] `docs/media-integration.md` records selected ideas, rejected implementations, responsive
      refinements, compromises, and intentionally omitted ideas.
- [ ] The three experiment branches remain unchanged and no branch is merged.

## Manual review target

Before final review, inspect the affected pages at approximately 390px, an evidence-based
intermediate width in the 520–900px pressure range, and 1280–1440px. Include populated, missing
media/fallback, long-name, relevant empty/error, keyboard/focus, and reduced-motion states where
the current browser test infrastructure supports them.
