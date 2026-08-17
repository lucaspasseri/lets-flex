/**
 * @typedef {import("../sessions/sessions.types.js").SessionMapperStep} SessionMapperStep
 * @typedef {import("../sessions/sessions.types.js").DetailsStepsViewModel} DetailsStepsViewModel
 */

/**
 * @param {SessionMapperStep} step
 * @returns {DetailsStepsViewModel}
 */

function createDetailsStepViewModel(step) {
	return {
		id: step.id,
		order: step.order,
		type: step.type,

		exercise: {
			name: step.exercise.name,
			variantName: step.exercise.variantName,
			movementPattern: step.movementPattern,
			equipment: step.equipment.name,
		},

		prescription: {
			sets: step.sets,
			reps: step.reps,
			loadValue: step.loadValue,
			loadUnit: step.loadUnit,
		},

		setupDescription: step.exercise.setupDescription ?? "-",
		environment: step.exercise.environment ?? "-",
		notes: step.exercise.notes ?? "-",

		muscles: step.muscles ?? [],
	};
}

export default createDetailsStepViewModel;
