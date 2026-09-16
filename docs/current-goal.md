# Goal: Persistent Canonical Media Registry and Reset Recovery

## Goal status

**Completed — 2026-09-16.** The approved outcome was to make a successful Admin **Make Canonical** promotion
durable outside the resettable PostgreSQL database using the existing private Cloudflare R2
infrastructure, and to reconstruct that state safely after `db:reset` or fresh initialization.

## Objective

Implement first-level durability for canonical media:

```text
repository canonical manifest → baseline state
R2 canonical registry        → persistent Admin overrides
PostgreSQL                   → runtime materialized state
```

The repository manifest remains the baseline. The registry is one versioned object per supported
canonical entity and uses stable catalog keys, never reset-sensitive database IDs. A successful
promotion must not be reported if the durable registry cannot be persisted. Reset must validate
registry state before destructive database work, then seed the baseline and reapply validated R2
overrides idempotently.

## Verified baseline and delta

The completed [canonical media audit](canonical-media-audit.md) verified that:

- `promoteMediaToCanonical` currently changes the runtime `entity_media` assignment but never the
  repository manifest;
- `media_assets` and `entity_media` are the current canonical persistence model;
- the existing R2 adapter owns public media object access and uses `assets/...` keys;
- `db:reset` recreates schema and manifest-backed seed state only;
- runtime rendering resolves through PostgreSQL assignments, with precedence
  `variant → base exercise → movement pattern`.

This goal adds only the missing durability, reset recovery, conflict/failure handling, audit and
verification paths. It does not redesign the media schema, resolver, Admin action, or manifest.

## Scope constraints

- Use private, server-side R2 access for registry metadata; never require a public registry URL.
- Support only the entity types already supported by the canonical media architecture.
- Keep secrets in environment variables and out of logs, browser errors, committed files, and
  generated audit output.
- Do not reset or mutate production, upload/delete production test objects, or delete R2 orphans.
- Do not add developer promotion from the registry back to `data/canonical-media.json`.
- Do not add automatic registry cleanup or automatic orphan deletion.
- Do not add a migration for this development reset workflow.

## Completion criteria

- [x] Registry configuration, versioned validation, private R2 access, one object per entity, and
      development-only smoke testing exist.
- [x] Make Canonical persists the registry and has explicit DB/R2 compensation or reconciliation
      behavior for partial failures and conflicting writes.
- [x] Reset preflight validates registry JSON, supported identity, catalog keys, and media objects
      before any destructive database operation; invalid state aborts safely.
- [x] Baseline seed remains authoritative default state; valid registry entries override it and
      reconstruct `media_assets` and `entity_media` without old numeric IDs, idempotently.
- [x] Existing runtime resolver precedence and starter-workout behavior remain unchanged after
      restoration.
- [x] `npm run media:registry:audit` is read-only and reports registry, R2, catalog, and DB
      inconsistencies; no cleanup is automatic.
- [x] Focused automated tests and repository verification are run with environment limitations
      recorded; development/production infrastructure access is reported separately.
- [x] Documentation answers promotion, registry, reset, runtime, audit/recovery, and verification
      behavior, and current goal/action records are updated.

## Final review evidence

- `npm run verify` passed formatting, lint, server/browser type checking, and all 526 repository
  tests, including PostgreSQL and HTTP integration suites.
- Focused registry, promotion, reset recovery, audit, smoke, and resolver tests passed.
- No real R2 smoke-test mutation, development reset, production reset, or production resource
  mutation was performed. Live development R2 verification remains an operational follow-up when
  explicitly configured development resources are available; the guarded command and fake-client
  coverage are present.
- Manifest promotion, automatic registry cleanup, R2 orphan deletion, architecture redesign, and
  destructive production verification remain intentionally deferred.

The goal satisfies the listed completion criteria based on repository and automated-test evidence.
The user approved the final goal on 2026-09-16.

## Deferred work

Registry-to-Git manifest promotion, automatic registry cleanup, automatic R2 orphan deletion,
media architecture redesign, and destructive production verification remain explicitly deferred.
