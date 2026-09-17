# Canonical database setup

The disposable local-development database is rebuilt through one guarded, atomic command:

```text
schema → seed → application ready
```

Run:

```sh
npm run db:reset
npm start
```

`db:reset` applies the current `db/schema.js`, runs the complete `db/seed.js` baseline, and creates
the initial administrator in one transaction. It requires `NODE_ENV=development` or `NODE_ENV=test`,
`ALLOW_DATABASE_RESET=true`, a local or explicitly development/test database target, and the
administrator configuration. `npm start` loads `.env` when present and does not perform hidden
database initialization.

For development/test resets, `R2_BUCKET_NAME` is the selected public-media bucket and must match
`R2_DEVELOPMENT_BUCKET_NAME`; the reset also requires a development-scoped canonical registry
bucket. In production, `R2_BUCKET_NAME` is instead the production media bucket, and
`npm run db:reset` is forbidden.

The schema is authoritative for the complete current structure. The seed order is:

1. static reference data;
2. catalog entities and their numeric foreign-key relationships, resolved by `catalog_key`;
3. catalog translations, resolved by `catalog_key` and stored with numeric foreign keys;
4. the global starter workout, resolved by variant `catalog_key`;
5. 70 canonical curated entity media assets and primary assignments, resolved by `catalog_key`;
6. the administrator identity, stored with its Argon2id password hash.

The reset seed recreates the baseline media assignments from the repository-controlled canonical
media manifest. Each
entry supplies an entity type, stable entity key, deterministic `/media/catalog/` or existing
curated path, provider-neutral object key, role, dimensions, MIME type, source, and localized alt
text. The seed stores the manifest path as `entity_media.canonical_path`, validating the path,
metadata, role, duplicate assignments, and catalog reference before inserting
`media_assets`, `entity_media`, and localized alt-text rows. Environment and category artwork is
contextual resolver fallback media and is intentionally not an `entity_media` assignment. Missing
catalog references or files fail the seed with the entity type and key; they are never silently
skipped.

Canonical catalog media is distinct from runtime/admin media. New uploads, pending generated
candidates, rejected candidates, incomplete provenance, and unassigned reusable files stay under
ignored `public/media/uploads/` or the private candidate store and do not become seed data
automatically. The current manifest contains 70 canonical assignments: reviewed catalog assets
recovered from that collection plus the retained source-controlled static assignments. Legacy
unassigned or provenance-uncertain files remain preserved and excluded from the seed.

Runtime promotion writes the selected asset and its compatibility path to the database. For an
R2-backed asset, the existing `assets/...` object key is preserved; the deterministic
`/media/catalog/promoted/<entity-type>-<catalog-key>-<content-digest>.<extension>` path is stored
as compatibility metadata and does not cause a copy to Render's local filesystem. Existing
databases must apply the additive canonical-path migration before using the updated promotion
flow. Database reset remains a deliberate bootstrap operation, so runtime promotions are not
silently added to the source manifest or recreated by a later reset.

## Canonical media durability and recovery

The repository manifest and tracked catalog files define the 70-entry database baseline, while R2
holds the durable media bytes. Existing production objects are authoritative: the baseline command
adopts them without overwriting or deleting them, and reports differing repository bytes as drift
only. The manifest is used to reconstruct a missing object, never to replace an existing one.

Run the read-only baseline check with an explicitly selected target:

```sh
CANONICAL_MEDIA_TARGET=development \
npm run media:baseline:provision -- --mode=verify
```

For production, use:

```sh
CANONICAL_MEDIA_TARGET=production \
npm run media:baseline:provision -- --mode=verify
```

Production verification requires `R2_BUCKET_NAME`, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, and
`R2_SECRET_ACCESS_KEY`; `R2_REGION` is optional and defaults to `auto`. It does not require
PostgreSQL or registry credentials. A successful report distinguishes adopted existing objects,
byte-drift warnings, missing objects, and operational failures. Do not run `--mode=apply` for an
existing object solely because its bytes differ. Apply is reserved for reviewed reconstruction of
missing objects and requires the exact target confirmation.

The manually dispatched GitHub workflow
`.github/workflows/canonical-media-recovery-rehearsal.yml` runs the complete read-only R2
preflight, captures the validated private registry snapshot, resets an ephemeral PostgreSQL 16
service using the current schema and baseline seed, restores the snapshot by stable catalog key,
and strictly verifies every restored assignment. It uses no production PostgreSQL credentials and
does not write or delete either R2 bucket. Production Environment credentials must be limited to
the read-only media and canonical-registry operations needed by the preflight.

Historical migrations remain available through the explicit `npm run db:migrate` path for existing
databases. They are not required for a clean disposable setup and must not be used as a normal reset
step. Never use `npm run db:reset` against production.

## GitHub Actions production preparation

The manually dispatched GitHub Actions workflow owns production preparation because this project
does not use Render's Pre-Deploy Command feature. Its production path is:

```text
GitHub Actions
    npm run verify
    ↓
    npm run media:durability:preflight
    ↓
    npm run production:prepare
    ↓
    Render deploy hook

Render
    npm install
    ↓
    node server.js
```

The workflow maps the preparation configuration from the GitHub `production` Environment. During
normal deployments, leave `PRODUCTION_DATABASE_RESET_MODE` and `ALLOW_PRODUCTION_DB_RESET` unset
or empty; the command logs `Production database reset not requested.` and performs no database,
registry, or media changes. The workflow does not infer or populate either guard.

An intentional production reconstruction requires the GitHub `production` Environment to provide
`NODE_ENV=production`, the production `DATABASE_URL`, administrator and R2 configuration, separate
production media and private canonical-registry buckets/credentials, and the exact sentinels:

```env
PRODUCTION_DATABASE_RESET_MODE=reset-and-restore
ALLOW_PRODUCTION_DB_RESET=I_CONFIRM_PRODUCTION_DB_RESET
```

Both values are required exactly; missing, blank, or arbitrary truthy values fail before any
destructive SQL. The generic `npm run db:reset` command remains development/test-only and cannot
become a production reset through these values. The preparation command validates the private R2
canonical registry and referenced media objects before invoking the existing schema-and-seed
reset. It then restores the validated in-memory registry snapshot through the existing canonical
recovery path and verifies every restored assignment against PostgreSQL. Registry preflight, reset,
restoration, and post-restore failures return a non-zero exit code and prevent the Render deploy
hook from being called. No registry objects are written or deleted during recovery.

Because these settings persist in GitHub's `production` Environment, disable or remove both
production-reset values again immediately after the intentional reset has been validated. Any
other non-empty value is rejected as a configuration error and cannot trigger a reset. The Render
build and application startup remain non-destructive.
