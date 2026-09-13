# Current Goal

## Parent milestone

Let’s Flex should help people recognize and navigate training content quickly while preserving the focused, dark training experience and stable catalog ownership boundaries.

## Current goal

### Phase 4 — Populate and Operationalize the Media Catalog

Scale the proven media foundation, admin workflow, and Phase 3 visual language into broad, deliberate catalog coverage. This phase prioritizes effective coverage and meaningful recognition over one unique image for every entity.

## Status

Phase 4 is **Completed** on 2026-09-13. Actions 1–6 are completed, including the focused Admin →
Manage Media responsive-layout correction. The Library Sessions and Exercises surfaces, recovered
media catalog, resolver behavior, and media assignments remain preserved. The user explicitly
authorized and completed one scoped local-development recovery; no database reset, production
change, commit, push, or deployment was authorized or performed.

## Problem being solved

Phase 3 established a coherent representative set of 17 provenance-recorded PNG assignments, shared geometry, and resolver behavior, but the real catalog remains only partially covered. In the local development snapshot, 78 base exercises, 129 global variants, 28 equipment entities, 8 movement patterns, and 24 muscles coexist with only 17 documented Phase 3 assignments. This leaves many useful catalog entities on an initial fallback and provides no documented operational workflow for expanding coverage safely and consistently.

## Intended outcome

The catalog has practical, traceable media coverage that is useful in the real product: high-value exercises use deliberate direct media where it improves recognition; visually similar variants reuse their base media; movement patterns and equipment have coherent coverage; and medically sensitive muscle media remains conservative. Administrators can identify and work through real coverage gaps using the existing management boundary or narrowly justified refinement. Mixed direct, inherited, contextual, and intentional initial states remain consistent, responsive, localized where meaningful, and accessible.

## Verified current baseline

The following evidence was collected read-only from the configured local development database on 2026-09-12, using the current ID-backed resolver and its persistent assignment precedence.

| Entity type              | Total | Direct persistent | Base inherited | Movement inherited | Environment fallback | Category fallback | Initial fallback |
| ------------------------ | ----: | ----------------: | -------------: | -----------------: | -------------------: | ----------------: | ---------------: |
| Base exercises           |    78 |                 1 |              — |                 56 |                    — |                 0 |               21 |
| Global exercise variants |   129 |                 7 |              1 |                 90 |                    4 |                 0 |               27 |
| Equipment                |    28 |                 4 |              — |                  — |                    — |                 0 |               24 |
| Movement patterns        |     8 |                 5 |              — |                  — |                    — |                 0 |                3 |
| Muscles                  |    24 |                 2 |              — |                  — |                    — |                 0 |               22 |

- All 78 base exercises and all 129 global variants have a movement-pattern relationship. The five currently assigned patterns—Push, Pull, Squat, Hinge, and Gait—cover 56 base exercises and 90 variants through persistent movement inheritance. Carry (3 bases), Lunge (8), and Rotation (10) are the three real pattern gaps.
- The persistent store contains 20 `admin-upload` media assets and 19 active primary assignments. The 17 documented Phase 3 PNG assets are IDs 4–20 and have both English and Brazilian Portuguese alt text.
- **Documentation discrepancy:** assets 1–3 are older JPEG uploads absent from the Phase 3 provenance record. Assets 1 and 3 are directly assigned to Abs and Abductors; asset 2 is unassigned; asset 3 has no localized-alt records. The Phase 3 documents state that no muscle images were assigned. Repository/database evidence is authoritative for the live baseline. Phase 4 will audit these assets and their storage/provenance safely before any retention, reassignment, or deletion decision.
- Environments remain seven string values on variants (`gym`, `home`, `gym_or_home`, `outdoors`, `track`, `beach`, and `treadmill`), not assignable catalog entities. No environment-domain redesign is proposed.
- The existing admin screen already provides entity-type and name-search filters, direct/inherited/fallback preview state, upload, existing-asset reuse, and safe removal of a direct assignment. It does not yet provide an explicit coverage-state filter or coverage summary.

## Coverage strategy and targets

### Tiers

1. **Tier 1 — high-value recognition:** use direct, human-reviewed media for a documented selection of base exercises that have a clearly recognizable technique or frequent catalog role, plus all catalog equipment that can be safely illustrated. Base exercises are selected before duplicate variants so their image can propagate by inheritance.
2. **Tier 2 — meaningful differentiation:** add a direct variant only when equipment, body position, machine context, unilateral setup, or locomotion context materially changes recognition. Otherwise retain base or movement-pattern inheritance. Complete the coherent movement-pattern family, then address documented equipment and high-value exercise gaps in category batches.
3. **Tier 3 — intentional fallback:** retain inherited or initial media where a unique image adds little value or where muscle/anatomical reliability is not established. Fallback is an intentional product state, not a failure metric.

