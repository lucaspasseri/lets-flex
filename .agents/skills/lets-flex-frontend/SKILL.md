---
name: lets-flex-frontend
description: Plan, implement, or review user-facing frontend work in the Let’s Flex repository, including EJS, CSS, responsive layouts, forms, navigation, interaction states, accessibility, and rendered visual verification. Do not use for backend-only or documentation-only work.
---

# Let’s Flex Frontend Workflow

Extend the product’s existing interface deliberately. Preserve verified behavior and identity while
making the smallest cohesive improvement supported by repository and rendered evidence.

## Inherit the repository rules

The user’s current request and the repository’s Required rules take precedence over this workflow.

Before frontend work:

1. Read [general guidelines](../../../docs/general-guidelines.md) and
   [UI guidelines](../../../docs/ui-guidelines.md).
2. If the work contributes to the active goal, read
   [the current goal](../../../docs/current-goal.md) and
   [current actions](../../../docs/current-actions.md), then obey their approval gates.
3. Read [the frontend audit](../../../docs/frontend-audit.md) when choosing visual direction,
   changing a shared pattern, or baselining a validation surface. Use it as dated evidence, not as
   permission to implement every opportunity it records.

Do not copy those documents into an implementation plan. Extract only the constraints and evidence
that affect the requested surface.

## Establish the verified baseline

Inspect before proposing or editing. Use the repository and current rendering as the source of
truth, including completed related work as historical evidence.

Record a compact baseline with:

- **Primary task:** what the user is trying to accomplish on this surface.
- **Primary information:** what they must understand to complete that task.
- **Action hierarchy:** the one primary action, secondary actions, navigation, and destructive or
  utility actions.
- **States:** relevant default, populated, empty, loading, success, error, validation, disabled,
  selected, expanded, destructive, and partial or nullable-content states.
- **Preserve:** behavior, semantics, security, data boundaries, and compatible design decisions that
  must not change.
- **Verified shortcomings:** observable problems in hierarchy, readability, reuse, responsiveness,
  accessibility, motion, or visual restraint.
- **Unknowns:** evidence that is unavailable and how that limits the change.

Resolve an inspectable unknown before planning around it. Do not turn a plausible convention or
audit interpretation into a verified defect.

## Shape the interface

### Start with task and hierarchy

Make the primary task and current state understandable before adding decoration. Give one action
clear priority. Let supporting context, metadata, and destructive utilities recede.

Ask of every label whether it communicates location, selection, state, or the next action. Remove
or demote repeated context that answers none of those questions.

### Preserve the recognizable core

Retain the dark, focused training identity and existing semantic color roles unless the approved
scope explicitly changes them:

- near-black page and dark neutral surfaces;
- coral for primary action and emphasis;
- teal for success, available information, and non-destructive exercise identity;
- red for brand and destructive states;
- strong workout data and editorial heading character.

Do not add a font or network dependency merely to formalize typography. Treat the current
browser-default serif as an accidental implementation detail whose metrics can vary, not as a
portable font contract.

### Spend surfaces deliberately

Use a border, radius, elevation, or distinct background when it explains an independently
actionable, stateful, selected, or scrollable region. Prefer spacing, typography, alignment, and a
simple rule for ordinary grouping.

Before adding a nested card, pill, icon tile, gradient, or uppercase eyebrow, name the hierarchy or
state it communicates. Omit it when it is only generic polish. Do not remove these treatments
categorically when they provide a useful cue.

### Reuse complete contracts

Search the existing EJS partials, CSS, browser scripts, view models, and tests before creating a
component or page-local pattern.

- Reuse shared buttons, fields, forms, icons, modals, tabs, accordions, feedback, page headings, and
  status treatments when their semantic role matches.
- Extend a shared component only when multiple consumers share the role and the change preserves
  its full state and accessibility contract.
- Keep a page-specific variant when the task is genuinely different.
- Use the correct semantic element. Shared visual treatment does not make navigation a button or a
  mutation a link.
