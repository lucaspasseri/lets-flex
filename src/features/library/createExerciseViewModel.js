import createMuscles from "./createMuscleViewModel.js";

/**
 * @typedef {import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateMapper} ExerciseTemplateMapper
 * @typedef {import("../exerciseTemplates/exerciseTemplates.types.js").ExerciseTemplateItemViewModel} ExerciseTemplateItemViewModel
 */

/**
 * @typedef {object} CreateExerciseInput
 * @property {ExerciseTemplateMapper} exerciseTemplate
 * @property {number | null} actorUserId
 * @property {boolean} managementMode
 */

/**
 * @param {CreateExerciseInput} input
 * @returns {ExerciseTemplateItemViewModel}
 */

function createExercise({
	exerciseTemplate,
	actorUserId = null,
	managementMode = false,
}) {
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
		exerciseId: id,
		name: variant?.name,
		isPrivateOwner: variant?.ownerUserId === actorUserId,
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
			canManageGlobal: managementMode && variant?.ownerUserId == null,
			canManagePrivate: variant?.ownerUserId === actorUserId,
			update: {
				label: `Edit ${variant?.name}`,
				modalId: "updateExerciseModal",
				values: {
					exerciseId: id,
					variantId: variant?.id,
					name: variant?.name,
					movementPatternId: movementPattern?.id,
					equipmentId: equipment?.id,
					muscleGroup: muscles.map((muscle) => ({
						muscleId: muscle.id,
						muscleRoleId: muscle.role.id,
					})),
				},
			},
			remove: {
				label: `Delete ${variant?.name}`,
				modalId: "deleteExerciseModal",
				value: id,
			},
		},
	};
}

export default createExercise;
