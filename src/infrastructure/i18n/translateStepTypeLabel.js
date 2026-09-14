import translateMessage from "./translateMessage.js";

const STEP_TYPE_LABELS = Object.freeze({
	exercise: { key: "workout.stepType.exercise", defaultValue: "Exercise" },
	warm_up: { key: "workout.stepType.warmUp", defaultValue: "Warm up" },
	cardio: { key: "workout.stepType.cardio", defaultValue: "Cardio" },
	stretching: { key: "workout.stepType.stretching", defaultValue: "Stretching" },
	mobility: { key: "workout.stepType.mobility", defaultValue: "Mobility" },
	cooldown: { key: "workout.stepType.cooldown", defaultValue: "Cooldown" },
});

/** @param {unknown} value */
function normalizeStepType(value) {
	return typeof value === "string"
		? value
				.trim()
				.toLowerCase()
				.replace(/[\s-]+/gu, "_")
		: "";
}

/**
 * Translate a fixed step-type identifier for presentation without changing the
 * persisted step-type value or submitted ID.
 *
 * @param {unknown} value
 * @param {Function} [translate]
 * @returns {string}
 */
export default function translateStepTypeLabel(value, translate) {
	const normalized = normalizeStepType(value);
	const definition = STEP_TYPE_LABELS[normalized];
	if (!definition) {
		return typeof value === "string" ? value : "";
	}
	return translateMessage(translate, definition.key, definition.defaultValue);
}
