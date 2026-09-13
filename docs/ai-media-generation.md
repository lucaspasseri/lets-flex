# AI-Assisted Media Generation

## Purpose and boundary

Phase 5 adds a controlled way for administrators to create **candidate** catalog media. It does
not make image generation part of normal application rendering, catalog creation, or approval.

```text
admin request → provider-neutral generation service → private candidate
    → explicit admin review → approve → normal media asset + primary assignment
```

No user-facing page calls an AI provider. The resolver reads only approved `media_assets` joined to
`entity_media`; it has no candidate lookup or AI fallback.

## Initial support policy

| Entity type              | Supported | Preset                     | Server-derived context                                                                                                                                 |
| ------------------------ | --------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Global exercise          | Yes       | `exercise-editorial`       | Canonical name and movement pattern when present                                                                                                       |
| Global exercise variant  | Yes       | `exercise-editorial`       | Canonical and base names, equipment when present, setup description when present, environment when present, and the base movement pattern when present |
| Equipment                | Yes       | `equipment-editorial`      | Canonical equipment name                                                                                                                               |
| Movement pattern         | Yes       | `movement-pattern-graphic` | Canonical movement-pattern name                                                                                                                        |
| Muscle                   | No        | —                          | Generated anatomy is outside Phase 5’s reliability boundary                                                                                            |
| Environment              | No        | —                          | Environments are contextual strings, not assignable media entities                                                                                     |
| Private exercise variant | No        | —                          | The current media-management boundary excludes private catalog content                                                                                 |

The candidate-context repository must load the target afresh by stable type and ID. It must not
trust form-supplied name, equipment, pattern, or environment. Missing metadata is omitted from the
prompt; it is never guessed.

## Visual presets and prompt strategy

The fixed presets interpret [the media style guide](./media-style-guide.md); they are not free-form
style controls.

- `exercise-editorial`: a single, recognizable movement with relevant supplied equipment, a safe
  readable body position, full defining movement/equipment in a protected central 3:2 crop, a calm
  charcoal/neutral background, coral emphasis, and restrained teal support.
- `equipment-editorial`: one recognizable, unbranded object with simple geometry, no display text,
  a neutral/dark background, and the same 3:2 editorial family.
- `movement-pattern-graphic`: a quiet, readable silhouette or simplified pose; it must not compete
  with exercise illustrations or mix a photographic treatment into the movement-pattern family.

The prompt builder has a version such as `media-v1`. It combines the preset’s non-negotiable
composition/safety instructions with reliable structured context. An optional administrator
refinement is limited to 280 trimmed characters, rejects control characters, and is presented only
as a quoted visual preference. It cannot select an entity, alter a preset, change configuration,
write a path, or control authorization. The prompt builder never asks for embedded words, labels,
logos, watermarks, anatomy diagrams, or coaching authority.

Prompts and refinement text are not persisted in the first version. Candidate history records only
the prompt-builder version and preset. This is sufficient to reproduce the applicable policy while
avoiding retention of arbitrary administrator text.

## Provider-neutral contract and configuration

The application-facing boundary will be a service, not a controller, repository, or template:

```text
mediaGenerationService.requestCandidate({ entityType, entityId, preset, refinement, requestNonce })
```

It loads context, builds the prompt, invokes an injected provider adapter, validates the returned
bytes, and creates a pending candidate. A provider adapter receives a normalized request:

```text
{ prompt, aspectRatio: "3:2", preset }
```

and returns only normalized data:

```text
{ bytes, mimeType, provider, model? }
```

Image dimensions are derived from the locally inspected bytes, not trusted from the provider. Raw
provider responses, request headers, credentials, URLs containing secrets, and cost guesses do not
cross the adapter boundary.

