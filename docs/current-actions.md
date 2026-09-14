# Current Actions

## Current goal

Post-goal cleanup, translation coverage, and CSS loading audit.

## Goal status

**Completed:** 2026-09-14 after explicit user approval. Actions 1–3 are **Completed** after
verification.

## Verified baseline reused

- The completed object-storage goal and corrective follow-up are historical evidence, not work to
  reopen. Stable object keys, R2 selection, configured public URLs, reset reconstruction, fallback
  behavior, and production safeguards remain the baseline to preserve.
- `data/canonical-media.json` currently contains 70 entries; `public/media` has 78 tracked files;
  ignored `public/media/uploads` has 73 local files. Cleanup must classify references and runtime,
  seed, test, fallback, and historical roles before deletion.
- The shared head loads `/css/main.css`, whose 31 imports begin with `base.css` and later load form,
  component, and page styles. The suspected form-control flash remains an investigation item, not
  a confirmed root cause.
- `locales/en/common.json` and `locales/pt-BR/common.json` each contain 1,183 keys with no key
  parity gaps. Known route translation gaps must therefore be checked at the usage/default-literal
  and rendered-output level, not only by comparing JSON key sets.

## Proposed action sequence

### Action 1 — Repository cleanup after object-storage migration

**Status:** Completed

**Completed:** 2026-09-14 after explicit user approval

**Activated:** 2026-09-14 after explicit user approval

**Purpose:** Audit `docs`, `data`, and `public/media` against actual references, runtime use, reset
and seed behavior, tests, local fallback behavior, canonical reconstruction, and the completed
object-storage boundary. Delete or consolidate only files whose purpose and references are verified.

**Reviewable outcome:** Record files removed, files intentionally retained, documentation updated or
removed, and uncertain/deferred items. Keep canonical media, deterministic seed inputs, test
fixtures, fallback assets, and any required local development behavior.

### Investigation findings

- The current manifest contains 70 entries, all 70 have provider-neutral `storageKey` values, and
  all 70 repository source paths exist. The 68 catalog raster files plus two root static files are
  canonical seed inputs; seven additional root SVGs are resolver fallback assets, and the README is
  documentation rather than media.
- The ignored `public/media/uploads` directory contains 73 files and remains a local/deferred
  runtime and provenance boundary. Its files are not seed inputs merely because they exist. The
  three legacy JPEG findings and the unassigned reusable material remain uncertain and were not
  deleted.
- `scripts/migrate-canonical-media-to-r2.mjs` and `src/features/media/storage/migrateCanonicalMedia.js`
  were one-time canonical import tooling. Every current canonical entry is already mapped and the
  application promotion path handles future object-backed canonical assignments, so the command,
  module, test, and package script were obsolete and removed together.
- `src/features/media/mediaStorage.js` was an unused compatibility re-export. Repository runtime,
  tests, and package references now use `storage/localStorage.js` or the provider-independent
  factory directly, so the re-export was removed.

### Formatting correction requested during review

- `data/canonical-media.json` is valid, required project data, not malformed or obsolete output.
  It is imported by the canonical manifest, seed SQL/reset generation, media URL resolution, and
  media tests; `canonicalMediaManifestStore.js` also updates it as the durable canonical manifest.
  Repository-wide reference searches found no replacement or unused-only lifecycle.
- The format failure was purely indentation: the checked-in JSON and the manifest writer used
  JSON's two-space indentation, while the repository Prettier configuration requires tabs
  (`useTabs: true`). A semantic integrity check found 70 entries, unique assignments/paths/
  storage keys, required fields on every entry, and all 70 local source files present.
- Kept the manifest and formatted it with the repository formatter. Updated the manifest store to
  write tab-indented JSON and added a regression assertion so future canonical promotions do not
  recreate the format failure. No generated-file exclusion or deletion was used.

### Implementation completed

- Removed: `src/features/media/mediaStorage.js`; `scripts/migrate-canonical-media-to-r2.mjs`;
  `src/features/media/storage/migrateCanonicalMedia.js`; its focused test; and the
  `r2:migrate-canonical-media` package script.
- Retained intentionally: `data/canonical-media.json`, all 78 tracked `public/media` files,
  ignored uploads, the guarded `r2:smoke-test` tool, the canonical manifest store, private
  candidate storage, and historical database migrations. These still have verified seed, fallback,
  development, recovery, test, or operational purposes.
- Updated the root README, catalog identifier documentation, database setup documentation,
  provenance record, and `public/media/README.md` to reflect 70 canonical entries, provider-neutral
  object keys, local source-file requirements, and historical upload-key terminology.

### Verification evidence

- Manifest/source audit: 70 entries, 70 storage keys, and zero missing local source files.
- No executable, test, or package references remain to the removed compatibility or canonical-import
  files/command; historical tracking references are explicitly annotated.
- Focused seed/storage/R2-safety tests: **17/17 passed**.
- `npm run lint`: **passed**.
- `npm run check:types`: **passed**.
- `npm test`: **445 passed, 2 database-hook failures, and 4 cancellations out of 451 tests**. The
  failures were `EPERM` PostgreSQL connection errors from the sandbox; the remaining suite passed.
- `git diff --check`: **passed**.
- `npm run format:check`: **passed** after formatting `data/canonical-media.json`.
- Canonical manifest, seed, media-resolution, promotion, and R2 URL tests: **40/40 passed**.
- `npm run check:browser-types`: **passed**.
- `npm run db:seed:sql`: **passed**.
- `npm run verify`: format, lint, type, and browser-type checks passed; the test phase retained
  the sandbox-only PostgreSQL `EPERM` connection failures noted above.

### Review notes

- No files were removed from `docs`, `data`, or `public/media`; their verified roles require
  retention. The cleanup is limited to obsolete source/package migration artifacts and stale
  documentation statements.
- Local uploads and legacy provenance findings remain explicitly deferred because deletion would
  require stronger source, assignment, fallback, and recovery evidence.

### Completion summary

Action 1 cleanup and the requested `data/canonical-media.json` lifecycle/formatting correction
were accepted. The canonical manifest remains retained and formatted, obsolete migration artifacts
were removed, required media/reset/seed behavior was preserved, and the recorded verification
evidence passed subject only to the sandbox PostgreSQL connection limitation.

### Resume here

Action 1 is **Completed**. Action 2 is **Completed**. Action 3 is **Completed** after the
first-paint correction.

### Action 2 — Complete remaining translation coverage

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval

**Completed:** 2026-09-14 after explicit user approval

### Investigation baseline

- English and Brazilian Portuguese locale resources have matching keys, and the existing production
  reference test resolves the translated server/browser keys in both locales.
- The remaining verified gaps are user-facing literals bypassing that contract: Programs create and
  delete form view models, Library delete/private-variant controls, and History empty/fallback
  labels. The audit also found equivalent fallback gaps in Progress, Dashboard workout controls,
  and Program Day navigation, plus a database fallback label for unnamed history/progress sessions.
  Library's browser-generated counters and collection messages already use the rendered
  `data-i18n-messages` contract and are retained.
- Domain names, exercise names, program names, notes, and database-backed catalog labels remain
  user/content data rather than interface copy. Internal logs, IDs, DOM selectors, and form field
  names remain intentionally untranslated.

### Review corrections requested and correction completed

- Investigate and correct untranslated database-backed Goal select options in Portuguese while
  preserving stable goal IDs and canonical values.
- Investigate and correct untranslated Step Type select options in both session create and edit
  flows while preserving stable step-type IDs and submitted values.
- Trace History step-name/type presentation, distinguish user-authored names from catalog labels,
  remove unintended bilingual `English (Portuguese)` output, and keep user-authored names intact.
- Audit equivalent catalog-backed selects in the Action 2 flows, add focused regression coverage,
  and repeat the relevant verification before returning this action to review.

### Correction completed

- Root cause: Goals and step types are fixed canonical database enums without catalog-translation
  tables. The Goal form used `formatGoalLabel(goal.name)` and the session form used the mapped
  `stepType.name` directly, so both bypassed i18next. Library session details likewise rendered
  the canonical step type directly; History carried its raw `step_type_name` through its ViewModel
  without localizing it.
- Added presentation-only mappings for the seven stable Goal identifiers and six stable Step Type
  identifiers. Portuguese labels include `Hipertrofia`, `Força`, `Perda de peso`, `Condicionamento`,
  `Mobilidade`, `Reabilitação`, `Condicionamento geral`, `Exercício`, `Aquecimento`, `Cardio`,
  `Alongamento`, `Mobilidade`, and `Desaquecimento`. English mappings remain explicit English.
- Reused the same Step Type mapping in session create and update forms, Library session details,
  and History details. History now presents the localized system step type separately while
  preserving `session_step.name` as user-authored content. No `English (Portuguese)` composition is
  constructed by the corrected paths.
- The focused equivalent-select audit found that exercise, movement-pattern, equipment, and muscle
  options in Library already receive locale-aware repository values; their templates pass those
  values through as labels while preserving IDs. Session names, exercise names, variant names, and
  notes remain content rather than interface labels.
- Stable goal IDs, step-type IDs, submitted values, canonical database names, catalog translation
  records, and request contracts were not changed.

### Additional review correction requested

- Investigate why POST-backed language switching redirects to `/dashboard`, preserve the current
  safe internal pathname and query string, reject external/open-redirect targets, verify guest and
  authenticated behavior, and add focused regression coverage without changing locale/session or
  CSRF behavior.

### Locale return-path correction completed

- Root cause: the shared POST-backed language switcher rendered only `_csrf` and `locale`; it did
  not submit the server-derived `page.url`. The locale controller therefore had no explicit page
  context and ultimately redirected to `/`, which is this application's dashboard route (there is
  no separate `/dashboard` route). Its existing same-origin `Referer` fallback was not a reliable
  primary navigation contract.
- Chosen strategy: each application-chrome language form now posts the current server-rendered
  `page.url` as `returnTo`. This preserves pathname and query parameters for Library tabs,
  history pagination, and nested Program Day URLs while retaining the existing POST, CSRF, session
  locale assignment, and session-save ordering.
