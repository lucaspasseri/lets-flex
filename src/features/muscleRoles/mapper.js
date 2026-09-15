import toCapitalizedString from "../../../utils/toCapitalizedString.js";

/**
 * @typedef { import("./muscleRoles.types.js").MuscleRoleRow} MuscleRoleRow
 * @typedef { import("./muscleRoles.types.js").MuscleRoleMapper} MuscleRoleMapper
 */

/**
 * @param {MuscleRoleRow} role
 * @returns {MuscleRoleMapper}
 */

export function toMuscleRole(role) {
	return {
		id: role.id,
		key: role.name,
		name: toCapitalizedString(role.name).replaceAll("_", " "),
		description: role.description,
	};
}
