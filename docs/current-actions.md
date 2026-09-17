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

**Initial implementation summary:** Action 4's first implementation passed focused verification.
The manual workflow uses the production Environment only for read-only R2 access;
it uses production R2 only for read-only preflight, restores the validated snapshot into an
ephemeral PostgreSQL service, and strictly verifies the reconstructed state without production
database credentials or R2 mutation.

**Requested changes from live acceptance:** The repository owner dispatched the workflow against
the production Environment. The run safely stopped during the initial read-only preflight with
`Canonical media durability preflight failed with 70 issue(s)` before PostgreSQL was touched. The
workflow mappings are present and match the application contract; `.env not found` is expected in
CI because the command uses `--env-file-if-exists`. The 70 count is the 70-entry baseline loop,
but the previous recovery command discarded each provider cause and printed only the aggregate
error, so the run cannot distinguish recognized object misses from a wrong bucket or an R2 access
failure. Add early presence/shape validation for both R2 resources and safe categorized issue
diagnostics, with tests for workflow mappings, missing configuration, separate buckets, 70
baseline misses, provider failures, and secret redaction. Preserve the read-only and disposable
database boundaries; do not repair byte drift.

**Correction implemented and evidence:** The rehearsal now validates the complete media and private
registry R2 configuration before making requests, reports only safe bucket names, requires both
bucket configurations, and rejects using the same bucket for both resources. Preflight issues now
retain sanitized provider causes and the CLI reports category counts plus per-entry identity and
object-key diagnostics. Categories distinguish `canonical-object-missing`,
`bucket-authentication-or-access-failure`, `bucket-unavailable-or-not-found`, and
`unexpected-provider-or-api-error`; credential values are never printed. A 70-issue result is now
diagnostic: `canonical-object-missing=70` means all baseline probes received recognized missing
responses, while provider-category counts identify access or provider failures. No PostgreSQL or
R2 write path was added or changed.

Focused verification passed:

- `node --test scripts/canonical-media-recovery-rehearsal.test.mjs scripts/canonical-media-durability-preflight.test.mjs src/features/media/registry/canonicalMediaRegistryRecovery.test.js src/features/media/storage/r2Storage.test.js` — 23 tests passed.
- `npm run format:check` — passed.
- `npm run lint` — passed.
- `npm run check:types` — passed.

The required `npm run verify` was also attempted. Formatting, lint, server type checks, and browser
type checks passed; the full test suite could not complete because the local catalog PostgreSQL
hook failed with `EPERM` while no safe disposable test database was configured. The live GitHub
workflow remains the required external acceptance check.

**Correction completion summary:** The requested CI diagnostic correction was approved after the
focused verification evidence above. The workflow mapping remains explicit and unchanged; missing
or invalid Environment configuration now fails before R2 requests, while live R2 failures are
reported with safe categories and resource/object context. Production R2 and PostgreSQL were not
accessed or mutated by this correction.

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

### Action 6 — Execute manual production recovery acceptance

**Status:** Ready for review — development R2 authorization verification 2026-09-16

Dispatch `Canonical Media Recovery Rehearsal` from the GitHub Actions `production` Environment
using the workflow revision containing the approved diagnostic correction. Confirm the read-only
R2 preflight, ephemeral PostgreSQL schema/baseline seed, registry snapshot restoration, and strict
post-restore verification complete successfully. Record the run URL and output. Do not run R2
apply/overwrite/delete operations, production reset commands, or provide production PostgreSQL
credentials.

**Prior requested changes from live acceptance:** The owner reran the workflow after the diagnostic
correction. Configuration presence validation passed, and the read-only preflight then reported
`mediaBucket=lets-flex-media-prod`, `registryBucket=lets-flex-canonical-registry-prod`, and 70
`bucket-authentication-or-access-failure` issues with HTTP 403 for baseline media probes. The run
stopped before disposable PostgreSQL, as required. Trace the separate media and registry secret
contracts and determine whether any repository correction is needed; do not broaden permissions or
touch production data.

