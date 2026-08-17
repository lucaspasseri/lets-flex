import toCapitalizedString from "../../../utils/toCapitalizedString.js";

/**
 * @typedef {import("./movementPatterns.types.js").MovementPatternRow} movementPatternRow
 * @typedef {import("./movementPatterns.types.js").MovementPatternViewModel} MovementPatternViewModel
 */

/**
 * @param {movementPatternRow} movement
 * @returns { MovementPatternViewModel}
 */

export function toMovementPattern(movement) {
	return {
		id: movement.id,
		name: toCapitalizedString(movement.name),
		notes: movement.notes,
	};
}
