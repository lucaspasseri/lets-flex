import { resolveMedia } from "./resolveMedia.js";

/** @typedef {import("../sessions/sessions.types.js").SessionMapperStep} SessionMapperStep */
/** @typedef {import("./media.types.js").ResolvedMedia} ResolvedMedia */

/**
 * Resolve a catalog-backed session step through the shared media contract.
 * Step type supplies category context when the exercise has no dedicated asset.
 *
 * @param {SessionMapperStep} step
 * @param {{presentation?: "image" | "initial"}} [options]
 * @returns {ResolvedMedia}
 */
export default function resolveStepMedia(step, options = {}) {
	const label = step.exercise.variantName || step.exercise.name;

	return resolveMedia({
		entityType: "exercise",
		variantName: step.exercise.variantName,
		baseName: step.exercise.name,
		movementPattern: step.movementPattern,
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
