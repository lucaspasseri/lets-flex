# Current Goal

## Parent milestone

Let’s Flex should help users recognize and navigate training content quickly while preserving
stable training relationships, ownership boundaries, and the focused strength-training workflow.

## Current goal

### Phase 3 — Localize database-backed catalog and domain content

Extend the existing English (`en`) / Brazilian Portuguese (`pt-BR`) i18n system so
application-managed catalog/domain content resolves in the active locale without duplicating
entities, changing stable IDs, translating user-generated content, or moving locale-specific
rules into business logic.

## Status

Completed on 2026-09-11. Actions 1–9 are completed; Phase 3 localization is approved with the
recorded environment-limited verification and intentional exclusions.

## Objective

Establish a predictable, normalized domain-localization architecture for the centrally managed
catalog values currently presented by Library, workout/session, Dashboard, Program Day, History,
Progress, media, and related forms. The active locale should select the localized display label,
then fall back deterministically to English and finally to a safe existing canonical value where
necessary. Canonical entity identity, foreign keys, ownership/history behavior, and machine-facing
values must remain stable.

## Verified delta-first baseline

### Already satisfied and reusable

- Phase 1/2 i18n provides `en` and `pt-BR`, locale detection/persistence, English fallback,
  request/EJS translation access, aligned resources, and the locale switch route.
- The modular-monolith separation between repositories/queries, mappers/view models, controllers,
  EJS, and browser scripts is established and must be reused.
- Current IDs and relationships already connect exercises to variants, movement patterns, equipment,
  muscles, roles, sessions, steps, workout logs, history, and media resolution.
- The current Library browser filtering contract already uses presentation-derived search text and
  stable form IDs/values; it is a reuse point for active-locale plus English search coverage.
- The current media resolver is centralized, but its catalog matching keys are derived from names;
  stable identity should be evaluated before localized labels are introduced.

### Verified audit classification

| Current entity/value                                         | Repository evidence                                                                                                                                                             | Phase 3 strategy                                                                                                          | Boundary                                                 |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `exercises`                                                  | Seeded catalog rows; the only create route is admin-only and `created_by_user_id` records creator provenance rather than user ownership; variants reference stable exercise IDs | **B — database translations**                                                                                             | Current application-managed catalog                      |
| Potential user-created exercise rows                         | No current user-facing create workflow was found; do not infer a private boundary from the nullable creator column                                                              | **Unknown / defer**                                                                                                       | Reassess only if a user-owned exercise workflow is added |
| Global `exercise_variants` with `owner_user_id IS NULL`      | Seeded centrally managed variants and admin global-variant workflow                                                                                                             | **B — database translations**, including clearly application-owned setup text if retained in scope                        | Global application catalog                               |
| Private `exercise_variants` with `owner_user_id IS NOT NULL` | Private create/update/archive repository paths and ownership predicates                                                                                                         | **C — do not translate automatically**                                                                                    | User-owned/custom content                                |
| `muscles`                                                    | Seeded catalog table with stable IDs, common/scientific names, regions, and exercise relationships                                                                              | **B — database translations** for display names; scientific/region fields require an explicit field decision              | Global catalog                                           |
| `equipments`                                                 | Seeded catalog table referenced by variants and Library forms                                                                                                                   | **B — database translations** for display names; category is an internal code/presentation value                          | Global catalog                                           |
| `movement_patterns`                                          | Seeded lookup rows with stable IDs, names, and notes                                                                                                                            | **B — database translations** for display labels/notes if shown                                                           | Global lookup/catalog                                    |
| `step_types`                                                 | Seeded fixed internal names such as `warm_up` and `cooldown`; used as relational IDs                                                                                            | **A — translation resources** for user-facing labels                                                                      | Stable internal codes                                    |
| `muscle_roles`                                               | Seeded fixed role codes such as `prime_mover`; referenced by exercise-muscle rows                                                                                               | **A — translation resources** for labels/descriptions                                                                     | Stable internal codes                                    |
| `environment` on variants                                    | Free-text/code-like field in `exercise_variants`, with seeded vocabulary and user-visible filters                                                                               | **A — translation resources** for known codes; preserve unknown/custom values safely                                      | Catalog metadata, not a separate entity yet              |
| `goals`                                                      | Seeded global lookup referenced by user-owned programs                                                                                                                          | **A — translation resources** only if the current UI exposes fixed seeded codes; audit program flow before implementation | Global lookup candidate                                  |
| `sessions` and session steps                                 | Global templates (`owner_user_id IS NULL`) can be copied; owned sessions and step names/notes are user data                                                                     | **C for owned/user-entered fields**; global template localization is deferred pending a separate field/identity decision  | Mixed content; do not broaden from a `name` column       |
| programs, cycles, training days, workout snapshots, notes    | User-owned planning/history data and immutable snapshot fields                                                                                                                  | **C — do not translate**                                                                                                  | User-generated or historical content                     |

### Verified gaps and dependencies

- `db/schema.js` and `db/seed.js` remain the authoritative fresh-setup path. The repository had no
  migration process, so Action 2 adds a narrowly scoped, opt-in versioned migration runner.
  Existing local/development/test targets require `ALLOW_DATABASE_MIGRATION=true`; production
  additionally requires `ALLOW_PRODUCTION_DATABASE_MIGRATION=true`. No database was reset or
  mutated during this action.
