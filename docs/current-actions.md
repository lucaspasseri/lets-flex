# Current Actions

## Current goal

### Phase 5 — Add translation maintenance and admin tooling

Add a small, secure admin workflow for inspecting and maintaining application-managed `en` and
`pt-BR` catalog translations while preserving stable identity, relationships, fallback, ownership,
user-authored content, and existing catalog behavior.

## Goal status

Phase 5 is Completed on 2026-09-12. Actions 1–8 are completed with their verification evidence
recorded. Phase 4 is completed and approved historical work.

**Phase 5 goal completion (2026-09-12):** The user approved the final review after the completion
matrix and verification evidence were recorded. Phase 5 delivered the shared translation
maintenance contract, database-backed overview and counts, admin-only validated upsert workflow,
global catalog synchronization, fallback and ownership safeguards, accessible responsive maintenance
views, and regression coverage. The five out-of-scope HTTP failures and unavailable live-browser /
assistive-technology inspection remain documented limitations; no next goal is implied by this
completion record.

## Planning evidence

- **Verified:** Five dedicated translation tables exist for exercises, global exercise variants,
  muscles, equipment, and movement patterns, keyed by stable entity ID and locale.
- **Verified:** Catalog reads resolve active locale → English → canonical value; unsupported locales
  normalize to English. Existing seed/read guards exclude private variants from global translation.
- **Verified:** `requireAdmin` enforces the existing admin role for `/admin/library/exercises`; current
  admin Library forms manage canonical exercises and global variants but not translations.
- **Verified gap:** No reusable database-backed completeness query/service or admin translation list
  currently exists. Existing completeness checks validate authored manifest/seed coverage only.
- **Verified gap:** Existing translation tables include optional localized description columns, while
  current Portuguese seed/read behavior uses names; the supported editable field set must be chosen
  explicitly.
- **Verified boundary:** UI resource files remain source-controlled; user-owned variants, authored
  names/notes, sessions/programs, and historical/external content are outside this goal.

## Confirmed decisions

- Reuse the Phase 3 translation tables, catalog localization helpers, existing Library/admin forms,
  CSRF and `requireAdmin` boundaries, and the established i18next presentation architecture.
- Derive completeness from translation availability rather than adding persisted status columns.
- Keep stable IDs, canonical/internal values, relationships, calculations, authorization, and user
  content locale-neutral and unchanged.
- Use explicit reviewed translations only; no machine translation, SaaS/CMS, or external API.
- Stop at each active action’s review gate before activating the next action.

## Proposed Phase 5 action sequence

### Action 1 — Update goal tracking and audit

**Status:** Completed

**Purpose:** Establish Phase 5 as the active goal, preserve Phase 3/4 history, and record the
verified translation schema, fallback, ownership, existing admin routes, catalog flows, and current
completeness checks before runtime implementation.

**Acceptance criteria:**

- Both tracking files explicitly describe Phase 5 objective, scope, non-goals, completion criteria,
  constraints, and current status.
- The audit identifies supported global entity types, localized fields, fallback behavior, existing
  admin authorization, private-content exclusions, and the verified implementation delta.
- No broad runtime implementation occurs before the action plan is approved.

**Action 1 activation (2026-09-12):** The user approved the proposed Phase 5 action plan. Action 1
was activated as the only authorized action; Actions 2–8 remain pending.

**Action 1 implementation and audit evidence (2026-09-12):** Updated `docs/current-goal.md` to make
Phase 5 the active goal and retained Phase 4 and Phase 3 records as historical context. Inspected
the Phase 3 translation schema, seed/migration contract, catalog localization joins, fallback
behavior, global/private variant ownership, existing `/admin/library/exercises` routes and forms,
the `requireAdmin` authorization middleware, source-controlled UI resources, and current manifest/
seed completeness tests. The verified Phase 5 delta is a reusable database-backed completeness
contract plus concise admin overview and safe single-record translation maintenance. Supported
entities are exercises, global exercise variants, muscles, equipment, and movement patterns.
Existing translation tables expose name fields and optional description columns; current Portuguese
seed/read behavior uses names, so the editable field contract remains explicitly scoped for Action 2.
No runtime, schema, seed, database, route, or user-content implementation was performed in this
audit action.

**Action 1 verification (2026-09-12):** Confirmed both tracking files explicitly describe Phase 5,
its objective, scope, non-goals, completion criteria, constraints, verified baseline, and action
status. Confirmed the proposed actions contain only the verified maintenance delta and preserve the
existing identity, ownership, fallback, authorization, UI-resource, and database lifecycle
boundaries. `npx prettier --check docs/current-goal.md docs/current-actions.md` passed, and
`git diff --check` passed. Runtime checks were not run because this action changed documentation
only.

**Action 1 review stop (2026-09-12):** The Phase 5 tracking and architecture audit are complete and
the action is Ready for review. Action 2 remains Pending and prepared but has not been activated or
implemented.

**Action 1 review approval (2026-09-12):** The user approved the tracking and audit implementation
after its verification evidence was recorded. Action 1 is Completed. Action 2 remains Pending and
prepared as the next action; it has not been activated or implemented.

### Action 2 — Define the translation maintenance contract

**Status:** Completed

**Purpose:** Specify the supported entity/field matrix, derived status vocabulary, required locales,
fallback preview semantics, validation, upsert, and English fallback protection in one reusable
contract.

**Action 2 activation (2026-09-12):** The user approved the prepared next action. Action 2 is now
active and is the only Phase 5 runtime action authorized for implementation. Actions 3–8 remain
pending.

**Action 2 implementation (2026-09-12):** Added the reusable
`src/features/translationMaintenance/translationMaintenanceContract.js` boundary and its focused
tests. The contract supports exercises, global exercise variants, muscles, equipment, and movement
patterns; exposes names as the currently supported localized field; derives `complete`, `missing-en`,
`missing-pt-BR`, and `incomplete` from actual translation-row values; and resolves preview text as
active locale → English → canonical fallback. It validates positive stable IDs, supported `en` /
`pt-BR` locales, required non-empty names, and outer-whitespace trimming. It formalizes upsert-only
maintenance with deletion disabled, so the English fallback cannot be removed through this workflow.
Optional localized description columns remain excluded until their read paths are integrated.

**Action 2 verification (2026-09-12):** The focused contract suite passed 6/6 tests, covering the
entity matrix, status derivation, fallback preview, validation, unsupported values, and fallback
mutation policy. `npm run check:types`, `npm run format:check`, `npm run lint`, and `git diff --check`
passed. Browser type-checking and full repository tests were not run because Action 2 added no
browser code or database/repository integration; those checks remain part of the later integration
and verification actions.

**Action 2 review stop (2026-09-12):** The translation maintenance contract is implemented and
verified within the approved scope. Action 2 is Ready for review. Action 3 remains Pending and has
not been activated or implemented.

**Action 2 review approval (2026-09-12):** The user approved the contract implementation after its
verification evidence was recorded. Action 2 is Completed. Action 3 remains Pending and prepared as
the next action; it has not been activated or implemented.

### Action 3 — Add the completeness query/service boundary

**Status:** Completed

**Purpose:** Implement parameterized repository/service logic for per-record status, filtered search,
entity type, and lightweight counts while excluding archived/private/user-owned content.

**Action 3 activation (2026-09-12):** The user approved the prepared next action. Action 3 is now
active and is the only Phase 5 runtime action authorized for implementation. Actions 4–8 remain
pending.

**Action 3 implementation (2026-09-12):** Added the parameterized
`src/features/translationMaintenance/queries.js` and `repository.js` read boundary plus
`getTranslationOverview.js`. The query combines the five supported global catalog entity types,
searches English, Portuguese, and canonical names, filters by entity type, excludes archived
exercises/variants and private variants, and returns stable IDs with separate translation values.
The service applies the shared Action 2 status and fallback-preview contract, supports status
filtering, and derives total/status/entity counts without duplicating entity or status definitions.

**Action 3 verification (2026-09-12):** Focused translation-maintenance and contract tests passed
10/10, covering SQL scope, parameterized search/entity filters, invalid filters, status derivation,
counts, fallback, entity coverage, and validation policy. `npm run check:types`,
`npm run format:check`, `npm run lint`, and `git diff --check` passed. Browser type-checking was not
run because no browser code changed. Full database/HTTP tests remain part of later integration and
verification actions because this action added a read boundary tested with fakes only.

**Action 3 review stop (2026-09-12):** The completeness query/service boundary is implemented and
verified within the approved scope. Action 3 is Ready for review. Action 4 remains Pending and has
not been activated or implemented.

**Action 3 review approval (2026-09-12):** The user approved the completeness query/service
implementation after its verification evidence was recorded. Action 3 is Completed. Action 4
remains Pending and prepared as the next action; it has not been activated or implemented.

### Action 4 — Add the admin translation overview

**Status:** Completed

**Purpose:** Add a concise authorized overview with accessible status, search/filter controls, counts,
fallback visibility, and links into the maintenance workflow, reusing existing application chrome
and Library visual/form conventions.

**Action 4 activation (2026-09-12):** The user approved the prepared next action. Action 4 is now
active and is the only Phase 5 runtime action authorized for implementation. Actions 5–8 remain
pending.

