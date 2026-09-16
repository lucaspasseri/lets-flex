# Controlled production reconstruction checklist

Use this checklist for one explicitly approved production PostgreSQL reconstruction. It is based
on the successful `Canonical Media Recovery Rehearsal` run on 2026-09-16. That rehearsal used
production R2 read-only access and an ephemeral PostgreSQL 16 service; it did not reset production
PostgreSQL or write either R2 bucket.

Do not use the rehearsal workflow to reconstruct production. The real production path is the
manually dispatched `Production Deploy` GitHub Actions workflow. GitHub Actions owns the
production-preparation phase because this project does not use Render's Pre-Deploy Command
feature.

The preparation command runs once in GitHub Actions during one approved deployment. The surrounding
operational workflow is:

```text
owner approval → backup/PITR confirmation → read-only R2 checks
→ enable two temporary GitHub production-Environment reset values
→ one approved Production Deploy workflow
→ production:prepare → Render deploy hook
→ Render: npm install → node server.js
→ post-reset verification → remove the two temporary values
```

## 1. Approval and stop conditions

Before changing Render configuration, record all of the following in the recovery ticket or
incident record:

- the exact production database target, deployment revision, operator, approver, maintenance
  window, and expected start time;
- the successful rehearsal run URL and the current production registry override count `N`;
- confirmation that all writes are paused or the application is placed behind the organization's
  maintenance/traffic control. The repository has no verified maintenance-mode switch;
- the backup identifier and completion time from the prerequisite below;
- the rollback owner and the provider procedure for restoring that backup/PITR to the exact
  production database target.

Stop without enabling the reset values if any R2 preflight fails, the registry count is not
known, the database target is ambiguous, the backup cannot be restored, or the owner has not
explicitly approved the destructive operation.

## 2. Backup prerequisite

Complete and verify a provider-native PostgreSQL backup or point-in-time recovery marker for the
exact database identified by `DATABASE_URL`. The backup must complete before the reset values are
enabled. Record its immutable snapshot/restore identifier, completion timestamp, retention window,
and the person who confirmed it. Confirm that the provider can restore it to the production target
or to a controlled temporary target and that the rollback owner has access to do so.

This repository has no production backup or restore command. A database export that cannot be
located and restored is not a sufficient prerequisite. The R2 recovery design does not replace a
PostgreSQL backup: R2 preserves canonical media bytes and Admin selection metadata, not users,
workouts, authentication state, or other application data.

## 3. Read-only preflight before the reset

From a controlled workstation, or by using the already-successful GitHub `production` Environment
configuration, verify the production media bucket first:

```sh
CANONICAL_MEDIA_TARGET=production \
npm run media:baseline:provision -- --mode=verify
```

Then run the complete read-only baseline and private-registry preflight:

```sh
npm run media:durability:preflight
```

Both commands must use the production media R2 settings and the separate private canonical
registry settings. Accept only `missing=0` and `operational-failures=0` from the baseline check,
and a passed durability preflight with 70 baseline entries and `N` registry overrides. Existing
object byte drift is a warning and must be recorded; do not repair it as part of this reset.

The currently accepted production baseline is 70 existing/adopted objects, 69 byte-identical
objects, and one known byte-drift warning for `muscle:abductors`. If the current report differs,
stop and review the difference before proceeding.

The manually dispatched `Canonical Media Recovery Rehearsal` is the approved proof of the same
reconstruction sequence in a disposable database:

```text
read-only production R2 durability preflight
→ validated private-registry snapshot
→ disposable PostgreSQL 16 schema + canonical seed
→ stable-key registry restoration
→ strict post-restore verification
```

Do not proceed if that rehearsal is not successful against the current revision and current
production Environment configuration.

## 4. Required GitHub Actions production Environment configuration

Set these values in the GitHub Actions `production` Environment for one deployment only. Values marked
`required by the reset guard` must be exact.