### Targets grounded in the baseline

- **Movement patterns:** direct, coherent media for all 8 real movement patterns. This should provide effective movement-pattern coverage for all 78 bases and 129 global variants; it does not replace Tier 1 exercise-specific media.
- **Base exercises:** every documented Tier 1 base exercise receives meaningful direct media. Tier 2 and Tier 3 bases use the completed movement-pattern set or an intentional fallback; no arbitrary 78/78 direct-image target is imposed.
- **Variants:** use base inheritance by default. Direct variants must be recorded as meaningful overrides, not coverage inflation.
- **Equipment:** target direct, coherent coverage for each of the 28 current equipment entities unless a documented quality/suitability exception makes an initial fallback safer.
- **Muscles:** do not expand anatomical coverage until a coherent, source-verified anatomical set is available. Any retained current muscle assignment must pass provenance, localization, storage, and credibility review; otherwise it remains an explicit audit/repair decision rather than assumed coverage.
- **Environments:** retain string-context fallback only. Do not add a managed entity or media assignment model for environments in Phase 4.

## Scope

- Complete a documented catalog coverage audit, tier map, and practical curation workflow using actual catalog entities.
- Curate high-value base exercises, equipment, all real movement patterns, and carefully selected meaningful variant overrides through the existing media-management service wherever practical.
- Reuse media assets and existing resolver inheritance; do not create duplicate files solely to raise direct-assignment counts.
- Maintain provenance, localized meaningful alt text, human quality review, and application-managed storage for every curated asset.
- Audit existing assets, assignments, storage references, localization, broken-media conditions, obvious duplicate files, and legacy provenance discrepancies without unsafe deletion.
- Refine admin discoverability only where observed catalog curation shows a focused gap, such as coverage-state filtering, search refinement, compact navigation, or a constrained reviewable reuse/batch tool.
- Re-verify mixed media states, accessibility, performance, and responsive behavior on existing Library, selected-session, Dashboard/current-workout, Day, and admin media-management surfaces.
- Update this goal, `docs/current-actions.md`, `docs/media-style-guide.md`, and provenance/operational guidance to reflect actual completed coverage and deferred gaps.

## Explicitly out of scope

- Runtime AI generation, AI API integration, prompt-building UI, automatic generation/regeneration, autonomous catalog population, or automated AI moderation/review.
- Videos, animations, user-uploaded workout imagery, image recognition, computer-vision exercise validation, sophisticated crop editing, CDN/image-transformation infrastructure, or a full DAM system.
- New environment catalog entities or changing `exercise_variants.environment` from contextual strings.
- Unrestricted bulk mutation, arbitrary mass deletion, duplication merely for metric improvement, undocumented third-party assets, or questionable anatomical claims.
- Unrelated user-facing redesign, changes to resolver precedence, authorization/CSRF/storage safeguards, database migrations, database reset, production data changes, commit, push, or deployment without explicit authorization.

## Constraints and confirmed decisions

- The persistent media model, ID-backed resolver, direct → base-exercise → movement-pattern → existing contextual fallback → initial precedence, shared component geometry, localized metadata boundary, and admin authorization/CSRF/storage workflow are reuse constraints.
- Assets must be project-created, appropriately licensed, public-domain, or human-reviewed generated work with sufficient provenance. `admin-upload` describes the management path, not authorship or license.
- Exercise media must avoid obvious technique/equipment errors. Muscle imagery has a stricter reliability threshold; intentional fallback is preferable to uncertain anatomy.
- Media remains compact and text-first. Source dimensions must not control layout; meaningful admin previews use localized alt text while adjacent catalog identity media remains decorative.
- The database remains in its disposable development phase, but no reset or mutation is authorized by this goal setup. Any later reset requires the repository’s explicit local-target and `ALLOW_DATABASE_RESET=true` safeguards.

## Completion criteria

Phase 4 is ready for final review only when:

1. This file explicitly represents Phase 4 and its actual review state, and `docs/current-actions.md` records the actual action states, evidence, deferred coverage, and limitations.
2. The catalog baseline and final coverage results distinguish direct, inherited, contextual, and initial states for every supported entity type.
3. Coverage tiers and targets are documented and applied: Tier 1 base exercises/equipment receive meaningful curation; variants preserve inheritance unless a direct override is justified; Tier 3 fallbacks remain intentional.
4. All 8 real movement patterns have a cohesive, provenance-recorded visual set; equipment coverage is strong against the 28-entity real catalog; and muscle media is retained or changed only with verified credibility and provenance.
5. Curated assignments use the central management service and application-managed storage, with traceable provenance and required localized meaningful metadata.
6. Any legacy/provenance, broken-reference, missing-storage, malformed-path, unsupported-MIME, invalid-reference, orphan, or obvious duplicate finding is accurately recorded and safely repaired only where warranted.
7. The admin workflow exposes enough practical coverage information for reliable curation, with any refinement narrowly scoped and verified.
8. Direct, inherited, contextual, and initial media remain responsive, performant, semantically consistent, and text-first across existing media-enabled surfaces; browser/manual limitations are stated accurately.
9. Focused tests and applicable repository verification pass, with skipped checks and their reasons recorded.
10. No runtime AI media system, uncontrolled bulk operation, unsafe asset source, unrelated redesign, production change, reset, commit, push, or deployment is introduced.

## Historical context

Phases 1–3 were completed and approved on 2026-09-12. Phase 1 established persistent media and deterministic resolution; Phase 2 established admin management; Phase 3 established the visual language, representative 17-asset PNG set, shared geometry repair, and structural cross-surface validation. Phase 4 reuses those accepted systems. The pre-existing JPEG discrepancy above is a verified repository/database difference, not authorization to reopen Phase 3 wholesale.

## Action 6 final-audit evidence — 2026-09-13

The action's read-only resolver measurement found 78 base exercises (29 direct, 49
movement-pattern inherited), 129 global variants (1 direct, 54 base-exercise inherited, 74
movement-pattern inherited), 28 equipment records (all direct), 8 movement patterns (all direct),
and 24 muscles (all intentional initial fallback). There are no unresolved base exercises or global
variants, and no environment or category fallback in these catalog measurements. The single direct
variant is the reviewed Goblet Squat override.

All 70 stored files are present, readable, and consistent with their stored type/dimensions; no
byte-identical duplicate was found. The only unassigned retained assets are legacy records 1–3 and
the reviewed reusable asset 5. Action 6 removed only the unsupported legacy Abs/Abductors
assignments and did not delete an asset. Library collection thumbnails now request native lazy
loading and asynchronous decoding while selected/current media remains eager. Full repository
verification passed with local PostgreSQL access; live browser rendering remains unavailable because
no browser executable is installed in this environment. The action tracker holds the detailed
verification and the unrelated HTTP-suite limitations.

## Final-review comparison — 2026-09-13

1. **Met:** this goal and the action tracker record the completed work, evidence, intentional
   gaps, and limitations.
2. **Met:** final direct, inherited, contextual, and initial resolver counts are recorded for all
   supported entity types.
3. **Met:** Tier 1 direct coverage, deliberate variant inheritance, and intentional Tier 3 muscle
   fallback are documented and applied.
4. **Met:** all 8 movement patterns and all 28 equipment entities have reviewed direct coverage;
   muscle assignments were conservatively removed pending source-verified anatomy.
5. **Met:** curated assignments use the established management service, application-managed
   storage, provenance record, and localized metadata boundary.
6. **Met:** storage, metadata, duplicate, orphan, localization, and legacy conditions were audited;
   only unsupported assignments were removed and no potentially reusable asset was deleted.
7. **Met:** the concrete reusable-asset discovery limit was addressed with a bounded admin-page
   refinement; no speculative management feature was added.
8. **Met to available evidence:** shared geometry, fallback, responsive, accessibility, and native
   deferred-loading contracts are verified structurally. Live browser/manual review remains an
   explicit environment limitation.
9. **Met:** focused checks and `npm run verify` pass (379/379). The separately recorded full HTTP
   suite remains 60/65 because of five pre-existing, non-media copy assertions.
10. **Met:** no runtime AI media system, uncontrolled bulk operation, unsafe asset claim,
    unrelated redesign, production change, reset, commit, push, or deployment was introduced.

**Intentionally excluded/deferred:** source/license review of legacy assets 1–3; new
source-verified muscle illustrations; managed environment entities; browser/manual rendering and
network profiling until a browser-capable environment is available; and the five unrelated HTTP
assertion repairs.

## Regression correction requested — 2026-09-13

