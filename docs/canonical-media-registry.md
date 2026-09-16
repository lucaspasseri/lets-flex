# Canonical Media Registry

## Sources of canonical state

Canonical media has three layers:

```text
data/canonical-media.json
        ↓ baseline/default seed state
private R2 canonical registry
        ↓ persistent Admin overrides
PostgreSQL media_assets + entity_media
        ↓ runtime materialized state
existing media resolver and rendered surfaces
```

The repository manifest remains source-controlled baseline state. The registry does not edit or
replace that file. There is one private R2 JSON object per supported entity:

```text
<prefix>/<entityType>/<catalog-key>.json
```

For example, `v1/exercise/push-up.json`. `catalog_key` is the persistent identity; PostgreSQL
numeric IDs are never stored as registry identity. The versioned payload stores the entity type and
key, canonical role, R2 media object key, MIME type, dimensions, optional checksum, canonical
compatibility path, localized English and Brazilian Portuguese alt text, and update time.

Registry access is server-side only. The registry bucket and credentials are separate from the
public media bucket credentials, while the existing R2 endpoint and region configuration are
reused. Registry objects contain object keys such as `assets/uuid.webp`, never hardcoded public
URLs.

## Make Canonical guarantee

For a configured Admin flow, **Make Canonical**:

1. resolves the selected entity and stable catalog key;
2. reads the current registry object and its ETag;
3. verifies the selected R2 media object exists and reads it when promotion needs its digest;
4. prepares the existing PostgreSQL canonical assignment;
5. writes the registry override with `If-None-Match: *` or the prior `If-Match` ETag;
6. commits the PostgreSQL transaction.

The registry write occurs before DB commit so a registry failure rolls back the database transaction
and cannot be reported as a successful promotion. If the DB commit fails after a registry write,
the prior registry object is restored or a new object is conditionally deleted. If compensation
cannot be confirmed, the operation reports that reconciliation is required. Conditional writes
turn stale concurrent updates into a controlled conflict rather than a silent overwrite.

When the registry boundary is configured, local-only media paths are rejected because they cannot
satisfy the durable R2-object invariant. The Admin still has only one canonical action.

## Reset and recovery

`npm run db:reset` performs this sequence:

```text
registry preflight
  → schema recreation
  → normal catalog/starter/media seed (manifest baseline)
  → registry override materialization
  → administrator seed and commit
```

Preflight runs before opening the reset database connection or executing destructive SQL. It lists
and validates all registry objects, rejects unsupported or malformed data and duplicate identities,
maps every stable key against the catalog definitions used by the current seed, and verifies every
referenced media object in the public R2 bucket. It aborts on registry access failure, missing
catalog entities, or missing/unverifiable media objects. It does not silently fall back to the
baseline or delete invalid registry state.

Restoration resolves each stable key to the newly seeded numeric ID, upserts `media_assets` by the
R2 object key, restores localized alt text, and upserts the entity's existing primary
`entity_media` relationship with its canonical path. Repeating restoration is idempotent and does
not depend on IDs from before reset.

## Runtime rendering

Normal page rendering does not query R2 registry objects. The registry is used during promotion,
reset/recovery, and explicit audit/smoke commands. Runtime pages continue using the PostgreSQL
media assignment resolver, preserving the verified precedence:

```text
direct variant → base exercise → movement pattern
```

Therefore an unchanged starter-workout step resolves an Admin-promoted base image after reset once
the registry override has been materialized.

## Audit and smoke commands

`npm run media:registry:audit` is read-only. For each durable override it compares the registry
payload with the referenced R2 object, catalog entity, PostgreSQL asset metadata, and primary
assignment. It reports `OK`, `WARNING` for database drift, and `ERROR` for missing durable objects,
missing catalog/database state, or unverifiable dependencies. It performs no writes or deletes.

`npm run media:registry:smoke-test` writes and reads one temporary object under
`<prefix>/_smoke-test/`, confirms its contents, deletes it, and confirms cleanup. It refuses
production-looking bucket names and requires explicit development confirmation. No production
destructive verification is part of this workflow.

Automatic registry cleanup and R2 orphan deletion are intentionally not implemented. The registry
remains the recovery reference even when the current database is temporarily inconsistent.

## Production pre-deploy reconstruction

Render should use `npm run production:prepare` as its Pre-Deploy Command. The command is harmless
when `PRODUCTION_DATABASE_RESET_MODE` is unset or empty. It accepts only the exact destructive
sentinel `reset-and-restore`; unexpected values fail configuration validation without invoking
the database reset.

When enabled, the command requires `NODE_ENV=production`, a non-local/non-development-looking
PostgreSQL target, administrator configuration, and explicit separate production media and private
registry configuration. It then runs registry preflight, invokes the existing `db/seed.js`
reset-and-seed implementation with the validated snapshot, and runs strict post-restore checks.
The build command is not changed. Registry preflight failure always prevents database destruction,
and any reset or verification failure returns a non-zero exit code. After an intentional reset,
remove the environment variable or set it empty before subsequent deployments so they do not
repeat the destructive reconstruction.