| Variable                                  | Required value or presence                                        | Purpose                                                                     |
| ----------------------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `NODE_ENV`                                | `vars.NODE_ENV=production`                                        | Selects the production-only wrapper and guard.                              |
| `PRODUCTION_DATABASE_RESET_MODE`          | `vars.PRODUCTION_DATABASE_RESET_MODE=reset-and-restore`           | Required exact reset mode.                                                  |
| `ALLOW_PRODUCTION_DB_RESET`               | `secrets.ALLOW_PRODUCTION_DB_RESET=I_CONFIRM_PRODUCTION_DB_RESET` | Required exact destructive confirmation.                                    |
| `DATABASE_URL`                            | `secrets.DATABASE_URL` with the exact intended production URL     | Target to be reconstructed; local/development-looking targets are rejected. |
| `ADMIN_EMAIL`                             | `vars.ADMIN_EMAIL`                                                | Administrator recreated by the canonical seed.                              |
| `ADMIN_PASSWORD`                          | `secrets.ADMIN_PASSWORD`                                          | Hashed and used for the recreated administrator.                            |
| `MEDIA_PUBLIC_URL`                        | `vars.MEDIA_PUBLIC_URL`                                           | HTTPS public-media base validated by the preparation R2 adapter.            |
| `R2_BUCKET_NAME`                          | Production public-media bucket                                    | Verifies the media objects referenced by registry entries.                  |
| `R2_ENDPOINT`                             | HTTPS R2 endpoint                                                 | Shared R2 endpoint.                                                         |
| `R2_REGION`                               | Optional; defaults to `auto`                                      | Shared R2 region.                                                           |
| `R2_ACCESS_KEY_ID`                        | `secrets.R2_ACCESS_KEY_ID`                                        | Used for public-media reads.                                                |
| `R2_SECRET_ACCESS_KEY`                    | `secrets.R2_SECRET_ACCESS_KEY`                                    | Used for public-media reads.                                                |
| `R2_CANONICAL_REGISTRY_BUCKET_NAME`       | Separate private production registry bucket                       | Source of Admin canonical overrides.                                        |
| `R2_CANONICAL_REGISTRY_PREFIX`            | Configured registry prefix, such as `v1`                          | Registry object namespace.                                                  |
| `R2_CANONICAL_REGISTRY_ACCESS_KEY_ID`     | `secrets.R2_CANONICAL_REGISTRY_ACCESS_KEY_ID`                     | Used for private-registry reads.                                            |
| `R2_CANONICAL_REGISTRY_SECRET_ACCESS_KEY` | `secrets.R2_CANONICAL_REGISTRY_SECRET_ACCESS_KEY`                 | Used for private-registry reads.                                            |

`R2_BUCKET_NAME` and `R2_CANONICAL_REGISTRY_BUCKET_NAME` must be different. The media and
registry credentials must remain separate. Set `DATABASE_SSL=true` when the production provider
requires verified PostgreSQL TLS; map it as the non-sensitive `vars.DATABASE_SSL` setting. Map
`R2_REGION` and the bucket/prefix values through `vars.*`. The R2 endpoint is shared by both
clients. `RENDER_DEPLOY_HOOK_URL` remains a separate Environment Secret used only by the final
workflow step.

`OBJECT_STORAGE_PROVIDER` is not a `production:prepare` input; configure it as `r2` in Render's
runtime environment so the started application cannot fall back to local media storage.

Do not set `ALLOW_DATABASE_RESET=true`; that flag is for local/test reset and does not authorize
production. Do not set `ALLOW_PRODUCTION_DATABASE_MIGRATION` as a substitute; migration approval
never authorizes reset. Keep the normal application runtime secrets configured as usual, but do
not print any secret or place one in a command, ticket, or log.

## 5. Exact production execution

After the backup and read-only preflight gates pass, save the two temporary reset values in the
GitHub `production` Environment and manually dispatch the `Production Deploy` workflow exactly
once. It runs `npm run verify`, the complete durability preflight, and `npm run production:prepare`
in that order. Only after preparation succeeds does it invoke the Render Deploy Hook. Do not
dispatch `Canonical Media Recovery Rehearsal` for this step: its PostgreSQL target is intentionally
disposable. Render must retain only `npm install` as its build command and `node server.js` as its
start command; do not configure a Render Pre-Deploy Command.

Do not run `npm run db:reset`; it is development/test-only. Do not run the rehearsal command
against production `DATABASE_URL`. Do not run baseline `--mode=apply`, registry smoke tests,
R2 deletes, or any other R2 write as part of this operation.

The wrapper performs this order and aborts before destructive SQL when an earlier gate fails:

```text
exact production guard and target validation
→ private registry preflight + referenced public-media verification
→ schema recreation and 70-entry repository baseline seed
→ validated registry snapshot materialization by stable catalog key
→ administrator creation and transaction commit
→ strict registry restoration verification against PostgreSQL
```

Expected successful log shape is:

```text
[production-prepare] production preparation started
[production-prepare] reset mode detected: reset-and-restore
[production-prepare] authorization accepted
[production-prepare] destructive reset explicitly enabled
[production-prepare] registry preflight started
[production-prepare] registry entries validated: N
[production-prepare] media references verified: N
[production-prepare] canonical registry preflight passed
[production-prepare] PostgreSQL reset started
Canonical registry preflight passed (N override(s)).
Resetting and seeding the database...
[production-prepare] PostgreSQL reset transaction started
[production-prepare] canonical recovery started
[production-prepare] canonical recovery passed
[production-prepare] PostgreSQL reset transaction committed
Database seeded successfully.
Connection closed.
[production-prepare] PostgreSQL reset passed
[production-prepare] baseline seed and validated registry restoration completed
[production-prepare] post-restore verification started
[production-prepare] post-restore verification passed: N override(s)
[production-prepare] production preparation completed
```

`N` is the number read from the private registry at execution time; it is not necessarily 70.
The deployment is failed if the registry preflight, reset/seed, commit, or strict verification
fails. A failure before commit rolls back the reset transaction. A failure after the successful
commit requires the backup/PITR rollback procedure below.

## 6. PostgreSQL data destroyed and reconstructed

