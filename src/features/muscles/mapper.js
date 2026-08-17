/**
 * @typedef {import("./muscles.types.js").MuscleRow} MuscleRow
 * @typedef {import("./muscles.types.js").MuscleViewModel} MuscleViewModel
 */

/**
 * @param {MuscleRow} muscle
 * @returns {MuscleViewModel}
 */

export function toMuscle(muscle) {
	return {
		commonName: muscle.common_name,
		scientificName: muscle.scientific_name,
		bodyPart: muscle.body_region,
		referenceUrl: muscle.reference_url,
	};
}
