import formatStepLoadLabel from "../sessions/formatStepLoadLabel.js";
import resolveLibraryStepMedia from "./resolveLibraryStepMedia.js";
import translateCount from "../../infrastructure/i18n/translateCount.js";

/**
 * @typedef {import("../sessions/sessions.types.js").SessionMapperStep} SessionMapperStep
 * @typedef {import("../sessions/sessions.types.js").DetailsStepsViewModel} DetailsStepsViewModel
 */

/**
 * @param {SessionMapperStep} step
 * @param {string} [language]
 * @param {Function} [translate]
 * @returns {DetailsStepsViewModel}
 */

function createDetailsStepViewModel(step, language = "en", translate) {
	const prescriptionLoad = ` · ${formatStepLoadLabel({
		loadValue: step.loadValue,
		loadUnit: step.loadUnit,
		equipmentName: step.equipment.name,
		language,
	})}`;

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
		media: resolveLibraryStepMedia(step),

		prescription: {
			sets: step.sets,
			reps: step.reps,
			loadValue: step.loadValue,
			loadUnit: step.loadUnit,
			label: `${translateCount(translate, "workout.sets", step.sets, { one: "{{count}} set", other: "{{count}} sets" })} × ${translateCount(translate, "workout.reps", step.reps, { one: "{{count}} rep", other: "{{count}} reps" })}${prescriptionLoad}`,
		},

		setupDescription: step.exercise.setupDescription ?? "-",
		environment: step.exercise.environment ?? "-",
		notes: step.exercise.notes ?? "-",

		muscles: step.muscles ?? [],
	};
}

export default createDetailsStepViewModel;