- Security: `returnTo` remains client-controlled at the HTTP boundary and is never trusted merely
  because it came from a hidden field. `safeReturnTo` now accepts only a relative path beginning
  with one slash, rejects protocol-relative, backslash-based, absolute, and control-character
  variants, and confirms URL resolution remains on the local origin. Invalid or unavailable paths
  fall back to `/` (the dashboard route). The existing same-origin `Referer` fallback remains a
  compatibility path when an empty return value is explicitly supplied.
- Authenticated member and guest application-chrome render tests both verify the explicit return
  field, and locale-controller tests verify locale persistence, query/nested-path preservation,
  external/protocol-relative/backslash rejection, same-origin compatibility fallback, and
  dashboard fallback.

### Additional review correction requested — historical catalog-name presentation

- Identify catalog-controlled historical exercise/entity names separately from user-authored plan
  labels and system step-type labels. Keep canonical English snapshot names as the base display;
  append Portuguese only for catalog-backed exercise and global-variant names when `pt-BR` is active.
- Preserve `session_step.name`/historical `step.name` exactly as entered, and keep `stepTypeName` as
  the active-locale system label only. Do not expand bilingual presentation to user-authored session,
  program, or plan names.
- Add focused coverage for translated, missing, English, effectively identical, user-authored, and
  system-label cases before returning Action 2 to review.

### Historical catalog-name correction completed

- The historical detail query already retained immutable English snapshot names and catalog IDs in
  `workout_step_logs`. It did not load the linked catalog's Portuguese translations, so the detail
  ViewModel could only show the canonical snapshot. The query now reads `pt-BR` translations for the
  linked exercise and global exercise variant; private/user-owned variants receive no catalog
  translation.
- Added `formatCatalogDisplayName`, a presentation helper used by the history detail ViewModel. It
  returns canonical English for `en`, canonical-only when Portuguese is missing, and
  `Canonical (Portuguese)` for distinct `pt-BR` translations. It trims and normalizes whitespace/
  case for equality checks, preventing empty parentheses or duplicate labels.
- Variant titles and exercise metadata use the bilingual formatter. Historical plan labels remain
  raw user-authored content, and step type continues through the existing localized system-label
  helper only (`Exercício`, not `Exercise (Exercício)`). Existing snapshot behavior remains intact.

**Purpose:** Audit all user-facing server-rendered and browser-generated text, with particular
attention to `/history`, `/programs`, `/library`, reusable modals, titles, descriptions, buttons,
labels, empty/error/success states, filters, helper text, validation messages, and dynamic strings.
Reuse the existing i18next/browser message contract and avoid translating internal logs, IDs, or
technical-only values.

**Reviewable outcome:** Record untranslated areas discovered, strings moved into the translation
system, reusable components corrected, intentionally untranslated technical/internal strings, and
verification for English and Brazilian Portuguese flows.

### Implementation completed

- Routed Programs create-program, create-cycle, and delete-program/delete-cycle form copy through
  the existing view-model translator and passed the active translator into the shared form fields.
- Routed Library delete/archive actions, private-variant controls, base-exercise labels, session
  date/day fallbacks, bodyweight labels, and load-unit options through locale resources. Preserved
  stable entity IDs, form names, and submitted unit values.
- Routed History empty states, unavailable/unnamed program labels, step fallbacks, and unnamed
  session fallbacks through locale resources. Progress now localizes unavailable selections and
  unnamed session fallbacks. Dashboard workout headings/step fallbacks/units and Program Day
  navigation labels and descriptions now use the same contract.
- Removed the hard-coded `Workout session` fallback from history/progress SQL and mappers. The
  persisted session name remains nullable; the presentation view models supply the active-locale
  fallback (`history.unnamedSession` or `progress.unnamedSession`).
- Added the new keys to both `en` and `pt-BR`. The existing browser message contract remains the
  source for dynamic Library messages; no duplicate browser translation implementation was added.
- Updated one dashboard regression assertion from the old all-caps English literal to the active
  translated rendering.

### Intentionally untranslated or deferred

- User-provided program, session, exercise, variant, and note names remain content and are not
  translated. Database values, IDs, DOM selectors, form names, submitted unit identifiers, and
  internal error/log text remain technical values.
- Unit short symbols (`kg`, `lb`) remain stable display symbols; long labels and selectable unit
  copy use locale resources. The unreferenced `createArchiveSessionFormViewModel.js` remains a
  separate stale file candidate and was not deleted as part of translation coverage.
- Media-management copy already uses `translate(...)`; fallback literals in translation calls are
  safe English defaults, not bypasses. Existing recovery-state constants are translated at their
  response boundary and were not duplicated in the view models.

### Verification evidence

- Locale resource parity/reference contract: **8/8 focused i18n tests passed**; all production
  translation references resolve in both locales.
- Focused Programs/Library/History/Progress/Day/Dashboard view-model tests: **45/45 passed**.
- Focused history/progress data, view-model, and page tests after nullable session fallback change:
  **22/22 passed**.
- Browser Library/workout interaction tests: **11/11 passed**.
- `npm run verify`: **passed** — Prettier format check, ESLint, backend types, browser types, and
  **463/463 repository tests** passed with no cancellations or skips.
- New focused regression coverage: Goal labels in English/Portuguese with stable IDs; Step Type
  labels in English/Portuguese for both create/update forms; Library detail localization without
  bilingual labels; and History system-label localization with preserved user-authored names.
- `npm run dev`: **started successfully** and listened on `http://localhost:3000`; the smoke
  process was stopped after confirming startup.
- Both localized page suites for History, Progress, Library, and core internationalization passed;
  the repository's Portuguese rendering assertions remain green. No database reset was required
  because this action changed no schema or seed data; canonical database setup tests passed as part
  of the full verification.
- Language-switch return-path correction: **15/15 focused tests passed**, covering locale update,
  Library-style query preservation, nested resource preservation, authenticated member and guest
  chrome rendering, malicious/external return rejection, same-origin compatibility fallback, and
  dashboard fallback. `npm run format:check`, `npm run lint`, `npm run check:types`, and
  `npm run check:browser-types` all passed after the correction.
- Historical catalog-name correction: **17/17 focused tests passed**, covering Portuguese bilingual
  catalog names, missing translations, English-only output, effectively identical labels, preserved
  user-authored plan labels, localized step types, query mapping, and rendered history detail output.

### Completion summary

Action 2's verified translation gaps are corrected across the requested flows and adjacent shared
fallback paths. Locale resources remain in parity, fixed enum labels use the presentation
translation boundary, historical catalog names now support controlled English/Portuguese display,
and the language switcher returns to a validated explicit internal path without changing locale,
session, CSRF, or authentication behavior. User-authored and technical/content values remain stable.

### Resume here

Action 2 is **Completed**. Action 3 is **Completed** after its first-paint correction.

### Action 3 — Diagnose and fix the initial CSS/style flash

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval

**Completed:** 2026-09-14 after explicit user approval

### Review correction requested

- Investigate the remaining first-paint color flash beyond native-control defaults. Verify the
  stylesheet request/import order, foundational-token availability, delayed component rules,
  conditional loading, View Transitions, browser defaults, and competing overrides.
- Reduce the import-chain delay with a simple deterministic stylesheet boundary so foundational
  theme/control styling is requested independently and before the feature/component chain.
- Add architectural regression coverage for the head order and foundational rules, repeat full
  verification, and document the unavailable live-browser evidence without claiming visual proof.

### Verified investigation baseline

- `views/partials/pages/head.ejs` loads `/css/main.css` from the shared head, and `main.css` begins
  with `base.css` before the page/component imports. There is no browser script, loading overlay, or
  timing hook that hides the document before styling.
- `base.css` establishes the dark page variables and body surface, but it does not establish a
  dark native color scheme or foundational text/background styles for `button`, `input`, `select`,
  and `textarea`.
- Later form styles cover `.form-input`, `.form-select`, `.form-textarea`, and the legacy `.forms`
  scope only. Native controls outside those selectors can therefore expose browser-default white
  styling during the initial stylesheet/import path; this is a missing foundational contract, not a
  reason to add a timing workaround.
- No browser executable is available in this environment, so live paint timing and viewport
  screenshots cannot be claimed as verified. Static CSS contracts, rendered HTML, and automated
  repository checks will be used; the manual visual limitation will remain documented.

### Chosen correction

Add the native dark color scheme and conservative inherited text/background defaults for form
controls to the earliest `base.css` layer. Keep the existing component rules as the detailed
presentation contract, avoid duplicated component declarations, and add a focused CSS regression
test. Preserve the existing EJS layout, stylesheet order, browser initialization, and responsive
behavior.

### Review correction investigation and implementation

- The original generated `<head>` requested only `/css/main.css`. `main.css` then discovered
  `base.css` and every shared/page stylesheet through CSS `@import` rules. This made the earliest
  theme/control layer dependent on the initial stylesheet response and its import chain rather than
  being an independently requested resource.
- `base.css` was the first import inside that chain and did define the palette, but component-level
  button, form, border, and focus rules arrived later. There are no conditional stylesheet links,
  font files, or browser scripts that set the theme before paint. View Transitions are limited to
  the existing 100ms root transition and cannot explain the same flash on hard refresh; they remain
  unchanged.
- The generated HTML now requests `/css/base.css`, the shared legacy/new form styles, and
  `/css/components/button.css` before `/css/main.css`. The corresponding imports were removed from
  `main.css`, so those rules are not fetched twice or applied through a delayed nested import.
  Remaining feature/component imports stay in their established cascade order after the early
  foundation/control boundary.
- The foundational layer now also includes token-based border and focus defaults. Later component
  rules retain their existing detailed colors, radii, transitions, and accessibility states; no
  JavaScript hiding, opacity gate, loading overlay, timer, or literal color duplication was added.

### Review correction verification

- Generated-head ordering regression: **1/1 passed**; it verifies the rendered `<head>` places
  base, form, and button styles before the feature chain.
- Focused CSS suite including the new architecture test: **20/20 passed**.
- `npm run verify`: **passed** — formatting, lint, backend types, browser types, and **465/465
  repository tests** passed with no failures, cancellations, or skips.
- `git diff --check`: **passed**.
- Direct non-watch server startup continued to listen successfully with non-secret local OAuth
  placeholders. `npm run dev` remains blocked only by this environment's Node watch limit
  (`EMFILE`).
