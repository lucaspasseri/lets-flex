# Goal: Improve Interaction Feedback and Perceived Responsiveness

## Goal status

**Completed.**

**Started:** 2026-09-14 after the user explicitly requested this interaction-feedback goal and
required the tracking documents to be updated before implementation.

**Ready for final review:** 2026-09-14 after completing Actions 1–4, focused verification, full
repository verification, and the Done-when comparison in `docs/current-actions.md`.

**Completed:** 2026-09-14 after explicit user approval of the final review. Important asynchronous
actions now expose scoped pending/result feedback, workout completion has optional failure-safe sound
feedback, verified long-running media generation has local progress messaging, and native
navigation, accessibility, security, and reduced-motion boundaries remain preserved.

## Primary objective

Improve the perceived quality, responsiveness, and reliability of Let's Flex by making important
asynchronous actions and meaningful workout state changes immediately understandable. Preserve the
server-rendered Express + EJS architecture, progressive enhancement, accessibility, predictable
navigation, and the existing dark training identity.

## Existing relevant capabilities — Verified

- The shared button partial supports semantic button types, variants, disabled state, icons, and
  accessible names for icon-only buttons, but does not provide a reusable pending/result contract.
- Workout log and skip forms already identify their submit controls and partially change the label
  plus disable the clicked button during native form submission.
- The shared page-feedback partial renders contextual success/error content with `status` or
  `alert` semantics and focusability; form-local errors and workout feedback are also present.
- The application initializes browser components centrally through `public/js/app.js` and
  `initializeComponents`, providing a reuse point for browser interaction behavior.
- Native cross-document View Transitions are enabled with a short root transition and reduced-motion
  fallback. Existing named navigation/entity transitions and the targeted history scroll behavior
  are completed related work and must be reused, not redesigned.
- No existing audio utility, workout sound preference, or sound event orchestration was found in the
  inspected browser components and settings surfaces.
- No browser executable is available in the current environment, so live viewport, keyboard,
  screen-reader, audio, transition timing, and runtime performance checks require later manual
  verification when a browser is available.

## Verified gaps / delta classification

- **Modify:** Extend the shared pending-state convention only for high-value asynchronous controls,
  preserving native form submission and button dimensions.
- **Add:** Focused success/error recovery behavior and regression coverage where current flows do
  not keep feedback close to the initiating action or can leave a stale pending state.
- **Add:** A small optional workout-feedback sound mechanism, a persisted user preference using the
  existing settings approach if compatible, and visual equivalents for every sound event.
- **Modify:** Audit and refine View Transition/loading behavior only where real latency or a verified
  orientation problem justifies it; keep ordinary tabs, filters, redirects, and top-level navigation
  on their existing simpler paths.
- **Explicitly defer:** A decorative global splash screen, SPA/client-side routing, sounds for
  ordinary CRUD/navigation clicks, artificial delays, and broad visual redesign.

## Scope and constraints

In scope: audited pending states for important asynchronous actions; duplicate-submission
prevention; understandable contextual result feedback; optional workout-only sound feedback and
preference control; existing View Transition and real-loading refinements; focused accessibility,
reduced-motion, responsive, and regression verification.

Preserve CSRF protection, authorization boundaries, validation, server redirects, native form
semantics, keyboard behavior, existing View Transition fallbacks, and the completed theme and
history continuity work. Do not add production dependencies or a frontend framework.

## Done when

- Important asynchronous actions have clear, consistent pending states and relevant duplicate
  submissions are prevented.
- Pending controls recover after both success and failure without stale disabled states or avoidable
  layout shifts.
- Success and failure feedback explains what happened in the context of the initiating action.
- Meaningful workout events can optionally produce subtle sound feedback, while visual feedback
  remains complete and sounds can be disabled.
- Audio playback respects browser restrictions, does not overlap uncontrollably, and cannot break a
  workout flow when playback fails.
- Existing View Transitions are refined only where beneficial, real latency has local feedback, and
  no artificial splash/loading screen is introduced.
- Keyboard access, accessible names/states, reduced-motion behavior, and narrow layouts remain
  usable.
- Focused tests and the repository verification matrix pass; unavailable live-browser checks are
  explicitly recorded.
- `docs/current-goal.md` and `docs/current-actions.md` accurately record scope, implementation,
  exclusions, and verification status.

## Splash screen decision

**Rejected/deferred.** The inspected architecture has no verified genuine initialization period that
requires branding or a blocking splash screen. Loading feedback will be local to real asynchronous
work instead.

## Related completed work to preserve

The prior View Transitions goal completed on 2026-09-14. It established the safe naming contract,
history list/detail continuity, targeted history scroll restoration, semantic tab safeguards, and
native/reduced-motion fallbacks. This goal reuses that implementation and reopens it only for
specific interaction-feedback or real-loading defects found by the audit.
