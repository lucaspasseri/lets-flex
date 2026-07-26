import toCapitalizedString from "../../../utils/toCapitalizedString.js";

export function toStepType(type) {
	return {
		id: type.id,
		name: toCapitalizedString(type.name).replace("_", " "),
	};
}
