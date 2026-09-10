# Frontend Design and UX Audit

## Purpose and limits

This audit records the frontend that exists on 2026-09-10 so later design work can preserve the
product's intentional language and address verified drift. It is an evidence baseline, not a
redesign specification. No visual implementation is authorized by this document.

The findings distinguish three kinds of evidence:

- **Verified implementation:** current EJS, CSS, browser JavaScript, view models, and tests.
- **Verified rendering:** current repository-generated captures of Dashboard, Programs, day,
  Library, exercise progress, authentication, navigation, forms, and workout feedback at widths
  from 390px through 1440px. These captures were inspected alongside the code that produced them.
- **Interpretation:** a design judgment grounded in those sources. Candidate improvements remain
  proposals until a later action selects and baselines one surface.

This is representative rather than exhaustive. It does not certify every color pairing against a
contrast calculator, exercise every browser/assistive-technology combination, or reopen behavior
completed by earlier goals.

## Executive assessment

Let’s Flex already has a recognizable visual identity and a stronger accessibility foundation than
its styling consistency suggests. The dark training-focused palette, restrained coral and teal
accents, high-contrast editorial headings, numeric workout data, and compact status language feel
specific to the product. The application chrome, forms, workout tracker, analytics alternatives,
and recent Library interactions also contain deliberate responsive and keyboard behavior.

The main weakness is not absence of a design system. It is that a useful implicit system has grown
through repeated page-local recipes. Too many regions receive a border, rounded surface, eyebrow,
badge, icon tile, and occasionally a gradient regardless of their information role. Several pages
therefore look assembled from interchangeable dashboard cards, while hierarchy depends more on
container decoration than on content. A legacy token and component layer remains loaded beside the
newer layer, and equivalent links/actions are restyled per page. These are maintenance and visual
coherence issues, not justification for replacing the architecture.

## Evidence map

| Area                       | Representative implementation evidence                                                                                | Rendered evidence inspected                                                                                  |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Dashboard and workout      | `views/index.ejs`, dashboard partials, `dashboard.css`, workout-tracker tests                                         | Guest dashboard and planned workout at 390px and 1440px                                                      |
| Programs, cycles, and days | `views/programs.ejs`, programs/day partials, `programs.css`, `day.css`, page/view-model tests                         | Populated hierarchy at 390px and 1440px; assigned/unassigned day states; 500px and 1280px conflict feedback  |
| Library and accordions     | `views/library.ejs`, Library partials, `library.css`, `librarySearch.css`, `exerciseTemplates.css`, interaction tests | Personal/admin Library, empty and selected details, filters, forms, and accordions from 390px through 1440px |
| History and progress       | history/progress EJS, CSS, view-model and HTTP tests                                                                  | Exercise progress at 390px and 1440px, including long data labels and dense result states                    |
| Forms and overlays         | shared form/button/modal EJS and CSS, modal and workout-tracker browser tests                                         | Authentication and Library forms at small/intermediate/large widths; mobile menu and overlay layers          |
| Application chrome         | chrome EJS/CSS/JavaScript and browser tests                                                                           | Mobile header/menu, intermediate rail, desktop/short-height sidebar                                          |

## The existing design language

### Product identity and color

**Verified:** `base.css` defines a coherent semantic palette: near-black page (`#0b0c10`), dark
surface (`#16181d`), subtle surface (`#1c1c1c`), coral action, red brand/danger, teal success/accent,
light text, and a muted neutral scale. Current pages largely use these semantic aliases. The logo's
red/blue treatment, coral overlines, teal informational icons, and red destructive controls carry
across navigation, Programs, Library, authentication, and workout states.

**Interpretation:** this is the strongest visual asset and should be preserved. Coral reads as the
primary interaction/highlight color; teal works best for success, available information, and
non-destructive exercise identity; red should remain reserved for brand and danger. Gradients are
most effective as restrained atmosphere on a hero or special state, not as the default way to make
every panel feel important.

**Drift:** `base.css` still publishes an explicitly marked `OLD` alias layer (`--color-bg`,
`--color-primary`, `--color-stitch`, and others), and newer shared components still consume some of
those aliases. The rendered result is mostly coherent, but the naming obscures the intended role of
each color and makes future use easier to misread.

### Typography

**Verified:** there is no global `font-family` or local `@font-face`; only form/button inheritance
and a logo-specific Trebuchet declaration exist. Consequently the product currently relies on the
browser's default serif face. Pages consistently pair large bold headings with small uppercase,
widely tracked eyebrows. Workout and analytics views add tabular-looking large numbers, compact
metadata, and labels.

