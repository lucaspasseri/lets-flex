# Current Goal

## Parent milestone

Let’s Flex gives users a coherent, trustworthy, and polished interface for building and
using strength-training sessions.

## Current goal

Standardize and refine the Library page—especially Exercise Templates—against the visual
language already established across Dashboard, Programs, Progress, History, Profile, and
shared components, while repairing duplicated session exercise labels and the Dashboard
chart status that remains visible after successful enhancement.

## Status

Completed on 2026-09-08 after explicit user approval. Both actions are Completed.

**Outcome:** Library Exercise Templates now match the application's established visual and
component language, session exercise choices expose distinct variant-aware labels, and the
Dashboard chart no longer displays stale loading content after successful enhancement.

## Approved user outcome

The Library feels like part of the same application rather than a separate visual system.
Exercise templates have clear base/variant hierarchy, consistent spacing, typography,
surfaces, controls, accordion behavior, forms, and responsive states. New-session exercise
choices are distinct and variant-aware, and the Dashboard does not show a stale chart
loading placeholder when the chart is ready. Existing functional, ownership, accessibility,
and fallback behavior is preserved unless directly defective.

## Delta-first baseline

### Already satisfied

- The Library main container uses the same 76rem centered layout and horizontal spacing as
  Dashboard and Progress.
- Library uses the shared page heading, button, form-field, modal, icon, and accordion entry
  points. Shared fields already provide labels, required/optional status, hints, errors,
  focus states, and responsive form grids.
- Search, session-workspace, empty-state, private/global ownership, and personal/admin mode
  behavior already exist; this goal does not replace their product model.
- Exercise Template facts and actions already have small-screen stacking rules, and the
  Dashboard always provides complete weekly adherence data in a semantic disclosure/table.

### Reuse

- Current palette and semantic variables in `public/css/base.css`.
- Established page-heading, section-heading, surface, card, badge, action, focus, empty-state,
  and responsive conventions visible in Programs, Dashboard, Progress, History, and Profile.
- Shared accordion, button, form, modal, and icon components; existing Library ViewModel and
  server/browser-test boundaries.
- Variant IDs as the persisted session-step selection identity, and the existing Dashboard
  chart success/fallback split.

### Repair

- The new/update session form builds one option per exercise variant but labels each option
  with its base exercise name. The 18-base/36-variant catalog therefore presents repeated
  labels for different variant IDs. The projection must expose distinct variant-aware labels
  while preserving variant IDs and submitted session behavior.
- Successful chart initialization sets the status element's `hidden` property, but
  `.adherence-chart__status { display: grid; }` overrides the user-agent hidden rule. The
  last loading text—“Preparing visual chart… Weekly data is available below.”—therefore
  remains visible even when the canvas is ready.
- Exercise Template CSS expects `.exercise-template` and `.exercise-template__trigger`
  hooks that the shared accordion markup does not render. Intended container, expanded,
  focus, and reduced-motion styling therefore does not consistently apply.
- The Exercise Template detail region references an `aria-labelledby` trigger ID that is
  never emitted. Accordion naming and expanded-state semantics must use real IDs/contracts.

### Modify

- Replace Exercise Template-local hard-coded/legacy palette aliases with the established
  semantic variables where compatible.
- Clarify base exercise versus variant hierarchy without changing the existing ownership,
  archive, edit, private-variant, or session-selection model.
- Align Exercise Template section/card rhythm, typography, radii, borders, action placement,
  focus states, and responsive behavior with established page/card patterns. Refine nearby
  Library spacing or tokens only where direct comparison shows a mismatch.

### Unknown

- No manual browser viewport review has yet been performed for the proposed final styling.
  Action 2 must verify representative narrow and wide layouts rather than assuming CSS
  source inspection is sufficient.
- The report describes duplicated “option values,” while repository evidence proves
  distinct variant IDs with duplicated base-name labels. If implementation evidence reveals
  actual repeated IDs too, treat that as a defect in the same action and record its source.

## Scope

### In scope

- Repair the session exercise-option projection at its ViewModel/data boundary and add
  focused coverage for multiple variants of one base.
- Repair Dashboard chart ready/loading/fallback visibility while retaining semantic weekly
  data and a useful no-JavaScript/unavailable fallback.
- Refine Exercise Templates markup and styling through existing shared components and
  variables, including valid accordion naming, hierarchy, actions, and responsive states.
- Apply small Library-level consistency adjustments only when they directly support the
  established visual rhythm or remove duplicated legacy styling.
- Verify personal/admin, populated/empty, interactive/fallback, keyboard/focus,
  reduced-motion, and representative narrow/wide behavior proportionately to the change.

### Out of scope

- A new design system, palette, framework, dependency, or application-wide redesign.
- Broad refactoring of Dashboard, Programs, Progress, History, Profile, navigation, or
  unrelated shared components.
- Catalog content expansion, ownership changes, session schema changes, or database work.
- New exercise imagery, charts, product features, or changes to valid user behavior beyond
  the two identified defects.
- Push, deployment, or production-data mutation.

## Correctness and accessibility requirements

- Every rendered session exercise option has a stable variant ID and an unambiguous label;
  creation/update and preserved invalid-form rows continue selecting the intended variant.
- A ready Dashboard chart hides loading/status content; unavailable or invalid chart data
  exposes the useful fallback; the complete server-rendered weekly table remains available.
- Accordion triggers have valid accessible names, real control relationships, correct
  `aria-expanded`, keyboard operation, visible focus, and reliable state changes that do not
  depend solely on a transition event.
- Changed controls meet established target sizing and contrast, and no state is communicated
  only through color.
- Changed layouts remain usable at representative narrow and wide widths. New or changed
  motion honors reduced-motion preferences.
- Authorization, CSRF, ownership, validation, archive behavior, and database contents are
  unaffected.

## Done when

- The two defects are reproduced from repository evidence, corrected at their source, and
  covered by focused tests for success and fallback/preservation behavior.
- Exercise Templates use a coherent shared-component contract and established semantic
  tokens; stale class hooks and broken ARIA references are removed or repaired.
- Library hierarchy, spacing, typography, surfaces, controls, actions, empty/populated
  states, and responsive behavior visibly align with established application patterns
  without redesigning unrelated pages.
- Personal and administrator Library modes preserve their ownership and action boundaries.
- Relevant rendered, ViewModel, browser, and HTTP tests pass; `npm run verify` and the
  PostgreSQL HTTP suite pass when required by the implemented delta.
- A representative narrow/wide manual or equivalent rendered layout review is recorded,
  along with any remaining visual assumptions.
- No unrelated redesign, dependency, database change, push, deployment, or production-data
  mutation occurs.
