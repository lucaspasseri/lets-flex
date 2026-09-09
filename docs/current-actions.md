# Current Actions

## Current goal

Improve guest and first-use experience with an immediately startable representative workout,
human-readable program-goal labels, and a larger, more prominent version of the established
Let’s Flex logo.

**Goal status:** Completed on 2026-09-09 after explicit user approval. Actions 1, 2, and 3 are
Completed.

## Status definitions

- **Pending approval:** proposed first action that has not been approved for implementation.
- **Pending:** later work whose preceding action has not been completed and approved.
- **Active:** the only action currently authorized for implementation.
- **Ready for review:** implemented and verified; awaiting explicit user approval.
- **Changes requested:** review corrections are authorized for the current action.
- **Completed:** verification evidence was reviewed and the action was explicitly approved.

Only one action may be Active. Approving this plan activates Action 1 and stops at that
planning gate; it does not authorize implementation in the same response. Every implemented
action stops at Ready for review.

## Verified evidence baseline

- `src/features/auth/createGuest.js` creates only a `users` row through the users repository.
  `authController.enterGuest` rotates/authenticates the web session and redirects to `/`, but
  initializes no program or cycle selection. The resulting Dashboard has no active program.
- The canonical seed creates one global `Sample Full Body Session` and exactly one ordered
  step using the existing `Bodyweight Push Up` global variant. `findVisibleForUser` already
  exposes that global template to guests.
- The ownership model already permits a guest-owned program/cycle/day/workout to reference a
  global session. Workout start snapshots every current session step into ordered
  `workout_step_logs`, and lifecycle mutations are constrained through the owning program.
- The expanded catalog has 18 base exercises and 36 global variants. Suitable starter
  movements already exist, so neither new catalog rows nor duplicated variants are needed.
- Guest deletion cascades through owned programs and private resources. Guest conversion
  updates the same user row and therefore retains owned data. Existing tests cover both
  boundaries, although assertions describing guests as minimal or counting manually added
  programs will require focused updates for the new starter hierarchy.
- Goal seed values include `hypertrophy`, `weight_loss`, and `general_fitness`.
  `createProgramFormViewModel` and `createProgramSwitcherViewModel` both expose `goal.name`
  directly. The form option value is `goal.id`, and request validation parses a positive
  numeric `goalId`.
- `utils/toCapitalizedString.js` capitalizes only the first character. Current uses replace
  only one underscore or intentionally produce sentence-style labels, so changing that
  helper globally would be broader and less predictable than adding a focused presentation
  formatter.
- The shared logo is one 240×240 SVG included by the application chrome and login page.
  Existing arm paths are mirrored around the circular core. Wrapper sizes and responsive
  header heights live in `applicationChrome.css` and `auth.css`; focus and reduced-motion
  behavior already exist.
- The worktree was clean before planning. No implementation, database, dependency, reset,
  deployment, or production mutation has been performed for this goal.

## Confirmed decisions

- Reuse and expand the one global sample template; do not clone it per guest.
- Reuse only current active global exercise variants and keep the starter sequence to roughly
  four or five exercises with realistic sets/reps.
- Create one guest-owned program/cycle/current day/planned workout atomically and point it at
  the global starter template. Initialize the authenticated program/cycle selection so the
  guest lands on the workout-ready Dashboard.
- Preserve guest isolation, 15-day expiry, CSRF, rate limiting, session rotation, cleanup,
  and in-place conversion behavior.
- Preserve stored goal names and numeric goal IDs. Humanize names only in the Programs-page
  presentation models and cover both verified display sites.
- Refine the shared logo and its wrappers rather than creating separate mobile/desktop/auth
  assets or redesigning the mark.
- Use the canonical reset-first development workflow; add no migration or dependency and
  never mutate production.

## Proposed action sequence

### Action 1 — Build and verify the guest starter workout

**Status:** Completed

**Approved:** 2026-09-08. The user accepted the implementation after its recorded review and
final verification gate.

**Purpose:** Turn guest entry into an immediate but bounded workout demonstration by
expanding the shared starter template and linking it into an atomically created guest-owned
hierarchy.

