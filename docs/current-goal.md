# Current Goal

## Parent milestone

Let’s Flex remains clear and usable across the mobile-to-tablet transition, including secondary
Library workflows that follow the primary discovery experience.

## Current goal

Improve only the responsive presentation of the Library’s exercise-variant creation form around
medium mobile/tablet widths, starting from the restored pre-attempt layout and preserving all form
behavior and completed Library discovery work.

## Status

Approved for planning on 2026-09-09. The proposed delta action is Pending approval; no responsive
implementation has started.

## Approved user outcome

The exercise-variant creation form remains readable, balanced, and comfortable to use around
520px, 600px, and 680px without cramped columns, awkwardly stretched controls, uneven wrapping, or
horizontal overflow. Its labels, hints, inputs, selections, submit behavior, and visual language
remain consistent with the application. The rejected prior attempt is not reinstated.

## Why now

- The user explicitly identified the form’s presentation near 600px as the remaining Library issue
  and approved reassessing it from the restored baseline.
- The completed Library redesign is preserved in commit `3966016`; reopening its hierarchy,
  filtering, tabs, or variant behavior is unnecessary.
- The verified baseline has an abrupt layout boundary: the shared three-column form grid becomes a
  single column at 38rem (608px), while the surrounding Library action panel has already become one
  column at 56rem (896px). Nearby widths can therefore switch between narrow three-column controls
  and comparatively wide single-column controls.
- The rejected attempt added a full-width Exercise selector over a paired Variant name/Equipment
  row between 34rem and 46rem. That specific arrangement is historical evidence of an unsuitable
  direction, not a design to repeat.

## Delta-first baseline

### Already satisfied

- One shared EJS partial renders the personal and administrator variant forms with the same field
  order, labels, hints, native controls, button, CSRF field, action-prefix data, and submission
  behavior.
- Shared form styles provide consistent control sizing, focus treatment, validation presentation,
  and a three-column grid that stacks at 38rem.
- The Library action panel already becomes one column at 56rem, and its submit action becomes full
  width below 30rem.
- The completed Library discovery goal already covers grouped base exercises, progressively
  disclosed variants, independent filters, ownership actions, responsive page structure, and
  personal/administrator behavior.
- Focused rendered-EJS, CSS-contract, browser-interaction, and PostgreSQL HTTP coverage already
  protects the variant form’s identity and behavior.

### Reuse

- `views/partials/libraryPage/createVariantForm.ejs` and its existing shared field/button partials.
- The page-scoped `.library-variant-form`, `.library-action-panel`, and footer hooks in
  `public/css/pages/library.css`.
- The shared form grid as the baseline desktop/narrow behavior; avoid changing it globally unless
  direct evidence proves a shared defect rather than a Library-specific issue.
- Existing rendered Library, browser interaction, CSS contract, and HTTP tests.

### Modify

- Adjust only the form’s page-scoped responsive sizing, spacing, alignment, or wrapping through the
  problematic medium-width range, based on direct comparison of the restored baseline.
- Add a form-specific markup hook only if it is needed to scope the selected CSS without affecting
  other shared forms.

### Add

- Focused regression evidence for the selected responsive contract and recorded layout inspection
  at representative widths on both personal and administrator Library pages.

### Explicitly reconsider

- The current three-column-to-one-column transition near 608px is explicitly open for refinement.
  The previously rejected full-width-first-field/two-field-row solution is not an approved answer.

## Scope

### In scope

- Baseline inspection near 520px, 600px, and 680px, plus nearby narrow and wide regression widths.
- Page-scoped CSS and, only if required for safe scoping, one form-specific markup hook.
- Spacing, usable control width, alignment, wrapping, and submit-action presentation for the
  exercise-variant creation form.
- Focused tests and representative personal/administrator visual verification.

### Out of scope

- Changing form fields, field order, labels, hints, options, validation, routes, actions, CSRF,
  submission JavaScript, ownership, authorization, or persistence.
- Reopening Library filtering, tabs, exercise grouping, progressive disclosure, catalog data, or
  other page sections.
- Changing the shared form system for unrelated screens, adding dependencies, or changing schema,
  seed, repositories, APIs, deployment, or production data.

## Correctness and accessibility requirements

- Labels, required/optional cues, hints, inputs, selects, and the submit action remain readable and
  associated exactly as before.
- All controls retain their existing keyboard, focus, validation, and touch-target behavior.
- The layout has no horizontal overflow, clipped content, overlap, or unstable wrap near its chosen
  breakpoints.
- Personal and administrator forms use the same intentional presentation without changing their
  different action prefixes or copy.
- The solution follows the established dark Library visual language and does not reintroduce the
  rejected uneven two-row arrangement.

## Done when

- The restored baseline is compared at 520px, 600px, and 680px before selecting an implementation,
  with at least one narrower and one wider regression width also checked.
- The final form avoids both cramped controls and unnecessarily stretched fields throughout the
  inspected range and transitions predictably between layouts.
- Form markup and behavior contracts remain intact for personal and administrator modes.
- Focused rendered/CSS/browser tests, `npm run verify`, relevant PostgreSQL HTTP regressions, and
  `git diff --check` pass.
- Final inspection confirms no unrelated Library, shared-form, backend, database, dependency,
  deployment, push, or production-data change.
