# Media Style Guide

## Purpose

Media helps people recognize training content; it does not decorate every available space. This guide defines the visual and operational standard for new catalog media. It applies to developers, administrators, and any future human-reviewed asset-generation work.

For the Phase 5 AI-assisted candidate workflow, read this guide with the operational
[AI media-generation design](./ai-media-generation.md). The design defines supported entities,
prompt boundaries, review, provenance, and the rule that unapproved candidates never render to
normal users.

## Core direction

Use a restrained, editorial illustration language that belongs with Let’s Flex’s dark palette:

- clear subject, limited visual noise, and one immediately readable movement or object;
- charcoal/neutral backgrounds that work against dark surfaces, with coral for emphasis and teal only as a supporting accent;
- consistent line weight, lighting, contrast, and visual perspective across a set;
- practical recognition before drama, realism, or decoration.

Avoid product advertising, busy gym photography, text baked into images, collages, watermarks, gradients that fight the UI, white-background cutouts, and mixed illustration/photography within one nearby list. An intentional initial fallback is preferable to an asset that is misleading, low quality, visually unrelated, or has unknown provenance.

## Entity roles

| Entity           | Preferred treatment                                                                                                                                           | Assignment rule                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exercise         | Single, recognizable movement illustration with a clear body position and relevant equipment. Use a stable three-quarter or side perspective where practical. | A base-exercise asset is the default.                                                                                                                                  |
| Exercise variant | Inherit base-exercise media unless the equipment, body position, or training context materially changes recognition.                                          | Add direct media only for meaningful distinctions such as barbell versus dumbbell, seated versus standing, cable versus machine, or a clearly distinct cardio context. |
| Equipment        | Isolated object or simple illustration, neutral background, consistent scale, no product branding.                                                            | Use an asset when the equipment benefits catalog recognition; do not manufacture coverage solely for completeness.                                                     |
| Movement pattern | Quieter graphic illustration, silhouette, or symbolic pose that communicates the category quickly. It must not compete with exercise media.                   | One visual per pattern is sufficient for validation.                                                                                                                   |
| Muscle           | Standardized anatomical diagram with a neutral body representation, fixed orientation, and clearly limited highlight.                                         | Do not assign unless the source is known and the depicted region is reliably appropriate. Leave the initial fallback otherwise.                                        |
| Environment      | Contextual only. It may be more editorial than entity media, but must remain restrained and palette-compatible.                                               | `exercise_variants.environment` is not a managed entity; do not add direct environment assignments in this phase.                                                      |

## Asset characteristics

- **Composition:** keep the subject centered or slightly offset with clear negative space. Do not crop the defining equipment, hands, feet, or movement endpoint in the intended 3:2 frame.
- **Background:** use a calm neutral/dark background or a very restrained context. Avoid high-key white, visual clutter, and unrelated scenery.
- **Crop and fit:** create for a 3:2 source crop. The shared UI uses `object-fit: cover`; protect the subject inside a safe central area so a square icon crop still communicates the entity.
- **Density and contrast:** one subject, readable silhouette, and enough tonal separation from a dark surface. Coral/teal must support recognition, not become the entire image.
- **Quality:** use clean edges, no visible compression artifacts, no tiny unreadable details, and no embedded labels. Prefer a practical 1200 × 800 source or another efficient 3:2 size; do not upload an oversized original merely because the upload boundary permits it.
- **Formats:** Phase 2 accepts PNG, JPEG, and WebP only, validates image bytes, and limits uploads to 8 MB. SVG is not an admin-upload format.

## Presentation geometry

Only these current component variants are retained. Source dimensions never determine layout.

| Component variant | Role and surface                                                    | Geometry                                                  | Image behavior                                                        | Fallback behavior                                      | Responsive rule                                                               |
| ----------------- | ------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `icon`            | Compact list identity: Library summaries/variants and workout steps | 2.75rem × 2.75rem, 1:1                                    | `object-fit: cover`, centered, 0.55rem radius, page background/border | Same outer box; centered initial on the subtle surface | Fixed compact size; text wraps beside or below it at existing narrow layouts. |
| `thumbnail`       | Exercise detail and active-step identity                            | 3.75rem × 2.5rem, 3:2                                     | `object-fit: cover`, centered, 0.55rem radius, page background/border | Same 3:2 outer box and radius; centered initial        | Fixed compact size; narrow layouts reflow content instead of enlarging media. |
| `exercise`        | Admin representative preview                                        | 3:2, width up to 18rem and never wider than its container | `object-fit: cover`, centered, clipped figure frame                   | Same 3:2 preview frame and centered initial            | Fluid to available column width; no hero variant is currently justified.      |

Phase 3 repaired the shared initial-state contract: the initial state uses the requested `icon`, `thumbnail`, or `exercise` outer geometry rather than a fixed square tile. Do not introduce `hero`, gallery, or page-local variants unless a later approved action establishes a distinct information role.

## Content versus decoration

