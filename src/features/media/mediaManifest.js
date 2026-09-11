/** @typedef {import("./media.types.js").MediaManifestEntry} MediaManifestEntry */

const mediaAsset = (src, alt, matchType) =>
	/** @type {MediaManifestEntry} */ ({
		src,
		alt,
		width: 960,
		height: 640,
		aspectRatio: 1.5,
		matchType,
	});

/**
 * Curated local media for the first media-system iteration.
 *
 * Keys are normalized slugs of stable catalog names. Keep filenames lowercase,
 * use one primary 960×640 asset per entry, and add new artwork here rather than
 * looking up media in a page template.
 */
export const mediaManifest = Object.freeze({
	exerciseVariant: Object.freeze({
		"barbell-bench-press": mediaAsset(
			"/media/exercise-barbell-bench-press.svg",
			"Barbell bench press exercise illustration",
			"exercise_variant",
		),
	}),
	exercise: Object.freeze({
		"bench-press": mediaAsset(
			"/media/exercise-bench-press.svg",
			"Bench press exercise illustration",
			"exercise",
		),
	}),
	muscle: Object.freeze({
		chest: mediaAsset("/media/muscle-chest.svg", "Chest muscle illustration", "muscle"),
	}),
	equipment: Object.freeze({
		barbell: mediaAsset(
			"/media/equipment-barbell.svg",
			"Barbell equipment illustration",
			"equipment",
		),
	}),
	movementPattern: Object.freeze({
		push: mediaAsset(
			"/media/movement-push.svg",
			"Push movement illustration",
			"movement_pattern",
		),
	}),
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
	placeholder: mediaAsset(
		"/media/media-placeholder.svg",
		"Generic training media placeholder",
		"placeholder",
	),
});

/**
 * @param {string} value
 * @returns {string}
 */
export function toMediaKey(value) {
	return value
		.normalize("NFKD")
		.toLocaleLowerCase("en-US")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
