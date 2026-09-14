# Current Goal

## Goal: Post-goal cleanup, translation coverage, and CSS loading audit

### Status

**Completed:** 2026-09-14 after explicit user approval. Actions 1–3 are **Completed** after
verification.

### Objective

Perform a focused cleanup and consistency pass after the completed object-storage/media work:

1. Remove or consolidate files that are no longer necessary after media storage moved behind the
   object-storage boundary.
2. Find and fix remaining untranslated user-facing text while reusing the existing i18n system.
3. Diagnose and fix the initial CSS/style flash, especially browser-default white form controls.

Keep the implementation simple, predictable, and conservative. Investigate before changing or
deleting anything, and document what is removed, retained, updated, uncertain, or deferred.

### Verified baseline

- The previous object-storage goal's Actions 1–12 and corrective follow-up are completed. The
  current repository uses stable object keys, configured media URLs, R2-backed runtime selection,
  guarded reset reconstruction, and production refusal of the local persistent-media adapter.
- `data/canonical-media.json` is the durable canonical source and currently contains 70 entries.
  `db/mediaSeedSql.js` and the resolver still make local fallback/source-file assumptions that must
  be checked before removing anything under `public/media`.
- `public/media` contains 78 tracked files, and the ignored local `public/media/uploads` directory
  currently contains 73 files. Their roles must be classified before any deletion.
- The shared head now requests foundational theme/control styles directly before `/css/main.css`;
  `main.css` retains the later feature/component imports. The direct boundary avoids delaying the
  first-paint contract behind the nested `@import` chain while preserving the existing cascade.
- The English and Brazilian Portuguese locale files each contain 1,183 scalar keys with no key
  parity gaps. This does not prove that every user-facing literal or fallback/default is translated;
  the known `/history`, `/programs`, and `/library` flows still require a rendered audit.
- `docs/media-asset-provenance.md` contains historical local upload references that must be
  classified as historical, retained, or stale rather than removed blindly.

### Action status

1. **Repository cleanup after object-storage migration — Completed.** Audit `/docs`, `/data`, and
   `/public/media`; remove only verified obsolete files and update or remove obsolete documentation.
2. **Complete remaining translation coverage — Completed.** Audit all user-facing server and browser
   text, with special attention to `/history`, `/programs`, `/library`, modals, and dynamic states;
   verify both supported locales.
3. **Diagnose and fix the initial CSS/style flash — Completed.** Trace the actual EJS/layout and CSS
   loading path, then apply the smallest architectural fix for foundational theme and form-control
   styling without overlays or timing hacks.

### Scope and explicit deferrals

In scope: conservative repository cleanup, accurate media documentation, existing i18n coverage,
server-rendered and browser-generated user-facing strings, stylesheet ordering/loading, form-control
defaults, focused tests, startup/reset verification, and relevant manual rendering checks.

Deferred: unrelated redesign, broad accessibility remediation, new translation architecture,
destructive object-storage cleanup, migration redesign, production infrastructure changes, and any
file or asset whose purpose cannot be verified.

### Verification boundary

Required verification includes `npm run db:reset` only against the explicitly authorized local or
development target, `npm run dev` startup, media resolution and fallback behavior, both locales for
`/history`, `/programs`, `/library`, relevant modals, initial form rendering, and the repository's
format, lint, type, browser-type, test, and broad verification checks as applicable. No production,
object-storage, or unrelated database mutation is authorized by this goal.