**Expected work:**

- Define a reviewed four-to-five-step full-body sequence from existing active global
  variants, retaining `Bodyweight Push Up` and adding complementary lower-body, pull, and
  hinge work with contiguous ordering and realistic prescriptions.
- Update the authoritative canonical seed so `Sample Full Body Session` contains exactly the
  reviewed sequence, remains unowned/read-only, and introduces no duplicate catalog rows.
- Introduce a cohesive guest-workspace creation boundary that creates the guest, resolves
  the existing `general_fitness` goal and global sample session, and inserts one owned
  starter program, cycle, current training day, and planned workout in one transaction.
- Pass the new program/cycle selection through the existing session-rotation boundary so the
  redirect to `/` resolves the starter Dashboard immediately. Preserve cleanup if web-session
  establishment fails.
- Update directly affected guest/conversion tests whose “minimal” or exact program-count
  expectations are intentionally superseded.
- Add focused seed/service/HTTP coverage for exact template steps, transaction rollback,
  two-guest isolation, initial Dashboard state, workout start and ordered step snapshots,
  step perform/skip and finish, Dashboard/History/Progress compatibility, cleanup, and
  conversion preservation.
- If `ALLOW_DATABASE_RESET=true`, confirm the configured development target is disposable,
  run the required guarded reset, and verify its resulting relationships before the relevant
  test suites.

**Acceptance criteria:**

- Fresh seed data contains one global starter template with the approved realistic sequence
  and no new exercise or variant rows.
- Each new guest owns one complete starter hierarchy and shares only the global template and
  catalog. A partial hierarchy cannot survive any provisioning failure.
- The post-entry Dashboard selects today’s planned starter workout, which starts through the
  existing lifecycle and creates one correct ordered log per step.
- Existing step logging, workout finish, Dashboard analytics, History, Progress, guest
  cleanup, failure cleanup, isolation, and account conversion pass focused HTTP verification.
- Required formatting, lint, server types, focused tests, and applicable database checks pass.
  The action stops at Ready for review.

**Security and scope constraints:**

- Keep guest entry CSRF protected, rate limited, session-rotated, and owner-scoped; do not log
  guest/session secrets or collect new personal information.
- Do not change schema, workout lifecycle semantics, analytics formulas, guest expiry,
  authorization rules, or catalog identities.
- Do not create a migration, clone shared sessions/variants, add dependencies, touch the
  logo/goal-label work, push, deploy, or mutate production.

**Implemented:**

- Added one reviewed, shared starter-workout manifest with four existing active global
  variants in contiguous order: `Bodyweight Box Squat` (3×10), `Bodyweight Push Up` (3×10),
  `One-Arm Dumbbell Row` (3×10), and `Bodyweight Glute Bridge` (3×12).
- Made the canonical seed derive the unowned `Sample Full Body Session` and its ordered steps
  from that manifest. Manifest validation rejects missing catalog variants, duplicate
  variants, invalid prescriptions, and sequences outside the four-to-five-step scope.
- Changed guest provisioning to resolve the existing `general_fitness` goal and shared
  sample session, then transactionally create the guest, `Guest Starter Program`, `Getting
Started` cycle, current `Full Body` day, and planned workout through existing repositories.
- Extended the existing session-establishment boundary to persist the new program, cycle,
  and day selection after session rotation and before its single save. Existing failure
  cleanup still deletes a provisioned guest if web-session establishment fails.
- Added canonical-seed, manifest, and HTTP coverage for exact steps, per-guest ownership,
  immediate Dashboard/library state, workout start and ordered snapshots, perform/skip/
  finish behavior, Dashboard/History/Progress results, missing-reference rollback, injected
  mid-transaction rollback, cleanup, isolation, and conversion-compatible program counts.

**Security and data-integrity review:**

- Guest entry remains behind the established CSRF, rate-limit, session-rotation, and
  authentication boundaries. No credentials, session identifiers, or new personal data are
  logged or collected.
- The starter hierarchy is owner-scoped and transactionally atomic; both a missing canonical
  session and a forced insert failure leave no guest or partial program data behind.