**Interpretation:** the serif rendering gives Let’s Flex more editorial character than a generic
fitness admin dashboard, especially in program names and training results. It is also accidental:
different platform defaults can change metrics, wrapping, density, and tone. The typography needs a
declared system font stack and named size/line-height roles before any font change is considered.
The audit does not prescribe a new font or external font dependency.

The recurring eyebrow is useful for orientation (for example, “Training plans” and “Recorded
performance”), but 47 uppercase text-transform declarations and 68 letter-spacing declarations
across the CSS indicate page-local repetition. Overlines should label genuine context changes, not
appear above nearly every card heading.

### Spacing, widths, and density

**Verified:** the primary application pages use centered maximum widths, most often 76rem, with
1.5rem vertical gaps and `--horizontal-margin` of 2rem/1rem. Content grids usually use 0.75–1.5rem
gaps and `clamp()` for major padding and headings. Dashboard and Programs expose generous desktop
space; workout steps, history, and progress deliberately increase density to keep related data
together.

**Interpretation:** the spacing is generally readable and consistent at the macro level. Density
works best where it follows a task: workout steps, prescription/performance data, and exercise
filters. It becomes visually tiring when each grouping adds its own padded container, especially
on long Programs and analytics pages. A future workflow should set a “surface budget” before adding
padding or another wrapper.

### Surfaces, borders, radii, and elevation

**Verified:** current CSS contains 167 `border-radius` declarations and 27 gradient declarations.
Major page sections generally use a 1rem radius and border; nested cards use roughly 0.6–0.9rem;
badges and status markers use pills or circles. Dashboard, Programs, Library session details,
history results, progress summaries, profile, and auth all use nested bordered surfaces.

**Interpretation:** a consistent dark card language is present, but its frequency weakens hierarchy.
The user often sees a page surface, a section surface, a card surface, a metric surface, and a pill
before reaching the data. Programs is the clearest example: plan-structure cards sit inside a
structure panel, followed by separate program, cycle, and calendar panels containing more cards.
Progress similarly nests summary and measurement cards inside a bordered results surface. Borders
should separate independently actionable or scrollable regions; spacing and typography should
separate ordinary content groups.

### Forms and actions

**Verified strengths:** the newer shared form system provides labels, required/optional text,
hints, errors, invalid state, hover, focus, disabled state, 2.75rem controls, responsive grids, and
collection controls. Shared buttons provide primary, secondary, ghost, danger, danger-ghost, icon,
disabled, hover, active, and focus-visible states. Modals compose those shared form and button
partials. Recent Library form work uses container width rather than viewport width to decide its
three-column layout, which is a strong reusable precedent.

**Verified drift:** `main.css` loads both the 16-line legacy `.forms` stylesheet and the newer
`.form` component. Dashboard, day, history, and progress define parallel link-button recipes such
as `.dashboard-action-link`, `.day-panel__create-link`, `.history-primary-action`, and
`.exercise-progress-primary-action` even though a shared button exists. Shared buttons and icon-only
buttons have a 2.2rem minimum dimension, while most newer controls use 2.75rem or larger.

**Interpretation:** do not convert every link into a button. Establish action roles—primary task,
secondary task, text navigation, destructive action, and icon utility—and render the correct
semantic element through one visual contract. The 2.2rem compact target should be explicitly
limited to dense contexts or increased where space permits.

### Navigation and orientation

**Verified strengths:** application chrome adapts from a header and modal-like full menu on small
screens to a fixed rail on desktop, with a special short-height layout. Active destinations have a
non-color bar/dot treatment. Its JavaScript tests cover initialization, `inert`, focus containment,
Escape, focus restoration, resize cleanup, scroll locking, and coexistence with modal inertness.
Programs and day pages add semantic hierarchy/path navigation, while history includes pagination
and back navigation.

**Interpretation:** global navigation is intentionally prominent without competing with the work
area. Local orientation is less consistent: some pages use the shared page heading and contextual
metadata, while Dashboard and deeply nested Programs build their own hero and overline structures.
Future work should first decide whether a label answers “Where am I?”, “What is selected?”, or
“What can I do next?” and avoid repeating all three at every level.

### Responsive behavior

**Verified strengths:** all representative pages have responsive rules. Current CSS covers a wide
range from 23rem to 75rem; complex grids collapse, headers stack, desktop navigation changes mode,
tables become labelled horizontal scroll regions, and Programs intentionally turns entity/card
collections into scroll-snap rails below 48rem. Recent Library form CSS uses a 40rem container
query. Small rendered views show readable Dashboard/workout stacking, full-width form actions,
single-column progress metrics, usable Library accordions, and navigation that does not cover the
active content when closed.

