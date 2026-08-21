import createExercise from "./createExerciseViewModel.js";

/**
 * @typedef { import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateMapper} ExerciseTemplateMapper
 * @typedef { import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplatesViewModel} ExerciseTemplatesViewModel
 */

/**
 * @typedef {object} CreateExerciseTemplateInput
 * @property {ExerciseTemplateMapper[]} exerciseTemplateArr
 */

/**
 *
 * @param {CreateExerciseTemplateInput} input
 * @returns {ExerciseTemplatesViewModel}
 */

function createExerciseTemplates({ exerciseTemplateArr = [] }) {
	const exerciseTemplateCount = exerciseTemplateArr.length;
	const items = exerciseTemplateArr.map(exerciseTemplate =>
		createExercise({ exerciseTemplate }),
	);

	return {
		id: "exercise-templates",
		label: "Exercise templates",
		description: "Reusable exercises and their available equipment variations.",

		count: exerciseTemplateCount,
		countLabel: `${exerciseTemplateCount} templates`,

		emptyState: {
			title: "No exercise templates yet",
			description:
				"Create your first exercise template to start building reusable training sessions.",
			icon: "dumbbell",
		},

		items,

		actions: {
			create: {
				label: "Create exercise template",
				modalId: "createExerciseModal",
			},
		},
	};
}

export default createExerciseTemplates;
