# Current Actions

## Current goal

Improve Interaction Feedback and Perceived Responsiveness.

## Goal status

**Completed.** Actions 1, 2, 3, and 4 are completed.

## Verified baseline reused

- Shared buttons, page feedback, form-local errors, workout feedback, and centralized browser
  component initialization already exist and are the preferred extension points.
- Workout log/skip submission controls already have a local partial pending behavior: the submitted
  control is disabled and its label can change. This is evidence to extend carefully, not a reason
  to mechanically modify every form.
- Native cross-document View Transitions, named selected/entity continuity, reduced-motion fallback,
  and targeted history scroll restoration are completed related work. Tabs, filters, ordinary
  redirects, and top-level navigation currently use simpler native DOM/navigation behavior.
- No audio utility or persisted workout sound preference was found in the inspected code.
- No browser executable is available for live rendering, keyboard/screen-reader, audio, transition,
  or performance inspection.

## Proposed action sequence

### Action 1 — Audit asynchronous interactions and feedback boundaries

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval of the action plan.

**Ready for review:** 2026-09-14 after completing the repository audit and focused verification.

**Completed:** 2026-09-14 after explicit user approval of the verified audit.

**Purpose:** Inventory state-changing forms, uploads, media actions, workout actions, authentication
and settings actions, navigation/loading surfaces, and existing feedback. Classify each by duplicate
submission risk, expected latency, current pending/result behavior, accessibility semantics, and the
smallest appropriate improvement. Confirm the existing View Transition and inner-scroll boundaries,
and verify whether any genuine initialization period exists that could justify a splash screen.

**Reviewable outcome:** A decision matrix in this record identifies `Already satisfied`, `Reuse`,
`Modify`, `Add`, and `Explicitly defer` items; representative flows and focused regression tests are
selected; sound-event candidates and the compatible preference surface are identified from direct
repository evidence. No broad UI behavior is changed during the audit.

**Planned verification:** Focused static/template/browser-contract tests selected from the inventory,
`git diff --check`, and documentation inspection.

### Action 2 — Standardize high-value pending and result feedback

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval of the next action.

**Completed:** 2026-09-14 after explicit user approval of the verified implementation.

**Purpose:** Implement the smallest reusable pending-state contract for audited high-value actions,
including native disabling, accessible busy/status messaging, stable control dimensions, duplicate
submission protection, and reliable recovery. Apply contextual success/error feedback to
representative flows, then extend only where the audit identifies the same role.

**Reviewable outcome:** Important actions visibly communicate processing and understandable results;
failure paths do not leave stale disabled/loading controls; native forms, CSRF, redirects, and
progressive enhancement remain intact; focused interaction/template tests cover success and failure
boundaries.

## Action 2 implementation and verification evidence

- Added one opt-in browser contract at `public/js/components/formSubmissionFeedback/` and wired it
  through centralized component initialization. It disables only the initiating submit control,
  prevents repeat submits for the same native form, sets `aria-disabled` and `aria-busy`, adds a
  polite live status, reserves the measured control width, and uses the existing localized loading
  labels where available.
- Reused the contract for workout start, finish, perform, skip, and cancellation; Library and
  Programs CRUD; media mutation forms through their existing class hooks; authentication/profile
  forms; password reset; and translation maintenance. Native POST/PATCH navigation, CSRF fields,
  server validation, provider links, modal behavior, and unrelated controls remain intact.
- Added reduced-motion-safe pending styling in `public/css/components/button.css`.
- Added allowlisted, localized success feedback for Library and Programs mutation redirects while
  preserving existing contextual error feedback, selected anchors, and session/day return paths.
- Focused verification: **43/43 tests passed** across the new pending contract, workout reuse,
  mutation feedback, Library query validation, authentication, media, shared components, Library,
  and Programs view contracts.
- `npm run format:check`, `npm run lint`, `npm run check:types`, `npm run check:browser-types`, and
  `git diff --check`: **passed**.
- At the time of Action 2 verification, `npm run verify` outside the sandbox completed all static
  checks with one stale `db/seed.test.js` setup-output expectation; that intentional file-output
  contract was corrected during Action 3 review changes.
- No browser executable is available, so live keyboard/screen-reader behavior, native navigation
  timing, and responsive rendering remain manual verification limits.

