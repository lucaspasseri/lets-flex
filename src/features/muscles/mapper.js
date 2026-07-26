export function toMuscle(muscle) {
	return {
		id: muscle.id,
		commonName: muscle.common_name,
		scientificName: muscle.scientific_name,
		bodyPart: muscle.body_region,
		referenceUrl: muscle.reference_url,
	};
}
