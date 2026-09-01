import createExercise from "./createExerciseViewModel.js";

/**
 * @typedef { import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateMapper} ExerciseTemplateMapper
 * @typedef { import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplatesViewModel} ExerciseTemplatesViewModel
 */

/**
 * @typedef {object} CreateExerciseTemplateInput
 * @property {ExerciseTemplateMapper[]} exerciseTemplateArr
 * @property {number | null} actorUserId
 * @property {boolean} managementMode
 */

/**
 *
 * @param {CreateExerciseTemplateInput} input
 * @returns {ExerciseTemplatesViewModel}
 */

function createExerciseTemplates({
	exerciseTemplateArr = [],
	actorUserId = null,
	managementMode = false,
}) {
	const exerciseTemplateCount = exerciseTemplateArr.length;
	const items = exerciseTemplateArr.map((exerciseTemplate) =>
		createExercise({ exerciseTemplate, actorUserId, managementMode }),
	);

	return {
		id: "exercise-templates",
		label: managementMode ? "Global exercise catalog" : "Available exercises",
		description: managementMode
			? "Only global exercises and sample variants are shown in this administrator view."
			: "Global exercises are available to everyone; variants you create remain private to you.",

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
				isVisible: managementMode,
				label: "Create exercise template",
				modalId: "createExerciseModal",
			},
		},
	};
}

export default createExerciseTemplates;
