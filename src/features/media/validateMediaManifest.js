/** @typedef {import("./media.types.js").MediaManifestEntry} MediaManifestEntry */

const manifestSections = [
	"exerciseVariant",
	"exercise",
	"muscle",
	"equipment",
	"movementPattern",
	"environment",
	"category",
];

/**
 * Validate the static shape before a manifest is consumed by the resolver.
 * Filesystem existence is intentionally tested at the asset boundary rather
 * than during application import so startup does not depend on a filesystem
 * access policy.
 *
 * @param {unknown} manifest
 * @returns {{assetCount: number, sources: string[]}}
 */
export function validateMediaManifest(manifest) {
	if (typeof manifest !== "object" || manifest === null) {
		throw new Error("Media manifest must be an object");
	}

	const record = /** @type {Record<string, unknown>} */ (manifest);
	const entries = [];

	for (const section of manifestSections) {
		const sectionValue = record[section];
		if (typeof sectionValue !== "object" || sectionValue === null) {
			throw new Error(`Media manifest section is missing: ${section}`);
		}

		for (const [key, value] of Object.entries(
			/** @type {Record<string, unknown>} */ (sectionValue),
		)) {
			assertEntry(value, `${section}.${key}`);
			entries.push(/** @type {MediaManifestEntry} */ (value));
		}
	}

	assertEntry(record.placeholder, "placeholder");
	entries.push(/** @type {MediaManifestEntry} */ (record.placeholder));

	return {
		assetCount: entries.length,
		sources: [...new Set(entries.map((entry) => entry.src))],
	};
}

/**
 * @param {unknown} value
 * @param {string} label
 */
function assertEntry(value, label) {
	if (typeof value !== "object" || value === null) {
		throw new Error(`Media manifest entry is invalid: ${label}`);
	}

	const entry = /** @type {Partial<MediaManifestEntry>} */ (value);
	if (
		typeof entry.src !== "string" ||
		!entry.src.startsWith("/media/") ||
		typeof entry.alt !== "string" ||
		entry.alt.trim() === "" ||
		typeof entry.width !== "number" ||
		entry.width <= 0 ||
		typeof entry.height !== "number" ||
		entry.height <= 0 ||
		typeof entry.aspectRatio !== "number" ||
		entry.aspectRatio <= 0 ||
		typeof entry.matchType !== "string"
	) {
		throw new Error(`Media manifest entry is invalid: ${label}`);
	}
}