**Completion summary:** Standardized high-value native-form pending feedback and added contextual
success feedback at the silent Library/Programs redirect boundaries. Native navigation, CSRF,
validation, authorization, and existing failure recovery remain intact. Action 2 was approved
after the recorded focused verification; Action 3 remains pending.

### Action 3 — Add optional workout sound feedback

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval of the next action.

**Changes requested:** 2026-09-14 — Update the stale `database setup-output` test expectation
to verify the intentional `db/setup.sql` file-output contract, including deterministic schema-then-seed
contents and no SQL written to stdout. Preserve the current file-writing implementation.

**Ready for review:** 2026-09-14 after updating the setup-output expectation and completing focused
and full verification.

**Completed:** 2026-09-14 after explicit user approval of the verified changes.

**Purpose:** Add a small reusable, failure-safe sound mechanism for the highest-value workout event
identified by Action 1, with visual equivalents and a user-controlled persisted preference. Respect
autoplay restrictions, prevent uncontrolled overlapping playback, avoid ordinary CRUD/navigation
sounds, and include reduced-motion/accessibility-friendly non-audio feedback.

**Reviewable outcome:** Sound is subtle, optional, disableable, and never required to understand
workout state. Focused browser tests cover preference behavior, event selection, and playback failure
recovery.

## Action 3 implementation and verification evidence

- Added `public/js/components/workoutSounds/workoutSounds.js`, initialized through the centralized
  browser component entry point. The preference is opt-in by default, persists as a small
  `localStorage` value, and exposes an accessible Profile checkbox with localized status copy.
- The completion event is limited to a submitted finish form whose session ID matches a newly
  rendered finished workout. The one-shot `sessionStorage` marker expires after one minute and is
  consumed on read, so ordinary reloads and direct links do not replay the sound.
- The cue uses a short two-note Web Audio oscillator, stops any previous oscillator before starting,
  and swallows unsupported-audio, storage, and autoplay/resume failures. The rendered workout
  completion state remains the authoritative visual and accessible confirmation.
- Focused verification: **19/19 tests passed** across sound preference/storage behavior, cue
  playback and autoplay failure recovery, finish-marker matching, workout reuse, Profile rendering,
  and rendered workout lifecycle attributes.
- `npm run format:check`, `npm run lint`, `npm run check:types`, `npm run check:browser-types`, and
  `git diff --check`: **passed**.
- Updated `db/seed.test.js` to assert the destination-only status line, read the generated
  `db/setup.sql`, and compare its exact contents with the trimmed schema followed by the trimmed
  canonical seed. The SQL payload is no longer expected on stdout.
- Focused database verification: **6/6 tests passed**.
- `npm run verify`: **passed** — all static checks and **486/486 tests passed**.
- No browser executable is available, so actual audio autoplay behavior, keyboard/screen-reader
  output, responsive layout, and native post-redirect timing remain manual verification limits.

**Completion summary:** Added a safe, default-off, persisted workout completion cue with complete
visual fallbacks and no CRUD/navigation sounds. Corrected the stale setup-output test to cover the
existing deterministic file-output contract without restoring SQL stdout. Action 3 was approved after
the recorded focused and full verification; Action 4 remains pending.

### Action 4 — Refine real loading/navigation feedback and final verification

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval of the next action.

**Ready for review:** 2026-09-14 after implementing the local long-running-action feedback and
completing focused and full verification.

**Completed:** 2026-09-14 after explicit user approval of the verified changes.

**Purpose:** Revisit the existing View Transition implementation only for verified continuity or
latency issues, add local loading/skeleton feedback where actual latency warrants it, and document
deliberate exclusions. Run focused checks followed by formatting, lint, server/browser type checks,
applicable tests, and the full verification command.

**Reviewable outcome:** Transitions never block ready content or interaction, no artificial delays or
splash screen are introduced, reduced-motion and unsupported-API fallbacks remain safe, and all
manual browser limitations are explicitly recorded before final review.

## Action 4 implementation and verification evidence

- The verified audit found no continuity defect requiring changes to the existing short native View
  Transitions, named-element fallbacks, or targeted history scroll restoration.