The authorized provider is the OpenAI Image API. The adapter calls its single-prompt generation
endpoint with `gpt-image-2.5-flare`, OpenAI’s current fast, high-quality everyday image model;
the Image API is the documented choice for a single generated image rather than a conversational
editing workflow. See the [official OpenAI image-generation guide](https://developers.openai.com/api/docs/guides/image-generation).
`OPENAI_API_KEY` and the optional `OPENAI_IMAGE_GENERATION_TIMEOUT_MS` are read lazily from server
environment variables at request time. A missing key, invalid configuration, timeout,
quota/rate-limit, transport error, provider rejection, or invalid image becomes a small,
user-safe domain error for the admin UI. It does not make app startup fail or change active media.
Tests inject a deterministic adapter and never make paid/live generation requests.

## Candidate persistence and protected storage

Existing `media_assets` are approved renderable records, so candidates need a distinct table rather
than an approval flag on those assets. Action 2 will add `media_generation_candidates` to the
authoritative schema (and keep the canonical reset/seed path reproducible) with:

- stable candidate ID; target `entity_type` and `entity_id`, constrained to the four supported
  global types; and `requested_by_user_id`;
- `status` constrained to `pending_review`, `approved`, or `rejected`;
- provider name, optional model identifier, preset, source (`ai-generation`), prompt version,
  private storage key, inspected MIME type, dimensions, and creation time;
- optional reviewer ID and reviewed/approved/rejected times; and the resulting
  `approved_media_asset_id` after successful approval.
- `private_file_removed_at`, which records successful private-object cleanup for approved or
  rejected rows; a null value after a terminal status is a safe reconciliation target, never a
  reason to expose or reactivate the candidate.

No candidate is written to `/public/media/uploads`. Private candidate files use an
application-generated opaque key outside Express static roots. An admin-only route resolves a
candidate ID server-side, checks that it is pending review, reads only that private
object, and serves its validated MIME type with `Cache-Control: private, no-store`. It never
accepts a client-provided filesystem path or storage key.

Generation persists in this order: call the external provider; inspect returned bytes against the
existing PNG/JPEG/WebP and size limits; write an opaque private file; create the candidate row in a
database transaction. A failed database write removes the private file. A failed provider, byte
inspection, or private write creates no candidate and leaves current media unchanged.

One server-issued, session-bound, single-use generation nonce protects each form submission from
accidental duplicate requests. The page disables its submit control after a request begins as a
second, usability-level guard. Regeneration produces a new candidate ID. Once that new candidate
is safely persisted, the prior pending candidate for the same target is rejected and its private
file is removed; a failed regeneration leaves the prior candidate reviewable.

## Review and lifecycle

```text
pending_review --approve--> approved
pending_review --reject----> rejected
pending_review --regenerate-> rejected + a distinct pending_review candidate
```

Only `pending_review` is actionable. The admin page must show target identity/type, preset,
provider/model when available, candidate preview, source/provenance, and the current effective
media. If the target has direct media, approval clearly says that it will replace the **assignment**
only; the former approved asset remains reusable.

Approval requires a human review and meaningful English plus Brazilian Portuguese alt text. It
checks the relevant visual policy: exercise/equipment identity, equipment correctness, impossible
geometry, unsafe form, duplicated limbs, severe distortion, embedded text/branding, crop, and
style consistency. It does not claim coaching or anatomical authority.

On approval, the service reads and re-inspects the private candidate, writes it through the existing
public media-storage boundary, then starts a database transaction. The transaction locks the
pending candidate, revalidates its target, creates a normal `media_assets` row with source
`ai-generation`, writes localized alt text, calls the existing `assignPrimaryMedia`, and records the
approved asset ID on the candidate. If any database step fails, it removes the newly public file;
the existing assignment is untouched. After commit it removes the private candidate file. A failed
post-commit removal leaves `private_file_removed_at` null for safe retry/reconciliation, never
treated as a reason to undo a valid assignment.

Rejection locks the pending candidate, records reviewer/time/status, and removes the private file
after commit. If cleanup fails, the candidate remains rejected with its opaque key and a null
`private_file_removed_at` for a controlled retry; it is not public or active. This explicit cleanup
and the rollback cleanup above prevent unbounded silent orphan accumulation.

## Admin interface hierarchy and states

The existing selected-entity section remains the primary context. Candidate work is a second panel,
not a replacement for upload/reuse controls:

1. target entity, direct/inherited/fallback source, and current effective preview;
2. fixed preset and a short optional refinement field; then one primary **Generate candidate**
   action;
3. pending candidate preview with source/preset/provider metadata and explicit review checklist;
4. localized alt-text fields and a primary **Approve and assign** action; secondary **Regenerate**;
   destructive **Reject candidate**.

The UI will use native forms and existing shared controls, label every field, retain CSRF tokens,
surface validation/failure feedback without provider internals, and disclose direct-assignment
replacement in text. It must cover unavailable configuration, generation pending, candidate
pending review, success, malformed input, provider failure, storage/database failure, rejection,
and an entity with existing direct media. Responsive validation will inspect small, intermediate,
and large widths once UI work is authorized.

## Observability and verification plan

Action 2 will log only proportional, non-secret events: request accepted, generation succeeded or
failed by safe category, candidate approved, and candidate rejected. Events include candidate ID
and target type/ID where available; they exclude prompts, refinements, credentials, tokens, raw
provider payloads, and request headers.

Focused tests will cover context/prompt omission rules, preset validation, absent configuration,
provider-response normalization, byte validation, private-storage rollback, lifecycle transitions,
duplicate nonce behavior, approval handoff, replacement preservation, rejection cleanup, resolver
behavior after approval/rejection, admin/non-admin/guest authorization, CSRF, malformed IDs/types,
and refinement validation. Repository verification and a controlled manual provider check occur
only after the selected provider and any paid request are explicitly authorized.