- No browser executable is available for throttled hard-refresh, redirect, locale-navigation, or
  viewport paint inspection. The generated HTML/CSS dependency path and automated guarantees are
  verified; the actual visual first-paint effect remains an explicitly documented manual check.

### Implementation completed

- Added `color-scheme: dark` to the foundational `:root` contract so native controls use the
  product's dark color scheme before component-specific form styles apply.
- Added inherited text color, dark page-surface background, and inherited font defaults for native
  `button`, `input`, `select`, and `textarea` controls in `base.css`. The existing `.form-*` and
  legacy `.forms` rules remain the detailed component contract; no duplicate component styling,
  overlay, timeout, or JavaScript page hiding was introduced.
- Added `public/css/base.test.js` to lock the first-paint color-scheme and native-control defaults.
  The shared EJS layout, `/css/main.css` import order, browser initialization, responsive rules,
  and accessibility interaction contracts were not changed.

### Verification evidence

- Focused CSS regression test: **1/1 passed**.
- `npm run verify`: **passed** — formatting, lint, backend types, browser types, and **464/464
  repository tests** passed with no failures, cancellations, or skips. The run used the explicitly
  configured local PostgreSQL test database; no production or database reset operation was used.
- `git diff --check`: **passed**.
- Direct startup smoke with local `.env` and non-secret placeholder OAuth configuration: server
  listened on `http://localhost:3000` successfully.
- `npm run dev`: **not available in this environment** because Node's watch mode hit the process
  file-watch limit (`EMFILE`). This is an environment limit rather than an application startup
  error; direct non-watch startup passed.
- Live browser paint timing, screenshots, and keyboard/viewport inspection remain unavailable
  because no browser executable is present. Static CSS contracts and the complete automated suite
  passed; manual visual verification remains the only deferred check.

### Completion summary

Action 3's missing foundational control contract and delayed first-paint dependency are corrected.
Native controls now receive dark-scheme, text, surface, border, focus, and font defaults through an
independent early stylesheet boundary, while the existing layout, cascade intent, and interaction
architecture remain unchanged.

**Purpose:** Trace the rendered EJS/layout structure and actual stylesheet order from the first
`<link>` through imports and browser scripts. Determine whether the flash comes from import
waterfall/order, missing foundational form defaults, specificity, late-added styles, or another
rendering factor. Then apply the smallest architectural fix.

**Reviewable outcome:** Foundational dark theme, text, and form-control styles are available as
early as reasonably possible; no loading overlay, artificial timeout, JavaScript page hiding,
duplicated CSS, or excessive `!important` is introduced. Check responsive/component regressions and
representative initial form rendering.

## Resume here

Action 2 is **Completed**. Action 3 is **Completed** after the requested first-paint correction.

## Final goal review

### Completed outcome

- Repository cleanup retained required canonical media/reset/seed behavior and removed only verified
  obsolete migration/compatibility artifacts.
- Translation coverage was completed across the audited History, Programs, Library, Progress,
  Dashboard, Program Day, modal, and browser-message flows. Locale switching preserves safe internal
  paths and query parameters, and historical catalog names use the approved bilingual Portuguese
  presentation without translating user-authored labels.
- The CSS first-paint correction separates the foundational theme and high-frequency control rules
  from the delayed feature import chain. No JavaScript hiding, overlay, timer, or visual redesign was
  introduced.

### Verification against the goal boundary

- Repository format, lint, backend types, browser types, and full tests: **passed**; final
  `npm run verify` completed with **465/465 tests passed**, zero failures, cancellations, or skips.
- Canonical media, reset/seed, fallback, localization, language-switch, and historical-detail
  regressions remain covered by the recorded focused suites and the final full verification.
- Direct server startup passed with non-secret local OAuth placeholders. The watch-mode `npm run dev`
  smoke was limited by the environment's `EMFILE` file-watch ceiling, not application startup.

### Remaining limitation and intentional exclusion

- Live browser paint timing, throttled refresh/redirect flows, screenshots, and viewport/keyboard
  inspection could not be performed because this environment has no browser executable. The
  generated `<head>` order, CSS dependency boundary, rendered-template tests, and automated suite
  are verified; manual visual confirmation remains the only unmet verification item.
- No unrelated redesign, broad accessibility audit, production mutation, destructive media cleanup,
  or migration redesign was introduced.

---

## Historical record — Professional object storage for media

## Current goal

Professional object storage for media without breaking the canonical-media workflow.

## Goal status

**Active.** Actions 9–12 are **Completed** after explicit user approval and verification. No next
action is currently prepared.

## Historical baseline reused

The completed Canonical Media Promotion work is historical evidence, not a second active goal.
The repository currently contains stable catalog-key resolution, durable canonical manifest data,
transactional primary assignment replacement, Manage Media promotion, and local media storage.
Those behaviors are preserved as the starting point for this goal.

## Action 1 — Audit the current media/storage flow

**Status:** Completed

**Started:** 2026-09-14

**Completed:** 2026-09-14 after explicit user approval

**Purpose:** Verify the repository rather than relying on the supplied goal’s assumptions, document
the current responsibilities and coupling points, and propose the smallest safe Action 2 change.

### Verified current flow

#### File and byte storage

- Public runtime files are served by `express.static(path.join(__dirname, "public"))` in
  `app.js`. A stored key such as `/media/uploads/<uuid>.png` is therefore also currently a
  browser URL.
- The now-removed `src/features/media/mediaStorage.js` implemented `createLocalMediaStorage`. It
  defaulted to
  `public/media/uploads`, generates UUID filenames, writes with `flag: "wx"`, returns a
  `/media/uploads/...` key, and exposes `save`, returned-object `remove`, `exists`, and `read`.
  Reads are path-contained by configured public-prefix/root checks.
- `src/features/media/mediaCandidateStorage.js` is a separate private local store under
  `var/media/candidates`, with UUID keys, mode `0600`, and `save`/`read`/`remove`. It is used for
  unapproved generated candidates and is not exposed through normal media resolution.
- `public/media/catalog` contains 68 tracked files, while the ignored local
  `public/media/uploads` directory currently contains 73 files. Repository fallback/static media
  remains under `public/media` as SVG files. The current checkout therefore has a substantial
  local runtime-media footprint that must not be deleted during migration.
- `src/features/media/manageMedia.js` writes uploaded bytes before its PostgreSQL transaction and
  removes the new local file if the transaction fails.
- `src/features/media/approveMediaGenerationCandidate.js` reads a private candidate, writes a new
  public local asset before the database transaction, removes it on DB failure, and separately
  attempts private-candidate cleanup after approval.
- `src/features/media/promoteMediaToCanonical.js` reads from local uploads/static media and copies
  bytes into deterministic local `public/media/catalog/promoted/...` storage before updating the
  canonical manifest and primary assignment. This is the existing behavior to preserve while
  Action 2 establishes the boundary; Action 9 must explicitly remove unnecessary copy/reupload
  behavior for object-backed canonical promotion.

#### Database representation

- `db/mediaSql.js` defines `media_assets` with identity, `storage_key`, MIME type, dimensions,
  source, one non-localized alt text, and creation time. `storage_key` is unique but has no
  provider-neutral/object-key semantics enforced by the schema.
- `media_asset_alt_texts` owns localized English and Brazilian Portuguese descriptions.
- `entity_media` links an asset to one supported entity type/id and only permits the `primary`
  role. A unique `(entity_type, entity_id, role)` constraint gives the existing assignment
  replacement/idempotency behavior. `ON DELETE RESTRICT` preserves referenced assets.
- `mediaRepository.js` persists and returns `storage_key`; it does not access the filesystem.
  `removePrimaryMedia` removes only the relationship. The existing management workflow therefore
  already avoids deleting bytes merely because one assignment is removed.

#### Canonical promotion and durable state

- `data/canonical-media.json` is the durable canonical source. The current file has 70 entries and
  all referenced local files exist. The prior tracking documents described 68 entries, which is
  stale relative to the repository and tests; repository state is authoritative.
- `src/features/media/mediaManifest.js` imports that JSON and derives the resolver-facing
  `mediaManifest`; it currently passes each entry’s `path` directly through as `src`.
- `canonicalMediaManifestStore.js` performs fresh reads and serialized atomic same-directory JSON
  replacement. This is a repository-file maintenance boundary, separate from byte storage.
- `promoteMediaToCanonical` resolves a numeric entity to a stable `catalog_key`, validates the
  asset/source/metadata, copies bytes to a deterministic local canonical path, updates the JSON,
  creates a curated `media_assets` row, and transactionally replaces the primary assignment. It
  compensates the manifest/file when the PostgreSQL transaction fails. It intentionally leaves
  previous reusable assets/files intact.

#### Reset and seed flow

- `npm run db:reset` invokes `db/seed.js`, which is the authoritative schema-reset and seed entry
  point. It is guarded against production, requires `ALLOW_DATABASE_RESET=true`, and requires a
  local or explicitly development/test-named database.
- `db/mediaSeedSql.js` imports the canonical manifest, validates stable entity keys, metadata,
  localized alt text, duplicate assignments, and then checks every `entry.path` under the local
  `public` directory with `existsSync` before generating SQL.
- The seed resolves stable catalog keys to fresh numeric IDs and inserts `media_assets`,
  `entity_media`, and localized alt-text rows. It does not mutate or delete media files or any
  remote bucket. This is the desired database/object-storage lifecycle invariant, but the local
  file-existence check and `/media/...` path model must evolve before remote-only reads work.

#### Presentation surfaces

- `loadMediaAssignments.js` loads assignments for Library, day/workout, and Dashboard pages.
  `createMediaResolver.js` and `resolveEntityMedia.js` resolve direct/inherited persistent media
  before existing movement, environment, category, and initial fallbacks.
- A persistent assignment currently returns `src: asset.storage_key`; static manifest resolution
  returns a `/media/...` path. View models pass presentation-ready `{src, alt, width, height,...}`
  values to the shared `views/partials/shared/components/media.ejs` component.
- Verified consumers include Library exercise/session media, day/workout media, Dashboard/workout
  media, and Admin Manage Media previews. Templates do not know about R2/S3 commands or credentials.
- The only explicit HTTP byte read outside public static serving is the private generated-candidate
  preview in `mediaManagementController.js`, which reads through the private candidate storage
  helper and sends bytes with a private/no-store response.

### Responsibility map