- The shared session remains unowned and read-only, guest expiry remains 15 days, conversion
  retains the same user row and owned hierarchy, and no schema, authorization, lifecycle,
  migration, dependency, deployment, or production change was made.

**Verification evidence:**

- Confirmed `.env` explicitly authorizes reset, `NODE_ENV=development`, and the target is
  `localhost/lets_flex`; the guarded `npm run db:reset` completed successfully. A read-only
  post-reset query found exactly one unowned active sample session with four steps in the
  reviewed order.
- Focused starter-manifest tests passed: 2/2. Canonical catalog/seed tests passed: 2/2.
- The complete PostgreSQL HTTP suite passed: 52/52, including the new end-to-end guest
  workout and both provisioning rollback cases.
- `npm run verify` passed after the final code/test changes: formatting, lint, server types,
  browser types, and all 172 automated tests (0 failures).
- The approval-gate rerun passed `npm run verify` (172/172) and the complete PostgreSQL HTTP
  suite (52/52) with 0 failures.
- `git diff --check` passed. The final changed-file review found only Action 1 implementation,
  tests, and governed goal/action documentation; no Action 2 or Action 3 implementation was
  started.

**Completion summary:** New guests now receive an atomically provisioned, immediately selected
starter hierarchy linked to the expanded four-step global sample session. The existing workout,
reporting, cleanup, isolation, expiry, and conversion boundaries remain intact and verified.

### Action 2 — Humanize goal labels at the presentation boundary

**Status:** Completed

**Approved:** 2026-09-08. The user accepted the presentation-boundary implementation after its
recorded review and final verification gate.

**Purpose:** Make goal names readable everywhere they are currently shown on the Programs
page without changing their database identity or submission contract.

**Expected work:**

- Add a small shared ViewModel formatter that converts underscore-delimited identifiers to
  title-cased display words and handles empty/non-string input predictably.
- Use it in Create Program select options and existing-program switcher metadata, the two
  verified consumers of goal names.
- Preserve each select option’s numeric goal ID and the existing invalid-form selected value.
- Add focused formatter/ViewModel/rendered tests covering `hypertrophy`, `weight_loss`, and
  `general_fitness`, plus HTTP coverage proving a human-readable option still submits and
  persists the matching existing goal ID.
- Re-run the directly affected Programs-page and validation coverage, then the required
  formatting, lint, and server type checks.

**Acceptance criteria:**

- Create Program and program cards display `Hypertrophy`, `Weight Loss`, and
  `General Fitness` rather than raw identifiers.
- Display formatting is shared at the presentation boundary; raw goal names and IDs remain
  unchanged in repositories, mappers, validation, and database rows.
- Valid and invalid form-state behavior remains correct, and submitted IDs still resolve to
  the intended existing goal.
- Focused and required static checks pass. The action stops at Ready for review.

**Constraints:**

- Do not rename seeded goal rows, change the goal schema, alter the numeric `goalId` contract,
  or broaden formatting changes to unrelated identifiers.
- Do not begin logo work or unrelated Programs-page redesign.

**Implemented:**

- Added a focused Programs-page `formatGoalLabel` presentation helper. It converts each
  underscore-delimited segment to a title-cased display word and returns an empty label for
  empty or non-string input.
- Applied the shared helper to both verified goal-name consumers: Create Program select
  options and existing-program switcher metadata.
- Kept form option values as numeric goal IDs and retained the submitted string ID in invalid
  form state, including the selected human-readable option.
- Added formatter, ViewModel, rendered EJS, and PostgreSQL HTTP assertions for `hypertrophy`,
  `weight_loss`, and `general_fitness`, plus successful program creation using the existing
  `weight_loss` row.

**Security and scope evaluation:**

- The change is output-only at the ViewModel boundary. Request validation still parses the
  established positive numeric `goalId`, the controller still consumes validated input, and
  the repository still persists the existing foreign-key ID.
- The HTTP test proves the readable `Weight Loss` option submits the existing numeric ID while
  the joined database row remains named `weight_loss`. Existing CSRF and authenticated form
  boundaries were exercised and remain unchanged.