- AI media generation is the confirmed long-running browser action: the provider boundary permits a
  request timeout up to 120 seconds. Reused media form pending behavior now gives generate and
  regenerate submits localized pending labels and a polite status explaining that generation may
  take up to two minutes.
- Deliberately excluded a page-wide lock, global skeleton, artificial delay, splash screen, client-
  side navigation takeover, and sounds for media or navigation. Native form submission, CSRF,
  authorization, validation, redirects, and the existing local pending spinner remain unchanged.
- Focused media-management and pending-feedback verification: **14/14 tests passed**.
- `npm run verify`: **passed** — all static checks and **487/487 tests passed**.
- No browser executable is available, so live transition timing, rendered responsive states, keyboard
  focus during native navigation, and runtime provider latency remain manual verification limits.

**Completion summary:** Confirmed the existing transition and scroll behavior needs no redesign,
added explicit localized pending feedback for the only verified long-running browser action, preserved
native progressive enhancement and security boundaries, and recorded the intentional loading
exclusions. Action 4 was approved after the recorded focused and full verification.

## Final review comparison

- Important asynchronous actions have scoped pending states and duplicate-submission prevention:
  **satisfied in Action 2**, with the long-running media-generation message added in Action 4.
- Pending controls recover through native success/error navigation without stale disabled state or
  avoidable layout shifts: **satisfied by the shared contract and focused/full verification**.
- Success and failure feedback remains contextual to the initiating action: **satisfied in Actions 2
  and 4**, including media generation status and existing media/workout feedback.
- Workout events have optional sound with complete visual fallback and a disableable preference:
  **satisfied in Action 3**.
- Audio restrictions, playback overlap, and failure recovery are handled safely:
  **satisfied by Action 3 implementation and focused tests**.
- View Transitions remain progressive and local latency has explicit feedback; no splash or artificial
  delay was introduced: **satisfied in Action 4**.
- Keyboard access, accessible names/states, reduced motion, and narrow-layout contracts remain
  covered by implementation and automated tests; live browser inspection is **unavailable** because
  no browser executable is installed.
- Focused tests and the repository verification matrix pass: **14/14 focused tests and 487/487 full
  tests passed; formatting, lint, server/browser type checks, and diff checks passed**.
- Goal and action documentation now records the approved scope, implementation, exclusions, and
  verification status: **satisfied by this final review update**.

## Audit decision matrix — Action 1 findings

