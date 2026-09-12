# Current Goal

## Parent milestone

Let’s Flex should help users recognize and navigate training content quickly while preserving
stable training relationships, ownership boundaries, and the focused strength-training workflow.

## Current goal

### Phase 4 — Harden internationalization and complete locale-sensitive presentation

Complete and harden the established English (`en`) / Brazilian Portuguese (`pt-BR`) i18n
implementation so application-owned presentation is consistently locale-aware across dates, numbers,
durations, dynamic copy, validation and error states, authentication/account flows, generated auth
email copy where supported, accessibility text, browser-generated UI, analytics labels, and
responsive interfaces.

## Status

Completed on 2026-09-12. The Phase 4 goal and action sequence are recorded; Actions 1–9 were
approved and completed. Phase 3 remains completed and approved as the baseline.

## Objective

Make English and Brazilian Portuguese fully supported application modes without creating a parallel
i18n system, changing persisted domain data, or redesigning unrelated product areas. User-facing
application-owned copy and presentation values should respect the active locale, missing required
translations should be detectable, and locale switching should preserve behavior, identity,
ownership, authentication semantics, and user-authored content.

## Verified delta-first baseline

### Already satisfied and reusable

- Phase 1/2 provide the i18next resource contract, `en`/`pt-BR` support, English fallback,
  request/EJS translation access, locale detection/persistence, and the locale switch route.
- Phase 3 provides centralized catalog localization with active-locale → English → canonical
  fallback, stable IDs, localized catalog view models, and preserved user/history/media boundaries.
- The modular-monolith separation between routes, validation, controllers, services, repositories,
  view models, EJS, and browser scripts is established and remains the implementation boundary.
- Existing browser translation data already supports a small server-rendered message contract with
  `one`/`other` selection and interpolation; Action 3 extended it for Library counters where direct
  interaction evidence required it.

### Verified gaps and audit findings

- `src/infrastructure/i18n/i18n.js` currently centralizes locale detection and English fallback, but
  no shared application formatting boundary for dates, numbers, percentages, or durations was found.
- `views/viewModels/programsPage/createHierarchyGuideViewModel.js` manually selects singular/plural
  English words, and auth email delivery hard-codes English copy and duration wording.
- Authentication provider/controller paths still contain application-owned English error text, while
  validation schemas expose Zod messages that need a presentation-safe locale mapping audit.
- Browser scripts and Chart.js view models are existing dynamic-copy boundaries requiring a focused
  audit for localized labels, counters, fallback text, and numeric formatting.
- The existing resource completeness test compares leaf-key sets, but does not yet validate stronger
  required-resource structure or prevent an application-owned missing key from reaching production.
- Document language and the locale switch are already wired through the shared layout and middleware;
  representative auth, guest, authenticated, and browser interaction flows still need verification.
- The email service has no persisted user-locale argument. Email localization must either use a
  reliably supplied locale in the existing call path or document the asynchronous-context limitation;
  reset token, URL, anti-enumeration, and provider-error secrecy must remain unchanged.
- User-authored names, notes, descriptions, historical snapshots, external/provider-owned content,
  and stable measurement symbols such as `kg`/`lb` are intentionally not translation targets.

## Scope

### In scope

- Shared locale-aware presentation helpers for dates, times, numbers, percentages, durations, and
  application-owned workout units/count labels.
- Application-owned pluralization, interpolation, notifications, validation messages, safe errors,
  confirmation states, authentication/account copy, and generated authentication-email copy where
  reliable locale context exists.
- Browser-generated labels/messages, accessible names and descriptions, Chart.js/analytics labels,
  empty states, and existing search/filter interaction copy.
- Focused mixed-language and responsive audits for English and Brazilian Portuguese, including guest,
  authenticated, authentication, and locale-persistence flows.
- Stronger translation completeness/missing-key detection and regression verification.

### Non-goals

- Additional locales, runtime machine translation, translation SaaS/CMS integration, or external
  translation APIs.
- Translating user-generated content, user-owned catalog content, historical snapshots, or external
  provider pages/messages.
- Another catalog/schema redesign, localized route URLs, authentication architecture redesign,
  analytics calculation changes, new workout features, media architecture, or broad visual redesign.
- Changing stored numeric/date values, measurement-unit identifiers, stable IDs, relationships,
  authorization, business rules, or analytics grouping.

## Completion criteria

Phase 4 is ready for final review only when:

1. This file and `docs/current-actions.md` accurately describe Phase 4 and its actual status.
2. Dates, times, relevant numbers/percentages, durations, and count labels use the active locale.
3. Application-owned dynamic sentences use interpolation and localized pluralization.
4. Major validation, error, success, confirmation, authentication, and account messages follow the
   active locale without exposing internal/provider details.
5. Generated authentication-email localization is implemented where context is reliable, or its
   limitation is explicitly documented with security semantics preserved.
6. Relevant accessible names, browser-generated UI, analytics/chart copy, and document language
   follow the active locale.
7. User-generated content, catalog identity, persisted values, relationships, and auth behavior are
   unchanged.
8. Locale switching/persistence works through representative guest and authenticated flows.
9. English and Portuguese responsive interfaces have no known major translated-copy regressions.
10. A mixed-language audit classifies remaining English content as intentional, external, user-owned,
    or a documented limitation; obvious missing application translations are resolved.
11. Required translation keys are detectable and missing-key behavior falls back safely in production.
12. Relevant focused tests, type checks, lint, formatting, regression checks, and `git diff --check`
    pass, with unavailable browser/database/service capabilities recorded precisely.
13. Every action is approved through its review gate before the goal is reported ready for final review.

## Constraints and confirmed decisions

- Reuse the established i18next/session/EJS/browser-message architecture and English fallback.
- Keep all locale-specific formatting at presentation boundaries; calculations, storage, identity,
  authorization, and machine contracts remain locale-neutral.
- Use explicit reviewed translations only; never introduce runtime or automatic translation.
- Preserve the Phase 3 boundary: application-managed catalog labels may localize, while user-owned,
  user-authored, historical, and external content remains as authored.
- Preserve authentication security controls, generic password-reset responses, token/URL behavior,
  session behavior, and secret-free operational errors.
- Do not reset databases, mutate production data, deploy, push, commit, or add a production dependency
  without explicit approval.

## Historical context

- Phase 1 established the English/Brazilian Portuguese i18n foundation.
- Phase 2 expanded that foundation across shared UI and application-owned interface copy.
- Phase 3 localized application-managed catalog presentation while preserving stable identity,
  ownership, history, analytics, media, forms, and user-generated content. It was approved on
  2026-09-11 and is the verified baseline for Phase 4.

## Resume here

Action 1 — Update goal tracking and audit — is completed. Action 2 — Centralize locale-sensitive
formatting — is completed and approved. Action 3 — Dynamic copy and pluralization — is completed
and approved. Action 4 — Validation, errors, and notifications — is completed and approved. Action
5 — Auth/account/email localization — is completed and approved. Action 6 — Client-side,
accessibility, and analytics copy — is completed and approved. Action 7 — Responsive and
mixed-language audit — is completed and approved. Action 8 — Completeness and regression
verification — is completed and approved. Action 9 — Final tracking synchronization and review
preparation — is completed and approved. Phase 4 is completed and approved. Live browser/
assistive-technology execution and context-free email locale context remain documented limitations;
no other unmet completion criterion was identified.
