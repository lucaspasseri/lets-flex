# Current Actions

## Current goal

Refine only the Library exercise-variant creation form’s medium-width responsive presentation from
the restored baseline, without changing behavior or the completed Library discovery experience.

**Goal status:** Completed on 2026-09-10. Action 1 is Completed.

## Status definitions

- **Pending approval:** proposed first action that has not been approved for implementation.
- **Pending:** later work whose preceding action has not been completed and approved.
- **Active:** the only action currently authorized for implementation.
- **Ready for review:** implemented and verified; awaiting explicit user approval.
- **Changes requested:** review corrections are authorized for the current action.
- **Completed:** verification evidence was reviewed and the action was explicitly approved.

Only one action may be Active. Approving this plan activates Action 1 and stops at that planning
gate; it does not authorize implementation in the same response. Every implemented action stops at
Ready for review.

## Verified evidence baseline

- The completed Library filtering/discovery implementation and its final verification record are
  preserved in commit `3966016`.
- `createVariantForm.ejs` is shared by personal and administrator Library modes and renders three
  fields in order: Exercise, Variant name, and Equipment. It retains the existing CSRF input,
  `data-variant-create-form`, role-specific action prefix, and shared submit button.
- The form currently uses only `form-grid form-grid--three-columns`; there is no form-specific field
  grid hook or medium-width override after the rejected attempt was reverted.
- Shared `form.css` renders three equal columns above 38rem and one column at or below 38rem. At the
  608px boundary, the form therefore changes directly between three and one columns.
- The surrounding `.library-action-panel` changes from its header/form split to one column at 56rem,
  leaving a broad 38rem–56rem interval where the form occupies the panel width but retains three
  columns.
- Page CSS right-aligns the submit action normally and makes it full width only below 30rem.
- The rejected form-specific attempt used three columns above 46rem, a full-width Exercise field
  above two equal fields from 34rem–46rem, and one column below 34rem. The user explicitly rejected
  that presentation and approved its exact removal.
- Existing Library tests verify rendered personal/admin form contracts, role-specific submission
  actions, semantic/focus/responsive CSS foundations, ownership, CSRF, and end-to-end form behavior.

## Confirmed decisions

- Treat this as a presentation-only responsive repair. Do not change feature behavior or reopen the
  completed Library discovery design.
- Inspect the restored form at 520px, 600px, and 680px before choosing CSS; include at least 390px
  and 900px to guard the adjacent narrow and wide states.
- Prefer a page-scoped, naturally adaptive solution. Add a narrowly named markup hook only if it is
  required for safe form-specific styling.
- Do not default back to the rejected full-width Exercise plus paired Variant/Equipment layout.
- Preserve shared form controls and global grid behavior unless direct inspection shows the defect
  affects the shared system rather than this Library form.
- Security controls are unchanged: CSRF, validation, authorization, action URLs, and submitted data
  remain outside this presentation-only action and receive regression verification.

## Proposed action sequence

### Action 1 — Measure and refine the variant form’s medium-width layout

**Status:** Completed

**Prepared:** 2026-09-09. The user approved the goal outcome, not implementation. Repository
inspection narrowed the work to one responsive presentation action.

**Approved:** 2026-09-09. The user explicitly approved the proposed action scope. Per the approval
gate, implementation was not started in the approval response.

**Started:** 2026-09-09. Baseline viewport inspection began before any responsive CSS or markup
change.

**Ready for review:** 2026-09-10. The page-scoped responsive repair is implemented and verified.

**Completed:** 2026-09-10. The user explicitly approved the responsive changes after reviewing
the implementation. Final verification passed before completion.

**Purpose:** Remove the abrupt, visually awkward medium-width form transition while preserving the
restored baseline’s behavior and the completed Library page.

**Expected work:**

- Render the restored personal and administrator forms at 390px, 520px, 600px, 680px, and 900px;
  record control widths, wrapping, alignment, content readability, and document overflow before
  editing.
- Use that evidence to select the smallest page-scoped layout rule that avoids cramped or overly
  stretched fields and transitions uniformly. Do not reinstate the rejected uneven two-row grid.
- Preserve all field markup and shared components where possible. If a form-specific grid hook is
  necessary, add only that hook and use it solely for responsive presentation.
- Keep labels, hints, required/optional cues, controls, and the submit action aligned and readable;
  preserve native semantics, focus, validation, and target sizing.
- Add focused rendered-markup and CSS-contract coverage for the selected rule without testing
  arbitrary pixel values more narrowly than the user-visible layout contract requires.