The compact-density CSS does not win against a more-specific generic media width rule, so the
requested bounded exercise footprint is not reliably rendered. The Admin Media search-first path
also hides all entities until a name is supplied and marks the name field required. Action 6 is
reopened only to restore the normal server-rendered entity list with optional filtering and repair
the shared media sizing cascade; media assignment, storage, authorization, CSRF, and resolver
behavior remain unchanged.

**Implementation and current evidence:** The correction restores the default server-rendered
entity list and makes name search optional again; a read-only local-development query returns 238
entities with an empty search and 28 under the optional Equipment filter. The shared direct-media
fill rule no longer overrides compact frame dimensions, leaving 2.25rem-square icons and 3.25rem ×
2.1667rem thumbnails bounded across Library and Admin exercise rows. Focused regression coverage
passed 30/30 and `npm run verify` passed 381/381 with local PostgreSQL access. Live rendered
inspection remains unavailable because this environment has no browser executable. The requested
sizing correction is therefore implemented but not marked resolved until browser-capable manual
verification confirms the actual dimensions.

## Resume here

Phase 4 is active. Actions 1–5 are completed. **Action 6 — Asset health, performance, responsive
verification, and final-review preparation** is **Ready for review** after the cohesive
Library/Admin media and template UI audit and scoped local recovery. The goal is not ready for
final review until Action 6 is explicitly approved.

## Comprehensive Library/Admin audit — 2026-09-13

The requested end-to-end trace is verified in the repository: Library/Admin controllers load all
visible `entity_media` assignments once; the shared resolver receives stable entity IDs; Library
view models retain the resolved result; and the common media component renders that result in its
requested compact icon or thumbnail frame. The compact-density styling changes only frame geometry
and cannot select a fallback. The deterministic current order is direct entity assignment → base
exercise assignment for a variant → movement-pattern assignment → existing static contextual
fallback (movement, environment, category when present) → initial tile. Tests cover direct,
base-inherited, movement-inherited, localized-alt, and initial states; no recent UI change alters
this precedence.

The approved generated media files have **not** been lost from storage: `public/media/uploads`
contains all 70 retained managed files, including every provenance-recorded project-generated PNG.
However, a read-only query of the configured `lets_flex` development database found 78 exercises
and 129 variants but **0** `media_assets` and **0** `entity_media` rows. The canonical seed test
also intentionally asserts zero media rows. Thus this development database cannot render any
previous direct/generated assignment and will correctly show contextual or initial fallback; this
is a data-state discrepancy, not a resolver-priority, mapper, compact-frame, or file-loss bug.
Restoring the 66 historical assignments requires an explicitly authorized recovery/import decision
and is not silently performed here because this audit forbids reseeding and bulk reassignment.

**Scoped recovery completed:** The user then explicitly authorized the local recovery. One atomic
transaction restored only documented project-generated asset records 4–70: 67 PNG assets, 134
localized (`en` and `pt-BR`) alt-text rows, and 66 primary assignments. Asset 5 remains the
reviewed reusable unassigned asset; legacy assets 1–3 and the intentionally removed muscle
assignments were not recreated. The transaction validated every PNG's type/dimensions and every
catalog target before writing. The restored local catalog has 29 direct base-exercise assignments,
one direct variant, 28 equipment assignments, and eight movement-pattern assignments. A
post-recovery application-boundary check confirms Library Bench Press and its Barbell/Dumbbell
variants resolve to the expected generated Bench Press PNG, while Admin Media returns the localized
Portuguese direct preview.

The static UI audit found the Library Sessions desktop split preserves a useful list width and
collapses to one column before compression; long names/metadata use bounded grid tracks and
wrapping; selected-session exercise rows retain their resolved compact media. Library Exercises and
Admin → Manage Exercises share the same compact 2.25rem icon and 3.25rem × 2.1667rem thumbnail
contract, text-first grid, wrapping metadata, nullable-value copy, accordion semantics, and
responsive action reflow. The shared exercise form remains a single labelled modal workflow with
native fields, error/hint associations, muscle-role controls, dynamic rows, destructive actions,
and focus handling. One shared form correction ensures long added muscle-role labels remain bounded
on desktop and wrap rather than truncate on narrow layouts. Admin → Manage Media retains the
restored default entity list, optional search/type filters, clear-filter return path, selected
editor separation, direct/inherited/initial source information, existing-asset reuse, and
authorization/CSRF-preserving mutation forms. No media-management behavior, schema, resolver,
localization, authorization, or storage code changed in this audit.