- No EJS structure, controller, validation, repository, seed, schema, migration, dependency,
  logo, unrelated page, deployment, or production data was changed for this action.

**Verification evidence:**

- Focused formatter and Programs ViewModel/rendered tests passed: 6/6.
- The complete PostgreSQL HTTP suite passed: 53/53, including readable labels, invalid selected
  state, numeric submission, and unchanged stored identity.
- `npm run verify` passed: formatting, lint, server types, browser types, and all 174 automated
  tests (0 failures).
- The approval-gate rerun passed `npm run verify` (174/174) and the complete PostgreSQL HTTP
  suite (53/53) with 0 failures.
- `git diff --check` passed. A final source search confirmed the two Programs ViewModels are the
  only presentation consumers of goal names; no Action 3 implementation was started.

**Completion summary:** All current Programs-page goal presentations now use one output-only
formatter, while numeric submissions and stored goal identifiers retain their established
contracts.

### Action 3 — Increase logo presence and complete responsive verification

**Status:** Completed

**Approved:** 2026-09-09. The user accepted the responsive logo refinement after its recorded
rendered review and final verification gate.

**Purpose:** Give the established mark more visual impact while proving that the refinement
fits every existing first-use and authenticated shell state.

**Expected work:**

- Increase the shared logo’s effective size in the mobile header and normal desktop rail,
  and tune the authentication and short-height sizes only where rendered balance supports it.
- Enlarge or proportionally emphasize both mirrored arm shapes inside the existing shared SVG
  while preserving the core, lettering, rings, neon treatment, flex animation, and identity.
- Adjust only the directly required header/rail wrapper or spacing values. Keep practical menu
  spacing and avoid excessive chrome height.
- Add focused shared-mark and chrome/auth style contracts for balanced arms, responsive
  dimensions, overflow containment, focus, and reduced motion.
- Render and inspect the guest Dashboard and login page at representative 375/390px mobile,
  768/1024px rail, 1440px large, and approximately 1440×700 short-height viewports. Record
  element/document widths and check clipping, overlap, alignment, header/rail height, focus,
  motion, and breakpoint resizing.
- Run focused tests, `npm run verify`, the complete PostgreSQL HTTP suite, `git diff --check`,
  and final diff inspection. Record any unavailable manual verification explicitly.

**Acceptance criteria:**

- The logo is visibly larger in its primary chrome presentation and both arms have greater,
  symmetric prominence without becoming a new design.
- Mobile, normal/large rail, wide-short, and login layouts show no logo-caused clipping,
  overflow, overlap, misalignment, inaccessible menu control, or excessive header height.
- Existing focus, animation, reduced-motion, shell interaction, and page-layout contracts
  remain correct.
- All goal-level focused checks, `npm run verify`, PostgreSQL HTTP coverage, and diff checks
  pass, with live viewport evidence recorded. The action stops at Ready for review and the
  goal is prepared for final review.

**Constraints:**

- Do not redesign the brand, create separate logo assets, change navigation/shell behavior,
  alter unrelated pages, add dependencies, push, deploy, or mutate production.

**Implemented:**

- Preserved the shared 240×240 logo, circular core, lettering, rings, neon effects, and flex
  animation while enlarging the identical source geometry used by both mirrored arms.
- Increased both arms' upper-arm and forearm depth and reach, elbow radius, main stroke from
  3.5 to 4.25, detail stroke from 2 to 2.4, detail opacity, and restrained interior fill.
- Increased the authenticated mobile mark from 3.75rem to 4rem within a 4.75rem header, the
  normal rail mark from 5.5rem to 6.5rem within an 8.25rem header, and the compact-height mark
  from 4.5rem to 4.75rem within a 5.75rem header. Padding was adjusted only enough to contain
  those sizes.
- Increased the authentication-page mark from 3.5rem to 4.25rem without changing the panel,
  brand-link, or responsive layout model.
- Added focused shared-mark tests for equal mirrored geometry, retained identity, more
  prominent arm styling, responsive wrapper contracts, overflow containment, unchanged rail
  layout, and reduced-motion behavior.

**Rendered responsive evidence:**

