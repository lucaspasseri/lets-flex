import toCapitalizedString from "../../../utils/toCapitalizedString.js";

export function toMovementPattern(movement) {
	return {
		id: movement.id,
		name: toCapitalizedString(movement.name),
		notes: movement.notes,
	};
}