**Verified risk:** the styles use at least 18 distinct width thresholds (23, 28, 30, 32, 34, 36,
38, 42, 44, 45, 46, 48, 50, 52, 56, 58, 62, 64, and 68rem across max/min rules). Some are valid
content-specific breakpoints, but the volume shows that many page decisions are not shared. Legacy
base rules also shrink old `.current-day-container`, `.training-day-list-container`, and
`.current-week-container` typography at fixed pixel widths. Narrow Programs rails intentionally
show partial next cards and a scrollbar; this is useful discovery only if the rail itself owns the
overflow and keyboard/scroll affordance remains obvious.

**Interpretation:** responsive work should inspect small, intermediate, and large widths and choose
breakpoints where the component actually runs out of room. Prefer grid wrapping, `minmax()`,
`clamp()`, and container queries. A global breakpoint taxonomy may help navigation and page gutters,
but content components should not be forced onto arbitrary device categories.

### Motion and interaction states

**Verified strengths:** global view transitions are short and disabled for reduced motion.
Application chrome, Programs entity selection, Dashboard, day navigation, analytics charts,
Library discovery, exercise templates, history, progress, and workout controls include reduced-
motion handling where they animate. View-transition names convey navigation or selection state.
Buttons expose hover/active/focus, and workout submissions expose loading and focused feedback.

**Verified gaps:** the generic accordion and tabs styles predate the newer page treatment. They use
`em` sizing, old token aliases, a 400ms tab background transition, and no generic focus-visible or
reduced-motion rules. Library and authentication compensate with page/component-specific focus and
motion CSS. The modal has a large off-screen translate animation and no reduced-motion rule in its
own stylesheet, though its browser behavior correctly handles focus, trapping, background
inertness, scroll locking, restoration, and Escape. Shared buttons translate on hover, as do some
containing cards/rows, which makes competing motion possible if composition is not checked.

**Interpretation:** motion should show selected destination, disclosure, or state continuity. A
future shared-component pass should make the base contract safe by itself so each consuming page
does not have to repair focus and motion behavior.

### Accessibility and semantic structure

**Verified strengths:** representative templates use `main`, labelled `section`, `nav`, `aside`,
headings, lists, description lists, `details`/`summary`, captions, and labelled scroll regions.
Tabs expose roles, selection, controls, and roving `tabindex`; accordions expose expanded state;
status chips normally pair a marker with text. Charts and heatmaps have table/details alternatives
and patterned or symbolic non-color cues. Modal and application-chrome browser tests cover the
critical keyboard and inertness behavior. Form errors, workout feedback, empty states, destructive
confirmations, and loading states have explicit contracts. Focus-visible styles are common in the
newer components and pages.

**Risks to validate when touched:** generic tabs/accordion focus presentation, modal reduced motion,
compact 2.2rem action targets, long-name wrapping, deliberate horizontal regions, and whether every
status marker retains adjacent or accessible text in every context. These are targeted follow-up
checks, not claims of a complete accessibility failure.

## Generic or mechanical-looking patterns

These patterns are interpretations backed by repeated repository and rendered examples:

1. **Card-on-card construction.** Borders and radii are applied at nearly every grouping level, so
   task hierarchy can look like a stack of interchangeable widgets.
2. **The repeated “eyebrow + large heading + muted sentence + bordered panel” recipe.** It gives
   consistency, but across Dashboard, Programs, Library, auth, history, and progress it can make
   distinct tasks feel generated from one template.
3. **Badge and icon-tile proliferation.** Pills, circular counters, numbered tiles, and teal icon
   blocks are useful for state or scanning; decorative instances add noise without changing a
   decision.
4. **Default gradient polish.** Subtle gradients are on-brand in a hero or special state, but using
   them to upgrade ordinary panels substitutes decoration for hierarchy.
5. **Parallel component styling.** Page-local primary/text actions and page-specific tab repairs
   produce small inconsistencies and invite more one-off CSS.
6. **Uniformly promotional copy treatment.** Uppercase overlines and large headings sometimes give
   routine filters or structural explanations the same emphasis as the primary task.
7. **Responsive patch accumulation.** Many close breakpoints solve local layouts, but without an
   inspect-first rule they make intermediate widths unpredictable and encourage device-width fixes.

None of these patterns should be removed categorically. The test is whether a treatment explains
priority, grouping, state, or action. If it does none of those, it is probably decoration.

