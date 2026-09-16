# Production deployment gate

The manually triggered workflow at `.github/workflows/production-deploy.yml` is the normal
production deployment gate while Render Auto-Deploy is disabled:

```text
workflow_dispatch
→ checkout
→ setup Node
→ npm ci
→ npm run verify
→ complete canonical media durability preflight
→ Render Deploy Hook
```

The complete canonical media durability preflight is read-only. It validates the repository
manifest, stable catalog identities, baseline `assets/...` objects, private registry objects, and
the R2 objects referenced by registry overrides. It does not read or mutate PostgreSQL, write or
delete R2 objects, or run the database reset/recovery command. A failed verification or preflight
step stops the job before the Render Deploy Hook step.

## Audit finding

The existing preflight behavior did not query PostgreSQL, but it was originally located in the
same module as database restoration and verification. Importing that combined module imported the
media repository and PostgreSQL pool as well. The preflight behavior is now extracted into
`canonicalMediaRegistryPreflight.js`; the reset/recovery module re-exports it for compatibility,
while the deployment command imports only the database-independent module.

## GitHub `production` environment configuration

Configure the following values on the repository's `production` environment. The workflow uses
GitHub Environment Variables for non-sensitive configuration and Environment Secrets for
credentials.

| Variable                                  | Required by preflight | Classification              | Purpose                                                                                              |
| ----------------------------------------- | --------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------- |
| `R2_BUCKET_NAME`                          | Yes                   | Non-sensitive configuration | Production media bucket checked for each registry entry's `asset.objectKey`.                         |
| `R2_ENDPOINT`                             | Yes                   | Non-sensitive configuration | Shared Cloudflare R2 S3 endpoint used by both clients. The canonical registry loader requires HTTPS. |
| `R2_REGION`                               | No                    | Non-sensitive configuration | Shared S3 region; defaults to `auto` when unset or empty.                                            |
| `R2_ACCESS_KEY_ID`                        | Yes                   | Credential                  | Read access to the production media bucket.                                                          |
| `R2_SECRET_ACCESS_KEY`                    | Yes                   | Credential                  | Secret for the production media-bucket access key.                                                   |
| `R2_CANONICAL_REGISTRY_BUCKET_NAME`       | Yes                   | Non-sensitive configuration | Private canonical registry bucket; it must be separate from `R2_BUCKET_NAME`.                        |
| `R2_CANONICAL_REGISTRY_PREFIX`            | Yes                   | Non-sensitive configuration | Registry object namespace, such as `v1`; it is not a URL.                                            |
| `R2_CANONICAL_REGISTRY_ACCESS_KEY_ID`     | Yes                   | Credential                  | Dedicated read access to the private canonical registry bucket.                                      |
| `R2_CANONICAL_REGISTRY_SECRET_ACCESS_KEY` | Yes                   | Credential                  | Secret for the dedicated registry access key.                                                        |

The registry uses dedicated credentials. It shares only `R2_ENDPOINT` and `R2_REGION` with the
general media client; it does not use the general media credentials for registry objects.

These application variables are intentionally not configured for the preflight step:

| Variable                                                           | Why it is excluded                                                                                              |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL` and other PostgreSQL settings                       | The extracted preflight module does not import the database pool or query PostgreSQL.                           |
| `OBJECT_STORAGE_PROVIDER` / `MEDIA_STORAGE_PROVIDER`               | Provider selection belongs to runtime media composition; the preflight directly creates its read-only R2 probe. |
| `MEDIA_PUBLIC_URL`                                                 | Object existence uses `HeadObject`; it does not construct a browser URL.                                        |
| `R2_DEVELOPMENT_BUCKET_NAME` and smoke-test confirmation variables | The deployment gate never runs the disposable development smoke tests.                                          |

`RENDER_DEPLOY_HOOK_URL` remains a separate `production` Environment Secret and is exposed only
to the final deployment step. The workflow does not expose any database or Render PostgreSQL URL.

## Baseline verification and recovery rehearsal

The production baseline command is intentionally separate from startup and deployment:

```sh
CANONICAL_MEDIA_TARGET=production \
npm run media:baseline:provision -- --mode=verify
```

`verify` performs read-only object reads. Existing production objects are adopted without byte
replacement; a byte difference from the repository source is a diagnostic drift warning, not a
failed verification. Missing objects are reported as missing, and only an explicitly confirmed
`apply` may conditionally create them. Authentication, permission, malformed configuration,
bucket, and other provider failures remain hard failures. No baseline command deletes R2 objects.

The manually dispatched `.github/workflows/canonical-media-recovery-rehearsal.yml` uses the
`production` Environment only for read-only R2 access and a local PostgreSQL 16 service for the
database lifecycle. It runs:

```text
complete read-only R2 preflight
→ capture validated private-registry snapshot
→ disposable schema + 70-entry baseline seed
→ stable-key registry restoration
→ strict PostgreSQL post-restore verification
```

The rehearsal must use separate read-only-capable production media and registry credentials. It
must not receive production `DATABASE_URL`, production reset authorization, or any credential
intended for R2 writes. A successful run proves that the current schema, baseline seed, durable
registry snapshot, and recovery verifier work together; it does not authorize a production reset.

## Manual production acceptance test

Run this procedure from a controlled workstation or by dispatching the recovery workflow after
confirming the production Environment configuration:

1. Confirm the production media bucket and private registry bucket are separate, and that the
   supplied R2 credentials can only perform the required read operations.
2. Set `CANONICAL_MEDIA_TARGET=production`, the production `R2_BUCKET_NAME`, `R2_ENDPOINT`,
   `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY`; set `R2_REGION` when it is not `auto`.
3. Run the read-only baseline verification command above. Accept only a report with
   `missing=0` and `operational-failures=0`; existing-object drift warnings may remain and must
   identify the entity, object key, expected/actual digest, byte lengths, and returned metadata.
4. Dispatch `Canonical Media Recovery Rehearsal` from the GitHub Actions `production` Environment.
   Confirm it reports a passed complete preflight and strict post-restore verification against the
   ephemeral PostgreSQL service.
5. Do not run `--mode=apply` or `npm run production:prepare` as part of this acceptance test. A
   missing-object repair or intentional production database reconstruction requires a separate
   reviewed approval and the command-specific confirmation safeguards.