| Responsibility                                     | Current owner                                                               | Action 2 implication                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Media identity, MIME, dimensions, source, alt text | `media_assets` and localized table                                          | Preserve; storage changes must not alter meaning.                                                          |
| Entity assignment, primary role, replacement       | `entity_media` and media repository/service                                 | Preserve transactional/idempotent domain behavior.                                                         |
| Canonical stable identity and reset reconstruction | `data/canonical-media.json`, manifest store, seed SQL                       | Preserve stable catalog keys; replace local path assumptions with storage keys at a later approved action. |
| Public/private byte writes and reads               | Local adapters plus `express.static`                                        | Move behind one provider-independent public boundary; keep private candidate access separately scoped.     |
| Public URL derivation                              | Currently implicit in `/public` static serving and persisted path-like keys | Add configured `MEDIA_PUBLIC_URL`/equivalent at a later action; do not persist provider URLs.              |
| Presentation and fallback behavior                 | Resolver, view models, shared EJS media component                           | Continue receiving presentation-ready values; no provider details in views.                                |

### Coupling points to move behind the storage boundary

1. `manageMedia.js`, `approveMediaGenerationCandidate.js`, and `promoteMediaToCanonical.js`
   instantiate `createLocalMediaStorage` directly or type their dependencies as that concrete
   return type. They should depend on an application-owned contract supplied by composition/wiring.
2. The local adapter currently combines object-key generation, local public-prefix construction,
   path traversal protection, and filesystem operations. The future contract should separate the
   stable storage key from any local URL prefix.
3. `promoteMediaToCanonical.js` imports `node:path` and hard-codes `public/media/...` roots. Its
   domain operation must retain the stable-key/manifest/assignment rules while storage paths move
   behind the adapter.
4. `db/mediaSeedSql.js` directly maps a persisted public path to a local file and requires
   `existsSync`. Remote-backed seed reconstruction needs a provider-neutral reference check or a
   deliberately separate verification/import step; reset must never delete remote objects.
5. `resolveEntityMedia.js` and `mediaManifest.js` return persisted/local paths as `src`. They are
   the read-side seam for deriving a configured public URL without changing EJS contracts.
6. `app.js` injects generation/promotion dependencies but has no shared media-storage composition
   boundary. Application wiring must provide the selected adapter without exposing credentials to
   request/view layers.

### Existing R2 preparation and discrepancy

- `@aws-sdk/client-s3` is already present in `package.json`/`package-lock.json`, and
  `scripts/r2-smoke-test.mjs` already performs a disposable Put/Get/Delete against a configured
  S3-compatible endpoint.
- `.env.sample` currently documents only `R2_BUCKET_NAME`, `R2_ENDPOINT`, `R2_REGION`,
  `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY`. It does not yet document provider selection,
  development/production media separation, or a configured public media base URL.
- No application runtime code imports the R2 SDK; the smoke script is an isolated preparation
  artifact, not an object-storage adapter. No real R2 integration was run in this audit, and no
  credentials or environment values were exposed.

### Proposed minimal Action 2

1. Define a small application-owned public-media contract covering the operations already required
   by the current workflows: put bytes with content metadata and a generated/supplied stable key,
   delete one object, test existence where needed for safe cleanup/idempotency, and derive a
   configured public URL. Keep read/download only if the current promotion/import flow requires it;
   do not create a broad generic storage framework.
2. Adapt the existing local implementation to that contract without changing its effective local
   behavior or deleting existing files. Keep the private candidate store scoped and separately
   provider-independent where its current workflow requires it.
3. Inject the local adapter from application composition into upload, approval, promotion, and
   any read-side URL boundary. Remove direct concrete-constructor dependencies from those layers.
4. Add focused contract tests for local put/delete/exists/public-URL behavior, traversal/key
   validation, and failure cleanup. Do not add R2 network tests to the automated suite.
5. Update configuration documentation only as needed to make the future provider selection and
   development isolation explicit; defer actual R2 selection/migration to later actions.

### Risks and unresolved decisions for later actions

- The current canonical manifest field is named `path` and is a local browser path. Converting it
  to a stable object key affects seed validation, resolver URLs, canonical promotion, and existing
  tests; choose and document the compatibility strategy before changing records.
- Repository-tracked canonical files and ignored upload originals have different durability and
  deployment behavior. Do not bulk-upload or delete them until the development-bucket scope and
  rerunnable import policy are approved and verified.
- Remote object mutations cannot participate in the PostgreSQL transaction. Upload-then-DB and
  delete/reference behavior require explicit compensation and logging at the write boundary.
- Existing focused baseline test `src/features/media/media.test.js` fails because it expects 68
  canonical entries/76 assets while the current manifest resolves 70 canonical entries/78 assets.
  This audit records the discrepancy; repairing that unrelated stale expectation is deferred.

### Verification evidence

- Repository inspection covered application wiring, media adapters/services/repositories/resolvers,
  seed/schema code, views, configuration sample, tracked/ignored media, and recent storage history.
- Canonical manifest/file consistency check: 70 entries, no missing local files.
- Focused baseline: 22 passing, 1 failing. Passing tests covered seed validation, local storage,
  resolver behavior, and media boundaries; the failure is the stale count assertion described above.
- No source/runtime behavior was changed in Action 1. No R2 network call, database reset, upload,
  migration, deployment, or production mutation was performed.

### Completion summary

Action 1 is accepted. The current media responsibilities, filesystem/storage coupling points,
provider-preparation discrepancy, stable-key risks, and smallest proposed local-boundary change
are documented. The stale manifest-count test is intentionally deferred as unrelated repair work.

## Action 2 — Introduce the provider-independent storage boundary

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval

**Ready for review:** 2026-09-14

**Completed:** 2026-09-14 after explicit user approval

**Purpose:** Preserve current local behavior while moving public media byte operations, stable key
handling, cleanup, and public URL derivation behind an application-owned storage contract. Do not
add R2 runtime behavior or migrate media in this action.

### Approved scope

- Define and document the smallest contract required by current upload, approval, promotion, and
  read/URL flows.
- Adapt the existing local adapter without deleting or moving existing media files.
- Inject the selected local adapter through application composition rather than constructing the
  concrete adapter inside domain services.
- Keep private generated candidates separately scoped and protected.
- Add focused local contract and cleanup tests; preserve existing authorization, validation,
  canonical promotion, resolver fallbacks, and reset behavior.

### Implementation completed

- Added `src/features/media/storage/storage.js` with the provider-independent `MediaStorage`
  contract: `put`, `delete`, `exists`, `read`, and `getPublicUrl`, plus application-boundary
  adapter validation.
- Added `src/features/media/storage/localStorage.js` as the local implementation. It preserves the
  existing `/media/...` keys, UUID writes, exclusive file creation, path containment, and local
  cleanup behavior while exposing the new contract and optional public URL base.
- Kept `src/features/media/mediaStorage.js` as a compatibility re-export at that historical point;
  Action 1 later removed it after verifying there were no repository consumers.
- Wired the local public adapter through `app.js` and the Manage Media upload, approval, and
  canonical-promotion paths. Domain services no longer instantiate the local public adapter.
- Kept private generated-candidate storage separate; it remains local and private because remote
  candidate storage is outside this action’s approved scope.
- Updated focused fakes/tests to exercise the new contract. No R2 SDK runtime adapter, object-key
  migration, URL read migration, bucket operation, or media-file migration was added.

### Verification evidence

- Focused storage, upload, approval, canonical-promotion, and controller tests pass: 20/20.
- `npm run lint` passed.
- `npm run check:types` passed.
- `npm run check:browser-types` passed.
- Host-permitted `npm test` passed 422/423 tests. The sole failure is the pre-existing stale
  `src/features/media/media.test.js` assertion expecting 76 assets while the current manifest
  resolves 78; it is unrelated to this action and remains deferred.
- `npm run verify` was run but stopped at `npm run format:check` because the pre-existing
  `data/canonical-media.json` file is not formatted according to the repository-wide Prettier
  check. All changed files pass targeted Prettier checks.
- `git diff --check` passed. No database reset, R2 request, bucket mutation, media migration,
  deployment, or production infrastructure change was performed.

### Review notes

- Local behavior remains the default for the application: UUID uploads under
  `public/media/uploads`, repository/static media under `public/media`, and private candidates
  under `var/media/candidates`.
- The new `getPublicUrl` contract is available but existing resolver output remains unchanged in
  this action. Stable object-key conversion and configured remote reads belong to later actions.
- The existing canonical promotion still copies local bytes by design for now; removing that
  unnecessary copy for object-backed promotion is explicitly deferred to Action 9.

### Resume here

Action 2 is **Completed**. The local provider-independent boundary is implemented, verified, and
accepted. Action 3 was prepared as the next pending action and is now recorded below as the active
reviewable implementation.

## Action 3 — Add the S3-compatible R2 implementation

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval

**Ready for review:** 2026-09-14

**Completed:** 2026-09-14 after explicit user approval

**Purpose:** Add a server-side S3-compatible Cloudflare R2 adapter behind the existing
provider-independent `MediaStorage` contract. Preserve the local adapter as the default and do not
perform network calls, bucket mutations, media migration, or production configuration changes.

### Approved scope

- Implement `put`, `delete`, `exists`, `read`, and configured public URL derivation with
  `@aws-sdk/client-s3`.
- Read bucket, endpoint, region, access key, secret key, and public URL configuration from
  environment/configuration without logging credentials.
- Keep credentials server-side and reject incomplete or unsafe provider configuration.
- Use test doubles for SDK calls; do not contact Cloudflare or another external object store.
- Preserve local storage composition and all existing media-domain behavior until later actions.

### Implementation completed

- Added `src/features/media/storage/r2Storage.js` with an S3-compatible adapter using
  `PutObjectCommand`, `DeleteObjectCommand`, `HeadObjectCommand`, and `GetObjectCommand`.
- Added environment configuration parsing for the R2 bucket, endpoint, region, access key,
  secret key, and generic `MEDIA_PUBLIC_URL`. Secret values are only passed to the SDK client and
  are not included in errors or logs.
- Added server-side object-key, filename, extension, URL, and missing-object handling. `exists`
  translates R2 not-found responses to `false`, while permission/provider errors propagate.
- Added support for the AWS SDK response body conversion used by Node runtimes and preserved the
  provider-independent `MediaStorage` return shape.
