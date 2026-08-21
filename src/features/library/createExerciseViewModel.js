import createMuscles from "./createMuscleViewModel.js";

/**
 * @typedef {import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateMapper} ExerciseTemplateMapper
 * @typedef {import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateItemViewModel} ExerciseTemplateItemViewModel
 */

/**
 * @typedef {object} CreateExerciseInput
 * @property {ExerciseTemplateMapper} exerciseTemplate
 */

/**
 * @param {CreateExerciseInput} input
 * @returns {ExerciseTemplateItemViewModel}
 */

function createExercise({ exerciseTemplate }) {
	const { id, movementPattern, equipment, variant, muscles } = exerciseTemplate;

	const movementPatternLabel = movementPattern?.name
		? movementPattern?.notes
			? `${movementPattern.name} - ${movementPattern.notes}`
			: movementPattern.name
		: "-";

	const muscleTemplates = createMuscles({ muscles });

	const searchKeyWord = `${variant?.name ?? ""} ${movementPattern?.name ?? ""} ${equipment?.name ?? ""}`;

	return {
		id: variant?.id,
		name: variant?.name,
		searchKeyWord,

		summary: {
			movementPatternLabel,
			equipmentSummary: equipment?.name ?? "-",
		},

		details: {
			description: variant?.setupDescription ?? "-",
			movementPattern: {
				name: movementPatternLabel,
			},
			muscleTemplates,
			variant: {
				id: variant?.id,
				name: variant?.name,
				equipment,
				environmentLabel: variant?.environment ?? "-",
				setupDescription: variant?.setupDescription,
				notes: variant?.notes,
			},
		},

		actions: {
			remove: {
				label: `Delete ${variant?.name}`,
				modalId: "deleteExerciseModal",
				value: id,
			},
		},
	};
}

export default createExercise;
