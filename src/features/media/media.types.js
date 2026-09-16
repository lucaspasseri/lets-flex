/**
 * The domain kind that requested media. A category is included because workout
 * step types can provide useful context even when a catalog entity has no
 * dedicated artwork.
 *
 * @typedef {"session" | "exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern" | "environment" | "category"} MediaEntityType
 */

/** @typedef {"exercise_variant" | "exercise" | "muscle" | "equipment" | "movement_pattern" | "environment" | "category" | "placeholder"} MediaMatchType */

/**
 * Repository-controlled media that is recreated during the canonical database seed.
 *
 * @typedef {object} CanonicalMediaManifestEntry
 * @property {"exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern"} entityType
 * @property {string} entityKey
 * @property {string} path
 * @property {string} storageKey Provider-neutral object key after remote migration.
 * @property {"primary"} role
 * @property {string} mimeType
 * @property {number} width
 * @property {number} height
 * @property {string} source
 * @property {string} alt
 * @property {{en: string, "pt-BR": string}} altTexts
 */

/**
 * Input accepted by the shared catalog-media resolver.
 *
 * Exercise requests may provide both a variant and base name. Other entity
 * kinds use `key`. The optional context fields are used in the documented
 * fallback order after exact entity matching.
 *
 * @typedef {object} MediaRequest
 * @property {MediaEntityType} entityType
 * @property {string} [key]
 * @property {string} [variantName]
 * @property {string} [baseName]
 * @property {string} [movementPattern]
 * @property {string} [matchVariantName] Canonical variant name used for manifest matching.
 * @property {string} [matchBaseName] Canonical base name used for manifest matching.
 * @property {string} [matchMovementPattern] Canonical movement pattern used for fallback matching.
 * @property {string} [environment]
 * @property {string} [category]
 * @property {string} [label]
 * @property {"en" | "pt-BR"} [locale]
 * @property {"image" | "initial"} [presentation]
 */

/**
 * Presentation-ready metadata for one local media asset.
 *
 * @typedef {object} MediaManifestEntry
 * @property {string | null} src
 * @property {string} [storageKey] Provider-neutral key used to derive a remote public URL.
 * @property {string} alt
 * @property {number} width
 * @property {number} height
 * @property {number} aspectRatio
 * @property {MediaMatchType} matchType
 * @property {"image" | "initial"} mediaType
 * @property {"none" | "base-exercise" | "movement-pattern" | "environment" | "category" | "initial"} fallbackType
 * @property {"image" | "initial"} presentation
 * @property {string | null} initial
 */

/**
 * Resolved media returned to view-models and future shared media components.
 * `entityType` describes what the caller asked for; `matchType` records which
 * manifest tier supplied the asset.
 *
 * @typedef {object} ResolvedMedia
 * @property {string | null} src
 * @property {string} alt
 * @property {number} width
 * @property {number} height
 * @property {number} aspectRatio
 * @property {"image" | "initial"} presentation
 * @property {string | null} initial
 * @property {MediaEntityType} entityType
 * @property {MediaMatchType} matchType
 * @property {string | null} matchedKey
 * @property {number | null} [matchedId]
 * @property {boolean} isFallback
 * @property {"image" | "initial"} mediaType
 * @property {"none" | "base-exercise" | "movement-pattern" | "environment" | "category" | "initial"} fallbackType
 */

/**
 * Input for the ID-backed resolver. Context names are retained for the current
 * category/environment fallback boundary until those concepts become entities.
 *
 * @typedef {object} EntityMediaRequest
 * @property {"exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern"} entityType
 * @property {number} entityId
 * @property {number} [parentExerciseId]
 * @property {number} [movementPatternId]
 * @property {string} [key]
 * @property {string} [variantName]
 * @property {string} [baseName]
 * @property {string} [movementPattern]
 * @property {string} [environment]
 * @property {string} [category]
 * @property {string} [label]
 * @property {"en" | "pt-BR"} [locale]
 * @property {"image" | "initial"} [presentation]
 */

/**
 * @typedef {object} MediaAssignmentCandidate
 * @property {"exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern"} entityType
 * @property {number} entityId
 */

export {};