- Verify both personal and administrator variants at the representative widths, including no
  horizontal overflow and no regression to 390px or 900px layouts.
- Run focused Library tests, `npm run verify`, relevant PostgreSQL HTTP tests, and final format/diff
  inspection, then stop at Ready for review.

**Acceptance criteria:**

- At 520px, 600px, and 680px, fields have usable, visually balanced widths; copy does not overlap or
  clip; and wrapping is deliberate and uniform rather than an accidental orphaned field.
- At 390px and 900px, the established narrow and wide presentation remains usable with no
  horizontal overflow.
- Personal and administrator forms retain the same field order, labels, hints, options, action
  prefixes, CSRF fields, data hooks, submit behavior, and validation behavior.
- No Library discovery, exercise hierarchy, filter, tab, ownership, session, modal, shared-form, or
  backend behavior changes.
- Focused tests, `npm run verify`, relevant HTTP regressions, representative visual checks, and
  `git diff --check` pass. The action stops at Ready for review.

**Constraints:**

- Do not implement before explicit action approval.
- Do not add dependencies or change shared component behavior, routes, validation, authorization,
  repositories, schema, seed, catalog data, deployment, push, or production data.
- Preserve the completed Library commit and any unrelated working-tree changes.

**Implemented delta:**

- Made `.library-variant-form` an inline-size query container and scoped its direct field grid to
  one uniform column until the form itself has 40rem of usable width.
- Restored the existing three equal columns only above that container threshold. This responds to
  the actual nested form width at both the action-panel and viewport transitions without creating
  the rejected full-width-first/two-field-row arrangement.
- Preserved the shared form stylesheet and EJS partial unchanged; field order, markup, submission,
  validation, CSRF, role-specific action prefixes, and Library discovery behavior are unaffected.
- Added a focused CSS-contract regression for the form-scoped container query and the absence of a
  two-column intermediate state.

**Inspection and verification evidence:**

- Restored-baseline captures showed usable one-column controls at 520px and 600px, but the shared
  viewport rule switched to roughly 175px three-column controls at 680px, causing dense hint
  wrapping. At 900px, the action panel returned to two columns while its nested form still tried to
  fit three controls into the narrower form column. Personal and administrator modes behaved the
  same.
- Final personal and administrator captures at 520px, 600px, 680px, and 900px use one aligned
  column with readable labels and hints and no orphaned field row. At 1440px, the form has enough
  local space to return to three balanced columns of roughly 204px each.
- At 390px, the unchanged narrow contract remains one column and the new rule introduces no fixed
  or minimum width. The standalone headless fixture was subject to Chromium's minimum-window
  capture width, so overflow safety at this width is supported by the unchanged narrow CSS
  contract and the prior full-page 390px Library verification rather than fixture-edge geometry.
- Focused Library tests: 13 passed, 0 failed.
- `npm run verify`: formatting, lint, server and browser type checks, and 195 tests passed with 0
  failures.
- `npm run test:http`: 58 passed, 0 failed, including the administrator, global-catalog, and
  owner-scoped private-variant regressions.
- `git diff --check` passed. The working tree contains only the approved goal/action records and
  the focused Library CSS/test changes.

**Final verification after approval:**

- `npm run verify`: 195 passed, 0 failed; formatting, lint, and both server and browser type checks
  passed.
- `npm run test:http`: 58 passed, 0 failed.
- No new implementation changes were made during approval verification.

## Goal final-review summary

- The restored baseline was inspected before editing at the required medium widths, with 390px,
  900px, and 1440px used as adjacent regression widths.
- The final container-scoped layout keeps controls readable through the constrained range and
  restores equal desktop columns only when the form itself has sufficient room.
- Personal and administrator form markup and behavior remain unchanged; focused and HTTP
  regressions cover their distinct actions, CSRF, ownership, and catalog behavior.
- The implementation is limited to page-scoped Library CSS and its regression test. There are no
  shared-form, backend, database, dependency, deployment, push, or production-data changes.
- Every `Done when` criterion in `docs/current-goal.md` is satisfied. There are no unmet criteria.
- Intentionally excluded work remains unchanged: broader Library discovery redesign, form behavior,
  shared component changes, backend work, and schema or catalog changes.

## Resume here

Action 1 and the goal are Completed after explicit user approval. No verified remaining gap or
stated priority strongly supports a specific next goal; await user direction before replacing the
goal or planning further work.
