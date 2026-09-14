# Catalog and fallback media

Repository-controlled catalog media lives under `catalog/` and is registered and assigned by the
canonical database seed. The manifest currently contains 68 canonical assets and assignments across
exercises, one global exercise variant, equipment, muscles, and movement patterns. Its stable
`entityType + entityKey + path + metadata` records are the source of truth after `npm run db:reset`.

The ignored `uploads/` directory is runtime/admin storage. Existing UUID-named files there are not
seeded merely because they exist. The reviewed assignments recovered from the provenance record
were copied into `catalog/` with deterministic names; one unassigned reusable asset and three
legacy provenance-unknown assets remain runtime/deferred and are excluded from the seed.

Environment and category artwork remains resolver fallback media because those concepts are
contextual strings rather than `entity_media` entities.

For the active visual rules, accepted formats, presentation geometry, accessibility, provenance,
and future human-reviewed AI experiments, follow [the media style guide](../../docs/media-style-guide.md).

New representative raster assets should use the Phase 2 admin media-management workflow and the
normal resolver. Do not add page-local paths or generic media merely to fill a frame.