- Have view models provide presentation-ready labels and fallbacks when a template would otherwise
  concatenate domain fields or nullable values. Retain raw values where forms or actions need them;
  do not make EJS infer missing-data meaning.
- Avoid another page-local primary-action recipe when the shared button/link contract can represent
  the role.
- Do not turn focused work into a cleanup of legacy tokens, old CSS, breakpoints, or unrelated
  consumers. Record broader consolidation separately.

Check composed motion: do not translate both a containing card and a control inside it.

### Design from available width

Choose layout changes where content actually stops fitting rather than from a device label.

1. Start with intrinsic layout using wrapping, `minmax()`, `clamp()`, and flexible sizing.
2. Prefer a container query when a reusable or nested component depends on its own available width.
3. Use page-level media queries for page composition, chrome, or gutters.
4. Make intentional horizontal regions own their overflow, expose a clear next item or cue, and
   remain keyboard-scrollable where needed.
5. Do not shrink essential text as a substitute for reflow.

For a small collection with a known item count, inspect how items distribute across rows at each
width. An intrinsic grid can technically fit while leaving a lone final item; prefer intentional
track counts at evidence-based container thresholds when that distribution weakens hierarchy.

Inspect at least one small, one intermediate, and one large width. Include the observed failure
width and adjacent widths when changing a breakpoint. Use stressful content such as long names,
wrapped metadata, many controls, and empty/populated alternatives.

### Build accessibility and states into the design

Use native semantics first. Preserve heading order, labels, accessible names, keyboard operation,
visible focus, non-color state cues, adequate contrast, and clear feedback. Apply the shared and
component-specific requirements in the UI guidelines rather than inventing a page-local substitute.

Reuse the existing browser interaction contracts for tabs, accordions, modals, application chrome,
and workout controls when those components are involved. Preserve semantic data alternatives and
labelled overflow regions for analytics. Exercise each relevant state rather than asserting
accessibility from markup inspection alone.

### Use motion for continuity

Animate selection, navigation, disclosure, or feedback only when it clarifies a change. Keep motion
brief, avoid decorative entrances and competing transformations, provide reduced-motion behavior,
and never make essential behavior depend only on a transition event.

## Implement the smallest cohesive delta

Keep behavior and presentation responsibilities in their existing layers: server-derived state and
permissions in view models/controllers, semantic structure in EJS, presentation in CSS, and browser
interaction in the existing component modules.

Implement only verified `Modify`, `Add`, `Repair`, or explicitly reconsidered items. Do not rewrite
an already satisfied surface to make it resemble an imagined design system.

## Verify with code and rendered evidence

Run the verification matrix in the general guidelines for the actual files changed, starting with
focused tests. Add contract or interaction coverage for meaningful behavior and state boundaries;
avoid tests that merely freeze arbitrary class lists or pixel values.

For a meaningful UI change, inspect rendered output at:

- a small width around 390px;
- an intermediate width chosen from the component’s actual pressure point, commonly 520–900px;
- a large width around 1280–1440px.

Exact widths are evidence choices, not permanent breakpoints. At each relevant width inspect:

- overflow, clipping, wrapping, alignment, track distribution, density, and reading order;
- primary/secondary/destructive action hierarchy;
- default plus stressful content and applicable empty/error/loading/selected states;
- keyboard order, visible focus, accessible state/name, and modal or disclosure behavior;
- hover/active behavior with a pointer when applicable;
- reduced-motion behavior when motion is present.

Use reliable browser geometry rather than assuming a requested screenshot width was honored. Record
minimum-window or rendering limitations instead of treating unreliable captures as proof.

## Deliver the result

Report:

1. the verified baseline and intended hierarchy;
2. the smallest implemented delta and preserved behavior;
3. reused and extended components;
4. automated checks with exact pass/fail counts where available;
5. rendered widths and states inspected, including keyboard/accessibility evidence;
6. remaining risks, unknowns, skipped checks, and separately scoped follow-ups.

For active-goal work, update the current action as work progresses and stop at its required review
gate. Completing one UI action never authorizes the next redesign or shared-system cleanup.
