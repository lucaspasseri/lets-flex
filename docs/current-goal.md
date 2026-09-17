# Goal: Improve the Exercises tab on the Library page

## Goal status

**Completed — 2026-09-17**

The Exercises tab now follows the Sessions master/detail composition: a compact independently
scrollable summary list on the left and the selected exercise details on the right at desktop and
tablet widths, with the existing responsive stacked layout at narrower widths. Exercise-specific
data, filtering, selection, localization, media fallback, themes, accessibility, View Transitions,
and ownership behavior remain intact. Focused tests and the full 594-test verification suite passed.
Browser-rendered geometry and live keyboard inspection remain unavailable because no browser
harness is present.

The Exercises tab now uses a compact Sessions-derived summary list with a separate selected
exercise detail panel. Exercise-specific information, localization, media fallback, filtering,
management actions, accessibility contracts, and supported themes remain intact. Focused tests and
the full 594-test verification suite passed. Browser-rendered geometry and live keyboard inspection
remain unavailable because no browser harness is present.

This completed goal is explicitly reopened at the user's request to correct the remaining desktop
composition: Exercises must use the same two-column master/detail structure as Sessions, with the
compact scrollable list on the left and selected details on the right.

## Objective

Improve the Exercises tab's visual structure, spacing, hierarchy, and overall presentation so it
feels like the same Library design system as the recently refined Sessions tab. Focus on the
exercise list/summary items and the selected exercise/details area while preserving
exercise-specific information and all existing Library behavior.

## Verified baseline and delta

### Existing relevant capabilities

- `views/library.ejs` already provides accessible Sessions and Exercises tabs using the shared tab
  interaction contract.
- Exercise summaries are rendered through the existing accordion component and
  `exerciseTemplateSummary.ejs`; exercise details are rendered through
  `exerciseTemplateDetails.ejs` with movement, equipment, muscles, variants, and management data.
- `exerciseTemplates.css` already provides responsive exercise cards, selected/expanded styling,
  media frames, facts, muscle groups, variant lists, focus states, and reduced-motion behavior.
- The Sessions tab already provides the approved visual reference for compact summary cards,
  selected states, media sizing, structured detail panels, spacing, borders, and theme tokens.
- Existing view models, media resolver/fallback contracts, search/filter interactions,
  localization, ownership/security behavior, navigation, and View Transitions are already
  implemented and covered; they must be reused. The prior accordion presentation is the baseline
  being explicitly reconsidered for this goal's final master/detail structure.
- The previous Library session-presentation goal is completed and remains historical evidence.
  This goal explicitly revisits only the Exercises tab, which was previously outside that scope.

### Verified gaps

- Exercise summaries use a separate accordion-card composition with a `5rem` minimum trigger,
  `1rem` trigger padding, and exercise-specific metadata structure rather than the more compact
  Sessions summary proportions and alignment.
- Exercise details begin with a standalone media frame followed by fact, muscle, and variant
  sections, while selected Sessions use a coordinated header/detail hierarchy and spacing system.
- Exercise cards and details already have functional expanded/selected states, but their visual
  grammar is not yet explicitly aligned with the refined Sessions summary/detail patterns.
- The exercise-specific information is intentionally richer than the session summary content, so
  the delta must adapt the visual language without copying Session markup wholesale.
- The pasted request ends mid-sentence after “Rel”, so any acceptance text after that point is
  unknown and is not being invented as a requirement.
- No browser screenshot/geometry harness is available in this workspace; rendered geometry and
  live keyboard inspection must be reported as unavailable if not supported by tooling.

### Reuse and constraints

- Reuse the Sessions visual language, shared summary/detail surfaces, shared media partial,
  semantic CSS variables, existing responsive/container patterns, focus states, and reduced-motion
  safeguards where their roles match naturally.
- Use the smallest page-local selection controller needed to present compact summaries and one
  separate selected detail panel; preserve the existing search/filter data attributes and
  interaction boundaries rather than creating a parallel exercise data model.
- Preserve exercise-specific movement, equipment, muscle, variant, setup, notes, and management
  information.
- Keep media compact and proportional; do not introduce hard-coded URLs, new media resolution
  logic, or a broad Library redesign.
- Use the existing Classic and Bold Neon Performance theme tokens and preserve the shared tab,
  localization, authorization, navigation, media fallback, and exercise data contracts.

## Explicitly excluded

- No redesign of the entire Library page or Sessions tab.
- No changes to exercise search/filter semantics, variant actions, creation/edit/archive flows,
  ownership/security, localization, media resolver/fallback precedence, navigation, or View
  Transitions. The exercise selection presentation is explicitly reconsidered only to support the
  separate master/detail layout requested during review.
- No removal of useful exercise-specific information merely to make content identical to Sessions.
- No changes to Dashboard, Day, History, Progress, database schema, migrations, or external
  dependencies.

## Completion criteria

- Exercise summary items visually align with the current Sessions summary design in proportion,
  media placement, padding, title hierarchy, metadata, borders, backgrounds, states, and focus.
- Selected exercise details visually align with the current Sessions details presentation while
  retaining exercise-specific information.
- Summary and detail media remain compact, proportional, responsive, and free of excessive empty
  space or overflow.
- Selected and unselected/closed states remain easy to distinguish.
- On desktop and tablet widths with sufficient space, the Exercises tab uses the Sessions-like
  two-column list/detail composition; narrower layouts may stack the regions.
- The exercise summary list is independently scrollable and does not make the full page excessively
  tall when many exercises are present.
- Classic and Bold Neon Performance themes retain readable contrast using existing tokens.
- Desktop, intermediate, and smaller supported viewports remain usable.
- Existing Library functionality and accessibility semantics remain unchanged.
- Focused tests cover summary/detail rendering, media fallback, expanded/selected states,
  exercise-specific data, themes, responsive contracts, localization, and interaction boundaries
  required by the implementation.
- `npm run verify` passes and the final diff remains limited to the Exercises tab presentation,
  its focused tests, and tracking/documentation records.

## Manual review target

Review populated, empty, long-name, media/fallback, selected/expanded, variant-rich, management,
localized, focus, reduced-motion, and both-theme states at approximately 390px, an evidence-based
intermediate width in the 520–900px pressure range, and 1280–1440px where browser infrastructure
supports it. Treat unavailable browser geometry or keyboard inspection as an explicit limitation,
not as inferred rendered evidence.
