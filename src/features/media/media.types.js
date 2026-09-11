/**
 * The domain kind that requested media. A category is included because workout
 * step types can provide useful context even when a catalog entity has no
 * dedicated artwork.
 *
 * @typedef {"exercise" | "muscle" | "equipment" | "movement_pattern" | "environment" | "category"} MediaEntityType
 */

/** @typedef {"exercise_variant" | "exercise" | "muscle" | "equipment" | "movement_pattern" | "environment" | "category" | "placeholder"} MediaMatchType */

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
 * @property {string} [environment]
 * @property {string} [category]
 * @property {string} [label]
 */

/**
 * Presentation-ready metadata for one local media asset.
 *
 * @typedef {object} MediaManifestEntry
 * @property {string} src
 * @property {string} alt
 * @property {number} width
 * @property {number} height
 * @property {number} aspectRatio
 * @property {MediaMatchType} matchType
 */

/**
 * Resolved media returned to view-models and future shared media components.
 * `entityType` describes what the caller asked for; `matchType` records which
 * manifest tier supplied the asset.
 *
 * @typedef {object} ResolvedMedia
 * @property {string} src
 * @property {string} alt
 * @property {number} width
 * @property {number} height
 * @property {number} aspectRatio
 * @property {MediaEntityType} entityType
 * @property {MediaMatchType} matchType
 * @property {string | null} matchedKey
 * @property {boolean} isFallback
 */

export {};