- Documented `OBJECT_STORAGE_PROVIDER=local` and `MEDIA_PUBLIC_URL` in `.env.sample`; application
  composition still defaults to the local adapter until the later provider-selection action.
- Added fake-client tests for command inputs, read/write/delete behavior, public URL derivation,
  configuration validation, missing-object handling, and unsafe key rejection.

### Verification evidence

- `node --test src/features/media/storage/r2Storage.test.js src/features/media/mediaStorage.test.js`
  passed 7/7.
- `npm run check:types` passed.
- `npm run lint` passed.
- `npm run check:browser-types` passed.
- Targeted Prettier checks passed for changed JavaScript and tracking documents; `.env.sample` is
  not a Prettier-supported parser input.
- `git diff --check` passed.
- Host-permitted `npm test -- --test-reporter=dot` passed 426/427 tests. The sole failure is the
  pre-existing `src/features/media/media.test.js` assertion expecting 76 assets while the current
  manifest resolves 78; it is unrelated to this action and remains deferred.
- No R2 network call, bucket mutation, development media migration, database reset, deployment,
  or production infrastructure change was performed.

### Review notes

- The adapter is available for later application composition, but local storage remains the
  runtime default in this action. R2 provider selection and remote reads/writes belong to later
  approved actions.
- The default R2 key prefix mirrors the current upload namespace only as a provisional adapter
  default. The stable object-key strategy remains explicitly deferred to Action 5.

### Resume here

Action 3 is **Completed**. The R2 adapter and configuration boundary are implemented and verified.
Action 4 was prepared as the next pending action and is now recorded below as the accepted
verification.

## Action 4 — Verify R2 with a controlled development asset

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval

**Ready for review:** 2026-09-14

**Completed:** 2026-09-14 after explicit user approval

**Purpose:** Verify a real R2 put/get/delete round trip only against an explicitly selected,
development-scoped bucket using a disposable smoke-test object. Keep the operation separate from
application media, migrations, database reset, and production infrastructure.

### Approved scope

- Harden the existing smoke-test command with an explicit development-bucket identity check and
  opt-in confirmation before any network operation.
- Use a unique temporary text object, verify its returned contents, and delete it in a `finally`
  cleanup path after a successful put.
- Keep credentials server-side and avoid printing configuration values or object contents.
- Run the smoke test only when complete credentials and the explicit development confirmation are
  available; otherwise record the external verification as unavailable.

### Implementation completed

- Hardened `scripts/r2-smoke-test.mjs` with a required `R2_DEVELOPMENT_BUCKET_NAME` match,
  development-scoped bucket-name guard, and exact `R2_SMOKE_TEST_CONFIRMATION` opt-in before
  constructing the SDK client.
- Changed the smoke test to use a unique temporary text object, validate the fetched contents, and
  delete the object in a `finally` cleanup path after a successful put, including cleanup on
  read/validation failure. It now performs a post-delete `HEAD` and requires a not-found response.
- Added focused fake-client coverage for development-bucket selection and put/get/delete cleanup.
- Added the required safety configuration keys to `.env.sample` without adding credentials or
  logging any secret values.

### Verification evidence

- Guarded smoke-test and R2 adapter tests passed 6/6.
- `npm run check:types` passed.
- `npm run lint` passed.
- `npm run format:check` was run and remains blocked only by the pre-existing unformatted
  `data/canonical-media.json`; targeted Prettier checks for changed JavaScript and tracking
  documents passed. `.env.sample` is not a Prettier-supported parser input.
- `git diff --check` passed.
- Host-permitted `npm test -- --test-reporter=dot` passed 428/429 tests. The sole failure is the
  pre-existing `src/features/media/media.test.js` assertion expecting 76 assets while the current
  manifest resolves 78; it is unrelated to this action and remains deferred.
- `npm run r2:smoke-test` passed against the development bucket `lets-flex-media-dev`. The guard
  confirmed that `R2_BUCKET_NAME` matched `R2_DEVELOPMENT_BUCKET_NAME`, accepted the development-
  scoped name, and required the exact explicit confirmation before the SDK client was constructed.
- The real round trip completed `put → get → content match → delete → post-delete HEAD=404`; the
  smoke command reported successful cleanup. No object, bucket, database, deployment, or production
  infrastructure was mutated beyond the disposable development test object, which was confirmed
  absent.

### Review notes

- The local `.env` required the non-secret `R2_DEVELOPMENT_BUCKET_NAME=lets-flex-media-dev` and
  `R2_SMOKE_TEST_CONFIRMATION=I_CONFIRM_DEVELOPMENT_BUCKET` entries before the guarded command
  could run; credentials remain local and are not recorded here.
- No production bucket can pass the name guard, and the selected bucket must match the separately
  declared development bucket before the smoke test proceeds.

### Resume here

Action 4 is **Completed**. The guarded disposable smoke test and post-delete absence check are
implemented, local verification passes, and the real round trip succeeded against the selected
development bucket. Action 5 was prepared as the next pending action and is now recorded below as
the accepted strategy work.

## Action 5 — Define and validate the object-key strategy

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval

**Ready for review:** 2026-09-14

**Completed:** 2026-09-14 after explicit user approval

**Purpose:** Establish a provider-neutral object-key policy before development media migration or
remote read/write integration. Avoid user filenames and mutable business meaning in new keys, while
preserving existing local canonical paths as legacy relative keys during migration.

### Approved scope

- Define opaque immutable public-media keys as `assets/<generated-id>.<extension>`.
- Validate object-key syntax and provide a safe conversion for existing `/media/...` paths without
  renaming those existing objects.
- Make the R2 adapter use the new generated-key policy for new objects; do not migrate existing
  records or files in this action.
- Add focused strategy and adapter tests. Do not change canonical promotion, database seed/reset,
  public URL reads, or production infrastructure.

### Implementation completed

- Added `src/features/media/storage/mediaObjectKey.js` with the `assets/<UUID>.<extension>` policy,
  strict relative-key validation, and lossless `/media/...` legacy-path conversion.
- Updated `r2Storage.js` so new R2 objects use generated opaque keys and ignore upload filenames;
  provider-specific URLs and mutable entity names are not persisted in the key.
- Validated every current canonical manifest path converts uniquely to a `media/...` relative key,
  preserving existing layout and avoiding unnecessary migration renames.
- Added focused tests for generated-key shape, filename independence, traversal/URL rejection,
  legacy conversion, current-manifest coverage, and R2 command behavior.
- No database rows, canonical manifest entries, local files, R2 objects, or production settings were
  migrated or changed.

### Verification evidence

- `node --test src/features/media/storage/*.test.js` passed 9/9.
- `npm run check:types` passed.
- `npm run lint` passed.
- `npm run check:browser-types` passed.
- `npm run format:check` remains blocked only by the pre-existing unformatted
  `data/canonical-media.json`; targeted Prettier checks for all changed JavaScript and tracking
  documents passed.
- `git diff --check` passed.
- Host-permitted `npm test -- --test-reporter=dot` passed 431/432 tests. The sole failure is the
  pre-existing `src/features/media/media.test.js` assertion expecting 76 assets while the current
  manifest resolves 78; it is unrelated to this action and remains deferred.

### Review notes

- New object-backed public media uses `assets/<UUID>.<extension>`; the extension is a validated MIME
  hint, not business identity. Existing `/media/...` keys remain legacy values until Action 6
  migration is explicitly approved.
- Canonical promotion remains unchanged. Later object-backed promotion should keep the selected
  asset’s existing object key rather than derive a canonical folder or reupload it.

### Resume here

Action 5 is **Completed**. The provider-neutral key strategy is implemented and verified. Action 6
is now the active approved action.

## Action 6 — Migrate existing development canonical media

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval

**Ready for review:** 2026-09-14

**Completed:** 2026-09-14 after explicit user approval

**Purpose:** Copy the existing canonical local media bytes into the explicitly verified
development R2 bucket, persist their provider-neutral object-key mapping, verify every uploaded
object, and retain local source files for recovery and current fallback behavior.

### Approved scope

- Enumerate the current canonical manifest and verify each local source file before any upload.
- Upload only to the configured development bucket, using safe immutable `assets/...` object keys.
- Reuse a manifest mapping when the object already exists and matches; fail on mismatches rather
  than overwriting unrelated content.
- Verify uploaded bytes and persist each `storageKey` alongside the existing canonical metadata.
- Preserve canonical entity assignments and local source files. Do not change production
  configuration, production buckets, database reset behavior, or later read/write integration.

### Implementation completed

- Added the rerunnable `r2:migrate-canonical-media` command and a focused migration boundary that
  preflighted every canonical local source before the first remote mutation. Action 1 later
  removed this completed one-time import tooling after all current entries were mapped.
- Added optional `storageKey` metadata to each canonical manifest entry while retaining every
  existing local `path`, assignment, and metadata field for the current resolver and seed flow.
- Uploaded the 70 canonical assets to the explicitly guarded development R2 bucket using opaque
  `assets/<UUID>.<extension>` keys. Existing mapped objects are compared byte-for-byte and are not
  overwritten; failed newly created objects are compensated where migration persistence fails.
- Kept all local source files in place. The migration does not delete or rewrite unrelated remote
  objects, production configuration, database rows, or application read/write behavior.
- Added automated coverage for upload/verification, rerun reuse, preflight failure, and mismatch
  refusal behavior.

### Verification evidence

- The existing development-bucket guard ran before the migration client was constructed: the
  selected bucket matched `R2_DEVELOPMENT_BUCKET_NAME`, had a development-scoped name, and the
  exact explicit confirmation was present. No credentials were printed.
- Real R2 migration passed for development bucket `lets-flex-media-dev`: 70 canonical objects
  verified, 27 uploaded, 43 already matching. A complete rerun passed with 70 verified, 0
  uploaded, and 70 already matching, confirming rerun reuse without duplicate uploads.
- Local integrity check passed: 70 entries, 70 storage mappings, 0 missing local sources, 70
  unique local paths, 70 unique canonical assignments, and 0 invalid object keys.
- Focused migration/storage tests passed 11/11. `npm run check:types`, `npm run lint`, and
  `npm run check:browser-types` passed. Changed-file Prettier checks and `git diff --check`
  passed.