`db/schema.js` drops and recreates the complete application schema. Every existing row and its
database-generated IDs are destroyed, including:

- users, local/OAuth authentication identities, password-reset tokens, database-backed sessions,
  guest limits, and the existing administrator;
- programs, cycles, training days, sessions, session steps, workout sessions, workout-step logs,
  and workout-set logs;
- goals, step types, muscles, muscle roles, equipment, exercises, variants, relationships, and
  all catalog translations;
- `media_assets`, localized media alt text, `entity_media` assignments, and media-generation
  candidate metadata;
- the PostgreSQL tables/types and sequences themselves, which are recreated from the current
  authoritative schema.

The new database contains the current schema, canonical reference/catalog seed, translations,
starter workout, 70 repository-controlled canonical media assignments, and one administrator.
Admin-promoted canonical selections are then restored from the validated private registry. This
is a reconstruction, not a merge; data created after the backup and before the reset is also lost.

## 7. What remains in R2

The recovery path performs no R2 writes or deletes. It preserves:

- every existing object in the public media bucket, including the 70 baseline `assets/...` keys,
  Admin-uploaded objects, and unrelated/orphaned objects;
- every validated private registry JSON object under the configured prefix, including the stable
  entity key, selected media object key, metadata, canonical path, and localized alt text;
- any existing byte drift. R2 production bytes remain authoritative and are not replaced merely
  to match the repository file.

The reset recreates PostgreSQL references to these keys. It does not copy media to Render's local
filesystem, delete R2 orphans, update `data/canonical-media.json`, or alter registry objects.

## 8. Post-reset verification

Save the Render deployment log and verify all of the following before reopening writes:

1. The log contains `post-restore verification passed: N override(s)` and
   `production preparation completed`, with the same `N` captured by the preflight.
2. Repeat the read-only baseline check:

   ```sh
   CANONICAL_MEDIA_TARGET=production \
   npm run media:baseline:provision -- --mode=verify
   ```

   Require 70 baseline objects, `missing=0`, and `operational-failures=0`. The known
   `muscle:abductors` drift may remain as the recorded warning; no object should have been
   overwritten or deleted.

3. Repeat the complete read-only durability preflight:

   ```sh
   npm run media:durability:preflight
   ```

   Require a passed report with 70 baseline entries and the same `N` registry overrides.

4. Run the read-only database/R2 registry audit with the production application environment:

   ```sh
   npm run media:registry:audit
   ```

   Require every registry entry to agree on its stable catalog key, R2 object, metadata,
   localized alt text, and PostgreSQL assignment. Expect `Summary: N OK, 0 WARNING, 0 ERROR`;
   investigate any warning and stop for any error.

5. Open representative production surfaces: one baseline-only catalog media item and at least
   one known Admin-promoted item. Confirm the image renders from the expected R2-backed media
   path and the Admin item retains its selection and alt text. Confirm sign-in with the recreated
   administrator before reopening normal writes.

The strict verifier and registry audit prove the Admin-managed selection survived the database
reset. The 70-entry seed result plus the two post-reset R2 preflights prove the canonical baseline
keys remain available and reconstructable. They do not restore any user data; that is the role of
the PostgreSQL backup.

## 9. Rollback procedure

Use the branch that matches the failure point:

- **Preflight or configuration failure:** do not retry with broader permissions or altered bucket
  names. No destructive SQL has run. Correct the reviewed configuration, rerun the read-only
  checks, or abandon the operation.
- **Reset failure before commit:** the reset transaction issues `ROLLBACK`; keep the application
  closed, inspect the staged error, and verify the original database target before deciding
  whether to retry. R2 requires no rollback because it was not changed.
- **Commit succeeded but verification or acceptance failed:** keep writes paused and do not run
  another reset. Use the recorded provider snapshot/PITR procedure to restore the original
  PostgreSQL state to the exact production target. If the provider requires a temporary restore,
  validate it there first, then perform the provider-approved cutover/restore and redeploy the
  compatible application revision.
- **R2 observation differs:** do not delete or overwrite the object. Preserve the R2 state and
  investigate the reported missing, permission, or drift condition separately. The recovery path
  itself has no R2 mutation to undo.

After a database rollback, rerun the read-only registry audit and application smoke checks before
reopening writes. If the original backup cannot be restored, the operation is blocked; do not
attempt to recreate user or workout data from canonical media metadata.

## 10. Remove temporary reset authorization

Immediately after a successful reconstruction—or after abandoning it—remove or unset both values
from the GitHub Actions `production` Environment:

```text
PRODUCTION_DATABASE_RESET_MODE
ALLOW_PRODUCTION_DB_RESET
```

Leave them absent or empty for normal deployments. Verify the next ordinary preparation/deploy
log contains:

```text
[production-prepare] Production database reset not requested.
```

Do not leave either sentinel in a local `.env`, shell profile, CI variable, deployment template,
or incident transcript. Retain only the normal runtime configuration. If the reconstruction used
a temporary administrator password or temporary R2 credentials, rotate or remove them under the
owner's credential policy, then record the cleanup and the final database/R2 verification results.