**Action 4 implementation (2026-09-12):** Added the admin-only `/admin/translations` overview using
the Action 3 overview service and the shared application chrome. The page presents the supported
catalog scope, derived status counts, entity/status/search filters, separate English and Portuguese
values, explicit missing/fallback markers, and an empty state. Added localized English and
Brazilian Portuguese copy, an admin navigation destination, and a Library admin-scope link. The
rendering uses semantic form labels, table headers/caption, keyboard-reachable horizontal overflow,
escaped values, responsive status/filter layouts, and mobile-stacked filter actions. No translation
mutation controls were added; those remain scoped to Action 5.

**Action 4 verification (2026-09-12):** Focused schema, CSS, page-render, view-model, and
application-chrome tests passed 14/14. `npm run check:types`, `npm run check:browser-types`,
`npm run format:check`, `npm run lint`, and `git diff --check` passed. The elevated full repository
test suite passed 319/319 tests, including database setup and loopback HTTP tests; the initial
sandboxed attempt was blocked only by local PostgreSQL/loopback `EPERM` restrictions. Responsive
behavior was verified from the source-level CSS contracts and focused assertions; no live browser
executable was available in this environment for screenshot inspection, so rendered browser
appearance remains a manual follow-up. No database/schema reset was needed.

**Action 4 review stop (2026-09-12):** The admin translation overview is implemented and verified
within the approved scope. Action 4 is Ready for review. Action 5 remains Pending and prepared but
has not been activated or implemented.

**Action 4 review approval (2026-09-12):** The user approved the admin translation overview after
its focused and full verification evidence was recorded. Action 4 is Completed. Action 5 remains
Pending and prepared as the next action; it has not been activated or implemented.

### Action 5 — Add single-record translation editing

**Status:** Completed

**Purpose:** Let admins add/update supported `en` and `pt-BR` localized fields through validated,
CSRF-protected server routes and repository transactions without changing canonical identity or
relationships.

**Action 5 activation (2026-09-12):** The user approved the prepared next action. Action 5 is now
active and is the only Phase 5 runtime action authorized for implementation. Actions 6–8 remain
pending.

**Action 5 implementation (2026-09-12):** Added dedicated editor GET/PATCH routes under
`/admin/translations/:entityType/:entityId`, reusing the existing `requireAdmin`, CSRF, parameter,
and body-validation middleware. Added a repository query/upsert boundary and service for the
approved name-only `en` / `pt-BR` contract. Each update is scoped to an active global catalog
record, uses a parameterized upsert on the stable `(entity, locale)` key, and leaves canonical
names, IDs, relationships, ownership, and user-authored content untouched. The overview now links
each record to the editor. Added localized English/Portuguese forms with independent locale saves,
fallback guidance, validation feedback, escaped values, semantic labels, stable-ID context, and
responsive stacked mobile layout. No deletion or localized description editing was introduced.

**Action 5 verification (2026-09-12):** Focused translation editing, schema, rendering, view-model,
and CSS tests passed 12/12. `npm run check:types`, `npm run check:browser-types`,
`npm run format:check`, `npm run lint`, and `git diff --check` passed. Elevated `npm run verify`
passed all 327 repository tests, including database setup and loopback HTTP tests. Responsive
behavior was verified from source-level CSS contracts and focused assertions; no live browser
executable was available for screenshot inspection, so rendered browser appearance remains a
manual follow-up. No database/schema reset was needed.

**Action 5 review stop (2026-09-12):** Single-record translation editing is implemented and
verified within the approved scope. Action 5 is Ready for review. Action 6 remains Pending and
prepared but has not been activated or implemented.

**Action 5 review approval (2026-09-12):** The user approved single-record translation editing
after its focused and full verification evidence was recorded. Action 5 is Completed. Action 6
remains Pending and prepared as the next action; it has not been activated or implemented.

### Action 6 — Integrate global catalog creation/editing

**Status:** Completed

**Action 6 activation (2026-09-12):** The user approved the prepared next action. Action 6 is now
active and is the only Phase 5 runtime action authorized for implementation. Actions 7–8 remain
pending.

**Verified delta:** Existing admin exercise creation and global-variant creation write canonical
catalog rows without translation rows, while existing global edits update canonical names without
synchronizing the English translation. The admin Library is already the shared global catalog
management surface, and translation upserts accept a transaction client. Private variants are
filtered from administrator Library data and remain outside this integration.

**Implementation scope:** Reuse the existing transaction services and translation repository to
create or synchronize English rows atomically for global exercises and variants. Add localized,
direct links from the existing admin catalog controls to the approved translation editor. Add
focused service, view-model, and rendered-template coverage for synchronization, transaction
rollback, translation-editor identity, and private-content exclusion.

**Action 6 implementation (2026-09-12):** Global exercise creation now returns the created
exercise/variant rows and upserts English translations for both inside the existing transaction.
Global variant creation now uses a transaction service that inserts the variant and its English row
together. Existing global exercise/variant editing synchronizes the English translation rows with
the canonical name in the same transaction; Portuguese translations remain independently editable.
The admin Library's existing global catalog now links each global exercise and variant directly to
the approved translation editor. Private variants remain without translation links and outside the
translation write path.

**Action 6 verification (2026-09-12):** Focused service, translation-maintenance, Library
view-model/render, CSS, and browser-interaction tests passed (45/45). `npm run format:check`,
`npm run lint`, `npm run check:types`, `npm run check:browser-types`, `git diff --check`, and the
elevated complete `npm run verify` passed; the complete repository suite passed all 331 tests.
The initial sandboxed full run reproduced the environment's PostgreSQL/loopback `EPERM` failures
(327 passed, 2 failed, 3 cancelled), then the approved elevated run passed those same checks.
No browser executable is available for live viewport or assistive-technology inspection; that
manual limitation remains for Action 7.

**Action 6 review stop (2026-09-12):** Global catalog creation/editing is integrated with the
translation workflow within the approved scope. Action 6 is Ready for review. Actions 7–8 remain
pending and have not been activated or implemented.

**Action 6 approval (2026-09-12):** The user approved the implementation after the recorded
verification evidence passed. Action 6 is Completed. Action 7 remains Pending and prepared as the
next action; it has not been activated or implemented.

**Purpose:** Connect existing global exercise/variant creation and editing to the approved
translation workflow where necessary, without exposing user-owned/custom content or duplicating
catalog management experiences.

### Action 7 — Security, accessibility, and regression audit

**Status:** Completed

**Action 7 activation (2026-09-12):** The user approved the prepared next action. Action 7 is now
active and is the only Phase 5 runtime action authorized for implementation. Action 8 remains
pending.

**Verified audit baseline (2026-09-12):** Authorization and CSRF boundaries are present on the
admin translation routes; schema validation, escaped shared fields, semantic headings/labels,
fallback status text, and private-content filters are present in the implementation. The first
focused HTTP audit exposed one repairable regression in the shared variant translation SQL: its
parent exercise join used the variant ID instead of `exercise_id`, so global variant translation
upserts incorrectly returned no row and rolled back global exercise creation. The focused audit
also requires end-to-end assertions for admin-only access, CSRF rejection, fallback preservation,
and private-variant exclusion.

**Action 7 repairs and coverage (2026-09-12):** Corrected the global exercise-variant translation
join to use the variant's stable `exercise_id` parent relationship. Corrected the translation editor
form to pass the existing query-string method-override contract and retained `entityType` in the
editor view model so generated actions cannot lose their entity route. Added HTTP coverage for
authenticated-user and guest denial, CSRF rejection, admin overview/editor access, validated
translation upsert, English fallback preservation, and private-variant exclusion. Added focused
regression assertions for the corrected SQL and rendered form action.

**Purpose:** Verify direct unauthorized access, guest/user/admin behavior, validation/escaping,
fallback, ownership, ID/relationship preservation, existing catalog search/rendering, and responsive
keyboard-accessible maintenance states.

**Action 7 verification (2026-09-12):** The focused authorization and translation-maintenance HTTP
tests passed 2/2. Focused translation, catalog-creation/update, view, and responsive CSS tests passed
14/14. `npm run verify` passed formatting, lint, server type-check, browser type-check, and all 331
repository tests. `git diff --check` passed. The complete HTTP application suite reached 64 tests:
59 passed and 5 failed in authentication/workout-history/progress scenarios outside this action's
translation paths; their causes were not investigated as part of this scoped audit. The two Action 7
HTTP tests passed in the same suite. No live
browser executable or assistive-technology runner is available, so live viewport and interaction
inspection at approximately 390px, an intermediate pressure width, and desktop remain unavailable;
static responsive contracts and rendered accessibility assertions passed. No database reset,
production mutation, deployment, push, or commit was performed.

**Action 7 review stop (2026-09-12):** The security, accessibility, and regression audit is
implemented and verified within the available repository and HTTP evidence. Action 7 is Ready for
review. Action 8 remains Pending and has not been activated or implemented.

**Action 7 review approval (2026-09-12):** The user approved the implementation after the recorded
verification evidence passed. Action 7 is Completed. Action 8 remains Pending and prepared as the
next action; it has not been activated or implemented.

### Action 8 — Final verification and tracking synchronization

**Status:** Completed

**Action 8 activation (2026-09-12):** The user approved the prepared next action. Action 8 is now
active and is the only Phase 5 runtime action authorized for implementation.