**Investigation result:** The live run passed early configuration presence validation and reported
`mediaBucket=lets-flex-media-prod`, `registryBucket=lets-flex-canonical-registry-prod`, then HTTP
403 `bucket-authentication-or-access-failure` for all 70 public-media `HeadObject` probes. The
adapter treats only 404/NotFound responses as object absence, so this is an R2 authorization or
credential/account-endpoint problem, not 70 missing objects. Repository inspection verified the
workflow explicitly maps media credentials from `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`,
and registry credentials from `R2_CANONICAL_REGISTRY_ACCESS_KEY_ID` and
`R2_CANONICAL_REGISTRY_SECRET_ACCESS_KEY`; the two clients do not share credential values. The
required owner correction is to inspect those exact Environment secrets, the media bucket scope,
and the shared Cloudflare R2 endpoint. No code or workflow change was necessary, and no production
resource was mutated.

**Completion summary:** The repository owner confirmed that the live GitHub Actions
`Canonical Media Recovery Rehearsal` passed against the production Environment. Production R2
read-only preflight verified the canonical baseline and read the production registry snapshot;
the ephemeral PostgreSQL schema and seed were reconstructed, the registry snapshot was restored,
and strict post-restore verification passed. The owner confirmed that no production R2 write and
no production PostgreSQL reset occurred.

**Requested changes from development reset behavior:** The reported `forcePathStyle` conclusion
was traced through the exact `npm run db:reset` path. `db/seed.js` creates the canonical registry
and media adapters independently; the registry list uses `createR2CanonicalMediaRegistry`, the
media object checks use `createR2MediaStorage`, and both concrete clients use the shared
`createR2S3Client` with `forcePathStyle: true`. Runtime request capture confirmed path-style
requests with the development bucket in the URL path. The exact command loaded `.env` via
`node --env-file-if-exists=.env`; its non-secret settings are development media and registry
buckets, region `auto`, and the configured account R2 endpoint hostname.

The exact development `npm run db:reset` in this workspace fails before media `HeadObject` checks
because the registry `ListObjectsV2` request returns DNS `ENOTFOUND`; the command reports the
operation, development registry bucket, endpoint hostname, `addressing=path-style`, provider
name/code, and sanitized message. The independent media `HeadObject` checks for the reported keys
use the same development adapter and also return DNS `ENOTFOUND` here because the sandbox resolver
cannot resolve even `cloudflare.com`. The user-reported output with two object-specific missing
issues represents the alternate reachable execution in which registry listing succeeds and
`HeadObject` returns recognized absence; it is not evidence of DNS in that execution.

The reset path now uses a diagnostic read-only probe that preserves a definitive 404 as a
structured missing-object cause. Its user-facing line includes `classification=object-missing`,
`operation=HeadObject`, the bucket, endpoint hostname, and `status=404`. DNS, authorization, and
other provider failures remain operational failures and cannot produce the missing-object reason.
The exact `npm run media:baseline:provision -- --mode=verify` also fails before R2 access because
the normal `.env` has no explicit `CANONICAL_MEDIA_TARGET`. No objects or database rows were
mutated.

**Root-cause evidence from the reachable development shell:** Before this correction, that shell
loaded `NODE_ENV=development`, selected `R2_BUCKET_NAME=lets-flex-media-prod`, and selected the
development canonical registry bucket. The R2 client did exactly what it was configured to do and
issued `HeadObject` against the production media bucket; this was local configuration drift, not
an alternate client or target-selection branch. `R2_BUCKET_NAME` is the active environment-specific
media bucket, while `R2_DEVELOPMENT_BUCKET_NAME` is the explicit development safety reference.
`CANONICAL_MEDIA_TARGET` does not participate in `db:reset`; it only selects the bucket contract for
the separate baseline provisioning command.

The reset boundary now fails closed before any R2 client is constructed when a development/test
environment has mismatched `R2_BUCKET_NAME` and `R2_DEVELOPMENT_BUCKET_NAME`, or a
production-scoped media/registry bucket. The local correction required in the reachable shell is
to set `R2_BUCKET_NAME=lets-flex-media-dev` while retaining the development registry bucket; do
not change production R2 configuration or upload objects to production. The current workspace
`.env` already selects `lets-flex-media-dev` and `lets-flex-canonical-registry-dev`, but its
sandbox cannot resolve DNS for direct access. A reachable, read-only verification with that
configuration resolved the configured R2 endpoint and confirmed both reported keys exist in
`lets-flex-media-dev`. The exact `npm run db:reset` then completed successfully with two
canonical registry overrides, and the documented development baseline verification completed
with 70 adopted entries, 0 missing objects, 0 operational failures, and 1 accepted byte-drift
warning; it created no objects and touched no production resource.

