# Current Goal

## Goal: Implement a production-ready Classic + Neon theme system

### Status

**Completed — Actions 1–4 are Completed.** This goal was explicitly requested on 2026-09-14 and
approved on 2026-09-14.

**Outcome:** Delivered exactly two shared semantic themes with Classic as the default and Neon as
the persisted optional theme; an accessible localized profile selector; safe pre-paint resolution;
shared decorative consolidation; locale regression coverage; and final design/workflow records.
Live browser and database checks remain unavailable in the sandbox and are documented rather than
claimed as verified.

### Objective

Implement one shared visual/component system with exactly two user-selectable themes:

- **Classic** — the current `main` appearance, bright, calm, restrained, and the default.
- **Neon** — the approved bold-neon direction, with dark surfaces, cyan/blue primary treatment,
  violet secondary accents, intentional gradients, stronger contrast, and restrained glow.

Provide an accessible Appearance/Theme control in the existing profile/settings surface. Persist the
choice across navigation, reloads, and future visits; safely fall back to Classic for missing or
invalid values; and resolve the saved choice before initial paint to avoid a Classic-to-Neon flash.

### Verified baseline

- The current checked-out branch is `main`. Historical experiment commits `a982c53` and `f6f1533`
  provide the earlier cyan/violet Neon direction requested as the source for this goal; the later
  calm palette commit is not active production code.
- `public/css/theme.css` now owns the Classic and Neon semantic token boundaries, while the shared
  head loads it before the foundational and feature stylesheet chain.
- Repository verification found that the historical experiment file, import, and page marker classes
  are absent from the current tree. The historical commits are source material, not active
  production wiring, so Action 3 consolidated approved decoration without repeating deletion work.
- The profile selector and browser theme module now provide the two-choice preference and safe
  persistence; the pre-paint resolver applies only supported stored values before styles load.
- `views/profile.ejs` and `public/css/pages/profile.css` provide the authenticated and guest account
  surface for the selector, and browser initialization starts in `public/js/app.js`.
- Theme-control copy for the section, helper text, legend, active status, option names, and option
  descriptions is translator-backed and verified in both `en` and `pt-BR`; the active status derives
  its name from the localized option label after switching.
- The existing session architecture and locale middleware do not expose a user-preference store.
  Browser persistence is therefore the simplest compatible strategy for guests and authenticated
  users alike, without adding database complexity.

### Scope and constraints

In scope: semantic theme tokens, shared component consumption, Classic and Neon theme boundaries,
profile theme selector, browser persistence, pre-paint resolution, translation coverage, focused
regression tests, CSS cleanup, and design/workflow documentation.

Preserve authentication, i18n, media, navigation, forms, modals, workout interactions, View
Transitions, accessibility contracts, responsive layouts, and existing component structures. Do not
add a framework or production dependency. Do not commit, merge, push, or delete branches.

Theme-specific styling may change colors, surfaces, borders, gradients, shadows, glow, and related
decoration. Layouts, spacing, responsive rules, semantics, state logic, and interaction behavior
remain shared. The middle-ground/calm palette experiment is rejected and must not remain an active
theme direction.

### Done when

- The application renders exactly Classic and Neon through shared semantic tokens, with Classic as
  the default.
- Profile users can select either theme with accessible semantics; selection persists and never
  redirects or resets page state.
- The selected stored theme is applied before visible initial rendering as far as the automated
  environment can verify, with invalid values falling back to Classic.
- The obsolete experiment wrapper and redundant competing Neon rules are removed or consolidated;
  responsive/layout and component contracts remain shared.
- `docs/design.md` records the supported themes, boundaries, rationale, and rejected experiment.
- Focused regression coverage and the repository verification suite pass. Browser visual/keyboard
  checks are reported honestly if the environment still lacks a browser executable.

At completion, summarize the architecture, persistence, flash prevention, retained/refactored CSS,
files changed, verification, limitations, and next review decision. Stop at **Ready for review**;
do not mark this goal complete without explicit user approval.
