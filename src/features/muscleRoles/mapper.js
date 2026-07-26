import toCapitalizedString from "../../../utils/toCapitalizedString.js";

export function toMuscleRole(role) {
	return {
		id: role.id,
		name: toCapitalizedString(role.name).replaceAll("_", " "),
		description: role.description,
	};
}