| Surface / flow                                                          | Verified implementation evidence                                                                                                                                                                                                                                                                   | Classification                       | Action 1 decision                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workout set complete and skip                                           | `views/partials/sessionComponent/workoutLogsForm.ejs` uses native POST forms and `data-workout-submit`; `public/js/components/workoutTracker/workoutTracker.js` disables the submitted control and changes its label. Controllers redirect on success and render contextual step errors/conflicts. | Modify                               | Keep native navigation and local button scope. Extend the existing behavior with explicit busy/status semantics and test that validation/error reloads do not leave stale state. Do not lock unrelated workout controls.                                       |
| Workout start, finish, and planned-session cancellation                 | `views/partials/sessionComponent/main.ejs` and day cancellation forms use native POST/PATCH forms. Start/finish/cancel conflicts render workout feedback; ordinary success redirects show the resulting state.                                                                                     | Modify                               | Add opt-in pending feedback to start/finish/cancel; preserve conflict rendering and native redirects. Finish is a sound candidate only after the visual completion state is confirmed.                                                                         |
| Workout-session creation and day assignment                             | Day session-link form is a shared native form with disabled state when no valid context/templates exist; success returns to the day, and validation returns the form.                                                                                                                              | Modify                               | Add pending only when the form is enabled; keep the existing disabled prerequisites and contextual return path.                                                                                                                                                |
| Shared Library/session/exercise CRUD                                    | Create/update/archive/delete forms use the shared button/form partials and browser modal configurators. Success commonly redirects to `/library` or an anchored Library state without a success message; conflicts use page feedback.                                                              | Modify                               | Use the shared pending contract for create/update and destructive submit controls. Add contextual success only where the redirect does not itself make the changed state obvious; do not add sounds or page-wide loading.                                      |
| Programs and cycles CRUD                                                | Program/cycle creation and deletion use native forms plus modal confirmations. Validation/conflict errors have page feedback; successful operations redirect to `/programs` without a result message.                                                                                              | Modify                               | Apply pending state to confirmed mutation submits and improve only the relevant redirect feedback. Preserve modal semantics and authorization.                                                                                                                 |
| Admin exercise/template and translation maintenance                     | Admin create/update/archive/variant forms and translation PATCH forms are server-rendered. Translation success has a saved status on the editor; other admin CRUD redirects are mostly silent.                                                                                                     | Modify / Defer                       | Protect high-risk/destructive submits and long forms. Reuse existing translation saved/error status. Ordinary admin actions do not receive sound or a general loading screen.                                                                                  |
| Media upload and assignment/removal/canonical promotion                 | `views/mediaManagement/index.ejs` contains native POST forms with contextual field/form errors. `mediaManagementController.js` redirects with operation-specific success feedback; remove and other actions have mutation impact.                                                                  | Modify                               | Add local pending state to upload and mutation controls, prioritizing upload, canonical promotion, and removal. Keep feedback near the selected entity and retain the existing CSRF/redirect contract.                                                         |
| AI media generation/regeneration                                        | `src/features/media/mediaGeneration.js` calls an external image provider with a configured timeout up to 120 seconds; controller renders operation-specific errors and redirects with a candidate-ready success message.                                                                           | Add / Modify                         | Highest latency and duplicate-risk candidate. Provide explicit “generating” pending copy, prevent repeat requests while the request is in flight, and preserve nonce/idempotency behavior. No page-wide lock.                                                  |
| Media candidate reject/approve                                          | Native POST forms mutate a pending candidate and render contextual success/error or recovery feedback.                                                                                                                                                                                             | Modify                               | Use the same local pending contract as other media mutations; keep candidate-specific error and not-found recovery.                                                                                                                                            |
| Authentication and account actions                                      | Login/register/guest/password-reset/password-update/logout and Google link/replace use native POST or provider navigation. Validation/status messages exist; reset requests call email delivery after a database transaction.                                                                      | Modify                               | Add pending state to native submits, especially registration, reset-link request, reset completion, and account linking. Preserve CSRF, rate limits, generic recovery wording, session rotation, and provider redirects. Google GET navigation remains a link. |
| Locale selection and theme selection                                    | Locale POST persists in the server session and redirects safely; theme is an immediate `localStorage` preference with a live current-theme status.                                                                                                                                                 | Already satisfied / Reuse            | Do not add pending UI to the quick locale/theme controls. Reuse the existing local-storage preference pattern for workout sound only if no server setting is compatible.                                                                                       |
| GET filters, search, pagination, tabs, accordions, and entity selection | These use native GET forms/links or same-document DOM updates; tabs/accordions expose semantic state and have existing reduced-motion/focus coverage.                                                                                                                                              | Already satisfied / Explicitly defer | Keep immediate native/DOM interaction. Do not add View Transitions or blanket loading indicators without demonstrated latency or orientation benefit.                                                                                                          |
| Chart rendering and deferred media                                      | Adherence chart exposes a live loading/fallback status before optional canvas rendering; shared media uses native lazy loading/async decoding where requested.                                                                                                                                     | Already satisfied / Reuse            | Preserve the local status and progressive fallback. No artificial delay or global skeleton.                                                                                                                                                                    |
| View Transitions and inner scrolling                                    | Native cross-document transitions, named continuity, reduced-motion fallback, and history-only scroll restoration were completed in the preceding goal. No browser-side fetch/navigation layer exists.                                                                                             | Reuse / Modify only if verified      | Preserve current names, native fallbacks, tabs, redirects, and targeted scroll behavior. Action 4 may document or make only a demonstrated loading/continuity correction.                                                                                      |
| Splash screen / initialization                                          | EJS renders the page shell server-side; browser scripts initialize components after the document is available. No genuine blocking initialization phase was found.                                                                                                                                 | Explicitly defer                     | Reject a decorative splash screen and fixed loading delay.                                                                                                                                                                                                     |

## Interaction inventory and implementation selection

### High-value Action 2 candidates

- Workout step perform/skip and session start/finish: users are waiting on a state transition and
  duplicate writes are undesirable. Reuse the current workout-specific hook, extending it rather
  than creating a second form system.
