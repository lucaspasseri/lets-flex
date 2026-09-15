import canonicalMediaData from "../../../data/canonical-media.json" with { type: "json" };

/** @typedef {import("./media.types.js").CanonicalMediaManifestEntry} CanonicalMediaManifestEntry */
/** @typedef {import("./media.types.js").MediaManifestEntry} MediaManifestEntry */

const catalogSection = Object.freeze({
	exercise: "exercise",
	exercise_variant: "exerciseVariant",
	muscle: "muscle",
	equipment: "equipment",
	movement_pattern: "movementPattern",
});

/** @param {string} src @param {string} alt @param {string} matchType @param {string} [storageKey] */
const mediaAsset = (src, alt, matchType, storageKey) =>
	/** @type {MediaManifestEntry} */ ({
		src,
		...(storageKey ? { storageKey } : {}),
		alt,
		width: 960,
		height: 640,
		aspectRatio: 1.5,
		matchType,
		presentation: "image",
		initial: null,
	});

/**
 * The repository-controlled durable canonical source is a stable-key data file. The exported
 * value remains the seed/resolver bootstrap contract. Runtime promotion persists its assignment
 * metadata in the database rather than rewriting this source-controlled data.
 */
export const canonicalMediaManifest = Object.freeze(
	/** @type {ReadonlyArray<CanonicalMediaManifestEntry>} */ (canonicalMediaData),
);

const entitySections = Object.fromEntries(
	Object.values(catalogSection).map((section) => [section, {}]),
);
for (const entry of canonicalMediaManifest) {
	const section = catalogSection[entry.entityType];
	entitySections[section][entry.entityKey] = mediaAsset(
		entry.path,
		entry.alt,
		entry.entityType,
		entry.storageKey,
	);
}

const initialFallback = /** @type {MediaManifestEntry} */ ({
	src: null,
	alt: "Initial fallback",
	width: 960,
	height: 640,
	aspectRatio: 1.5,
	matchType: "placeholder",
	presentation: "initial",
	initial: "?",
});

/**
 * Presentation resolver manifest. Entity sections are derived from the same canonical source
 * used by the database seed; contextual environment/category artwork remains fallback-only.
 */
export const mediaManifest = Object.freeze({
	exerciseVariant: Object.freeze(entitySections.exerciseVariant),
	exercise: Object.freeze(entitySections.exercise),
	muscle: Object.freeze(entitySections.muscle),
	equipment: Object.freeze(entitySections.equipment),
	movementPattern: Object.freeze(entitySections.movementPattern),
	environment: Object.freeze({
		gym: mediaAsset(
			"/media/environment-gym.svg",
			"Gym environment illustration",
			"environment",
		),
	}),
	category: Object.freeze({
		strength: mediaAsset(
			"/media/category-strength.svg",
			"Strength training illustration",
			"category",
		),
		cardio: mediaAsset(
			"/media/category-cardio.svg",
			"Cardio and running illustration",
			"category",
		),
		warmup: mediaAsset(
			"/media/category-warm-up.svg",
			"Warm-up movement illustration",
			"category",
		),
		mobility: mediaAsset(
			"/media/category-mobility.svg",
			"Mobility movement illustration",
			"category",
		),
		stretching: mediaAsset(
			"/media/category-stretching.svg",
			"Stretching movement illustration",
			"category",
		),
		cooldown: mediaAsset(
			"/media/category-cooldown.svg",
			"Cooldown breathing illustration",
			"category",
		),
	}),
	placeholder: initialFallback,
});

/** @param {string} value @returns {string} */
export function toMediaKey(value) {
	return value
		.normalize("NFKD")
		.toLocaleLowerCase("en-US")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
