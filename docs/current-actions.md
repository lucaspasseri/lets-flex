# Current Actions

## Current goal

Persistent Canonical Media Registry and Reset Recovery.

## Goal status

**Completed — 2026-09-16.** Action 5 and the final goal review were approved. No further action
is activated.

## Existing relevant capabilities

- Reuse `src/features/media/storage/r2Storage.js` for S3-compatible R2 client conventions and
  `src/features/media/storage/storage.js` for public media contracts.
- Reuse `media_assets`, localized alt text, `entity_media`, `mediaRepository.js`, and
  `db/mediaSeedSql.js`; no new canonical table or numeric-ID identity is needed.
- Reuse `promoteMediaToCanonical.js` and its existing transaction/local-file compensation shape.
- Reuse `canonicalMediaManifest` and `seedSql` as the baseline before applying overrides.
- Reuse the existing resolver and URL construction; normal rendering must not query the registry.

## Verified gaps or changes

- **Add:** focused registry domain/schema and private R2 implementation, explicit configuration,
  smoke command, and read-only audit command.
- **Modify:** promotion to persist a stable-key registry entry and compensate/reconcile partial
  DB/R2 failures; application composition to inject the boundary without making unrelated startup
  fail when registry features are unused.
- **Add:** reset preflight, catalog/object validation, baseline-plus-override restoration, and
  idempotent repository helpers.
- **Add:** tests for validation, storage behavior, promotion failure/conflict paths, reset safety,
  restoration, audit output, and unchanged resolver precedence.
- **Already satisfied / reuse:** manifest baseline, media schema, catalog key columns, R2 public
  object key convention, Admin Make Canonical surface, and variant/base/pattern resolution.

## Action 1 — Audit storage abstractions and establish registry delta

**Status:** Ready for review

**Purpose:** Verify the existing storage, promotion, media repository, seed, reset, and app
composition contracts before adding code; record the implementation boundary and supported entity
types without duplicating the public media provider.

**Verified evidence:** `r2Storage.js` creates the current R2 S3 client and public media adapter;
`promoteMediaToCanonical.js` reads object-backed assets and commits only PostgreSQL state;
`mediaRepository.js` materializes `media_assets`/`entity_media`; `mediaSeedSql.js` materializes the
manifest baseline; `db/seed.js` performs guarded schema+seed reset in one DB transaction; `app.js`
injects promotion dependencies and currently has no registry dependency.

**Implementation delta to carry forward:** add a separate private-registry client/service using
the shared endpoint/region convention but registry-specific bucket/credentials; use stable
`catalog_key` identity and the existing supported entity types; keep reset preflight outside the
destructive DB transaction and restore overrides after normal seed.

**Completion evidence:** storage/promotion/seed/reset contracts are documented here and in
`docs/current-goal.md`; no unrelated goal is reopened; the existing audit remains historical
evidence; no code was changed. Documentation-only review found no executable changes requiring
format, lint, type, or test checks. Action 2 is prepared but not activated.

## Action 2 — Canonical registry configuration and domain boundary

**Status:** Ready for review

Implemented environment validation, versioned schema validation, private R2 object operations,
safe conditional writes, and focused unit tests. `.env.sample` now documents separate registry
credentials without real secrets.

**Verified:** registry objects use `<prefix>/<entityType>/<catalog-key>.json`; payloads contain
schema version, supported stable identity, R2 media object key, MIME/dimensions/checksum metadata,
canonical compatibility path, localized alt text, and update time. Unsupported types/versions,
malformed metadata, unsafe paths, and identity mismatches are rejected. The R2 adapter uses the
registry bucket only, never a public registry URL, and sends `If-None-Match: *` for creation or
`If-Match` for an expected ETag replacement. Existing R2 client construction is shared.

**Evidence:** `canonicalMediaRegistrySchema.js`, `canonicalMediaRegistry.js`,
`r2CanonicalMediaRegistry.js`, `r2Storage.js`, `.env.sample`, and 8 focused registry tests.
`npm run format:check`, `npm run lint`, `npm run check:types`, `git diff --check`, and the focused
registry test command all passed.

