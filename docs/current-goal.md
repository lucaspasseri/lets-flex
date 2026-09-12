# Current Goal

## Parent milestone

Let’s Flex should help users recognize and navigate training content quickly while preserving
stable training relationships, ownership boundaries, and the focused strength-training workflow.

## Current goal

### Phase 5 — Add translation maintenance and admin tooling

Build on the completed English (`en`) / Brazilian Portuguese (`pt-BR`) internationalization and
catalog-localization work by giving authorized administrators a small, safe workflow to inspect
catalog translation coverage and add or correct application-managed translations.

## Status

Phase 5 is Completed on 2026-09-12. Actions 1–8 are completed with their verification evidence
recorded. Phase 4 is completed and approved historical work.

**Phase 5 outcome (2026-09-12):** Delivered the approved translation maintenance and admin tooling
workflow while preserving stable identity, relationships, fallback, ownership, user-authored content,
and existing catalog behavior. Final verification recorded five out-of-scope HTTP failures and the
unavailable live-browser/assistive-technology inspection as limitations; no next goal is implied.

## Objective

Make translation completeness visible and actionable for application-managed catalog content while
preserving stable entity identity, relationships, locale fallback, global/private ownership
boundaries, user-generated content, authorization, and current catalog behavior. Routine single-
record translation maintenance should not require manual SQL or seed-file edits.

## Verified current baseline

- Phase 3 provides dedicated translation tables for exercises, global exercise variants, muscles,
  equipment, and movement patterns. Each table uses a stable entity foreign key, supported `en` /
  `pt-BR` locale constraint, non-empty trimmed names, and an `(entity_id, locale)` primary key.
- Catalog reads use active locale → English → canonical-column fallback. Unsupported catalog locales
  normalize to English. The existing translation joins are application-owned SQL boundaries.
- Global versus user-owned content is represented by `exercise_variants.owner_user_id`: null rows
  are application-managed/global and non-null rows are private/user-owned. Existing translation
  seed and read guards exclude private variants.
- The existing admin capability is the `admin` user role enforced server-side by `requireAdmin`.
  `/admin/library/exercises` already exposes global exercise and sample-variant management; the
  ordinary `/library` path remains personal/guest-aware.
- Existing admin catalog forms edit canonical exercise/variant fields and create global catalog
  records. They do not yet provide a translation-maintenance contract or completeness overview.
- The current completeness contract validates the authored catalog manifest and Portuguese seed
  coverage. It does not calculate database-backed per-record status for an admin UI.
- Translation tables have optional localized `setup_description` and movement-pattern `notes`
  columns, but the current Portuguese seed and catalog read paths do not use those localized fields.
  The Phase 5 field contract must therefore be explicit rather than exposing every column.
- UI translation resources remain source-controlled through i18next and are not candidates for
  database editing in this phase.

## Scope

- Define one small completeness contract for supported global catalog entities and derive status
  from actual translation rows, including complete, missing English, missing Portuguese, and any
  necessary incomplete state.
- Provide an admin-facing overview with lightweight counts, search, entity-type/status filters,
  fallback visibility, and a path to edit incomplete records.
- Provide accessible, responsive single-record editing for reviewed localized catalog fields,
  initially names and only explicitly supported descriptions where the existing read/write contract
  makes them meaningful.
- Add or update translations through repositories/services using parameterized queries and stable
  foreign keys, with server-side admin authorization and validation for locale, trimming, required
  values, duplicate pairs, and safe English fallback behavior.
- Integrate existing global catalog creation/editing only where needed to avoid a parallel or
  contradictory workflow. Preserve user-owned/custom creation behavior unchanged.
- Add focused unit, repository, rendering, and HTTP/security regression coverage and synchronize
  the tracking documents before review.

## Non-goals

- Additional locales, machine/AI/third-party translation, runtime translation, or moving UI resource
  files into the database.
- Translation of user-created programs, sessions, notes, descriptions, custom exercises, private
  variants, historical snapshots, or external/provider-owned content.
- A general CMS, bulk CSV import/export, full audit-log system, approval workflow, synonym system,
  broad admin-dashboard redesign, route localization, or unrelated catalog/schema redesign.
- Changing stable IDs, internal values, foreign keys, relationships, canonical business data,
  ownership rules, locale fallback semantics, or existing Library/catalog authorization.

## Completion criteria

Phase 5 is ready for final review only when:

1. Both tracking files explicitly describe the Phase 5 scope and match the repository state.
2. Supported global catalog entity types and editable localized fields are documented and enforced.
3. Authorized admins can inspect per-record translation coverage and find missing `pt-BR` or `en`.
4. Completeness status and counts come from one reusable contract rather than duplicated view logic.
5. Authorized admins can add/update supported translations through validated server-side routes.
6. Guests and ordinary authenticated users cannot access or mutate translation maintenance.
7. Translation writes preserve entity IDs, relationships, canonical/internal values, and ownership
   boundaries; private/user-owned content is not exposed as global translation work.
8. English fallback remains available and English content cannot be accidentally removed as the only
   usable fallback.
9. Existing catalog creation, editing, search, rendering, locale fallback, and Library behavior
   continue working.
10. Maintenance forms are escaped, accessible, responsive, and usable at representative widths.
11. Focused security, fallback, identity, duplicate, unsupported-locale, and regression tests pass,
    along with applicable formatting, lint, type, browser-type, database, HTTP, and full checks.
12. Environment limitations and deferred maintenance improvements are documented precisely.

## Constraints and confirmed decisions

- Reuse the Phase 3 translation tables, catalog localization helpers, existing Library/admin
  patterns, i18next presentation boundary, CSRF protection, and `requireAdmin` authorization.
- Keep translation status derived; do not add persisted status columns unless direct evidence makes
  that unavoidable.
- Keep translation values separate from stable IDs, internal codes/slugs, canonical relationships,
  and user-owned content. Do not create duplicate entities for language variants.
- Use explicit reviewed translations only. No machine translation or external translation provider.
- Prefer update/upsert over deletion; preserve an English fallback and do not expose destructive
  translation deletion without a clear product need and fallback enforcement.
- Do not reset databases, mutate production data, deploy, push, commit, or add a production
  dependency without explicit approval.

## Historical context

- Phases 1–2 established the i18next/session/EJS/browser resource contract, locale selection and
  persistence, shared UI localization, and English fallback.
- Phase 3 added database-backed application-managed catalog translations while preserving stable
  identity and ownership boundaries; it was completed and approved on 2026-09-11.
- Phase 4 completed locale-aware formatting, dynamic copy, validation/errors, auth/account/email,
  accessibility/browser/analytics localization, and stronger resource completeness checks; it was
  completed and approved on 2026-09-12.

## Resume here

Action 1 — Update goal tracking and audit — is **Completed**. Action 2 — Define the translation
maintenance contract — is **Completed**. Action 3 — Add the completeness query/service boundary — is
**Completed**. Action 4 — Add the admin translation overview — is **Completed**. Action 5 — Add
single-record translation editing — is **Completed**. Action 6 — Integrate global catalog
creation/editing — is **Completed**. Action 7 — Security, accessibility, and regression audit — is
**Completed**. Action 8 — Final verification and tracking synchronization — is **Completed**.
Phase 5 is **Completed** on 2026-09-12.