**Purpose:** Run focused and repository verification, compare admin completeness with the existing
catalog completeness contract, document limitations/deferred work, and prepare Phase 5 for review
without claiming completion before explicit approval.

**Action 8 completion matrix (2026-09-12):**

1. **Verified:** Both tracking files describe the Phase 5 objective, scope, non-goals, constraints,
   action history, and current review state.
2. **Verified:** The shared maintenance contract defines five global entity types—exercises, global
   exercise variants, muscles, equipment, and movement patterns—with the supported localized field
   limited to the required `name`. The same five families are covered by the existing authored
   Portuguese manifest/vocabulary completeness contract. The admin contract derives live database
   status; the authored contract validates expected manifest/seed keys, so they are complementary
   checks rather than duplicated status logic.
3. **Verified:** Admin overview filters and counts expose per-record `complete`, `missing-en`,
   `missing-pt-BR`, and `incomplete` states, with search and entity/status filtering.
4. **Verified:** Overview status and counts are derived through the reusable maintenance contract,
   repository, mapper, and overview service rather than duplicated in the templates.
5. **Verified:** Admin-only validated upsert routes add or update supported `en` and `pt-BR` names
   through parameterized repository queries.
6. **Verified:** Authenticated ordinary users and guests receive denial on the maintenance overview;
   CSRF protection covers mutation, and the HTTP audit confirms the boundary.
7. **Verified:** Stable IDs, canonical values, relationships, and ownership predicates are retained;
   private variants are excluded from the global maintenance query and cannot be opened by the admin
   editor route.
8. **Verified:** Upsert-only mutation disallows deletion, and the editor preserves English rows and
   canonical fallback visibility when Portuguese is absent.
9. **Verified:** Full repository verification and the Action 7 HTTP audit cover global catalog
   creation/update synchronization, translation fallback, catalog search/rendering, and Library
   behavior without changing user-owned content or stable relationship identifiers.
10. **Verified with static/rendering limit:** Escaped values, semantic headings/labels, status
    feedback, labelled table overflow, keyboard focus styling, responsive filter/layout contracts,
    and reduced-motion-safe presentation are covered by render and CSS tests. No live browser or
    assistive-technology runner is available for viewport inspection at approximately 390px,
    intermediate pressure width, or desktop.
11. **Partially verified with precise limit:** `npm run verify` passed formatting, lint, server and
    browser type-checks, and all 331 repository tests. Action 7 focused HTTP coverage passed 2/2,
    but the complete 64-test HTTP application suite had 59 passes and 5 failures in authentication,
    workout-history, and progress scenarios outside the translation-maintenance paths; those causes
    were not investigated in this scoped goal. `git diff --check` passed.
12. **Verified/documented:** Deferred work includes localized description fields whose read paths are
    not integrated, bulk import/export and audit history, additional locales, and live browser/
    assistive-technology inspection. The full-suite HTTP failures remain an explicitly recorded
    follow-up rather than silently treated as Phase 5 evidence.

**Action 8 verification (2026-09-12):** Re-ran `npm run verify` with approved local PostgreSQL
access; formatting, lint, both type-check projects, and all 331 repository tests passed. Rechecked
the focused Action 7 HTTP tests at 2/2 and the complete HTTP application suite at 59/64, with the
five out-of-scope failures recorded in the completion matrix. `npx prettier --check
docs/current-goal.md docs/current-actions.md` and `git diff --check` passed. No database reset,
production mutation, deployment, push, or commit was performed.

**Action 8 review stop (2026-09-12):** Final verification, the completeness-contract comparison,
criterion-by-criterion matrix, limitations, and deferred work are synchronized. Action 8 is Ready
for review. Phase 5 awaits explicit final goal approval; no further action remains pending.

**Action 8 review approval (2026-09-12):** The user approved the final verification and tracking
synchronization after the recorded evidence passed. Action 8 is Completed. Phase 5 is Ready for
final review; no further action remains pending.

## Resume here

Action 1 is **Completed**. Action 2 is **Completed**. Action 3 is **Completed**. Action 4 is
**Completed**. Action 5 is **Completed**. Action 6 is **Completed**. Action 7 is **Completed**.
Action 8 is **Completed**. Phase 5 is **Completed** on 2026-09-12.

## Historical Phase 4 record

### Action 1 — Update goal tracking and audit

**Status:** Completed

**Purpose:** Record Phase 4 as the active goal, inspect completed Phase 1–3 behavior, audit
locale-sensitive presentation/mixed-language surfaces, and classify the verified implementation delta
before code changes begin.

**Acceptance criteria:**

- `docs/current-goal.md` explicitly describes Phase 4 objective, scope, non-goals, completion criteria,
  constraints, and current status.
- This file records the Phase 4 action sequence and keeps statuses synchronized with actual work.
- Existing i18n, catalog localization, locale persistence, document language, security, ownership,
  user-content, and browser-message contracts are documented as reusable boundaries.
- Formatting, dynamic copy, validation/errors, auth/account/email, accessibility, client-side,
  analytics, responsive, mixed-language, and completeness findings are classified by priority.
- No broad application implementation occurs in this audit action.

**Action 1 implementation and audit evidence (2026-09-11):** Updated `docs/current-goal.md` and
this file before executable Phase 4 implementation. Inspected the completed i18next middleware and
resource contract, shared EJS layout/document language, locale persistence route, Phase 3 catalog
localization/query/mapper boundaries, auth routes/controllers/passport strategy, validation schemas,
password-reset service/email delivery, dashboard analytics/chart view models, browser i18n/search/
workout scripts, accessibility-facing templates, and existing translation tests. Classified the
existing locale infrastructure and catalog identity/ownership boundaries as reusable; identified
direct date/number/duration formatting, manual pluralization, hard-coded auth/email messages,
browser/chart dynamic copy, and leaf-key-only completeness checks as the Phase 4 delta. Confirmed
user-authored content, external/provider-owned text, stable measurement symbols, persisted values,
security semantics, and analytics calculations remain outside translation scope.

**Action 1 verification (2026-09-11):** Both tracking files and the recorded baseline were inspected
against the Phase 4 request and repository evidence. `git diff --check` passed. No runtime code,
schema, seed data, database, route, email delivery, or user content was changed. Executable code
checks are deferred until an implementation action changes code.

**Action 1 review stop (2026-09-11):** Phase 4 tracking and the verified audit baseline are
complete. Action 1 is ready for review. Action 2 remains pending and has not been activated or
implemented.

**Action 1 review approval (2026-09-12):** The user approved the recorded tracking and audit
baseline after verification evidence was available. Action 1 is complete. Action 2 remains pending
and is prepared as the next action; it has not been activated or implemented.

### Action 2 — Centralize locale-sensitive formatting

**Status:** Completed

**Purpose:** Add or refine shared presentation helpers for dates, times, numbers, percentages,
durations, and application-owned workout unit/count labels, then migrate high-impact usages.

**Action 2 activation (2026-09-12):** The user approved the prepared next action. Action 2 was
activated and was the only action authorized for implementation in this work cycle. Actions 3–9
remain pending.

**Action 2 progress (2026-09-12):** The initial implementation audit confirms that several view
models already use `Intl` locally, but date-only helpers and analytics/workload/progress/history
formatters duplicate locale construction and some fixed-format helpers remain locale-insensitive.
The implementation centralized those presentation calls without changing stored date keys, numeric
calculations, unit identifiers, or translated sentence/pluralization scope reserved for Action 3.

**Action 2 implementation (2026-09-12):** Added the shared `src/infrastructure/i18n/formatLocale.js`
presentation boundary for locale-aware dates/times, numbers, percentages, durations, and long-form
measurements, with UTC anchoring for date-only values and stable `kg`/`lb` symbols for workout
labels. Migrated high-impact dashboard analytics/workload/navigation, Programs, Day, Library,
workout-session, progress, workout-history, and guest-profile expiration presentation paths to
receive the active language. Preserved stored date keys, numeric calculations, persisted unit
identifiers, catalog identity, and user-authored content.

**Action 2 verification (2026-09-12):** Focused locale/presentation tests passed (46 tests), with
English and Brazilian Portuguese date, decimal, percentage, duration, measurement, load, progress,
history, dashboard, Day, Programs, Library, and profile coverage. `npm run check:types`,
`npm run check:browser-types`, `npm run lint`, `npm run format:check`, and `git diff --check` passed.
The elevated full `npm test` run passed all 288 tests, including PostgreSQL-backed setup and the
locale-persistence HTTP test. The initial sandboxed `npm run verify` could not access loopback
PostgreSQL/HTTP resources (`EPERM`); the same complete test phase passed with the approved elevated
local verification.

**Action 2 review stop (2026-09-12):** Centralized formatting and the approved high-impact
migrations are complete and verified. Action 2 is ready for review. Actions 3–9 remain pending and
have not been activated or implemented.

**Action 2 review approval (2026-09-12):** The user approved the implementation after the recorded
verification evidence passed. Action 2 is complete. Action 3 remains pending and prepared as the
next action; it has not been activated or implemented.

### Action 3 — Dynamic copy and pluralization

**Status:** Completed

