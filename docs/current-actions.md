# Current Actions

## Current goal

Refine only the Library exercise-variant creation form’s medium-width responsive presentation from
the restored baseline, without changing behavior or the completed Library discovery experience.

**Goal status:** Approved for planning on 2026-09-09. Action 1 is Pending approval.

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

**Status:** Pending approval

**Prepared:** 2026-09-09. The user approved the goal outcome, not implementation. Repository
inspection narrowed the work to one responsive presentation action.

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

## Resume here

Action 1 is Pending approval. Await an explicit action decision; do not implement responsive code
until the user approves the proposed scope.
