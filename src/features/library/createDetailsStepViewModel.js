/**
 * @typedef {import("../sessions/sessions.types.js").SessionMapperStep} SessionMapperStep
 * @typedef {import("../sessions/sessions.types.js").DetailsStepsViewModel} DetailsStepsViewModel
 */

/**
 * @param {SessionMapperStep} step
 * @returns {DetailsStepsViewModel}
 */

function createDetailsStepViewModel(step) {
	const prescriptionLoad =
		step.loadValue !== null && step.loadValue !== undefined && step.loadUnit
			? ` · ${step.loadValue} ${step.loadUnit}`
			: "";

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
			label: `${step.sets} sets × ${step.reps} reps${prescriptionLoad}`,
		},

		setupDescription: step.exercise.setupDescription ?? "-",
		environment: step.exercise.environment ?? "-",
		notes: step.exercise.notes ?? "-",

		muscles: step.muscles ?? [],
	};
}

export default createDetailsStepViewModel;
