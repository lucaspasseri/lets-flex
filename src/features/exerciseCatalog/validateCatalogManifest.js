const minimumPatternCounts = Object.freeze({
	push: 13,
	pull: 13,
	squat: 6,
	hinge: 14,
	lunge: 8,
	rotation: 8,
	carry: 3,
	gait: 10,
});

const normalizeName = (name) =>
	name
		.normalize("NFKD")
		.toLocaleLowerCase("en-US")
		.replace(/[^a-z0-9]+/g, "");

function assertNonEmptyString(value, label) {
	if (typeof value !== "string" || value.trim() !== value || value.length === 0) {
		throw new Error(`${label} must be a non-empty trimmed string`);
	}
}

function assertUniqueNames(items, label) {
	const exactNames = new Set();
	const normalizedNames = new Map();

	for (const item of items) {
		assertNonEmptyString(item.name, `${label} name`);
		if (exactNames.has(item.name)) {
			throw new Error(`Duplicate ${label} name: ${item.name}`);
		}

		const normalizedName = normalizeName(item.name);
		const existingName = normalizedNames.get(normalizedName);
		if (existingName !== undefined) {
			throw new Error(
				`Normalized duplicate ${label} names: ${existingName} and ${item.name}`,
			);
		}

		exactNames.add(item.name);
		normalizedNames.set(normalizedName, item.name);
	}
}

export function validateCatalogManifest(manifest, vocabulary) {
	if (!Array.isArray(manifest) || manifest.length < 60) {
		throw new Error("Catalog must contain at least 60 base exercises");
	}

	const movementPatterns = new Set(vocabulary.movementPatterns);
	const muscles = new Set(vocabulary.muscles);
	const muscleRoles = new Set(vocabulary.muscleRoles);
	const equipment = new Set(vocabulary.equipment);
	const environments = new Set(vocabulary.environments);
	const patternCounts = new Map();
	const variants = manifest.flatMap((exercise) => exercise.variants ?? []);

	assertUniqueNames(manifest, "base exercise");
	assertUniqueNames(variants, "global variant");

	if (variants.length < 100) {
		throw new Error("Catalog must contain at least 100 global variants");
	}

	for (const exercise of manifest) {
		if (!movementPatterns.has(exercise.movementPattern)) {
			throw new Error(
				`Unknown movement pattern for ${exercise.name}: ${exercise.movementPattern}`,
			);
		}

		patternCounts.set(
			exercise.movementPattern,
			(patternCounts.get(exercise.movementPattern) ?? 0) + 1,
		);

		if (!Array.isArray(exercise.muscles) || exercise.muscles.length === 0) {
			throw new Error(`${exercise.name} must have muscle metadata`);
		}

		if (!exercise.muscles.some((muscle) => muscle.role === "prime_mover")) {
			throw new Error(`${exercise.name} must have a prime mover`);
		}

		for (const muscle of exercise.muscles) {
			if (!muscles.has(muscle.name)) {
				throw new Error(`Unknown muscle for ${exercise.name}: ${muscle.name}`);
			}
			if (!muscleRoles.has(muscle.role)) {
				throw new Error(`Unknown muscle role for ${exercise.name}: ${muscle.role}`);
			}
		}

		if (!Array.isArray(exercise.variants) || exercise.variants.length === 0) {
			throw new Error(`${exercise.name} must have at least one global variant`);
		}

		for (const exerciseVariant of exercise.variants) {
			if (
				exerciseVariant.equipment !== null &&
				!equipment.has(exerciseVariant.equipment)
			) {
				throw new Error(
					`Unknown equipment for ${exerciseVariant.name}: ${exerciseVariant.equipment}`,
				);
			}
			assertNonEmptyString(
				exerciseVariant.setupDescription,
				`${exerciseVariant.name} setup description`,
			);
			if (!environments.has(exerciseVariant.environment)) {
				throw new Error(
					`Unknown environment for ${exerciseVariant.name}: ${exerciseVariant.environment}`,
				);
			}
		}
	}

	for (const [pattern, count] of Object.entries(minimumPatternCounts)) {
		if ((patternCounts.get(pattern) ?? 0) < count) {
			throw new Error(
				`Catalog must contain at least ${count} ${pattern} base exercises`,
			);
		}
	}

	return {
		baseCount: manifest.length,
		variantCount: variants.length,
		patternCounts: Object.fromEntries(patternCounts),
	};
}
