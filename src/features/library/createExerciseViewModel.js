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
			remove: {
				label: `Delete ${variant?.name}`,
				modalId: "deleteExerciseModal",
				value: variant?.id,
			},
		},
	};
}

export default createExercise;
