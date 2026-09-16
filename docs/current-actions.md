# Current Actions

## Current goal

Complete Production Canonical-Media Durability Lifecycle.

## Delta-first baseline

The previous goal, **Conditional Production Database Reset and Canonical Registry Restore**, was
completed and approved on 2026-09-16. Its reset guards, registry snapshot recovery, compensation,
and strict post-restore verification are historical completed work and will be reused. This goal
reopens no completed behavior except where the new acceptance criteria require broader preflight
coverage and rehearsal evidence.

## Proposed action sequence

### Action 1 — Build the complete manifest and registry durability preflight

**Status:** Completed

Audit and implement the shared read-only validation needed to answer whether every baseline and
override assignment resolves to durable bytes. Validate manifest schema, stable catalog identity,
localized metadata, provider-neutral storage keys, source-file correspondence, and production R2
object existence; preserve all current registry validation and error behavior. Add focused tests
and expose one clear command suitable for the production deployment gate.

**Implementation and evidence:** Added `preflightCanonicalMediaDurability` and the
`npm run media:durability:preflight` command. It reuses the seed manifest validator, adds stable
catalog-key and production R2 object checks for every baseline entry, and composes the existing
registry preflight unchanged for private overrides. The production GitHub deployment gate now runs
the complete command before the Render Deploy Hook. Manifest seeding now requires an explicit,
provider-neutral `assets/...` storage key instead of falling back to a local path.

Focused verification passed:

- `node --test scripts/canonical-media-durability-preflight.test.mjs db/mediaSeedSql.test.js`
  — 10 tests passed.
- `npm run format:check` — passed.
- `npm run lint` — passed.
- `npm run check:types` — passed.
- `git diff --check` — passed.

The full `npm test` command was attempted with a name filter, but the repository's catalog suite
still opened its PostgreSQL hook and failed with a local `EPERM` connection error because no safe
disposable test database was configured. No database or R2 resource was mutated.

**Completion summary:** The deployment gate now checks the repository baseline and private Admin
override sources for durable production media bytes before deployment can proceed.

### Action 2 — Add explicit safe baseline R2 provisioning or verification

**Status:** Completed — 2026-09-16

Using repository-derived manifest mappings, determine whether current production baseline objects
are verifiable. If provisioning is required, add an explicit target-aware, idempotent command that
uses existing manifest storage keys, adopts any existing object without overwriting it, provisions
only missing objects, reports byte drift as a warning, supports dry-run/verification, and never
runs at startup/deploy or deletes unrelated objects. Do not run it against production during
implementation.

**Implementation and evidence:** Added `npm run media:baseline:provision` with explicit
`development`/`production` target selection and `verify`, `dry-run`, and `apply` modes. Apply mode
requires exact target confirmation, rejects development-scoped buckets for production, validates
the source-controlled manifest before reading files, preserves every existing `assets/...` key,
uses conditional R2 object creation, and re-reads created/raced objects. Existing objects are
adopted and never overwritten; byte differences are explicit drift warnings, while missing
objects and operational failures remain actionable failures. The command defaults to read-only
verification and has no startup or deployment hook.

Focused verification passed:

- `node --test scripts/canonical-media-baseline-provision.test.mjs src/features/media/storage/r2Storage.test.js`
  — 15 tests passed, covering idempotence, dry-run, conditional creation, adopted byte drift,
  diagnostics, R2 inspection metadata, and target confirmation.
- `npm run format:check` — passed.
- `npm run lint` — passed.
- `npm run check:types` — passed.
- `git diff --check` — passed.

The agent performed no production R2 verification, write, overwrite, or delete during
implementation. The user's temporary production verification reached the bucket and identified
the `muscle:abductors` byte drift described below; the later user-supplied verification after this
policy change passed with that drift reported as a warning.

**Requested changes:** Production verification returned only the generic failure line. Improve
expected configuration and provider-error diagnostics, identify the likely local failure category
without exposing credentials, add focused diagnostic tests, and keep this action at Changes
requested until a safe production verification produces an actionable report.

**Changes implemented and diagnosis:** The CLI now reports target, mode, non-secret bucket name,
failure category, canonical entity/object identity, and sanitized provider name/code/status/message.
Expected categories include configuration errors, canonical-object-missing, manifest-mismatch,
bucket-authentication-or-access-failure, bucket-unavailable-or-not-found, and
unexpected-provider-or-api-error. Existing objects with different bytes are reported as
byte-drift-warning entries and do not fail verification. Verification still fails explicitly for
missing baseline objects and operational failures; dry-run remains a non-failing planning mode.
Focused diagnostics tests pass, including secret-value redaction.

The reported production verification failure was reproduced safely with the user's command. It is
a local configuration error: the ignored `.env` contains `R2_BUCKET_NAME=lets-flex-media-dev`, so
the production target was refused before any R2 request. No R2 mutation occurred.