- Host-permitted full suite passed 435/436 tests. The only failure is the pre-existing stale
  `src/features/media/media.test.js` count assertion (`78 !== 76`); no migration test failed.
- `npm run format:check` remains blocked only by the pre-existing formatting warning for
  `data/canonical-media.json`. The real Action 4 disposable smoke test had already confirmed
  `put → get → content match → delete → post-delete HEAD=404`; the migration created no smoke-test
  objects and left the verified disposable smoke object absent.

### Review notes

- The 70 migrated development objects are intentional persistent media bytes; only the disposable
  Action 4 smoke object was deleted. Local source files remain available for recovery.
- Public URL reads and application R2 provider selection remain deferred to Action 7 and later;
  this action only records object keys and verifies bytes.

### Resume here

Action 6 is **Completed**. The development migration and complete idempotency rerun passed, with
local sources and canonical assignments preserved. Action 7 is prepared as the next pending
action; do not activate or implement it in this response.

## Action 7 — Switch media reads to configured public URLs

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval

**Ready for review:** 2026-09-14

**Completed:** 2026-09-14 after explicit user approval

**Purpose:** Derive browser-facing media URLs from persisted provider-neutral object keys through
the configured application boundary while preserving presentation-ready view models and resolver
fallbacks.

### Prepared scope

- Use the persisted canonical and database object keys to derive configured public URLs.
- Preserve local fallback paths and existing resolver precedence while the provider transition is
  incomplete.
- Keep credentials and provider details out of controllers, view models, templates, and browser
  code.
- Add focused URL/read-side tests before changing application provider selection or writes.

### Implementation completed

- Added the provider-independent read-side URL resolver and application wiring. Local mode keeps
  the existing `/media/...` sources; `OBJECT_STORAGE_PROVIDER=r2` requires a safe
  `MEDIA_PUBLIC_URL` and derives browser URLs without reading or exposing R2 credentials.
- Passed the resolver through Library, Dashboard, Program Day, and Admin Media presentation seams
  without changing view-model or template contracts.
- Mapped legacy canonical database paths to their migrated `assets/<UUID>.<extension>` keys while
  leaving non-migrated local upload paths on the local fallback. Static canonical manifest entries
  use the same mapping, and resolver precedence/fallback behavior is unchanged.
- Kept media writes on the existing local adapter; R2 write selection and compensation remain
  explicitly deferred to Action 8.
- Added focused coverage for local preservation, canonical-path mapping, direct object URLs,
  unmigrated fallback behavior, and configuration validation.

### Verification evidence

- New read-integration tests passed 5/5, including configured R2 URL derivation for a persistent
  canonical assignment and its static fallback.
- `npm run check:types`, `npm run lint`, and `npm run check:browser-types` passed. Changed-file
  Prettier checks and `git diff --check` passed.
- Host-permitted full suite passed 440/441 tests. The only failure is the pre-existing stale
  `src/features/media/media.test.js` count assertion (`78 !== 76`); all read-integration tests
  passed.
- `npm run verify` reached and stopped at the same pre-existing `data/canonical-media.json`
  formatting warning; the remaining verification commands were run individually and passed.
- No production configuration, bucket, database, media bytes, or browser/view-model contract was
  changed. The application continues to use local writes until Action 8.

### Review notes

- The public-domain fetch follow-up is now **Verified** for development: with
  `OBJECT_STORAGE_PROVIDER=r2`, `R2_BUCKET_NAME=lets-flex-media-dev`, and
  `MEDIA_PUBLIC_URL=https://media-dev.lets-flex.paxeri.dev`, a known migrated object fetched
  successfully through the configured public domain and matched its local source bytes.
- The normal application resolver produced exactly
  `https://media-dev.lets-flex.paxeri.dev/assets/<UUID>.<extension>` from `MEDIA_PUBLIC_URL` and
  the migrated object key. The bucket name, R2 endpoint, account identifier, and provider hostname
  were not incorporated into the browser-facing URL.
- R2 credentials are not required for URL derivation and are not read by the read-side resolver.

### Resume here

Action 7 is **Completed**. Configured remote URL derivation and local fallback preservation were
implemented and verified. The previously unverified public-domain fetch is now explicitly
**Verified** for the configured development domain. The known unrelated stale `78 !== 76`
assertion remains documented. Action 8 was subsequently completed; the current resume point is
recorded below.

## Action 8 — Move new Admin Media writes to R2

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval

**Ready for review:** 2026-09-14

**Completed:** 2026-09-14 after explicit user approval

**Purpose:** Switch new public-media writes to the configured R2-backed provider while preserving
private candidate isolation, local fallback behavior, transactional database semantics, and
reference-aware object cleanup.

### Prepared planning scope

1. **Responsibility:** Reuse the existing `MediaStorage` boundary and make the application’s
   public write adapter explicitly selectable. Keep the change limited to new public media writes
   and their compensation paths.
2. **Write paths that change:** direct Admin uploads through `createAndAssignUploadedMedia`, and
   approved generated candidates through `approveMediaGenerationCandidate`; both currently use
   the injected `app.locals.mediaStorage` public adapter. The current canonical-promotion copy
   path remains separately controlled until Action 9 removes unnecessary object copying.
3. **Write paths that remain local:** private AI candidates created by `mediaGeneration.js` under
   `var/media/candidates`, repository/static canonical source files, and all local fallback assets.
   Explicit local mode remains available. Existing local objects are not bulk-copied or deleted by
   this action.
4. **Consistency and compensation:** put the new R2 object before the database transaction; only
   commit the asset metadata, localized text, assignment, and candidate approval after the object
   exists. On any database failure, attempt to delete only the newly created object. If that
   compensation fails, preserve the database rollback and surface a safe cleanup-pending error
   without credentials or provider internals.
5. **Replacement, deletion, promotion, cleanup:** primary assignment replacement remains the
   existing transaction; replacing an assignment does not delete the old reusable object. Removing
   an assignment does not delete bytes. Canonical promotion must reuse an existing object key and
   alter only meaning/assignment in Action 9. Private candidate cleanup remains separate and
   occurs only after approval persistence succeeds.
6. **Safety guards:** local remains the default unless R2 is explicitly selected; complete R2
   endpoint, bucket, credential, and public-URL configuration remains required for the applicable
   adapter. Keep credentials server-side, preserve development-bucket/explicit-confirmation
   safeguards for real verification, and make no automatic production, Cloudflare, DNS, or bucket
   changes.
7. **Rollback/fallback:** an R2 put failure performs no database write. A database failure rolls
   back and compensates the new object. Do not silently write locally after an R2 failure, because
   that would split the persisted reference from the selected provider; explicit local provider
   mode remains the operational fallback.
8. **Required verification:** add fake-client/service tests for provider selection, put-before-DB
   ordering, transaction rollback, cleanup success/failure, candidate privacy, reference-aware
   deletion, and assignment replacement. Run types, lint, browser types, formatting, and the full
   suite; then run the guarded real development R2 smoke `put → get → delete` and a disposable
   R2-backed public-write verification before marking the action complete. Do not test or mutate
   production infrastructure automatically.

### Implementation completed

- Added explicit application provider selection through `OBJECT_STORAGE_PROVIDER`, retaining local
  storage as the safe default and selecting R2 only when configured with complete adapter settings.
- Kept `MEDIA_STORAGE_PROVIDER` as a compatibility fallback only when `OBJECT_STORAGE_PROVIDER` is
  absent; provider selection does not participate in public hostname construction.
- Switched direct Admin uploads and approved generated-candidate writes to the selected public
  `MediaStorage` adapter. Private generated candidates remain local and private.
- Added upload-before-database compensation. Database failures roll back and delete only the newly
  created object; cleanup failure raises a safe cleanup-pending error without provider details.
- Preserved reference-aware behavior: assignment replacement and assignment removal do not delete
  reusable objects. Canonical promotion remains local and separately controlled until Action 9.
- Added focused provider-selection and compensation tests. No production configuration, production
  bucket, database reset, or unrelated application cleanup was performed.

### Verification evidence

- Focused media/storage tests passed 30/30, including Admin upload rollback, candidate approval,
  provider selection, compensation success/failure, assignment replacement, and reference-aware
  deletion behavior.
- `npm run check:types`, `npm run check:browser-types`, and `npm run lint` passed.
- Targeted Prettier checks for changed files and `git diff --check` passed. Repository-wide
  `npm run format:check` remains blocked only by the existing `data/canonical-media.json`
  formatting warning.
- Host-permitted full suite passed 446/447 tests. The sole failure is the known unrelated
  `src/features/media/media.test.js` assertion (`78 !== 76`); it remains documented and was not
  changed for Action 8.
- Guarded real R2 smoke passed in the explicitly verified development bucket `lets-flex-media-dev`.
  The development-bucket match, development scope, and exact explicit confirmation were checked
  before the disposable mutation; `put → get → content match → delete → post-delete HEAD=404`
  completed successfully, with cleanup confirmed.
- Disposable real R2-backed Admin write passed through `createAndAssignUploadedMedia`: upload,
  retrieve-and-compare, existence check, delete, and post-delete absence all succeeded. The
  database used for this verification was an in-memory fake transaction; no application database
  or production target was mutated.

### Review notes

- The public-domain fetch follow-up from Action 7 is now explicitly **Verified** for the configured
  development domain. Action 8’s public URL behavior uses the authoritative `MEDIA_PUBLIC_URL`
  boundary and never derives a hostname from the bucket or R2 endpoint.
- Action 8 does not implement object-backed canonical promotion; that remains the prepared Action 9
  scope. The stale `78 !== 76` assertion remains unrelated.

### Completion summary

Action 8 is **Completed**. New Admin public-media writes use the explicitly selected R2 provider,
with safe database compensation and preserved local/private fallback behavior. The development
public URL is authoritative and was verified through a real custom-domain fetch with byte matching.

### Isolated full-suite failure investigation and correction

- The failure originated at `src/features/media/media.test.js:12`, with related stale expectations at
  lines 13 and 16. `76` represented all derived media-manifest entries; `75` represented their
  unique non-null local sources; and `68` represented canonical manifest entries.
- The current source of truth is `data/canonical-media.json` and its derived `mediaManifest`: 70
  canonical entries produce 78 derived entries (70 canonical + 1 environment + 6 category + 1
  placeholder) and 77 non-null sources.
