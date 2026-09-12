import { resolveMedia as resolveStaticMedia } from "./resolveMedia.js";

/** @typedef {import("../sessions/sessions.types.js").SessionMapperStep} SessionMapperStep */
/** @typedef {import("./media.types.js").ResolvedMedia} ResolvedMedia */

/**
 * Resolve a catalog-backed session step through the shared media contract.
 * Step type supplies category context when the exercise has no dedicated asset.
 *
 * @param {SessionMapperStep} step
 * @param {{presentation?: "image" | "initial", resolveMedia?: Function}} [options]
 * @returns {ResolvedMedia}
 */
export default function resolveStepMedia(step, options = {}) {
	const label = step.exercise.variantName || step.exercise.name;
	const presentation = options.resolveMedia ? "image" : options.presentation;
	if (options.resolveMedia && step.exerciseVariantId) {
		return options.resolveMedia({
			entityType: "exercise_variant",
			entityId: step.exerciseVariantId,
			parentExerciseId: step.exerciseId,
			movementPatternId: step.movementPatternId,
			variantName: step.exercise.variantName,
			baseName: step.exercise.name,
			movementPattern: step.movementPattern,
			matchVariantName: step.exercise.canonicalVariantName,
			matchBaseName: step.exercise.canonicalName,
			matchMovementPattern: step.canonicalMovementPattern,
			environment: step.exercise.environment,
			category: categoryForStepType(step.type),
			label,
			presentation,
		});
	}

	return resolveStaticMedia({
		entityType: "exercise",
		variantName: step.exercise.variantName,
		baseName: step.exercise.name,
		movementPattern: step.movementPattern,
		matchVariantName: step.exercise.canonicalVariantName,
		matchBaseName: step.exercise.canonicalName,
		matchMovementPattern: step.canonicalMovementPattern,
		environment: step.exercise.environment,
		category: categoryForStepType(step.type),
		label,
		presentation: options.presentation,
	});
}

/**
 * @param {string} type
 * @returns {"strength" | "cardio" | "warmup" | "mobility" | "stretching" | "cooldown" | undefined}
 */
function categoryForStepType(type) {
	const normalizedType = type.trim().toLocaleLowerCase("en-US").replaceAll("-", "_");
	return {
		exercise: "strength",
		cardio: "cardio",
		warm_up: "warmup",
		mobility: "mobility",
		stretching: "stretching",
		cooldown: "cooldown",
	}[normalizedType];
}
