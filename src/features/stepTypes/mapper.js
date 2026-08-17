import toCapitalizedString from "../../../utils/toCapitalizedString.js";

/**
 * @typedef { import("./stepTypes.types.js").StepTypeRow} StepTypeRow
 * @typedef { import("./stepTypes.types.js").StepTypeViewModel} StepTypeViewModel
 */

/**
 * @param {StepTypeRow} type
 * @returns {StepTypeViewModel}
 */

export function toStepType(type) {
	return {
		id: type.id,
		name: toCapitalizedString(type.name).replace("_", " "),
	};
}