**Purpose:** Replace application-owned count-dependent and sentence-fragment construction with
localized pluralization/interpolation while preserving stable symbols and user content.

**Action 3 activation (2026-09-12):** The user approved the prepared next action. Action 3 is now
active and is the only action authorized for implementation in this work cycle. Actions 4–9 remain
pending.

**Acceptance criteria:**

- Count-dependent application copy uses the established translation boundary and reviewed
  `one`/`other` resources for English and Brazilian Portuguese.
- Dynamic workout, library, Programs, Day, history, progress, and analytics labels preserve
  interpolation and stable measurement symbols while localizing grammatical copy.
- Server-rendered and browser-generated Library counters consume the existing server-provided
  browser message contract and do not revert to English after interaction.
- User-authored content, catalog identity, persisted values, calculations, relationships, and
  authorization behavior remain unchanged.

**Action 3 implementation (2026-09-12):** Added the shared count translation helper and reviewed
plural resources for workout prescriptions/progress, dashboard assignment/adherence/workload,
Programs cycle/hierarchy counts, Library session/exercise/variant/set/step counts, history step
counts, and progress occurrence summaries. Migrated server-rendered view models and EJS surfaces
away from manual singular/plural branches and direct count fragments, including session details,
Library tabs, history details, and progress rows. Updated the existing browser message contract and
Library search/filter counters so locale-provided messages remain active during filtering. Kept
`kg`/`lb` symbols, IDs, stored values, analytics calculations, and user content unchanged.

**Action 3 verification (2026-09-12):** Focused dynamic-copy, Library, dashboard, Day, Programs,
progress, history, and rendering tests passed (49 tests), including a new test proving that browser
Library counters consume a Portuguese message payload. `npm run format:check`, `npm run lint`,
`npm run check:types`, `npm run check:browser-types`, and `git diff --check` passed. The translation
resource leaf-key audit found matching `en`/`pt-BR` structures with 550 keys. The complete elevated
`npm run verify` passed all static checks and all 289 repository tests. A preceding sandboxed run
could not access local PostgreSQL/HTTP loopback resources (`EPERM`); the same test suite passed with
approved elevated local access.

**Action 3 review stop (2026-09-12):** Dynamic copy and pluralization implementation is complete
and verified. Action 3 is ready for review. Actions 4–9 remain pending and have not been activated
or implemented.

**Action 3 review approval (2026-09-12):** The user approved the implementation after the recorded
verification evidence passed. Action 3 is complete. Action 4 remains pending and prepared as the
next action; it has not been activated or implemented.

### Action 4 — Validation, errors, and notifications

**Status:** Completed

**Purpose:** Localize major application-controlled validation, safe error, success, confirmation, and
notification messages without translating logs, stack traces, or raw provider errors.

**Action 4 activation (2026-09-12):** The user approved the prepared next action. Action 4 is now
active and is the only action authorized for implementation in this work cycle. Actions 5–9 remain
pending.

**Acceptance criteria:**

- Application-owned validation literals are mapped to reviewed English and Brazilian Portuguese
  resources at the request/presentation boundary, while unknown Zod/provider/internal text keeps its
  safe existing fallback behavior.
- Recovery responses and contextual mutation failures localize HTML, JSON, and plain-text copy
  without exposing raw database, provider, stack-trace, or internal error details.
- Major Programs, Library, workout-session, and locale-switch validation/error/confirmation paths
  use stable translation keys and preserve status codes, redirects, submitted values, identities,
  and authorization behavior.
- Auth/account/provider copy remains assigned to Action 5; no success path or security-sensitive
  behavior is changed here unless it is already covered by the shared application boundary.

**Action 4 implementation (2026-09-12):** Added the shared application-owned message translator
with safe default interpolation. Expanded the validation presentation map and both locale resources
for route/query envelopes, program/cycle/day/session/exercise/workout identifiers, form constraints,
date ranges, reps, loads, and relationship errors. Localized application recovery states across HTML,
JSON, and plain responses; added locale-aware contextual mutation fallbacks; and migrated major
Programs, Library, session-template, exercise-variant, workout lifecycle, Library-context, and
locale-switch feedback paths. Replaced raw known not-found exception messages in rendered form errors
with safe localized copy. Localized workout deletion confirmation labels while preserving authored
session names and all mutation contracts.

**Action 4 verification (2026-09-12):** Focused validation, recovery, contextual mutation, and
deletion tests passed (21 tests), including Portuguese translation-boundary coverage. Application
types, browser types, lint, formatting, and `git diff --check` passed. The complete elevated
`npm run verify` passed all static checks and all 293 repository tests. The initial sandboxed verify
could not access loopback PostgreSQL/HTTP resources (`EPERM`); the same complete suite passed with
approved elevated local access. The final locale leaf-key audit found matching `en`/`pt-BR`
structures with 663 keys and no missing or extra keys.

**Action 4 review stop (2026-09-12):** Validation, safe error, contextual mutation, recovery, and
confirmation copy are implemented and verified. Action 4 is ready for review. Action 5 remains
pending and has not been activated or implemented.

**Action 4 review approval (2026-09-12):** The user approved the implementation after the recorded
verification evidence passed. Action 4 is complete. Action 5 remains pending and prepared as the
next action; it has not been activated or implemented.

### Action 5 — Auth/account/email localization

**Status:** Completed

**Purpose:** Audit and localize authentication/account states and generated auth email copy where
reliable locale context exists, preserving generic responses, tokens, URLs, sessions, and secrecy.

**Action 5 activation (2026-09-12):** The user approved the prepared next action. Action 5 is now
active and is the only action authorized for implementation in this work cycle. Actions 6–9 remain
pending.

**Verified delta-first baseline (2026-09-12):** Authentication and profile templates already use
the shared translation function for most labels, descriptions, forms, and accessible names. The
remaining application-owned copy is injected by auth/profile controllers: schema errors, generic
credential and registration failures, password-reset status/invalid-token messages, Google failure
states, profile provider-link statuses, and password-add errors. The reset email service hard-codes
English subject/body/lifetime copy and its delivery payload carries no locale; the password-reset
request already has reliable request-local language context. Provider errors and feature-layer
exception messages are not safe presentation contracts and must be mapped to generic reviewed copy.

**Proposed Action 5 delta:** Add reviewed auth/profile/email resources; translate auth validation and
controller-owned status/error messages at presentation boundaries; map known provider/account errors
to safe localized messages; pass the active locale into reset-email delivery; and add focused tests
for validation, profile/auth states, localized email output, token secrecy, and generic failures.

**Acceptance criteria:**

- Auth and password validation, generic credential failures, registration conflicts, reset states, and
  Google/account statuses use reviewed English and Brazilian Portuguese resources at presentation
  boundaries.
- Provider, database, and feature-layer exception details are not exposed as user-facing auth copy;
  generic login/reset behavior and anti-enumeration responses remain intact.
- Password-reset email subject, text, HTML, and lifetime wording use the active locale when request
  context is available and fall back safely to English for context-free callers.
- Reset tokens, reset URLs, session rotation/invalidation, CSRF/rate-limit boundaries, email
  recipient handling, and secret-free delivery diagnostics remain unchanged.
- Existing authentication/profile semantics and responsive/accessibility structure remain intact;
  no unrelated visual redesign is included.

**Action 5 implementation (2026-09-12):** Added shared auth-validation translation mapping and
reviewed auth, profile, and email resources. Localized controller-owned sign-in, registration,
Google, password-reset, and profile-link/password-add statuses while replacing raw known exception
messages with safe application copy and keeping invalid credentials generic. Carried the reliable
request locale through password-reset delivery and localized Resend subject, plain text, HTML, and
one/other lifetime wording; context-free email calls continue to use English. Preserved reset token
and URL generation, session/security behavior, provider boundaries, and recipient/diagnostic secrecy.
The existing profile/auth EJS structure and shared form/accessibility contracts were reused without
CSS or layout changes.

**Action 5 verification (2026-09-12):** Focused auth validation, profile/auth rendering, feature
authentication, and Resend email tests passed 19/19, including Portuguese validation/status/email
copy and secret-free provider rejection coverage. `npm run check:types`,
`npm run check:browser-types`, `npm run lint`, `npm run format:check`, and `git diff --check`
passed. The complete elevated `npm run verify` passed all static checks and all 295 repository
tests. The final locale leaf-key audit found matching `en`/`pt-BR` structures with 700 keys and no
missing or extra keys. No real email was sent; the initial sandbox database/HTTP limitation was
resolved by approved elevated local verification.

**Action 5 review stop (2026-09-12):** Authentication, account, and locale-aware reset-email copy
are implemented and verified. Action 5 is ready for review. Actions 6–9 remain pending and have
not been activated or implemented.

**Action 5 review approval (2026-09-12):** The user approved the implementation after the recorded
verification evidence passed. Action 5 is complete. Action 6 remains pending and prepared as the
next action; it has not been activated or implemented.

### Action 6 — Client-side, accessibility, and analytics copy

**Status:** Completed

**Purpose:** Localize remaining browser-generated application UI, accessible names/descriptions, and
Chart.js/analytics labels and fallback copy through the existing shared boundary.

**Action 6 activation (2026-09-12):** The user approved the prepared next action. Action 6 is now
active and is the only action authorized for implementation in this work cycle. Actions 7–9 remain
pending.