- Used the running local application and headless Chrome to enter a real guest workspace, then
  captured and visually inspected the login page and guest Dashboard. Review images are in
  the temporary directory `/private/tmp/lets-flex-logo-screens-20260909/`.
- Login passed at 390×844 and 1440×900 with a measured 68×68px mark. The brand remained within
  its introduction panel and neither document had horizontal overflow.
- Guest Dashboard mobile passed at 375×812 and 390×844 with a 64×64px mark in a 76px header.
  The home mark and 44×44px menu trigger did not intersect, and both document widths exactly
  matched their viewports.
- Normal rail layouts passed at 768×1024, 1024×900, and 1440×900 with a centered 104×104px mark
  in a 132px header. The 1440×700 compact layout correctly used a centered 76×76px mark in a
  92px header.
- All eight measured layouts reported no horizontal overflow, no logo/menu overlap, and a logo
  rectangle fully within the viewport. Visual inspection found no arm clipping, rail-divider
  collision, alignment regression, or excessive header height.

**Accessibility and scope evaluation:**

- Live keyboard input focused the logo's home link and produced the established solid 3px focus
  outline. Under emulated `prefers-reduced-motion: reduce`, the forearm animation name was
  `none` and the static 90-degree flex transform remained applied.
- The SVG remains decorative (`aria-hidden` and non-focusable) inside the existing accessible
  home/sign-in links. No navigation interaction, accessible name, route, authentication,
  authorization, form, database, dependency, or unrelated page behavior changed.

**Verification evidence:**

- Focused logo, application-chrome, authentication-page, and menu-interaction tests passed:
  22/22.
- `npm run verify` passed: formatting, lint, server types, browser types, and all 177 automated
  tests (0 failures).
- The complete PostgreSQL HTTP suite passed: 53/53, covering the cohesive guest and goal-label
  behavior alongside the visual change.
- The approval-gate rerun passed `npm run verify` (177/177) and the complete PostgreSQL HTTP
  suite (53/53) with 0 failures.
- `git diff --check` passed. Final changed-file review found only the shared logo, its existing
  chrome/auth sizing boundaries, focused tests, and governed documentation for Action 3.

**Completion summary:** The established logo now has greater presence and equally stronger arm
shapes across every shared presentation, with responsive fit, accessibility, and motion behavior
verified in both contracts and live Chrome renders.

## Goal completion review

- **Starter seed:** Satisfied. A fresh guarded local reset produced one unowned, active global
  sample session with the reviewed four-step sequence and no duplicate catalog data.
- **Guest workspace and isolation:** Satisfied. Focused HTTP coverage created two independent
  guest-owned hierarchies linked to the same global session and selected each guest's own current
  workspace.
- **Workout lifecycle and reporting:** Satisfied. A guest started the four-step workout, received
  ordered snapshots, performed/skipped every step, finished it, and observed the result through
  Dashboard, History, and Progress.
- **Guest data lifecycle:** Satisfied. Missing-reference and forced-write rollback, failed web
  session cleanup, expiry cleanup, cross-guest isolation, and in-place account conversion remain
  covered and passing.
- **Goal presentation and persistence:** Satisfied. Both Programs-page consumers display readable
  labels, invalid selection state is retained, and numeric submission persists the unchanged
  catalog goal ID/name.
- **Responsive logo:** Satisfied. Eight rendered login/Dashboard layouts across mobile, normal
  rail, large rail, and compact height had no measured overflow, clipping, overlap, or alignment
  failures; focus and reduced motion also passed live checks.
- **Required verification:** Satisfied. The authorized development reset, focused suites,
  `npm run verify` (177/177), PostgreSQL HTTP suite (53/53), rendered review, final diff inspection,
  and `git diff --check` all passed.
- **Unmet criteria:** None.
- **Intentionally excluded:** The approved out-of-scope items remain untouched, including catalog
  additions, schema/migrations, workout or authorization redesign, unrelated UI refactors, new
  dependencies, deployment, and production mutation.

## Resume here

The goal is Completed. No next goal is strongly implied by the verified repository state and the
user's stated priorities; await new user direction before changing goal/action tracking.
