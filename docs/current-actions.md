# Current Actions

## Current goal

Integrate the strongest media experiment ideas into one refined branch.

## Delta-first baseline

The completed canonical-media durability goal remains historical evidence. The current repository
has three independent media experiment branches, all based on `main`; they are references only and
must not be merged or modified. The integration work is a new curated delta from `main`.

Verified experiment decisions:

- `ui-media-insights`: retain History and Progress media-backed context.
- `ui-media-atmosphere`: retain the Dashboard workout-session header treatment; reject its Day
  treatment because manual review found responsive instability.
- `ui-media-forward`: retain the Day current-exercise hierarchy, but refine its intermediate-width
  behavior before considering it complete.

## Proposed action sequence

### Action 1 — Establish the curated integration branch and selected data contracts

**Status:** Ready for review

Create `ui-media-integration` directly from `main`, leaving all three experiment branches
unchanged. Selectively port or reimplement only the canonical media view-model/controller/template
contracts needed for Dashboard session headers, Day current-exercise media, History performed-data
media, and Progress selected-exercise media. Preserve resolver precedence, fallback behavior,
localization, accessibility metadata, session/workout behavior, History snapshots, and Progress
calculations. Add only the focused contract tests required by the selected integrations.

**Implementation and evidence:** Created `ui-media-integration` directly from `main` at commit
`4e0bfa2`; the three experiment branches remain separate references. Reused the existing
Dashboard and Day media loading/resolver contracts. Dashboard session headers now receive the
first resolved exercise media, History list cards resolve a representative image from the first
performed snapshot step, History detail steps resolve media from their recorded snapshot labels,
and Progress resolves media from the selected exercise context. History and Progress templates use
the shared media partial with decorative, lazy-loaded media so adjacent semantic labels remain the
accessible identity. No Programs/Library experiment styling or atmospheric Day styling was
imported, and no Progress calculation changed.

Focused verification passed:

- `node --test src/features/workoutHistory/workoutHistory.test.js` — 4 tests passed.
- `node --test views/viewModels/dashboardPage/createDashboardPageViewModel.test.js` — 8 tests passed.
- `node --test views/viewModels/workoutHistoryPage/createWorkoutHistoryPageViewModel.test.js` — 5 tests passed.
- `node --test views/viewModels/exerciseProgressPage/createExerciseProgressPageViewModel.test.js` — 4 tests passed.
- `node --test views/workoutHistoryPages.test.js views/exerciseProgressPages.test.js` — 8 tests passed.
- `npm run format:check` — passed.
- `npm run lint` — passed.
- `npm run check:types` — passed.
- `git diff --check` — passed.

No CSS composition or manual responsive review was performed in this action; those are reserved
for Action 2 and Action 4.

**Completion summary:** The selected Dashboard, Day, History, and Progress data/rendering
contracts are implemented on a direct integration branch and preserve canonical fallback,
localization, accessibility, History snapshot, workout-state, and Progress-calculation behavior.

**Done when:**

- The new branch is a direct descendant of `main`, not an experiment branch.
- Selected pages receive media through the existing resolver and shared media partial.
- History representative media remains grounded in performed snapshot data.
- Progress media remains grounded in the selected exercise/context.
- Dashboard and Day data contracts are ready for their selected compositions without importing
  unrelated Programs/Library experiment styling.
- Focused tests for the selected data/rendering boundaries pass.

### Action 2 — Integrate Dashboard atmosphere and refine Day responsiveness

**Status:** Pending

On the integration branch, apply the atmospheric experiment only to the Dashboard workout-session
header. Keep foreground text, status, and controls readable in both supported themes and across
small, intermediate, and large widths. Apply the forward experiment's current-exercise hierarchy
to Day, but rework its layout at the actual pressure point so exercise information and logging
controls retain usable space. Do not import the rejected atmospheric Day implementation.

**Done when:**

- Dashboard session-header media is a strong but restrained visual anchor with safe overlays.
- Day current-exercise media remains prominent without compressing essential interaction content.
- Intermediate widths are handled intentionally through composition/reflow rather than shrinking
  important controls.
- Missing media, long names, narrow layouts, theme variants, focus, and reduced-motion behavior
  remain safe.

### Action 3 — Integrate History and Progress presentation and run consistency review

**Status:** Pending

Complete the History and Progress presentation from the selected insights direction, then perform
a focused consistency pass across Dashboard, Day, History, and Progress. Review image radius and
aspect ratios, overlays, gradient strength, spacing, borders, card treatment, typography hierarchy,
media sizing, and fallback presentation. Keep purpose-specific layouts where they improve the
task instead of forcing identical components.

**Done when:**

- History helps identify actual previous workouts and exercises rather than adding arbitrary art.
- Progress keeps metrics and charts primary while retaining selected exercise context.
- The four surfaces read as one visual language and preserve their distinct information roles.
- Focused tests cover integrated fallback, localization, theme, and rendering boundaries.

### Action 4 — Responsive/manual review, documentation, and final verification

**Status:** Pending

Inspect affected layouts at approximately 390px, a representative intermediate width in the
520–900px pressure range, and 1280–1440px, with special attention to Day. Review populated,
fallback, long-content, empty/error, keyboard/focus, and reduced-motion states as supported by the
available browser infrastructure. Add `docs/media-integration.md` with selected experiment
sources, rejected implementations, Day responsive refinements, compromises, and intentionally
omitted reusable ideas. Inspect the final diff and run `npm run verify`.

**Done when:**

- Responsive evidence is recorded, including any browser/rendering limitations.
- Documentation accurately describes the curated integration.
- `npm run verify` passes on the final integration branch.
- The experiment branches are unchanged, no merge commits are introduced, and the integration
  branch is ready for manual review.

## Resume here

Action 1 is Ready for review. Action 2 remains Pending: integrate Dashboard atmosphere and refine
Day responsiveness after explicit approval.