**Action 6 implementation (2026-09-12):** Extended the established presentation boundary across
browser and accessibility-facing output. Chart week labels, numeric tooltip values, heatmap markers,
cycle summaries, and analytics table counts now use the active locale while chart metric arrays and
analytics calculations remain unchanged. Localized remaining application-owned navigation/list
accessible names for training-day navigation, program/cycle collections, calendar day links, the
Library session-template region, contextual session creation, and the heatmap data-table hint.
Nested EJS includes now receive the existing request translator explicitly. User-authored names,
stable IDs, form values, persisted metrics, and stable measurement symbols remain unchanged.

**Action 6 verification (2026-09-12):** Focused browser, analytics, Programs, Day, Library, and
rendering tests passed (20/20), including Brazilian Portuguese chart/heatmap labels and tooltip
number formatting. `npm run check:types`, `npm run check:browser-types`, `npm run lint`,
`npm run format:check`, and `git diff --check` passed. The complete elevated `npm run verify`
passed all 296 repository tests. The initial sandboxed full run was unable to access local PostgreSQL
and loopback HTTP resources (`EPERM`); the same complete verification passed with approved elevated
local access. No browser automation dependency is present, so new viewport screenshots and live
assistive-technology inspection were not available; those responsive/mixed-language checks remain
with Action 7.

**Action 6 review stop (2026-09-12):** Client-side, accessibility, and analytics copy are
implemented and verified within the approved boundary. Action 6 is ready for review. Actions 7–9
remain pending and have not been activated or implemented.

**Action 6 review approval (2026-09-12):** The user approved the implementation after the recorded
verification evidence passed. Action 6 is complete. Action 7 remains pending and prepared as the
next action; it has not been activated or implemented.

### Action 7 — Responsive and mixed-language audit

**Status:** Completed

**Purpose:** Verify representative English and Portuguese guest/authenticated/auth screens and
interaction states at supported widths, correcting only proven translated-copy regressions and mixed
application language.

**Action 7 activation (2026-09-12):** The user approved the prepared next action. Action 7 is now
active and is the only action authorized for implementation in this work cycle. Actions 8–9 remain
pending.

**Action 7 implementation (2026-09-12):** Audited representative authenticated Library, Day,
Dashboard/workout, Programs, and shared interaction surfaces in both locale paths. The audit found
proven mixed-language regressions in Library discovery, session/exercise detail, session assignment,
workout lifecycle/cancellation, Programs navigation, and Library creation forms. Routed those labels,
descriptions, hints, empty states, accessible names, and action controls through the established
server translator, including private/global variant and administrator exercise forms. Added matching
reviewed English and Brazilian Portuguese resources and regression assertions for Portuguese Library,
Day, Dashboard/workout, and selected-session detail output. Stable catalog labels, IDs, submitted form
values, ownership, authorization, and user-authored content remain unchanged.

**Action 7 responsive and mixed-language verification (2026-09-12):** The focused Library and
translation checks passed 14/14 after the final form corrections. The repository-wide literal audit
found no obvious remaining hard-coded application-owned English in the reviewed EJS surfaces; any
remaining English found outside that pattern is intentional fallback/resource text, catalog or
user-authored content, or outside the reviewed application-owned copy boundary. Existing static
responsive contracts for pressure widths, navigation, Library, Programs, Day, workout, history,
progress, media, and accessibility passed as part of the full suite. No live browser executable or
assistive-technology runner is available in this workspace, so viewport screenshots and live
interaction inspection at approximately 390px, an intermediate pressure width, and desktop remain
unavailable; no CSS/layout redesign was introduced because no repository-level responsive defect was
proven.

**Action 7 verification (2026-09-12):** `npm run verify` passed formatting, lint, server type-check,
browser type-check, and all 300 repository tests, including PostgreSQL-backed setup and HTTP tests.
`git diff --check` passed. The initial sandboxed full run was environment-limited by denied loopback
PostgreSQL/HTTP access (`EPERM`); the same complete verification passed with approved elevated local
access. No database reset, production mutation, deployment, push, or commit was performed.

**Action 7 review stop (2026-09-12):** The responsive and mixed-language audit is implemented and
verified within the available static/rendering evidence. Action 7 is ready for review. Action 8
remains pending and has not been activated or implemented.

**Action 7 review approval (2026-09-12):** The user approved the implementation after the recorded
verification evidence passed. Action 7 is complete. Action 8 remains pending and prepared as the
next action; it has not been activated or implemented.

### Action 8 — Completeness and regression verification

**Status:** Completed

**Purpose:** Strengthen translation completeness/missing-key detection and run focused, static,
regression, and environment-available verification across the Phase 4 contract.

**Action 8 activation (2026-09-12):** The user approved the prepared next action. Action 8 is now
active and is the only action authorized for implementation in this work cycle. Action 9 remains
pending.

**Action 8 implementation (2026-09-12):** Strengthened the common-resource contract so English and
Brazilian Portuguese must preserve the same namespace/object shape and every leaf value must be a
non-empty string in both locales. Added a production-source translation-reference audit covering
literal server, EJS, and browser translation calls, including plural-family references, so missing
application keys fail the test suite before reaching production. Added explicit chart and Programs
browser-message resources and corrected verified missing Library, workout-form, and Programs keys.
Preserved i18next English fallback, browser message interpolation, catalog/user-content boundaries,
stable IDs, calculations, and runtime behavior.

**Action 8 verification (2026-09-12):** Focused i18n resource and fallback checks passed 11/11.
`npm run verify` passed formatting, lint, server type-check, browser type-check, and all 303
repository tests, including PostgreSQL-backed setup and HTTP tests. `git diff --check` passed. The
initial sandboxed full run was environment-limited by denied loopback PostgreSQL/HTTP access
(`EPERM`); the same complete verification passed with approved elevated local access. No database
reset, production mutation, deployment, push, or commit was performed.

**Action 8 review stop (2026-09-12):** Translation completeness and regression verification are
implemented and verified. Action 8 is ready for review. Action 9 remains pending and has not been
activated or implemented.

**Action 8 review approval (2026-09-12):** The user approved the implementation after the recorded
verification evidence passed. Action 8 is complete. Action 9 remains pending and prepared as the
next action; it has not been activated or implemented.

### Action 9 — Final tracking synchronization and review preparation

**Status:** Completed

**Purpose:** Record the actual implementation, audit classifications, verification results,
environment limitations, intentional exclusions, and criterion-by-criterion Phase 4 status before
the final review gate.

**Action 9 activation (2026-09-12):** The user approved the prepared next action. Action 9 is now
active and is the only action authorized for implementation in this work cycle.

**Action 9 implementation and completion matrix (2026-09-12):** Reconciled the Phase 4 goal and
action records with the repository, tests, and approved Action 1–8 evidence:

1. **Verified:** `docs/current-goal.md` and `docs/current-actions.md` describe the Phase 4 scope,
   constraints, action statuses, approval history, and current review gate.
2. **Verified:** Dates, times, numbers, percentages, durations, measurements, and workout count
   labels use the shared locale-aware presentation boundary; stored values and calculations remain
   locale-neutral.
3. **Verified:** Application-owned dynamic copy uses reviewed interpolation and plural resources,
   including server-rendered and browser-generated Library counters.
4. **Verified:** Validation, recovery, mutation, confirmation, authentication, and account messages
   use localized application boundaries without exposing internal/provider details.
5. **Verified with documented limitation:** Password-reset email copy uses the request locale when
   reliably supplied; context-free email calls remain English because no user locale is available in
   those call paths. Token, URL, secrecy, anti-enumeration, and delivery behavior are preserved.
6. **Verified:** Accessible names/descriptions, browser-generated UI, chart/analytics labels, and
   document language use the active locale; browser message interpolation remains intact.
7. **Verified:** Stable IDs, relationships, ownership, authorization, persisted data, analytics
   calculations, catalog identity, user-authored content, and authentication behavior are unchanged.
8. **Verified:** Locale detection, session persistence, English fallback, and locale switching are
   covered by middleware and HTTP tests for guest/authenticated request paths.
9. **Partially verified with precise limit:** Static responsive contracts and rendered component
   tests pass for guest/authenticated surfaces at supported pressure widths. No live browser
   executable is available, so viewport screenshots and live interaction inspection at mobile,
   intermediate, and desktop widths were not possible; no known major repository-level responsive
   regression remains from the available evidence.
10. **Verified with classifications:** The mixed-language audit resolved obvious application-owned
    literals in reviewed surfaces. Remaining English is intentional fallback/resource text,
    catalog or user-authored content, external/provider-owned content, or the documented context-free
    email limitation.
11. **Verified:** Required translation keys are checked for matching namespace shape, non-empty
    values in both locales, literal production references, plural families, and safe missing-key
    fallback behavior.
12. **Verified:** Focused checks, server/browser type checks, lint, formatting, full regression
    verification, PostgreSQL-backed setup, HTTP tests, and `git diff --check` passed. The sandboxed
    PostgreSQL/HTTP attempt was environment-limited by `EPERM`; approved elevated local verification
    passed the same suite. No database reset, production mutation, deployment, push, or commit was
    performed.
