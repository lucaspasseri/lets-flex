# Production deployment gate

The manually triggered workflow at `.github/workflows/production-deploy.yml` is the normal
production deployment gate while Render Auto-Deploy is disabled:

```text
workflow_dispatch
→ checkout
→ setup Node
→ npm ci
→ npm run verify
→ canonical registry preflight
→ Render Deploy Hook
```

The canonical registry preflight is read-only. It validates registry objects against the
repository catalog definitions and verifies that each referenced `assets/...` object exists in the
production media bucket. It does not read or mutate PostgreSQL, write or delete R2 objects, or run
the database reset/recovery command. A failed verification or preflight step stops the job before
the Render Deploy Hook step.

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