- Repositories and SQL currently select raw catalog names, while mappers capitalize or compose
  display strings. Locale-aware translation lookup must be centralized rather than added per
  controller or EJS template.
- Library search is currently client-side and builds `data-search-key-word` from one presentation
  value. It must include the active localized label and, where practical, the English fallback
  label without replacing stable IDs or filter values.
- Forms already submit numeric exercise, variant, movement-pattern, muscle, role, and equipment
  IDs. Localized labels must remain display-only and must not change submitted values.
- Media manifest matching currently normalizes names such as `Bench Press` to name-derived keys.
  Phase 3 must preserve existing media behavior and decide whether stable IDs/codes can be added
  without turning this into a media redesign.
- Workout logs/history contain snapshot names as well as relational IDs. Locale switching must not
  rewrite snapshots or analytics identity; current-label substitution, if appropriate, belongs at a
  verified presentation boundary and needs focused tests.
- `created_by_user_id` on exercises is creator provenance, not an ownership discriminator in the
  current application: the exercise-management route is admin-only and active exercises are broadly
  visible. The translation backfill must therefore cover existing application-managed exercise rows
  rather than only rows where that column is null.

## Scope

### In scope

- A documented localization strategy for each supported catalog/domain type.
- A normalized, explicit translation model for data-driven global catalog entities where repository
  evidence supports it, with stable entity IDs, uniqueness constraints, fallback behavior, and
  query/index strategy.
- Deterministic English backfill/seed behavior and Brazilian Portuguese translations for the
  agreed global catalog set.
- Centralized locale-aware repositories/queries/mappers and presentation-ready view models.
- Library, forms, Dashboard/current workout, Program Day, History/Progress, media labels, and
  accessibility output where catalog labels are actually rendered.
- Active-locale search/filter behavior, sensible localized sorting, stable form values, relationship
  preservation, translation completeness checks, and regression/performance verification.

### Non-goals

- Translating user-created exercises/variants, sessions, programs, cycles, days, notes, descriptions,
  workout notes, or arbitrary historical/user-generated content.
- Duplicating entities per language, changing IDs/foreign keys, changing routes, or using translated
  text in authorization, business-rule comparisons, analytics grouping, or machine contracts.
- Adding locales beyond `en` and `pt-BR`, machine translation, external translation APIs/CMS/SaaS,
  localized URL routing, or a new search engine.
- Broad media redesign, workout analytics redesign, broad UI redesign, authentication changes, or
  unrelated schema cleanup.
- Automatically localizing every `name` column or global session-template field without a separate
  classification and identity decision.

## Completion criteria

Phase 3 is ready for final review only when:

1. This file and `docs/current-actions.md` accurately describe and track Phase 3.
2. In-scope entities have documented strategies and terminology decisions.
3. Catalog labels resolve in English and Brazilian Portuguese with deterministic English fallback.
4. Stable IDs, foreign keys, ownership, media identity, history, and analytics semantics remain intact.
5. No language-duplicate entities are created and user-owned content remains unchanged.
6. Fresh setup and the approved schema-evolution path provide the same localized catalog contract.
7. Locale-aware access is centralized; major catalog-heavy surfaces render localized labels.
8. Search supports active-locale names and forms submit stable IDs.
9. Translation completeness for application-managed catalog data is testable.
10. Portuguese terminology is reviewed for consistent Brazilian fitness usage.
11. Relevant focused, database, HTTP/render, browser, type, lint, formatting, performance/query,
    and diff checks pass, with unavailable environment capabilities recorded precisely.
12. Final tracking is synchronized and no action is reported complete before its approval gate.

## Constraints and confirmed decisions

- Reuse the existing i18next/session/EJS architecture and presentation-boundary translation model.
- English remains the fallback locale; active locale lookup precedes English lookup.
- Use stable IDs/codes/slugs for identity and machine contracts; localized text is presentation data.
- Preserve current relational ownership and history behavior, including private/global exercise variants.
- Action 4’s Portuguese catalog population is limited to authored global display names. Global
  variant `setup_description` and movement-pattern `notes` retain English fallback until a later
  action explicitly approves and reviews long-form terminology; private variants receive no rows.
- Do not machine-translate or require bilingual input for user-owned content.
- Do not reset a database, mutate production data, deploy, push, or commit.
- Any schema evolution must preserve IDs/relationships and have a documented compatibility and
  rollback path. The Phase 3 migration runner requires `ALLOW_DATABASE_MIGRATION=true`; production
  additionally requires `ALLOW_PRODUCTION_DATABASE_MIGRATION=true`, while reset remains prohibited
  in production. Each version runs in its own transaction. Existing databases must run the
  migration before application code relies on translation tables; fresh setup uses the latest
  `db/schema.js` followed by canonical seed SQL. The additive migration leaves legacy canonical
  columns intact for fallback/rollback safety; a failed migration rolls back its transaction and
  no destructive down migration is provided.

## Historical context

- Phase 1 established the English/Brazilian Portuguese i18n foundation.
- Phase 2 expanded that foundation across shared UI and application-owned interface copy and was
  explicitly completed and approved on 2026-09-11.
- The existing worktree contains those Phase 1/2 changes plus the previously completed curated media
  work. They are preserved as the baseline for Phase 3.

## Resume here

Actions 1–9 are **Completed**. Phase 3 is **Completed** on 2026-09-11. The completion matrix,
verification limits, and intentional exclusions are recorded above and in `docs/current-actions.md`.