13. **Verified:** Actions 1–9 are approved and complete, and the user explicitly approved the Phase
    4 goal. Phase 4 is complete with the documented live-browser and context-free email limitations.

**Action 9 verification (2026-09-12):** The final matrix and both tracking files were inspected
against the current repository state. `npm run verify` passed all static checks and 303 repository
tests before this documentation-only synchronization; `git diff --check` passed afterward. No live
browser or assistive-technology runner is available, as recorded above.

**Action 9 review stop (2026-09-12):** Phase 4 tracking, completion-criterion comparison,
intentional-exclusion classification, and verification evidence are synchronized. Action 9 is ready
for review. The Phase 4 goal remains active pending explicit approval of this final action.

**Action 9 review approval (2026-09-12):** The user approved the implementation after the recorded
verification evidence passed. Action 9 is complete, and Phase 4 is ready for final review. The live
browser/assistive-technology limitation and context-free email limitation remain explicitly recorded
in the completion matrix; no other unmet completion criterion was identified.

**Phase 4 final approval (2026-09-12):** The user approved the goal after the completion matrix and
verification evidence were recorded. Phase 4 is complete. The remaining live-browser/
assistive-technology and context-free email limitations are intentional, documented boundaries;
no other unmet completion criterion was identified.

## Historical Phase 3 record

### Action 1 — Goal tracking and domain audit

**Status:** Completed

**Purpose:** Establish the Phase 3 goal tracking required before implementation, inspect the current
schema/seed/query/mapper/view-model/search/media/ownership paths, classify entities by ownership and
translation strategy, and record the schema workflow constraint.

**Acceptance criteria:**

- `docs/current-goal.md` explicitly describes Phase 3 objective, scope, non-goals, completion
  criteria, constraints, and current status.
- This file records the small reviewable Phase 3 action sequence and stays synchronized with the
  implementation status.
- Global catalog, enum/code, user-owned, historical, and application-UI values are classified from
  direct repository evidence rather than table names alone.
- Existing repositories/queries, mappers/view models, Library search/filtering, form ID contracts,
  media resolution, creation/update workflows, and history/snapshot boundaries are documented as
  reuse points or risks.
- The absence of a migration runner and the conflict between the requested no-reset migration path
  and the repository’s authoritative reset setup are explicitly recorded for resolution before
  schema work.
- No domain schema or application behavior is changed by this action.

**Implementation and audit evidence (2026-09-11):** Updated both tracking files before any Phase 3
schema/application implementation. Inspected `db/schema.js`, `db/seed.js`, the exercise catalog
manifest/seed SQL, catalog repositories and mappers, Library data/view-model/search paths, exercise
and variant creation/update ownership workflows, session joins, workout/history snapshot queries,
and the centralized media resolver. Classified global catalog rows, fixed internal codes, mixed
global/user content, and user/historical content in `current-goal.md`. Confirmed that raw names are
currently selected in SQL, localized display lookup does not yet exist, Library filtering uses
presentation-derived search text, form values are stable IDs, and media keys are name-derived.

**Verification evidence (2026-09-11):** Documentation and repository audit completed. The changed
tracking files were inspected against the Phase 3 request and current repository state. No runtime
code, schema, seed data, database, route, or user content was changed. Code checks are deferred
until an implementation action changes executable files.

**Review approval (2026-09-11):** The user approved Action 1 after its audit and documentation
verification evidence were recorded. Action 1 is complete. Action 2 remains pending and has not
been activated or implemented.

### Action 2 — Define and implement the localization data model

**Status:** Completed

**Purpose:** Resolve the schema workflow constraint, then implement the smallest explicit normalized
translation model for the agreed global catalog entities, including constraints, indexes, fallback
contract, compatibility, rollback, and fresh-seed behavior.

**Acceptance criteria:**

- The chosen model is explicit and avoids one translation table per entity unless repository evidence
  supports it; no polymorphic abstraction is added speculatively.
- Existing IDs, foreign keys, ownership, exercise/media relationships, workout references, and
  history remain valid; no language-duplicate entities are created.
- English backfill and fresh seed behavior are deterministic; missing Portuguese rows remain safe.
- The approved schema-evolution path, deployment order, and rollback expectations are documented.
- Focused schema/seed/repository tests pass without resetting a user or production database.

### Action 3 — Backfill English catalog content and align fresh seed

**Status:** Completed

**Purpose:** Populate the canonical English translation contract from existing global catalog values
without destructive cleanup, and make fresh development/test setup reproducible.

**Acceptance criteria:**

- Existing IDs and English behavior remain intact through the backfill.
- Global rows receive deterministic English translations; user-owned rows are excluded.
- Seed and compatibility tests prove the same contract for fresh and existing data paths.

**Delta verification (2026-09-11):** This action is already satisfied by the completed Action 2
implementation. `catalogTranslationSeedSql` is used by the canonical `seedSql` and deterministically
inserts English rows for all current application-managed exercises, muscles, equipment, and movement
patterns, plus global variants selected by `owner_user_id IS NULL`. The same shared schema and seed
SQL are used by `db/schema.js`, `db:setup:sql`, and migration `001_catalog_translations`; legacy
canonical columns remain intact. No additional backfill or parallel implementation was added.

**Verification evidence (2026-09-11):** Focused schema/migration/seed/lifecycle tests passed 10/10;
server type-check and full formatting passed; `git diff --check` passed. Database row-count
assertions remain present but could not be executed without a configured test database, and no
database reset or migration was run.

**Review stop (2026-09-11):** Action 3 is ready for review. Action 4 remains pending and has not
been activated or implemented.

**Review approval (2026-09-11):** The user approved Action 3 after its reuse verification evidence
was recorded. Action 3 is complete. Action 4 remains pending and has not been activated or
implemented.

### Action 4 — Add reviewed Brazilian Portuguese catalog translations

**Status:** Completed

**Purpose:** Add consistent Brazilian Portuguese labels for the in-scope global catalog. Long-form
global descriptions/setup text remain fallback content unless separately approved and reviewed.

**Acceptance criteria:**

- Terminology is reviewed for natural, consistent Brazilian fitness usage.
- No machine translation or user-content translation is introduced.
- Completeness tests distinguish required global rows from user-owned/custom rows.

**Action 4 activation (2026-09-11):** The user approved the prepared next action. Action 4 is now
active and is the only action being implemented in this work cycle. Actions 5–9 remain pending.

**Action 4 implementation (2026-09-11):** Added an authored Brazilian Portuguese terminology map
for every current application-managed exercise, global exercise variant, muscle, equipment, and
movement-pattern label. The map validates exact coverage against the canonical catalog manifest and
vocabulary, rejects missing/extra/blank entries, and generates deterministic `pt-BR` seed SQL by
joining stable English source names to existing IDs. Global variants are explicitly restricted by
`owner_user_id IS NULL`; user-owned/custom variants are not translated. SQL literals escape
apostrophes safely. This action populates names only: global variant setup descriptions and
movement-pattern notes remain English fallback, and no machine translation or user-content
translation was added.

The canonical fresh-database seed now includes the reviewed Portuguese rows. Existing databases
receive them through additive migration `002_catalog_translations_pt_br` after the completed
schema/English migration `001_catalog_translations`; migration 001 remains English-only so the
historical action boundary does not drift. Both paths use the same generated Portuguese SQL, with
idempotent upserts and no entity duplication or relationship changes.

**Action 4 verification (2026-09-11):** Focused catalog/seed/migration tests passed 11/11. The
completeness test verifies 78 exercises, 129 global variants, 24 muscles, 28 equipment rows, and 8
movement patterns, including representative accented terminology and apostrophe escaping. Server
and browser type checks, lint, formatting, and `git diff --check` passed. The full suite reached 271
tests: 266 passed, 2 failed because the sandbox denied loopback `listen` with `EPERM` (including the
associated cleanup failure), and 3 database setup tests were cancelled because PostgreSQL connection
attempts were denied with `EPERM`. No reset, migration execution, production provisioning, or
database mutation was performed.

**Action 4 review stop (2026-09-11):** The authored Portuguese catalog labels, completeness boundary,
fresh-seed path, and existing-database migration are implemented and verified within the available
environment. Action 4 is ready for review. Action 5 remains pending and has not been activated or
implemented.

**Action 4 review approval (2026-09-11):** The user approved the implementation after its
verification evidence was recorded. Action 4 is complete. Action 5 remains pending and is prepared
as the next action; it has not been activated or implemented.

### Action 5 — Centralize locale-aware catalog access

**Status:** Completed

**Purpose:** Update shared repository/query/mapper boundaries to resolve active-locale labels,
English fallback, and safe canonical fallback without controller- or template-specific joins.

**Acceptance criteria:**

- Catalog reads use one reusable contract with bounded query count and appropriate indexes.
- View models receive presentation-ready localized labels while raw IDs/codes remain available for
  forms and machine contracts.
- Missing Portuguese translations do not fail pages and remain detectable.

**Action 5 activation (2026-09-11):** The user approved the prepared next action. Action 5 became
active and was the only action implemented in this work cycle. Actions 6–9 remain pending.

**Action 5 implementation (2026-09-11):** Added the shared catalog localization contract in
`src/features/catalogLocalization/catalogLocalization.js`. It normalizes request locale values to
`en`/`pt-BR` and provides one indexed lateral-join pattern resolving active locale, then English,
then the canonical database value. Each lookup also exposes its resolved locale as `pt-BR`, `en`, or
`canonical`, so missing translations remain detectable without breaking a page.

