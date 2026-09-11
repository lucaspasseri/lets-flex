import { mediaManifest, toMediaKey } from "./mediaManifest.js";

/** @typedef {import("./media.types.js").MediaRequest} MediaRequest */
/** @typedef {import("./media.types.js").MediaEntityType} MediaEntityType */
/** @typedef {import("./media.types.js").MediaManifestEntry} MediaManifestEntry */
/** @typedef {import("./media.types.js").ResolvedMedia} ResolvedMedia */

const fallbackSections = Object.freeze([
	{ property: "movementPattern", section: "movementPattern" },
	{ property: "environment", section: "environment" },
	{ property: "category", section: "category" },
]);

/**
 * Resolve catalog/domain information into safe presentation metadata.
 *
 * Exact entity media is preferred, followed by exercise-base inheritance and
 * then movement, environment, category, and placeholder fallbacks. The same
 * function handles muscles, equipment, environments, and movement patterns so
 * page features never need their own lookup rules.
 *
 * @param {MediaRequest} request
 * @returns {ResolvedMedia}
 */
export function resolveMedia(request) {
	const label =
		request.label ??
		request.variantName ??
		request.baseName ??
		request.key ??
		"Training content";
	const exactCandidates = getExactCandidates(request);

	for (const candidate of exactCandidates) {
		const entry = getEntry(candidate.section, candidate.key);
		if (entry) {
			return toResolvedMedia(
				entry,
				request.entityType,
				candidate.key,
				candidate.isFallback,
				label,
				request.presentation,
			);
		}
	}

	for (const fallback of fallbackSections) {
		const value = request[fallback.property];
		if (!value) continue;
		const key = toMediaKey(value);
		const entry = getEntry(fallback.section, key);
		if (entry) {
			return toResolvedMedia(
				entry,
				request.entityType,
				key,
				true,
				label,
				request.presentation,
			);
		}
	}

	return toResolvedMedia(
		mediaManifest.placeholder,
		request.entityType,
		null,
		true,
		label,
		request.presentation,
	);
}

/**
 * @param {MediaRequest} request
 * @returns {Array<{section: keyof typeof mediaManifest, key: string, isFallback: boolean}>}
 */
function getExactCandidates(request) {
	if (request.entityType === "exercise") {
		return [
			...(request.variantName
				? [createCandidate("exerciseVariant", request.variantName, false)]
				: []),
			...(request.baseName
				? [createCandidate("exercise", request.baseName, Boolean(request.variantName))]
				: []),
			...(request.key ? [createCandidate("exercise", request.key, false)] : []),
		];
	}
	if (request.entityType === "session") return [];

	return request.key
		? [createCandidate(entitySection(request.entityType), request.key, false)]
		: [];
}

/**
 * @param {keyof typeof mediaManifest} section
 * @param {string} key
 * @param {boolean} isFallback
 * @returns {{section: keyof typeof mediaManifest, key: string, isFallback: boolean}}
 */
function createCandidate(section, key, isFallback) {
	return { section, key: toMediaKey(key), isFallback };
}

/**
 * @param {MediaEntityType} entityType
 * @returns {"muscle" | "equipment" | "movementPattern" | "environment" | "category"}
 */
function entitySection(entityType) {
	const sections = /** @type {const} */ ({
		muscle: "muscle",
		equipment: "equipment",
		movement_pattern: "movementPattern",
		environment: "environment",
		category: "category",
	});
	return sections[entityType];
}

/**
 * @param {string} section
 * @param {string} key
 * @returns {MediaManifestEntry | null}
 */
function getEntry(section, key) {
	const sectionValue = mediaManifest[section];
	if (!sectionValue || typeof sectionValue !== "object") return null;
	return sectionValue[key] ?? null;
}

/**
 * @param {MediaManifestEntry} entry
 * @param {MediaEntityType} entityType
 * @param {string | null} matchedKey
 * @param {boolean} isFallback
 * @param {string} [label]
 * @param {"image" | "initial"} [presentationOverride]
 * @returns {ResolvedMedia}
 */
function toResolvedMedia(
	entry,
	entityType,
	matchedKey,
	isFallback,
	label = "",
	presentationOverride,
) {
	const displayLabel = typeof label === "string" ? label.trim() : "";
	const safeLabel = displayLabel || "Training content";
	const presentation = presentationOverride ?? entry.presentation;
	const isInitial = presentation === "initial";

	return {
		...entry,
		src: isInitial ? null : entry.src,
		alt: isInitial
			? `${safeLabel} — initial tile`
			: isFallback && displayLabel
				? `${displayLabel} — ${entry.alt}`
				: entry.alt,
		initial: isInitial ? firstMeaningfulLetter(displayLabel) : entry.initial,
		presentation,
		entityType,
		matchedKey,
		isFallback,
	};
}

/**
 * @param {string} value
 * @returns {string}
 */
function firstMeaningfulLetter(value) {
	return value.match(/\p{L}/u)?.[0]?.toLocaleUpperCase("en-US") ?? "?";
}