## Proposed Let’s Flex design principles

These principles are candidates for Action 3’s workflow; they do not yet authorize implementation.

1. **Start with the training task.** Name the primary user task, the information needed to complete
   it, and the next valid action before choosing layout or decoration.
2. **Preserve the recognizable core.** Keep the dark palette, restrained coral/teal roles, strong
   workout data, and editorial heading character. Formalize accidental choices before changing
   them.
3. **Use a surface budget.** Add a bordered/elevated surface only for an independently actionable,
   stateful, or scrollable region. Use spacing, rules, and type for ordinary grouping.
4. **Make hierarchy unequal on purpose.** One primary action and one dominant content focus should
   be obvious; supporting context, metadata, and destructive utilities should recede.
5. **Reuse contracts, not just class names.** Begin with shared semantic EJS components and their
   full state/accessibility behavior. Extend a shared contract when the role is shared; keep a page
   variant when the task is genuinely different.
6. **Design from available width.** Test the component’s actual container at small, intermediate,
   and large sizes. Prefer intrinsic grids and container queries; add a breakpoint at observed
   failure, not at a device label.
7. **Make every state understandable without color or motion.** Include text/non-color cues, visible
   focus, useful errors, empty/loading/disabled/destructive states, and reduced-motion behavior in
   the initial design rather than as a cleanup pass.
8. **Use motion for continuity.** Animate selection, navigation, disclosure, or feedback briefly;
   avoid nested translations and decorative entrance effects.
9. **Inspect rendered evidence.** Compare default and stressful content, keyboard behavior, and at
   least small/intermediate/large layouts. Record what was observed and any environment limitation.
10. **Change the smallest coherent surface.** Preserve verified behavior and completed work; do not
    use a local visual improvement as permission for an application-wide refactor.

## Candidate validation surfaces

### Recommended: Library session workspace, selected-session detail

**Why it is representative:** it is a contained product surface combining master/detail navigation,
status/tags, actions, empty and populated states, dense workout steps, responsive stacking, and
shared buttons. It sits next to recently improved Library discovery and forms, so a validation can
test whether the new workflow extends that established work without reopening it.

**Verified opportunity:** `sessionWorkspace.css` uses a clear two-column-to-stacked structure, but
selected details add a bordered outer surface, four bordered stat cards, note treatment, bordered
step cards, prescriptions, metadata, and tags. It uses the same badge/icon/card vocabulary the
audit identifies as over-applied. At small widths the master list and detail become a long linear
flow, making task hierarchy and return-to-selection orientation important.

**Possible bounded validation:** refine only the selected-session detail hierarchy and responsive
reading/action order. Preserve Library search/filtering, exercise accordions, modal forms, routes,
view-model data, and all CRUD behavior. Exact changes and success criteria must be baselined after
Action 3, not assumed here.

### Alternative: workout history results and empty state

This surface combines filters, result cards, status, metrics, pagination, empty/error states, and a
detail transition. It would test action hierarchy and surface restraint well. It is a weaker first
choice because no current rendered history capture was available in this audit; selecting it would
require a fresh rendered baseline before planning any change.

### Alternative: shared tabs/accordion/modal playground

This would directly expose legacy focus, motion, token, and visual-contract drift with low product
risk. It is a weaker workflow validation because a component playground does not exercise a real
training task. Treat shared-component remediation as a candidate follow-up only if the selected
product surface proves that the base contract blocks a correct result.

## Explicitly preserve or defer

- Preserve planned-only workout cancellation, ownership, CSRF, validation, modal mechanics, and the
  Action 1 conflict experience; none is design-audit scope.
- Preserve recent application-chrome, analytics, Programs planning, Library discovery, exercise
  presentation, and Library responsive-form behavior unless direct validation evidence shows a
  narrowly defined incompatibility.
- Do not introduce a frontend framework, utility CSS system, font/network dependency, token rewrite,
  or broad component migration as part of the first validation.
- Defer a full contrast audit, assistive-technology matrix, legacy CSS removal, breakpoint
  consolidation, and typography selection to separately scoped work if future evidence prioritizes
  them.

## Audit conclusion

The frontend does not need a new visual identity. It needs a workflow that makes the existing one
intentional: establish task hierarchy first, spend surfaces and accents selectively, reuse complete
semantic contracts, respond to available width, design every state with accessibility in mind, and
require rendered evidence. The selected-session detail in Library is the strongest current
validation candidate, but it remains unapproved until the workflow exists and the user explicitly
authorizes Action 4.