| Surface                                                                                           | Classification                                                  | Rule                                                                                                                               |
| ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Library exercise summary, variant row, session-step row, Day/workout-step row, Dashboard step row | Decorative identity                                             | Keep the media hidden from assistive technology because adjacent text already identifies the item. Preserve the text-first layout. |
| Library selected exercise detail                                                                  | Decorative supporting identity                                  | The adjacent heading supplies the name; do not create repeated screen-reader output.                                               |
| Admin media preview                                                                               | Meaningful                                                      | Expose localized alt text because the preview is reviewing the asset itself.                                                       |
| Session headers and session summaries                                                             | Meaningful session identity is not established by catalog media | Retain the intentional session initial; do not use catalog imagery as a generic session banner.                                    |
| Programs, History, and other pages without a current media-component use                          | Unnecessary                                                     | Do not add media merely for visual variety.                                                                                        |

## Accessibility

- Write useful English and Brazilian Portuguese alt text for meaningful admin-preview media. Describe the entity/movement, not color or the surrounding UI.
- Decorative instances use empty alt text or `aria-hidden` when a visible adjacent name supplies the identity.
- Initial fallbacks are intentional visual identity, not an error. Do not announce them redundantly when decorative; meaningful standalone fallbacks retain the existing labelled image contract.
- Do not encode assignment source, selected state, or error state in media color alone.

## Source, provenance, and review

Before an asset is added, record its entity, creator/source, license or permission, source URL or project origin, creation date, format/dimensions, and reviewer in the Action 2 curation record. Use only project-created work, assets with an appropriate documented license, public-domain sources, or human-reviewed generated work. Do not copy images from search results or fitness sites without established permission.

Review each exercise for obvious movement identity, body orientation, equipment placement, and unsafe-looking positioning. This is a visual quality gate, not medical or coaching certification. Muscle imagery is stricter: reject uncertain side/orientation, inaccurate highlight regions, invented structures, and unverified anatomy. Keep a fallback when confidence is insufficient.

External AI generation may be used only as a human-reviewed design experiment. It must follow the same provenance and quality record, then pass through human review → admin assignment → normal resolver. No runtime generation, prompt UI, automatic regeneration, or automatic approval is permitted.

## Phase 3 representative validation set

Action 2 curates this 17-asset representative set from the existing seed catalog. It is deliberately within the approved 15–30 entity range and favors clear coverage over broad catalog population. The Dumbbell Bench Press variant is validated through intentional base-exercise inheritance rather than a duplicate direct image.

| Group                        | Existing entities                                             | What it validates                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Base/variant resolver states | Bench Press; Goblet Squat; Dumbbell Bench Press               | Base direct assignment, a materially distinct kettlebell direct variant, and inherited variant media.                                           |
| Exercise recognition         | Push Up; Row; Leg Press; Goblet Squat; Hip Extension; Running | Direct base media and one meaningful variant override across bodyweight, unilateral, machine, kettlebell, posterior-chain, and cardio contexts. |
| Equipment                    | Barbell; Dumbbell; Kettlebell; Resistance Band                | Isolated-object consistency across free weights and an accessory.                                                                               |
| Movement patterns            | Push; Pull; Squat; Hinge; Gait                                | A compact, quiet category system without treating every exercise as a category illustration.                                                    |
| Muscles and environments     | None initially                                                | Muscle assignments require independently reliable anatomical sources; environments are contextual strings rather than manageable entities.      |

The unassigned Box Squat, mobility/stretch and cable examples, and Treadmill equipment remain valid future candidates; their omission is a scope choice, not an asset-quality finding. Lunge, Carry, and Rotation were subsequently added as the completed three-item movement-pattern family in Phase 4 Action 3.

## Current audit notes

- The committed static manifest contains 12 small, lightweight 3:2 SVG illustrations using the current charcoal/coral/teal palette. They prove resolver coverage but are not a complete Phase 3 curation set and are not admin-uploadable assets.
- Three ignored JPEG uploads (also mirrored in ignored `imagesSample`) have no repository-tracked provenance and use disparate realistic/anatomical styles. They are rejected from Phase 3 curation unless their source and suitability are established later.
- Library uses icon and thumbnail contracts; Dashboard/current workout and Day use compact step media; the admin page uses the 3:2 preview. Session headers intentionally use initial identity rather than catalog imagery. Programs and History currently have no shared-media rendering call.
- The repository has responsive CSS contracts, but this environment has no detected browser executable. Live visual inspection at narrow, intermediate, and desktop widths remains required in later validation.

## Phase 4 operational curation

Phase 4 uses this visual language at catalog scale. The entity-level tier map, current coverage
baseline, batch order, reuse rules, and legacy-asset boundary live in
[`media-catalog-coverage-plan.md`](./media-catalog-coverage-plan.md). Follow that plan before
adding or replacing a catalog assignment.

The operational rule is: choose a reviewed, provenance-recorded asset; check whether an existing
asset or parent assignment already communicates the entity; use the admin media-management service
for every supported assignment; and record a direct override only when it changes recognition. Do
not add an asset merely to improve a direct-coverage percentage.
