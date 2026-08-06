import createExercise from "./createExerciseViewModel.js";

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

		emptyState: "(empty)",

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