- The guarded development database independently contains 70 curated `media_assets`, 70 matching
  `entity_media` assignments, and 140 localized rows. Its relationship set exactly matches the
  manifest. Duplicate entity keys, paths, and storage keys were absent, and all 70 local files
  exist and pass canonical seed validation.
- Git history shows the two additional canonical entries are intentional prior canonical-promotion
  media: JPEG assets for `muscle/abs` and `muscle/abductors`, not unintended catalog duplicates.
- Updated only the stale test expectations to 78, 77, and 70, and extended its existing file-signature
  assertion to accept JPEG, which is already an allowed canonical MIME type. No catalog, seed,
  database, R2 object, or unrelated code was changed.
- Final full suite: **447/447 tests passed**.

### Resume here

Action 8 is **Completed** after explicit user approval. Action 9 is **Completed** after explicit
user approval and verification. Action 10 was subsequently completed; the current resume point is
recorded below.

## Action 9 — Regression-test canonical promotion with R2-backed media

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval

**Ready for review:** 2026-09-14 after implementation and verification

**Completed:** 2026-09-14 after explicit user approval

**Purpose:** Change and verify canonical promotion for an R2-backed asset so promotion changes
database meaning and canonical assignment without copying, renaming, or deleting the existing
object.

### Prepared planning scope

1. **Current verified gap:** `promoteMediaToCanonical` currently reads through `sourceStorage`,
   writes a deterministic local `canonicalStorage` copy, updates the canonical manifest, creates a
   curated asset, and replaces the primary assignment. Action 9 should address only the
   object-backed promotion path; existing local promotion and resolver fallback behavior remain
   covered.
2. **Object behavior:** when the selected asset already references an R2 object key, verify that
   canonical promotion reuses that exact key and does not issue a second object upload or delete.
   The canonical manifest must retain the provider-neutral key while preserving required metadata.
3. **Database/manifest consistency:** keep manifest update and canonical asset/assignment changes
   within the existing transaction/compensation boundary. If persistence fails, restore the prior
   manifest and leave the pre-existing R2 object untouched.
4. **Replacement and reuse:** replace only the selected entity’s canonical meaning/assignment;
   preserve prior reusable assets and objects. Re-promoting an already canonical object remains
   idempotent.
5. **Provider and fallback boundaries:** use the selected application storage boundary for R2
   object existence/read verification where needed; do not expose SDK details to controllers or
   views. Keep local source files and local fallback resolution intact.
6. **Safety:** automated tests use fakes. Any real verification must use the explicitly guarded
   development bucket and disposable/reference-safe data; no production bucket, configuration,
   database reset, DNS, or Cloudflare mutation is authorized.
7. **Required verification:** add focused fake-storage tests for no-copy key reuse, unchanged
   object bytes, manifest/assignment replacement, idempotency, and failure compensation. Run the
   relevant media tests, types, lint, browser types, formatting, and full suite; then perform a
   real development R2-backed canonical-promotion verification that confirms the object identity
   and bytes remain unchanged.

### Implementation completed

- Added an object-backed promotion branch that recognizes the existing `assets/...` key, reads
  through the configured object-storage boundary, preserves the existing canonical compatibility
  path, and persists the same provider-neutral key in the canonical manifest and curated database
  asset.
- The R2-backed branch never uploads, renames, or deletes the selected existing object. Existing
  local promotion continues to use its local source and deterministic canonical destination.
- Existing canonical meaning is replaced only for the selected entity, object-backed promotion is
  idempotent when the key already matches, and manifest compensation leaves pre-existing remote
  bytes untouched if database persistence fails.
- Application wiring supplies the selected public-media storage adapter as the object-backed
  promotion dependency while retaining the local source and canonical adapters for local assets.

### Verification evidence

- Focused canonical-promotion tests: **8/8 passed**, including exact object-key reuse, byte
  preservation, assignment/manifest replacement, R2-key idempotency, and failure compensation.
- `npm run check:types`: passed.
- `npm run check:browser-types`: passed.
- `npm run lint`: passed.
- Targeted Prettier verification for the Action 9 implementation and test files: passed;
  `git diff --check`: passed. Repository-wide `npm run format:check` still reports the existing
  unrelated formatting state of `data/canonical-media.json`, which was already modified before
  Action 9 and was not changed here.
- Full verification suite: **450/450 tests passed** with `npm test` using the development test
  database.
- Real development R2-backed verification: passed against bucket `lets-flex-media-dev` using
  the configured R2 provider. One existing object was read before and after promotion; the exact
  `assets/...` identity and byte content were unchanged, the fake transactional persistence
  switched the canonical assignment to that key, and guarded remote `put`/`delete` calls were
  both zero. No production configuration, bucket, or object was mutated.

### Review notes

- Action 7’s development public-domain fetch is verified. The unrelated catalog count failure is
  resolved and no longer a known exception.
- Action 9 changes are intentionally limited to canonical promotion’s object-backed reuse path;
  broader cleanup remains separate, while database-reset reconstruction is recorded in Action 10.

### Resume here

Action 9 is **Completed** after explicit user approval. Action 10 is **Completed** after explicit
user approval and verification. Action 11 was subsequently activated; its current status is
recorded below.

## Action 10 — Verify database-reset reconstruction

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval

**Ready for review:** 2026-09-14 after implementation and verification

**Completed:** 2026-09-14 after explicit user approval

**Purpose:** Prove that a disposable development PostgreSQL reset reconstructs canonical media
metadata and relationships from the current schema/seed while persistent R2 objects remain intact
and the application starts with the configured storage boundary.

### Approved execution scope

1. Confirm the reset target is the local development database and that the existing explicit reset
   guards are enabled; production and ambiguous remote targets remain forbidden.
2. Run the canonical `npm run db:reset` path against that disposable development database. Do not
   reset, delete, migrate, or otherwise mutate the R2 bucket.
3. Verify the rebuilt media tables, canonical assignments, localized metadata, and provider-neutral
   object-key references against the current canonical manifest.
4. Read a known development R2 object before and after the reset and confirm its identity and
   bytes are unchanged. Verify the normal application can initialize with the configured R2
   adapter and public URL boundary.
5. Keep any failure diagnosis limited to reset reconstruction, media references, startup, or the
   explicit safety boundary. Do not remove local fallback assets or begin production preparation.

### Required verification

- Guarded `npm run db:reset` succeeds only for `NODE_ENV=development`, `ALLOW_DATABASE_RESET=true`,
  and the local development database target.
- Post-reset media counts, assignments, localized rows, and manifest key relationships match the
  canonical source of truth.
- A known development R2 object remains readable with byte-for-byte identity after reset.
- Application startup initializes with the configured R2 provider without changing the bucket.
- Run the relevant focused checks, types, lint, formatting, and full suite before returning this
  action to **Ready for review**.

### Implementation completed

- Corrected canonical media seed generation to persist `entry.storageKey ?? entry.path` in
  `media_assets.storage_key`. Local compatibility paths remain the required file-validation
  source, while migrated entries now reconstruct their stable R2 references after reset.
- Updated the database relationship expectation and seed SQL regression coverage for migrated
  object keys. No R2 objects, production configuration, or production databases were changed.

### Verification evidence

- Reset safety was confirmed before mutation: `NODE_ENV=development`,
  `ALLOW_DATABASE_RESET=true`, and database target `localhost/lets_flex`; the development bucket
  remained `lets-flex-media-dev`.
- Guarded `npm run db:reset` completed successfully against the disposable local development
  database. A second before/after verification confirmed the same result after the seed-key
  correction.
- Post-reset media state matched the 70-entry canonical manifest: 70 `media_assets`, 70
  `entity_media` assignments, and 140 localized rows. Every entity/catalog-key/storage-key
  relationship matched `storageKey ?? path`.
- A known existing R2 object remained readable and byte-identical across reset; no R2 writes or
  deletes were issued.
- Application startup initialized with the configured R2 provider, and both the storage adapter
  and normal resolver produced the configured `MEDIA_PUBLIC_URL` for the migrated object.
- `npm run check:types`: passed; `npm run check:browser-types`: passed; `npm run lint`: passed;
  targeted Prettier and `git diff --check`: passed.
- Full suite: **450/450 tests passed** with the development test database.
- Repository-wide `npm run format:check` still reports the pre-existing unrelated formatting
  state of `data/canonical-media.json`; no unrelated formatting cleanup was performed.

### Review notes

- The only implementation correction required by Action 10 was preserving migrated object keys in
  canonical reset seed data. The reset safeguards and local fallback behavior remain intact.
- Action 11 remains separate; no production configuration or infrastructure work was started.

### Resume here

Action 10 is **Completed** after explicit user approval. Action 11 is **Completed** after explicit
user approval and verification. Action 12 remains the pending resume point.

## Action 11 — Prepare production configuration and custom-domain steps

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval

**Ready for review:** 2026-09-14 after implementation and verification

**Completed:** 2026-09-14 after explicit user approval

**Purpose:** Prepare an exact, reviewable manual handoff for production R2 configuration and its
public custom media domain while preserving development/production isolation and the existing
provider-independent application boundary.

### Approved execution scope

1. Document production-only environment variables and secret handling for the existing R2 adapter:
   `OBJECT_STORAGE_PROVIDER=r2`, a production-scoped `R2_BUCKET_NAME`, `R2_ENDPOINT`,
   `R2_REGION`, R2 credentials, and an explicit `MEDIA_PUBLIC_URL`.
2. Document that the bucket name identifies storage only; `MEDIA_PUBLIC_URL` is the complete
   browser-facing base URL and must not be derived from or combined with the bucket, account ID,
   R2 endpoint, or another provider hostname.
3. Document the manual Cloudflare bucket/access-key/custom-domain and DNS handoff, Render secret
   configuration, rollout order, rollback boundary, and read/write verification. Use placeholders
   for production values and do not create, alter, or test production resources.
4. Keep development-only values (`R2_DEVELOPMENT_BUCKET_NAME`,
   `R2_SMOKE_TEST_CONFIRMATION`, and reset authorization) out of production configuration. Do not
   weaken the smoke-test or database safety guards to support production verification.

### Production configuration handoff

Use the following conceptual Render environment configuration, replacing only the placeholders with
manually provisioned production values:

