# Curated media integration

Branch: `ui-media-integration`

## Scope and sources

This branch was created directly from `main` at `4e0bfa2`. It selectively reimplements the
successful ideas from three independent experiment branches; it does not merge, rewrite, or
depend on those branches.

- `ui-media-insights`: History representative media from the first performed snapshot step and
  Progress media from the selected exercise context.
- `ui-media-atmosphere`: restrained atmospheric media for the Dashboard workout-session header
  only.
- `ui-media-forward`: recognizable current-exercise media for Day and, after focused review,
  the Dashboard current-workout step.

All selected surfaces use the existing resolver and shared media partial. No media URL, exercise
association, Progress calculation, History snapshot, authorization, or localization rule is
hard-coded into the integration.

## Selected compositions

### Dashboard

The session header uses the atmosphere treatment: an edge-aligned image, restrained masking, and
foreground text/status layering. The current-workout step uses the forward task composition, with
the exercise image beside the identity and logging form on wider containers and a stacked layout
below 45rem. The atmosphere is not applied to the active-step panel.

### Day

The first assigned exercise image is a compact visual anchor beside the exercise identity and
controls. The side image is 9rem high at wide widths and becomes a 9rem full-width image at the
52rem pressure threshold, before status, delete, and logging content become cramped. Narrow
content continues to wrap through the existing controls and shared fallback.

### History

The list uses one representative performed exercise image so a past workout is identifiable
without becoming a gallery. On the detail route, each exercise-result card places its compact
image beside the exercise header; scheduled and performed information spans the card below it.
This keeps the card height driven by its actual data instead of by an empty media-side column.

### Progress

The selected exercise image is a small 3:2 context cue beside the selection heading. At narrow
widths it stacks above the heading at a maximum width of 9rem. Summary metrics, coverage, units,
and trend data remain the primary content.

## Responsive evidence

The available repository evidence is static: this workspace contains no browser screenshot or
geometry harness, and no reliable rendered capture was available to this action. The CSS contracts
were reviewed at the requested width bands:

- Around 390px: Day media, Dashboard current-exercise media, and Progress selection context stack;
  History detail content uses its existing single-column content rules. Shared media preserves the
  3:2 fallback geometry, long labels wrap, and reduced-motion rules remain present.
- Around 520–900px: Day stacks at 52rem before its exercise identity and controls are squeezed;
  History detail retains the compact image/header row with full-width scheduled/performed content;
  Progress keeps its small image beside the selection until its 42rem stack threshold.
- Around 1280–1440px: Dashboard and Day retain distinct side-by-side task compositions; History
  uses a 7–9rem media column and Progress an approximately 6.5–8.5rem selection column. No
  selected layout introduces fixed-height media that dictates unrelated content height.

The manual review evidence supplied during the goal led to the compact Day, History, and Progress
corrections and the Dashboard current-exercise refinement. Populated, fallback, long-content,
empty/error, localization, focus, and reduced-motion contracts are covered by the existing focused
tests; browser-level keyboard and rendered geometry inspection remains a documented environment
limitation.

## Rejected ideas and compromises

- The atmospheric Day implementation was rejected for responsive instability and is not present.
- The atmosphere experiment's active-step background was omitted; only the Dashboard session header
  uses atmospheric masking.
- Incidental Programs and Library experiment styling was not carried into this branch.
- History and Progress do not share identical media dimensions or card grids. History benefits from
  compact edge-aligned recognition; Progress benefits from an inset context cue that leaves its
  metrics primary.
- Dashboard header atmosphere and Dashboard current-exercise media remain separate treatments so
  a decorative header image does not compete with the logging task.

## Verification and integrity

The shared media partial retains informative and decorative accessibility modes, initial fallback
presentation, native lazy loading where appropriate, and canonical resolver precedence. The
integration branch has no merge commits after `main`, and the three experiment branches remain
separate references. Final repository verification passed with `npm run verify` (586 tests).
