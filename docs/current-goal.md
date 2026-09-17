# Goal: Complete Production Canonical-Media Durability Lifecycle

## Goal status

**Changes requested — development missing-object classification correction 2026-09-16**

## Objective

Complete the production canonical-media lifecycle so canonical images managed through the Admin UI
remain reconstructable independently of PostgreSQL lifetime:

```text
canonical media durability = durable R2 image bytes + durable canonical metadata/selection
```

Preserve the existing architecture and resolver:

```text
repository manifest → baseline canonical state
public media R2 → durable image bytes
private canonical registry R2 → durable Admin override metadata
PostgreSQL → reconstructable runtime materialization
```

The existing Admin **Make Canonical** workflow remains the primary future image-management path.
Normal deployments must not reset PostgreSQL or provision media implicitly.

## Verified baseline and delta

### Existing relevant capabilities

- `data/canonical-media.json` contains 70 canonical entries across all five supported entity types;
  every current entry has a provider-neutral `assets/...` storage key and a matching tracked
  `public/media/...` source file.
- `db/mediaSeedSql.js` validates the manifest and seeds `media_assets`, localized alt text, and
  primary `entity_media` assignments by stable catalog key. It does not upload R2 objects.
- Admin promotion already requires an R2-backed object when the canonical registry is configured,
  writes the private registry before PostgreSQL commit, uses ETag concurrency, and compensates a
  registry mutation when the database transaction/commit fails.
- `canonicalMediaRegistryRecovery.js` already restores validated registry overrides after the
  baseline seed and strictly verifies the materialized PostgreSQL state.
- `npm run media:registry:preflight` is read-only and validates registry entries and their referenced
  public-media R2 objects without PostgreSQL access. The production GitHub workflow runs it before
  the Render Deploy Hook.
- Normal startup and the ordinary build do not provision media or reset PostgreSQL.

### Verified gaps to close

- The deployment preflight does not validate the repository manifest schema, stable identity,
  localized metadata, storage keys, source-file correspondence, or production R2 objects.
- There is no explicit safe/idempotent command to provision source-controlled baseline media to R2
  while preserving existing objects and using the manifest only to reconstruct missing keys.
- The GitHub workflow has no disposable PostgreSQL recovery rehearsal proving baseline plus registry
  restoration without production database credentials.
- Lifecycle tests must explicitly cover missing R2 objects, registry availability/write/conflict
  failures, and PostgreSQL failure after registry mutation for every supported entity type.
- `docs/canonical-media-audit.md` contains superseded pre-registry conclusions and must be brought
  into agreement with the current source-of-truth model.

## Completion criteria

- [x] Every baseline manifest entry is schema-valid, catalog-valid, and references an available
      durable production R2 object; existing R2 bytes are adopted as authoritative and any
      repository-byte drift is reported separately from missing or operational failures.
- [x] Every Admin canonical override is validated by the deployment preflight and references an
      available durable production R2 object.
- [x] A single read-only canonical durability preflight runs before the Render Deploy Hook, needs no
      PostgreSQL access, returns non-zero on any gap, and includes the existing registry checks.
- [x] An explicit safe baseline provisioning/verification command exists if production baseline
      objects are not already reliably provisioned; it is idempotent, key-preserving, target-
      explicit, adopts existing objects without overwriting them, provisions only missing keys,
      and never deletes unrelated objects.
- [x] Admin promotion cannot report success when its R2 object, private registry, registry write,
      concurrency precondition, or PostgreSQL commit fails; existing compensation behavior remains.
- [x] All supported canonical entity types are covered: `exercise`, `exercise_variant`, `muscle`,
      `equipment`, and `movement_pattern`.
- [x] A GitHub Actions disposable-database rehearsal proves schema + baseline seed + durability
      preflight + registry restoration + strict verification without production PostgreSQL credentials
      or production writes.
- [x] The final source-of-truth model, deployment behavior, provisioning/rehearsal commands, and
      manual production acceptance test are documented.
- [x] No production PostgreSQL reset, production R2 write/delete, Render filesystem dependency,
      manifest mutation by Admin, resolver redesign, or R2 orphan deletion is introduced.

## Final review assessment

- [x] Baseline manifest validation, catalog identity, source correspondence, and explicit
      production baseline verification are implemented; the user-supplied read-only result found
      70 adopted objects, zero missing objects, and zero operational failures, with one diagnostic
      drift warning.
- [x] Admin canonical overrides are checked by the complete read-only preflight against durable R2
      objects, with focused failure coverage.
- [x] The read-only durability preflight runs before the Render Deploy Hook and includes registry
      validation without PostgreSQL access.
- [x] The explicit baseline command is target-aware, idempotent, non-destructive, and provisions
      only reviewed missing objects in apply mode.
- [x] Admin promotion preserves the existing R2, registry, concurrency, and PostgreSQL failure
      guarantees, including compensation behavior.
- [x] All five supported canonical entity types are covered by the implementation and tests.
- [x] The manually dispatched GitHub Actions recovery rehearsal passed against the configured
      production Environment. Production R2 read-only preflight, disposable PostgreSQL schema and
      seed reconstruction, registry restoration, and strict post-restore verification all passed;
      no production R2 write or production PostgreSQL reset was performed.
- [x] The final source-of-truth model, deployment behavior, commands, and manual acceptance test
      are documented.
- [x] No production reset, production R2 write/delete, Render filesystem dependency, manifest
      mutation by Admin, resolver redesign, or orphan deletion was introduced.

All completion criteria are satisfied, including the owner-confirmed live production recovery
rehearsal. The goal is complete.

## Deliberate non-goals

No automatic production reset, normal-deploy baseline upload, production database credential in
GitHub Actions, Render filesystem durability, Admin-to-Git promotion, resolver rewrite, R2 orphan
cleanup, or destructive production verification is included.
