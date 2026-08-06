import createMuscleTemplate from "./createMuscleViewModel.js";

function createExercise({ exerciseTemplate = {} }) {
	const {
		movementPattern = {},
		equipment = {},
		variant = {},
		muscles = [],
	} = exerciseTemplate;

	const movementPatternLabel = movementPattern?.name
		? movementPattern?.notes
			? `${movementPattern.name} - ${movementPattern.notes}`
			: movementPattern.name
		: "-";

	const muscleTemplate = createMuscleTemplate({ muscles });

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
			muscleTemplate,
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
			edit: {
				label: `Edit ${variant?.name}`,
				href: "/library/exercises/1/edit",
			},
			remove: {
				label: `Delete ${variant?.name}`,
				modalId: "deleteExerciseModal",
				value: 1,
			},
		},
	};
}

export default createExercise;
