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

Historical migrations remain available through the explicit `npm run db:migrate` path for existing
databases. They are not required for a clean disposable setup and must not be used as a normal reset
step. Never use `npm run db:reset` against production.