- Media generation/regeneration: provider latency is explicitly bounded at up to 120 seconds and
  repeated requests have a meaningful cost/side effect. Add the strongest local pending feedback.
- Media upload, canonical promotion, removal, and candidate approval/rejection: these mutate the
  selected entity and already have local contextual result/error surfaces.
- Authentication registration, password-reset request/completion, profile password creation, and
  logout/account-link forms: duplicate submission and user uncertainty matter; security and provider
  redirect boundaries must remain unchanged.
- Confirmed Library/Programs destructive and long create/update submits: use native disabled
  controls, but avoid locking the surrounding page or unrelated modal actions.

### Reuse or intentionally exclude

- Existing workout success is communicated by the resulting progress/terminal state, while errors
  are rendered as `workout-feedback` and focused on initialization. Action 2 should improve the
  pending boundary and copy only where needed, not add a second success overlay automatically.
- Media operation success already uses `saved=<operation>` and operation-specific page feedback;
  Action 2 should preserve this contract and make the initiating control’s pending state consistent.
- Translation saves already expose a locale-specific saved status and field/form errors.
- Same-document tabs, filters, accordions, theme/locale controls, normal navigation links, and
  provider GET redirects do not need pending UI under this goal’s current evidence.

## Sound audit

- No audio element, Web Audio utility, timer/countdown, workout sound preference, or audio event
  orchestration exists in the repository.
- A rest-timer-finished event cannot be implemented from current evidence because no rest timer or
  countdown exists. It remains a future candidate if that feature is separately introduced.
- The best existing starting candidate is workout completion, because the server-rendered workout
  model exposes a visual terminal success state after the finish action. Set/exercise completion is
  a secondary candidate because each perform action can repeat frequently and must remain pleasant.
- The preference integration point should reuse the existing `localStorage` approach used by
  `public/js/theme.js`, with a safe default and storage-failure fallback. No database setting or
  schema change is justified by current evidence.
- Action 3 must treat playback as best-effort: visual state remains authoritative, autoplay failure
  is swallowed, and repeated event playback must not create uncontrolled overlap.

## Security and data-integrity boundaries

- `app.js` applies the shared CSRF middleware before all state-changing routes; forms include the
  server-provided token. Pending behavior must not remove or replace native form submission.
- Authentication routes retain anonymous/authenticated guards, password-reset rate limiting, generic
  recovery wording, provider redirects, session rotation, and logout behavior.
- Media generation has a session nonce check and the generation/regeneration operations must retain
  it. UI duplicate prevention is complementary, not a replacement for server-side protection.
- No database schema or migration change is required by the audit.

## Action 1 verification evidence

- Focused existing contracts: **26/26 tests passed** across workout tracker behavior, theme
  persistence, history restoration, shared feedback/components, media-management rendering, and
  authentication page rendering.
- Repository inspection verified all state-changing route families in `src/interfaces/routes`, the
  corresponding EJS forms, centralized browser initialization, and the shared CSRF boundary in
  `app.js`.
- `rg` inspection found no browser-side `fetch`, `XMLHttpRequest`, or audio implementation; the only
  application `fetch` use is in the server-side image-generation provider and test HTTP helpers.
- `npm run format:check`: **passed**.
- `git diff --check`: **passed**.
- No browser executable is available. Live viewport, keyboard/screen-reader, audio autoplay/failure,
  transition timing, and runtime performance checks remain manual verification for later actions.

**Completion summary:** Audited the server-rendered mutation and navigation surfaces, selected
high-value pending/result candidates, identified workout completion as the first feasible sound
event, confirmed `localStorage` as the compatible preference approach, preserved security and
transition boundaries, and rejected a splash screen.

## Historical completed related goal

The immediately preceding goal, “Audit and Expand View Transitions Without Sacrificing Performance or
Predictability,” was completed on 2026-09-14. Its implementation and verification established the
safe View Transition naming contract, history continuity and targeted scroll restoration, tab
safeguards, reduced-motion fallback, and full automated verification. Those decisions remain
historical evidence and are intentionally not repeated or redesigned here.

## Resume here

Actions 1, 2, 3, and 4 are **Completed**. The goal was **Completed** on 2026-09-14 after explicit
final approval. All Done-when criteria were satisfied or explicitly marked unavailable for live
browser inspection.