Applied the contract to exercise-template, equipment, muscle, movement-pattern, session, and
workout-session reads. Locale is passed from the existing i18n request locals through Library, Day,
and Dashboard data loaders; mappers preserve stable IDs and expose resolved-locale metadata. Session
and program names, user-owned variant names, setup/notes text, historical snapshots, authorization,
analytics identities, and media name keys remain unchanged.

**Action 5 verification (2026-09-11):** Focused localization/repository, catalog translation, seed,
and migration tests passed 16/16. `npm run verify` completed formatting, lint, server type-check,
browser type-check, and the full suite: 276 tests total, 271 passed, 2 failed because the sandbox
denied loopback `listen` with `EPERM` (including its cleanup failure), and 3 database setup tests
were cancelled because PostgreSQL connections were denied with `EPERM`. `git diff --check` passed.
No database reset, migration execution, production provisioning, or database mutation was performed.

**Action 5 review stop (2026-09-11):** The centralized locale-aware repository/query/mapper
contract and locale plumbing are implemented and verified within the available environment. Action 5
is ready for review. Action 6 remains pending and has not been activated or implemented.

**Action 5 review approval (2026-09-11):** The user approved the implementation after its
verification evidence was recorded. Action 5 is complete. Action 6 remains pending and is prepared
as the next action; it has not been activated or implemented.

### Action 6 — Integrate major application surfaces

**Status:** Completed

**Purpose:** Render localized catalog labels on Library, forms, Dashboard/current workout, Program
Day, History/Progress, accessibility labels, and media-adjacent presentation where applicable.

**Acceptance criteria:**

- The active locale changes only catalog presentation; UI translation continues through Phase 1/2
  i18n resources.
- Existing ownership, CRUD, workout, media, layout, accessibility, and nullable-data behavior stays
  intact.
- No EJS template performs translation-table lookup or locale-specific business logic.

**Action 6 activation (2026-09-11):** The user approved the prepared next action. Action 6 became
active and was the only action implemented in this work cycle. Actions 7–9 remain pending.

**Action 6 implementation (2026-09-11):** Integrated the localized catalog values already supplied
by Action 5 into the major presentation boundaries. Library exercise/session view models and forms
now consume localized exercise, variant, movement-pattern, equipment, and muscle labels without
changing submitted IDs or ownership actions. Dashboard/current-workout and Program Day steps expose
localized catalog labels, prescriptions, and accessible initial-media labels. Canonical exercise,
variant, and movement-pattern names now travel as non-presentational media identity fields so
localized labels cannot break the existing manifest matches or fallback order.

History and Progress were verified against their snapshot-backed repositories and view models. Their
exercise/session labels remain historical snapshot content rather than being relinked to current
catalog translations, preserving the approved user/history boundary and reversible progress keys.
No EJS template was given translation-table access or locale-specific business logic.

**Action 6 verification (2026-09-11):** Focused localization, media, Library, form, Dashboard, and
Program Day coverage passed, including translated-label presentation with canonical media matching.
`npm run verify` completed formatting, lint, server type-check, browser type-check, and the full
suite: 282 tests total, 277 passed, 2 failed because the sandbox denied loopback `listen` with
`EPERM`, and 3 database setup tests were cancelled because PostgreSQL connections were denied with
`EPERM`. `git diff --check` passed. Existing EJS render tests passed. No live browser executable is
available in this workspace, so rendered inspection at approximately 390px, an intermediate
pressure width, and desktop remains unavailable; no layout/CSS redesign was introduced.

**Action 6 review stop (2026-09-11):** Major catalog-backed surfaces are integrated within the
approved presentation and ownership boundaries. Action 6 is ready for review. Action 7 remains
pending and has not been activated or implemented.

**Action 6 review approval (2026-09-11):** The user approved the implementation after its
verification evidence was recorded. Action 6 is complete. Action 7 remains pending and has not
been activated or implemented.

### Action 7 — Search, forms, relationships, and sorting

**Status:** Completed

**Purpose:** Extend the existing Library discovery behavior and catalog forms so localized labels
are searchable/sortable while stable IDs and relational submissions remain unchanged.

**Acceptance criteria:**

- Active-locale names search successfully; English fallback names remain discoverable where practical.
- Filters and sorting use localized display values without changing underlying values or IDs.
- Form options display localized labels and submit stable numeric identifiers.
- Exercise → variant → equipment/muscle/movement relationships remain unchanged.

**Action 7 activation (2026-09-11):** The user approved the prepared next action. Action 7 is now
active and is the only action being implemented in this work cycle. Actions 8–9 remain pending.

**Action 7 implementation (2026-09-11):** Extended the existing Library discovery metadata so
active-locale catalog labels remain searchable and filter values remain localized, while canonical
English catalog names are included as search-only terms where the repository already exposes stable
identity fields. This covers exercise bases, variants, movement patterns, equipment, muscles, and
session-step metadata. Existing localized-label sorting for exercise bases, variants, and filter
options remains in the view-model boundary; no session ordering or user-authored content was
rewritten.

Confirmed the existing Library forms continue to present localized catalog labels while submitting
stable numeric exercise, variant, movement-pattern, equipment, muscle, and role IDs. The existing
browser search/filter component was reused unchanged, so independent filters, clear behavior,
variant visibility, keyboard/focus behavior, and empty states retain their established contracts.
No relationship, ownership, authorization, route, or database write behavior changed.

**Action 7 verification (2026-09-11):** Focused search, filter, form, catalog-query, and view-model
tests passed 24/24. `npm run verify` completed formatting, lint, server type-check, browser
type-check, and the full suite: 284 tests total, 279 passed, 2 failed because the sandbox denied
loopback `listen` with `EPERM`, and 3 database setup tests were cancelled because PostgreSQL
connections were denied with `EPERM`. `git diff --check` passed. Existing EJS render and browser
interaction tests passed. No live browser executable is available in this workspace, so manual
inspection at approximately 390px, an intermediate pressure width, and desktop remains unavailable;
the action introduced no CSS or layout changes.

**Action 7 review stop (2026-09-11):** Localized search/filter/form behavior is integrated within
the existing presentation and relationship boundaries. Action 7 is ready for review. Action 8
remains pending and has not been activated or implemented.

**Action 7 review approval (2026-09-11):** The user approved the implementation after its
verification evidence was recorded. Action 7 is complete. Action 8 remains pending and has not
been activated or implemented.

### Action 8 — Completeness, regression, and performance audit

**Status:** Completed

**Purpose:** Detect missing global translations, mixed-locale output, accidental user-content
translation, locale-dependent business logic, query-count regressions, and media/history breakage.

**Acceptance criteria:**

- Representative English/Portuguese resolution, fallback, ID/relationship, seeded-content,
  user-content, search, form, media, and history tests pass.
- Catalog-heavy query behavior has no obvious N+1 regression and any material change is documented.
- Relevant format, lint, server/browser type, HTTP/render, database, full-suite, and diff checks pass
  or are precisely recorded as environment-limited.

**Action 8 activation (2026-09-11):** The user approved the prepared next action. Action 8 is now
active and is the only action being implemented in this work cycle. Action 9 remains pending.

**Action 8 implementation (2026-09-11):** Audited the translation boundary, representative
localized view-model/form/media paths, and history/progress snapshot paths. The existing catalog
repositories issue one database read per catalog aggregate and use the shared active-locale →
English → canonical fallback contract. Added a read-side ownership guard to every exercise-variant
translation join so a stray translation row cannot localize a private/custom variant; authored
translation seed coverage remains global-only. Added query-shape assertions for five bounded
`LEFT JOIN LATERAL ... LIMIT 1` lookups per catalog-heavy aggregate, one repository call per read,
and no translation joins in immutable history snapshot reads.

**Action 8 verification (2026-09-11):** Focused localization, seed/completeness, search/form,
media, Dashboard, Program Day, History, Progress, render, and browser-interaction checks passed
63/63. `npm run verify` passed formatting, lint, server type-check, and browser type-check; its full
suite reached 284 tests with 279 passed, 2 failed because the sandbox denied loopback `listen` with
`EPERM`, and 3 database setup tests cancelled because PostgreSQL connections were denied with
`EPERM`. The dedicated `npm run test:http` suite reached the same sandbox PostgreSQL/loopback
limitation and cancelled all 63 HTTP tests before execution. `git diff --check` passed. No database
reset, migration, production mutation, deployment, push, or commit was performed; no live browser
executable is available for manual viewport verification.

**Action 8 review stop (2026-09-11):** The completeness, ownership-boundary, query-count,
fallback, search/form, media, history/progress, and regression audit is complete within the
available environment. Action 8 is ready for review. Action 9 remains pending and has not been
activated or implemented.

**Action 8 review approval (2026-09-11):** The user approved the recorded implementation and
verification evidence. Action 8 is complete. Action 9 remains pending and has not been activated
or implemented.

### Action 9 — Final tracking synchronization and review preparation

**Status:** Completed

**Purpose:** Compare every completion criterion with evidence, record deferred candidates and
environment limitations, synchronize both tracking files, and stop at the final review gate.

