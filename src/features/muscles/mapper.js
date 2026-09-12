/**
 * @typedef {import("./muscles.types.js").MuscleRow} MuscleRow
 * @typedef {import("./muscles.types.js").MuscleMapper} MuscleMapper
 */

/**
 * @param {MuscleRow} muscle
 * @returns {MuscleMapper}
 */

export function toMuscle(muscle) {
	return {
		id: muscle.id,
		commonName: muscle.common_name,
		commonNameLocale: muscle.common_name_locale ?? "canonical",
		canonicalCommonName: muscle.canonical_common_name ?? muscle.common_name,
		scientificName: muscle.scientific_name,
		bodyPart: muscle.body_region,
		referenceUrl: muscle.reference_url,
	};
}
