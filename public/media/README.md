# Catalog and fallback media

Repository-controlled catalog media lives under `catalog/` and is registered and assigned by the
canonical database seed. The manifest currently contains 70 canonical assets and assignments across
exercises, one global exercise variant, equipment, muscles, and movement patterns. Its stable
`entityType + entityKey + path + storageKey + metadata` records are the source of truth after
`npm run db:reset`.

The manifest's `path` values are repository source/fallback paths and are required by the current
seed preflight. Its `storageKey` values are provider-neutral object keys used for R2-backed reads.
Reset reconstructs PostgreSQL metadata and relationships from the manifest; it does not delete or
recreate remote objects.

The ignored `uploads/` directory is local runtime/admin storage and historical recovery material.
Existing UUID-named files there are not seeded merely because they exist. The reviewed assignments
recovered from the provenance record were copied into `catalog/` with deterministic names; one
unassigned reusable asset and three legacy provenance-unknown assets remain retained/deferred and
are excluded from the seed. Do not delete this directory without separately verifying its local
development, fallback, and provenance role.

Environment and category artwork remains resolver fallback media because those concepts are
contextual strings rather than `entity_media` entities.

For the active visual rules, accepted formats, presentation geometry, accessibility, provenance,
and future human-reviewed AI experiments, follow [the media style guide](../../docs/media-style-guide.md).

New representative raster assets should use the Phase 2 admin media-management workflow and the
normal resolver. Do not add page-local paths or generic media merely to fill a frame.
