# Current Goal

## Goal: Professional object storage for media

### Status

**Active.** Actions 1–12 are **Completed** after explicit user approval and verification. No next
action is currently prepared.

### Objective

Separate media metadata and entity relationships from media bytes and application runtime
storage. Introduce Cloudflare R2 as the first provider through the AWS SDK for JavaScript v3,
while keeping application layers behind a small provider-independent storage boundary.

The production target is:

```text
PostgreSQL  → media metadata, canonical assignments, entity relationships
Object store → image bytes
Application  → provider-independent storage boundary and configured public URLs
```

The existing canonical-media workflow, resolver fallbacks, admin media operations, and
`npm run db:reset` behavior must remain predictable. Database reset may rebuild PostgreSQL
metadata and relationships, but must never reset or delete object-storage contents.

### Important invariants

- PostgreSQL owns media metadata and relationships. Object storage owns media bytes. Database
  resets must never implicitly reset object storage.
- Canonical promotion changes media meaning/assignment and should not normally require moving,
  duplicating, renaming, or reuploading a stored object.
- Persist stable object keys, not Cloudflare-specific URLs. Public URLs are derived from
  configuration at the application boundary.
- Credentials remain server-side and development and production buckets/credentials remain
  explicitly isolated.
- Existing admin authorization, CSRF protection, upload validation, MIME checks, and cleanup
  safeguards remain intact.

### Historical related work

Canonical Media Promotion was completed on 2026-09-14 immediately before this goal. Its verified
repository baseline is reusable: stable catalog identifiers, the `media_assets`/`entity_media`
model, transactional primary-assignment replacement, durable canonical manifest state, and the
Manage Media promotion workflow. That work intentionally used local storage; this goal addresses
the explicitly deferred provider/storage gap rather than redesigning canonical behavior.

### Action status

1. **Audit the current media/storage flow — Completed.** Findings and verification evidence are
   recorded in `docs/current-actions.md`; no runtime behavior was changed.
2. **Introduce the provider-independent storage boundary — Completed.** Preserve local behavior
   while moving provider-specific/file-system operations behind the application-owned contract.
3. **Add the S3-compatible R2 implementation — Completed.** Use `@aws-sdk/client-s3`; no
   presigned browser uploads.
4. **Verify R2 with a controlled development asset — Completed.** Use only an explicitly selected
   development bucket and disposable test object.
5. **Define and validate the object-key strategy — Completed.** Decide the stable key format before
   bulk migration or unnecessary renames.
6. **Migrate existing development canonical media — Completed.** Make the import rerunnable and
   retain local source files until verification is complete.
7. **Switch media reads to configured public URLs — Completed.** Preserve presentation-ready view
   models and resolver fallbacks. The configured development public-domain fetch is now verified.
8. **Move new Admin Media writes to R2 — Completed.** Define compensation for remote-write/DB-write
   partial failures and reference-aware deletion.
9. **Regression-test canonical promotion with R2-backed media — Completed.** Promotion changes
   database meaning/assignment while leaving the object unchanged; focused tests, the full suite,
   and real development R2-backed read/identity/byte verification passed.
10. **Verify database-reset reconstruction — Completed.** The guarded disposable reset
    reconstructs 70 media assets, 70 assignments, and 140 localized rows with manifest-matching
    R2 keys; the existing object remains byte-identical and application startup/resolution pass.
11. **Prepare production configuration/custom-domain steps — Completed.** Documented the manual
    production R2, public-domain, Render, isolation, rollout, and verification handoff without
    mutating Cloudflare, Render, DNS, or production infrastructure.
12. **Remove mutable local uploads as the persistent runtime store — Completed.** Production now
    rejects the local persistent-media adapter while development and fallback behavior remain.

### Scope and explicit deferrals

In scope: a small local adapter, one S3-compatible R2 adapter, configured public URL derivation,
safe development migration/import, admin read/write integration, cleanup behavior, reset
reconstruction, focused tests, and documentation.

Deferred: presigned/direct browser uploads, multipart large-file uploads, image transformations,
CDN optimization beyond basic delivery, lifecycle policies, complex garbage collection,
cross-region replication, other providers, production mutation/deployment, galleries, and broad
media-domain redesign.

### External/manual boundary

Cloudflare account credentials, R2 bucket creation/policies, custom domains/DNS, Render environment
variables, and production changes are user-controlled. The implementation may prepare exact
configuration and verification commands but must stop before mutating those systems without
explicit authorization.