For production `--mode=verify`, the local environment must provide these variables (values are not
logged): `R2_BUCKET_NAME` for the production bucket, `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, and
`R2_SECRET_ACCESS_KEY`. `R2_REGION` is optional and defaults to `auto`. The bucket must not have a
development-scoped name. `CANONICAL_MEDIA_TARGET=production` is required; no registry credentials,
`DATABASE_URL`, `MEDIA_PUBLIC_URL`, or production confirmation are needed for read-only verify.
Do not run `--mode=apply` until verify succeeds.

**Follow-up investigation:** Production verification reached the media bucket and found one
existing object whose bytes differ from the repository baseline at `muscle:abductors` /
`assets/ab2a5fc5-f6ab-468b-9b88-b5bf776bd106.jpg`. The repository expects
`public/media/catalog/promoted/muscle-abductors-f1fe5fead20e2bb4.jpg`, 40,797 bytes, SHA-256
`f1fe5fead20e2bb43372efd9138be026166fa279b39e2df3bfccfa719875e176`, MIME `image/jpeg`, and
manifest dimensions `1124x1092`. `file` identifies the tracked bytes as a 730x456 progressive
JPEG. Git history shows those exact bytes were introduced with the canonical image on 2026-09-14;
the later R2 mapping commit added the storage key and changed the recorded dimensions without
changing the file bytes. This is no evidence of a newer local source image or an incorrect key
association, but the production object's actual hash/metadata remains unknown until the next
read-only verify output.

The drift warning includes expected and actual SHA-256, byte lengths, source path, expected
dimensions/MIME, and—when R2 returns them—actual content type, content length, ETag, and last
modified time. It remains read-only. Under the revised durability model, the existing production
object is adopted as the authoritative runtime bytes and must not be replaced or deleted merely
because the repository source differs. The manifest remains the safe reconstruction source for a
missing key; a private registry entry remains authoritative for an Admin override selection.

The safe next step is to rerun the same read-only `--mode=verify` command with the temporary
production configuration after this policy update. The abductors object should be reported as
adopted with a byte-drift warning, not as an unresolved verification failure. Review its actual
SHA-256/length/content type/ETag if source history or metadata reconciliation is needed, and
inspect the private registry object `v1/muscle/abductors.json` read-only if it exists. No
production mutation is needed for this existing key. If future verification finds missing keys,
`--mode=apply` may create only those absent objects after the existing production target and
confirmation safeguards pass.

Verification evidence after the requested changes:

- `node --test scripts/canonical-media-baseline-provision.test.mjs src/features/media/storage/r2Storage.test.js scripts/canonical-media-durability-preflight.test.mjs`
  — 19 tests passed.
- `npm run lint` — passed.
- `npm run format:check` — passed.
- `npm run check:types` — passed.
- `git diff --check` — passed.
- The exact production verify command now returns the actionable local configuration diagnosis
  above and performs no R2 request with the development bucket.

**Completion summary:** The revised production read-only verification passed with 70 adopted
existing objects, 69 byte-identical objects, one accepted byte-drift warning for
`muscle:abductors`, zero missing objects, zero created objects, and zero operational failures.
The production object at `assets/ab2a5fc5-f6ab-468b-9b88-b5bf776bd106.jpg` is now explicitly
accepted as authoritative under the durability policy. Its actual SHA-256 is
`4a3f6fbdaa1bd9b5449932cb47afd1927cb493b899c9f6e71eb61837c9501ad9`, size is 307,794 bytes, and
content type is `application/octet-stream`; no replacement or deletion is required. Existing R2
objects remain protected, byte drift is diagnostic only, missing objects remain conditionally
provisionable, and configuration/authentication/provider failures remain fatal. The user approved
Action 2 after this verification. No `--mode=apply` operation was run.

### Action 3 — Strengthen Admin promotion lifecycle verification

**Status:** Completed — 2026-09-16

Reuse the current promotion, registry, storage, transaction, concurrency, and compensation
abstractions. Add or repair tests covering all five entity types and each failure boundary: missing
R2 object, unavailable registry, failed registry write, concurrency conflict, and PostgreSQL commit
failure after registry mutation. Confirm a successful promotion leaves durable registry metadata
and the runtime assignment in the intended order.

**Implementation and evidence:** Repaired the configured-registry promotion guard so every
R2-backed candidate object is verified before a database transaction, including first-time
promotions with no existing canonical assignment. Existing promotion, registry, transaction,
concurrency, and compensation behavior remains in place. Added focused coverage for all five
supported entity types and for missing R2 objects, unavailable registry reads, failed registry
writes, registry concurrency conflicts, and PostgreSQL commit failure after registry mutation.
The success matrix asserts that the durable registry write occurs before database commit and that
the runtime entity assignment uses the same durable object key.

Verification evidence:

- `node --test src/features/media/promoteMediaToCanonical.test.js src/features/media/registry/canonicalMediaRegistry.test.js src/features/media/registry/canonicalMediaRegistryRecovery.test.js src/features/media/storage/storage.test.js src/features/media/storage/r2Storage.test.js`
  — 35 tests passed, including 18 promotion tests.
- `npm run lint` — passed.
- `npm run format:check` — passed.
- `npm run check:types` — passed.
- `git diff --check` — passed.

No production database or R2 resource was accessed or mutated during this action.

**Completion summary:** Action 3 was approved after the focused promotion, registry, recovery,
and storage verification passed. The first-time R2 object existence gap is repaired, all five
supported entity types are covered, durable registry state is written before the PostgreSQL
commit, and all required failure boundaries remain fatal and recoverable according to the
existing compensation rules.

### Action 4 — Add disposable GitHub recovery rehearsal

**Status:** Completed — 2026-09-16

Compose the existing schema/seed/recovery implementations into a GitHub Actions workflow using an
obviously disposable PostgreSQL service/container. Run the complete durability preflight, restore
the production registry snapshot into the temporary database, and perform strict post-restore
verification. Use production Environment R2 credentials only for read-only R2 access; do not expose
or require `DATABASE_URL`, enable reset authorization, or mutate production resources.

**Implementation and evidence:** Added `npm run media:recovery:rehearsal`, which runs the complete
read-only canonical-media durability preflight against the production R2 media and private registry
buckets, captures the validated registry snapshot, invokes the existing schema/baseline seed and
registry restoration against the configured disposable PostgreSQL target, and performs strict
post-restore verification. The rehearsal passes the in-memory snapshot into reset so the local
database restore does not re-read or write production registry objects.

Added the manually dispatched `.github/workflows/canonical-media-recovery-rehearsal.yml` workflow.
It provisions an ephemeral PostgreSQL 16 service, uses a local `lets_flex_rehearsal` database and
dummy rehearsal administrator credentials, and reads production R2 settings from the production
Environment. The workflow grants no production database credentials and the rehearsal code invokes
only R2 list/get/head operations; no R2 put or delete operation is part of the path.

Focused verification passed:

- `node --test scripts/canonical-media-recovery-rehearsal.test.mjs scripts/canonical-media-durability-preflight.test.mjs src/features/media/registry/canonicalMediaRegistryRecovery.test.js db/seed.test.js`
  — 21 tests passed.
- `npm run lint` — passed.
- `npm run format:check` — passed.
- `npm run check:types` — passed.
- `git diff --check` — passed.

No production database or R2 resource was accessed or mutated during this action. The manual
workflow run remains required to confirm the configured production Environment credentials and
the current production registry/baseline contents.

**Completion summary:** Action 4 was approved after the recovery rehearsal implementation and
focused verification passed. The manual workflow is ready to run with the production Environment;
it uses production R2 only for read-only preflight, restores the validated snapshot into an
ephemeral PostgreSQL service, and strictly verifies the reconstructed state without production
database credentials or R2 mutation.

### Action 5 — Reconcile documentation and final acceptance procedure

**Status:** Completed — approved 2026-09-16

Update `docs/canonical-media-registry.md`, `docs/canonical-media-audit.md`, `docs/database-setup.md`,
`README.md`, and deployment documentation with the final source-of-truth model, command names,
workflow behavior, baseline verification/provisioning result, recovery rehearsal result, and exact
manual production acceptance test. Mark superseded audit conclusions clearly. Run the full required
verification and inspect the final diff.

**Implementation and evidence:** Reconciled the canonical-media audit so its historical pre-registry
conclusions are explicitly marked superseded and the current model is clear: existing R2 bytes are
authoritative, the private registry preserves Admin selections across PostgreSQL reset, and the
repository manifest reconstructs missing baseline keys without replacing existing objects. Updated
the registry, database setup, README, and production deployment documentation with the baseline
policy, command names, GitHub workflow behavior, production verification result, recovery rehearsal,
R2 Environment settings, and exact manual production acceptance steps.

Full verification passed:

- `npm run verify` — formatting, lint, server/browser type checks, and all 560 tests passed.
- `git diff --check` — passed.

The full verification used the repository's disposable local `lets_flex_test` PostgreSQL target and
loopback HTTP server only. No production database or R2 resource was accessed or mutated during
this action. The manually dispatched production recovery workflow remains a documented operational
acceptance step and was not run by the agent.

**Completion summary:** Action 5 was approved after the documentation reconciliation, full
verification, and final diff review. The goal is ready for final review; the manually dispatched
production recovery workflow remains the only operational acceptance step not executed in this
workspace.

## Resume here

Action 1 through Action 5 are Completed. The goal is Ready for final review. Compare the completion
criteria and review the documented manual production recovery-workflow acceptance step.