The documented development baseline command is:
`CANONICAL_MEDIA_TARGET=development npm run media:baseline:provision -- --mode=verify`.

The preflight now preserves operational R2 failures as verification failures and reports
recognized object absence separately; a provider 403 is not classified as a missing object.
Focused verification passed after this correction: 19 relevant storage/registry/recovery tests,
`npm run check:types`, and `npm run format:check`. The reachable exact reset, development
baseline verification, and independent read-only HeadObject checks all passed after correcting
the selected bucket. The final `npm run verify` passed: formatting, lint, both type checks, and
all 582 tests passed with 0 failures.

**New owner-provided development verification:** After removing the shell-level production bucket
override, the ordinary `npm run db:reset` selected `lets-flex-media-dev`, used path-style
addressing, reached `HeadObject`, and received HTTP 403 for both reported media keys. The
classification remains correctly operational (`referenced R2 media object could not be verified`),
not object-missing. This confirms bucket selection, endpoint reachability, and addressing; the
remaining issue is the rotated media credential's authorization, account, or bucket scope.

**Authorization contract inspection:** Public media uses `R2_ACCESS_KEY_ID` and
`R2_SECRET_ACCESS_KEY` against `R2_BUCKET_NAME`; its application operations are `HeadObject` and
`GetObject` for verification/reads, `PutObject` for uploads and explicit baseline apply, and
`DeleteObject` for existing cleanup/compensation paths. The public media adapter does not issue
`ListObjectsV2`. The private canonical registry separately uses
`R2_CANONICAL_REGISTRY_ACCESS_KEY_ID` and `R2_CANONICAL_REGISTRY_SECRET_ACCESS_KEY` against
`R2_CANONICAL_REGISTRY_BUCKET_NAME`; it requires `ListObjectsV2` and `GetObject` for preflight and
reads, `PutObject` for canonical promotion/recovery, and `DeleteObject` for override removal and
compensation. `HeadObject` is additionally used only by the explicit registry smoke-test cleanup
confirmation. Both clients share only `R2_ENDPOINT`, `R2_REGION`, and the S3 path-style client;
they do not share credential values.

The replacement credentials must therefore be R2 S3-compatible object credentials, scoped to the
intended development bucket(s): the media credential to `lets-flex-media-dev`, and the registry
credential to `lets-flex-canonical-registry-dev`. Cloudflare's dashboard-level least-privilege
choice for these existing long-lived credentials is Object Read & Write with specific buckets;
that product permission includes object read, write, and list, so it is broader than the media
adapter's actual list usage but narrower than account-wide administration. Separate one-bucket
tokens preserve the repository's credential separation; a single token scoped to exactly both
development buckets is technically possible but is not required. A read-only token is sufficient
for reset/preflight-only access, but not for the normal development admin/upload and cleanup
workflow or baseline apply.

The repository validates that `R2_ENDPOINT` is an HTTPS endpoint and uses it for both clients, but
does not and cannot infer the Cloudflare account associated with opaque replacement access keys.
Account matching remains an owner-side check: compare the account ID in the endpoint with the
Cloudflare account that owns both development buckets and issued each replacement token. The
replacement token's bucket resource scope must name only the intended development bucket(s).
No production credentials or production bucket access is required by normal development
`db:reset`; it uses only the two development bucket variables and their corresponding credential
pairs, and its R2 work is read-only.

**Post-rotation acceptance:** After the owner rotated the exposed R2 credentials, the exact
`npm run db:reset` completed successfully against the development configuration. The canonical
registry preflight passed with 4 overrides; both reported media keys were verified without 403;
the disposable PostgreSQL reset, baseline seed, canonical recovery, and transaction commit all
passed. No production resource was accessed or mutated by this verification.

Action 6 is Ready for review. Its requested development acceptance criteria are satisfied: the
reachable environment uses only the development media and registry buckets, confirms the two
objects, and the corrected exact `npm run db:reset` succeeds without object replacement.

## Resume here

Actions 1 through 5 are Completed. Action 6 is Ready for review after the development R2
authorization correction; the original live production recovery acceptance evidence remains
recorded above.