**Acceptance criteria:**

- Both tracking files match the actual implementation and every action status.
- Entity strategies, schema/backfill/fallback behavior, user-content boundary, search/forms,
  terminology, tests, and deferred work are included in the final record.
- Phase 3 is not reported complete before explicit user approval.

**Action 9 activation (2026-09-11):** The user approved the prepared next action. Action 9 is now
active and is the only action being implemented in this work cycle.

**Action 9 completion matrix (2026-09-11):** Compared the Phase 3 completion criteria with the
repository, tests, and recorded Action 1–8 evidence:

1. **Verified:** This file and `docs/current-goal.md` describe the same Phase 3 outcome, action
   statuses, approval history, resume point, and environment limitations.
2. **Verified:** Entity strategies and terminology decisions are documented for database-backed
   catalog entities, resource-backed codes, mixed session content, and user-owned/history content.
3. **Verified:** Active-locale catalog reads select `pt-BR`, then English, then canonical values;
   unsupported locales normalize to English. Seed/completeness tests cover the managed catalog.
4. **Verified:** Stable IDs, foreign keys, ownership predicates, canonical media matching fields,
   snapshot labels, and progress identities remain separate from localized display values.
5. **Verified:** No language-duplicate entities are introduced; Portuguese seed data is global-only,
   private variants are excluded at seed and read time, and snapshot/user-authored content remains
   unchanged.
6. **Verified by setup/migration SQL and tests; database execution environment-limited:** Fresh
   setup and the opt-in migration use the shared translation schema/seed contract. PostgreSQL row
   count and live migration assertions could not run because the environment denied connections.
7. **Verified:** Locale access is centralized in the catalog helper and repository/query boundaries;
   Library, forms, Dashboard/current workout, Program Day, History/Progress, media labels, and
   accessibility-facing outputs use the established presentation boundaries.
8. **Verified:** Active-locale and English search coverage, localized sorting/filter display, and
   stable numeric form values are covered by focused tests.
9. **Verified:** Translation completeness validation covers 78 exercises, 129 global variants,
   24 muscles, 28 equipment rows, and 8 movement patterns for both authored catalog maps and seed
   expectations.
10. **Verified:** Brazilian Portuguese terminology is authored in the catalog translation map and
    completeness tests cover representative accented terms and SQL apostrophe escaping.
11. **Partially verified with precise limits:** Focused checks passed 63/63; formatting, lint,
    server/browser type checks, and diff checks passed. The full suite reached 284 tests with 279
    passed, 2 sandbox `listen` failures, and 3 PostgreSQL setup cancellations. The dedicated HTTP
    suite cancelled all 63 tests at the same sandbox PostgreSQL/loopback boundary. No live browser
    executable is available for viewport inspection.
12. **Verified:** All prior actions and Action 9 are tracked without claiming Phase 3 complete;
    final goal completion remains gated on explicit user approval.

**Action 9 deferred and excluded work (2026-09-11):** Global session-template names and long-form
setup/notes remain deferred by the approved classification and terminology scope. User-owned
exercise/variant names, sessions, programs, planning fields, notes, workout logs, and historical
snapshots are intentionally not translated. Live PostgreSQL integration/migration execution,
HTTP execution, and manual browser viewport inspection require an environment with the relevant
services and capabilities; they were not bypassed through database reset or production mutation.

**Action 9 verification (2026-09-11):** Inspected both tracking files and the final repository diff
after synchronizing the matrix. `git diff --check` passed; documentation formatting was checked by
the repository formatter. No executable code, schema, seed, database, route, or user content was
changed in Action 9.

**Action 9 review stop (2026-09-11):** The final tracking synchronization, criterion comparison,
deferred-work record, and environment limitation record are complete. Action 9 is ready for review.
The Phase 3 goal remains active and is not reported complete. No subsequent action is activated.

**Action 9 review approval (2026-09-11):** The user approved the final tracking synchronization
and recorded verification evidence. Action 9 is complete. Phase 3 is ready for final review and has
not been marked complete.

## Progress log

**Action 1 audit and tracking (2026-09-11):** Phase 3 tracking was established before any domain
localization implementation. Direct repository evidence shows global seeded catalog rows for
exercises, global exercise variants, muscles, equipment, and movement patterns; fixed code-like
values for step types, muscle roles, and known environments; and mixed or user-owned records for
custom exercises/variants and session/planning/history content. Raw catalog names currently flow
through SQL, mappers, Library view models, forms, workout/session joins, and history/media paths.
The selected delta is therefore a centralized translation contract plus presentation integration;
no duplicate entities or mechanical name replacement is authorized.

**Action 1 review stop (2026-09-11):** The audit and required tracking updates were complete and
the action was presented for review. The user approved the action; it is now completed. Action 2
was prepared as the next action.

**Action 2 activation (2026-09-11):** The user approved the prepared next action. Action 2 is now
active and is the only action being implemented in this work cycle. Actions 3–9 remain pending.

**Audit correction (2026-09-11):** Direct route and repository inspection showed that
`created_by_user_id` on exercises is not a user-ownership boundary: exercise creation is admin-only
and active exercises are broadly visible. The model/backfill will treat current exercises as
application-managed; private-content exclusion applies to variants with a non-null
`owner_user_id` and to owned sessions/planning/history content.

**Action 2 implementation (2026-09-11):** Added explicit normalized translation tables for
application-managed exercises, global exercise variants, muscles, equipment, and movement
patterns. Each table uses a stable entity foreign key, supported `en`/`pt-BR` locale constraint,
non-empty trimmed display name, and `(entity_id, locale)` primary key; variant setup text and
movement-pattern notes are retained as optional translated fields. Existing canonical `name`
columns remain intact for compatibility and safe fallback. Fresh schema setup includes the tables,
and seed SQL deterministically backfills English rows while excluding private variants.

Added `db/migrations/001_catalog_translations.js` and the opt-in `npm run db:migrate` runner for
existing databases. The migration is transactional, records applied versions, preserves existing
IDs/relationships, requires a separate production opt-in, and refuses ambiguous non-production
targets.
Existing databases must apply it before code begins reading translation tables; fresh development
setup continues through `db:reset`. The migration is additive, leaves legacy canonical columns for
fallback/rollback safety, rolls back a failed transaction, and intentionally has no destructive down
migration. No reset, migration execution, or database mutation was performed in this workspace.

**Action 2 verification (2026-09-11):** Focused schema/migration/seed/lifecycle tests passed 10/10.
Server type-check, browser type-check, lint, full formatting, and `git diff --check` passed. The
full repository run reached 268 subtests: 265 passed; two application tests failed because the
sandbox denied loopback `listen` with `EPERM` (with the associated cleanup failure), and three
database setup tests were cancelled because PostgreSQL connection attempts were denied with
`EPERM`. Database integration assertions for seeded translation counts are present but could not be
exercised without a configured test database; no database mutation was attempted. Portuguese
translation population, locale-aware repositories, and application-surface integration remain
deferred to Actions 3–6.

**Changes applied (2026-09-11):** Made `db/catalogTranslationsSql.js` the single source for
translation-table DDL consumed by both `db/schema.js` and the versioned migration. Added the
read-only `npm run db:setup:sql` command, which emits the latest schema followed by canonical seed
SQL for intentional clean-database provisioning; `npm run db:seed:sql` remains the canonical seed
output. Kept `db:reset` as the complete development/test schema-plus-seed transaction, so a fresh
reset does not require `db:migrate` afterward. Production migrations now require both
`ALLOW_DATABASE_MIGRATION=true` and the separate `ALLOW_PRODUCTION_DATABASE_MIGRATION=true`, plus
a valid PostgreSQL URL; reset remains production-blocked.

**Correction verification (2026-09-11):** The lifecycle/setup tests passed 10/10, including exact
schema-plus-seed output, shared DDL-source assertions, production migration confirmation, and reset
safety checks. No reset, migration, production provisioning, or database mutation was performed.

**Action 2 review stop (2026-09-11):** The localization data model, fresh-seed contract, and
non-destructive migration path are implemented and verified within the available environment.
Action 2 is ready for review. Action 3 remains pending and has not been activated or implemented.

**Changes requested (2026-09-11):** Before approving Action 2, verify the reset-versus-migration
lifecycle, canonical `db:seed:sql` behavior, production provisioning path, and whether duplicated
translation DDL can drift between `db/schema.js` and the migration module. Make only the smallest
corrections required to prove that fresh/reset and existing-database workflows converge without
weakening reset or production safeguards.

**Review stop after requested changes (2026-09-11):** The requested lifecycle verification and
corrections are complete. Action 2 is ready for review again. Action 3 remains pending and has not
been activated or implemented.

**Review approval (2026-09-11):** The user approved Action 2 after the lifecycle corrections and
verification evidence were recorded. Action 2 is complete. Action 3 remains pending and has not
been activated or implemented.

## Resume here

Action 1 is **Completed**. Action 2 is **Completed**. Action 3 is **Completed**. Action 4 is
**Completed**. Action 5 is **Completed**. Action 6 is **Completed**. Action 7 is **Pending** and
prepared as the next action; Actions 8–9 remain **Pending** and have not been
activated. Phase 3 historical action records remain preserved under `Historical Phase 3 record`.