## Action 3 — Development smoke test and canonical promotion integration

**Status:** Ready for review

Implemented development-only put/read/delete smoke tooling and integrated durable registry
persistence into the existing Make Canonical flow with explicit compensation/reconciliation
behavior.

**Verified:** the app injects a lazy private registry boundary, so missing registry configuration
does not break unrelated startup but fails at the Admin durability operation. Configured promotion
reads the current per-entity registry object before database mutation, verifies an R2 media object,
writes the stable-key override before DB commit, and uses ETag preconditions. A registry write or
conflict prevents success and rolls back the DB transaction. If DB commit fails after a registry
write, the previous entry is restored or a newly created entry is conditionally deleted; failed
compensation reports reconciliation-required state. Local-only assets are refused when the registry
boundary is configured because they cannot provide a durable R2 object.

`npm run media:registry:smoke-test` is guarded by a development-looking bucket name and explicit
`I_CONFIRM_DEVELOPMENT_CANONICAL_REGISTRY` confirmation. Its automated fake-client test proves
put/read/delete/cleanup without touching a real bucket.

**Evidence:** `promoteMediaToCanonical.js`, `app.js`,
`scripts/canonical-registry-smoke-test.mjs`, package scripts, `.env.sample`, and 24 focused tests
(including three promotion consistency tests and two smoke tests). `npm run format:check`,
`npm run lint`, `npm run check:types`, `git diff --check`, and the focused test command passed.

## Action 4 — Reset preflight, baseline restoration, and idempotency

**Status:** Ready for review

Implemented preflight before destructive reset, baseline-plus-registry restoration, stable-key
media upserts, and idempotency tests.

**Verified:** preflight reads all applicable registry objects before the reset database connection
is opened, validates entries and stable catalog keys from the authoritative seed inputs, checks each
referenced media object through the public R2 storage boundary, and aborts on registry, malformed
entry, duplicate identity, catalog, or media-object failures. Reset runs schema and normal seed
first, then materializes registry overrides in the same transaction. Restoration upserts
`media_assets` by object key, replaces localized alt text, and upserts `entity_media` by the
existing unique primary relationship; it never uses prior numeric IDs. Repeated restoration is
idempotent at the SQL boundary.

**Evidence:** `canonicalMediaRegistryRecovery.js`, `mediaRepository.js`, `db/seed.js`,
`db/seed.test.js`, and the recovery test suite. The combined reset/registry/promotion focused suite
passed 35 tests. `npm run format:check`, `npm run lint`, `npm run check:types`, and `git diff --check`
passed. No real database reset or R2 mutation was performed.

## Action 5 — Read-only audit, lifecycle verification, and documentation

**Status:** Completed

Implemented `media:registry:audit`, focused lifecycle/resolver coverage, final architecture
documentation, and repository verification. No real R2 smoke-test mutation or production reset was
performed.

**Verified:** the audit lists durable overrides, checks referenced R2 objects, compares stable-key
catalog state and PostgreSQL canonical assignments, reports `OK`/`WARNING`/`ERROR`, and performs no
writes or cleanup. Recovery tests prove a restored base override is consumed by an unchanged
starter-workout step while the existing variant/base/movement-pattern resolver remains in use.
The smoke command is explicitly development-only and its fake-client test proves cleanup.

**Evidence:** `canonicalMediaRegistryAudit.js`, `scripts/canonical-registry-audit.mjs`,
`docs/canonical-media-registry.md`, the registry recovery/audit/smoke tests, and package scripts.
`npm run verify` passed with formatting, lint, server/browser type checking, and all 526 repository
tests passing. The command was rerun with approved local network access because the sandbox-only
run could not connect to PostgreSQL or bind the HTTP test server. Real development R2 smoke access
was not configured or exercised; no production resources were touched.

**Completion summary:** the read-only audit and development-only smoke paths are available, the
registry recovery path preserves existing resolver behavior, and the requested documentation and
verification evidence are complete. The user approved this action.

## Resume here

The goal was approved and completed. No next action is prepared or activated.