```text
NODE_ENV=production
OBJECT_STORAGE_PROVIDER=r2
R2_BUCKET_NAME=<production-scoped-bucket-name>
R2_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
R2_REGION=auto
R2_ACCESS_KEY_ID=<bucket-scoped-secret>
R2_SECRET_ACCESS_KEY=<bucket-scoped-secret>
MEDIA_PUBLIC_URL=https://<production-media-domain>
```

`R2_BUCKET_NAME` is sent to R2 commands as the bucket identifier. `MEDIA_PUBLIC_URL` is used only
as the public URL base, with the normalized object key appended below it:

```text
object key:  assets/<UUID>.<extension>
public URL:  https://<production-media-domain>/assets/<UUID>.<extension>
```

Do not set `R2_DEVELOPMENT_BUCKET_NAME`, `R2_SMOKE_TEST_CONFIRMATION`, or
`ALLOW_DATABASE_RESET` in Render. Do not add production database migration/reset flags as part of
this handoff; any reviewed production migration is a separate, explicitly authorized operation.
Store R2 access keys only in Render’s secret environment storage and never in the repository,
logs, URLs, or browser-facing configuration.

### Manual Cloudflare and DNS handoff

The operator must complete these steps in the production Cloudflare account using the current
Cloudflare interface and account-specific target values:

1. Create or select a bucket whose name is clearly production-scoped and is not the development
   bucket `lets-flex-media-dev`.
2. Create a least-privilege R2 access key restricted to the production bucket and required object
   operations. Record the secret only in Render’s secret storage.
3. Attach the chosen HTTPS custom domain to the production R2 bucket and complete the DNS/TLS
   checks required by Cloudflare. The chosen domain becomes the exact `MEDIA_PUBLIC_URL`; do not
   include the bucket name in its hostname.
4. Confirm that the custom domain routes to the intended production bucket and not the development
   bucket before placing the values in Render.

No Cloudflare, DNS, Render, bucket, credential, or production database mutation was performed by
Action 11.

### Rollout, rollback, and verification boundary

- Provision the bucket/domain/access key manually, set the reviewed Render environment values,
  deploy the existing application with `npm start`, and inspect startup logs only for generic
  configuration success; never log credentials.
- Verify one known production object through the custom-domain URL and through the normal resolver,
  confirming exact object-key suffix and byte/content match. Verify a controlled production upload
  and reference-aware cleanup only in a separately approved production verification action; the
  development smoke command is intentionally not a production test.
- If startup or public reads fail, first correct the endpoint, bucket, credential scope, domain,
  or `MEDIA_PUBLIC_URL` configuration while keeping R2 available. Reverting only the provider flag
  after remote object keys are persisted can strand those references, so local fallback is not a
  substitute for a remote configuration failure.
- Before any production cutover, retain the existing local compatibility assets and resolver
  fallback. Do not delete local sources or R2 objects as part of rollback or configuration repair.

### Required verification

- Static configuration review confirms all production placeholders are replaced manually, secrets
  remain outside the repository, development bucket values are not reused, and the public domain
  is independent of the bucket name.
- Application startup, a known-object public fetch, and normal resolver URL derivation pass against
  the operator-provided production configuration.
- Any production write/delete verification is separately authorized and uses reference-safe,
  disposable data with explicit cleanup; no such mutation is part of this Action 11 handoff.
- Run the relevant documentation/configuration checks and full suite before returning this action
  to **Ready for review**.

### Implementation completed

- Added the production R2/custom-domain handoff to `README.md` and this tracking record using
  placeholders only. It documents the existing `OBJECT_STORAGE_PROVIDER`, bucket, endpoint,
  region, credential, and `MEDIA_PUBLIC_URL` boundaries without introducing runtime behavior.
- Recorded the required development/production isolation, least-privilege credential handling,
  manual Cloudflare/DNS/TLS and Render steps, rollout order, rollback boundary, and future
  production verification requirements.
- No production configuration, Cloudflare resource, DNS record, Render environment, bucket,
  credential, database, or object was created or changed.

### Verification evidence

- Markdown documentation formatting passed for `README.md`, `docs/current-goal.md`, and
  `docs/current-actions.md`; `git diff --check` passed. `.env.sample` was not passed to Prettier
  because it is an env template without a supported Prettier parser.
- Full suite: **450/450 tests passed** with `npm test` using the development test database.
- The handoff contains no production secrets or concrete production resource values. It explicitly
  keeps `R2_DEVELOPMENT_BUCKET_NAME`, `R2_SMOKE_TEST_CONFIRMATION`, and reset authorization out
  of production configuration.

### Review notes

- Action 11 is documentation and manual-operator preparation only. Production provisioning,
  custom-domain attachment, DNS/TLS changes, deployment, and production write verification remain
  outside this action and require separate user-controlled execution.
- The repository-wide formatter continues to report the pre-existing unrelated
  `data/canonical-media.json` warning; no unrelated formatting cleanup was performed.

### Resume here

Action 11 is **Completed** after explicit user approval. Action 12 is now **Completed** after
explicit user approval and verification. No next action is currently prepared.

## Action 12 — Remove mutable local uploads as the persistent runtime store

**Status:** Completed

**Activated:** 2026-09-14 after explicit user approval

**Ready for review:** 2026-09-14 after implementation and verification

**Completed:** 2026-09-14 after explicit user approval

**Purpose:** Ensure production cannot silently use the local filesystem as its persistent public
media store now that R2 reads, writes, reset reconstruction, and user-facing resolution are
verified, while preserving local development and intentional static/fallback assets.

### Approved execution scope

1. Verify that all new public Admin Media writes already use the selected provider boundary and
   that the current development canonical references have R2 object keys.
2. Add a production safety guard rejecting the local persistent-media provider; production must
   explicitly select R2 and provide its existing validated configuration.
3. Preserve local provider behavior for development/tests and retain local source/fallback assets;
   do not delete `public/media/catalog`, local compatibility files, or private candidate fixtures.
4. Add focused guard coverage and verify existing media workflows, startup, resolver behavior, and
   the full suite. Do not migrate or delete production objects, change Cloudflare, or redesign
   private candidate storage in this action.

### Implementation completed

- Added production guards to the storage factory and media URL resolver. When `NODE_ENV=production`,
  selecting the local provider—or omitting the provider and allowing the local default—now fails
  with a clear configuration error requiring `OBJECT_STORAGE_PROVIDER=r2`.
- Local storage remains available for development/tests and intentional local fallback/source assets;
  no static catalog files, compatibility assets, or private candidate fixtures were removed.

### Verification evidence

- Focused storage-provider and URL-resolver tests: **10/10 passed**, including production refusal
  and preserved local development behavior.
- `npm run check:types`: passed.
- `npm run check:browser-types`: passed.
- `npm run lint`: passed.
- Targeted Prettier verification for changed implementation, tests, and tracking files passed;
  `git diff --check`: passed. Repository-wide formatting still reports the pre-existing unrelated
  `data/canonical-media.json` warning.
- Real development read-only verification passed: all 70 canonical manifest entries have R2 keys,
  all 70 corresponding objects are readable in `lets-flex-media-dev`, the development database
  contains 70 remote media keys, and the application initializes with R2. No R2 writes or deletes
  occurred.
- Full suite: **452/452 tests passed** with the development test database.

### Resume here

Action 12 is **Completed** after explicit user approval and verification. No next action was
activated because no Action 13 scope is defined in the approved goal.

## Corrective follow-up — Existing object-backed canonical media

**Status:** Completed as a corrective follow-up to Action 9

**Date:** 2026-09-14

### Reproduced symptom

The development database contained the reported valid state: `muscles.id = 22` (`abductors`),
`media_assets.id = 71`, and a primary `entity_media` assignment linking the muscle to that
asset. The asset used the existing R2 object key
`assets/fc90e72d-8032-44e0-af91-9ea1d37959a3.jpg`, with valid JPEG metadata and both localized
alt-text rows. The HTTP regression reproduced the same shape with stable test fixtures and valid
admin/CSRF submission.

### Root cause

Entity-type validation and muscle lookup were already correct. The shared object-backed promotion
branch read the selected object key, then attempted to insert a second `media_assets` row with that
same key. `media_assets.storage_key` is unique, so PostgreSQL rejected the insert with a unique
constraint violation (`23505`, `media_assets_storage_key_key`: `Key (storage_key)=(assets/fc90e72d-8032-44e0-af91-9ea1d37959a3.jpg) already exists.`). The unexpected database error escaped the controller as a 500. Existing
local/exercise promotion tests did not expose it because local promotion creates a different
deterministic canonical key, and the fake database did not enforce the unique constraint.

### Correction

Object-backed promotion now reuses the selected existing `media_assets` row and transactionally
replaces the entity's primary assignment. It still updates the canonical manifest, preserves the
existing object key and bytes, leaves unrelated assignments and reusable assets intact, and keeps
the local-copy path unchanged. No muscle-specific branch, URL reconstruction, CSRF change, or data
repair was added.

### Regression coverage and verification

- Added a focused service regression for muscle `22` and media asset `71` that asserts no duplicate
  `media_assets` insert and the expected `muscle` primary assignment.
- Added an HTTP regression with admin authentication and a valid CSRF token. It asserts a `302`
  response, reuse of asset `71`, one row for the object key, canonical manifest update, and the
  resolver/page output for the promoted image.
- Preserved coverage for object-backed exercise promotion, idempotency, compensation, and the
  existing local exercise promotion path.
- Focused service/schema checks: **12/12 passed**; media-management view-model checks: **23/23
  passed**; targeted HTTP regression: **passed**;
  `npm run lint`, `npm run check:types`, `npm run check:browser-types`, and targeted Prettier:
  **passed**.
- The full HTTP file ran with host database access: **62/68 passed**. The new canonical muscle
  regression passed; six unrelated pre-existing assertions failed in authentication/catalog and
  workout/progress scenarios. The non-HTTP full suite passed **454/454**; `npm run verify` remains
  blocked only by the pre-existing repository-wide `data/canonical-media.json` formatting warning.

### Data repair assessment

No repair is required for the reported development rows. The asset, localized metadata, primary
assignment, and object key are valid; the failure was in promotion logic. The real development
database was inspected read-only and was not reset, rewritten, or used for a live promotion.
