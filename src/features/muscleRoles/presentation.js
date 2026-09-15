import translateMessage from "../../infrastructure/i18n/translateMessage.js";

/**
 * @typedef {import("./muscleRoles.types.js").MuscleRoleMapper} MuscleRoleMapper
 */

const ROLE_LABEL_KEYS = Object.freeze({
	prime_mover: { key: "library.muscleRoleLabels.primary", defaultValue: "Primary" },
	secondary_mover: {
		key: "library.muscleRoleLabels.secondary",
		defaultValue: "Secondary",
	},
	synergist: { key: "library.muscleRoleLabels.synergist", defaultValue: "Synergist" },
	stabilizer: {
		key: "library.muscleRoleLabels.stabilizer",
		defaultValue: "Stabilizer",
	},
	antagonist: {
		key: "library.muscleRoleLabels.antagonist",
		defaultValue: "Antagonist",
	},
	fixator: { key: "library.muscleRoleLabels.fixator", defaultValue: "Fixator" },
	dynamic_stabilizer: {
		key: "library.muscleRoleLabels.dynamicStabilizer",
		defaultValue: "Dynamic stabilizer",
	},
});

/**
 * @param {MuscleRoleMapper | null | undefined} role
 * @returns {string}
 */
export function getMuscleRoleKey(role) {
	return role?.key ?? role?.name?.toLowerCase().replaceAll(" ", "_") ?? "";
}

/**
 * @param {MuscleRoleMapper | null | undefined} role
 * @returns {"primary" | "secondary" | "other"}
 */
export function getMuscleRoleGroup(role) {
	const roleKey = getMuscleRoleKey(role);
	return roleKey === "prime_mover"
		? "primary"
		: roleKey === "secondary_mover"
			? "secondary"
			: "other";
}

/**
 * @param {MuscleRoleMapper | null | undefined} role
 * @param {unknown} translate
 * @returns {string}
 */
export function getMuscleRoleLabel(role, translate) {
	const definition = ROLE_LABEL_KEYS[getMuscleRoleKey(role)];
	return definition
		? translateMessage(translate, definition.key, definition.defaultValue)
		: role?.name ||
				translateMessage(translate, "library.muscleRoleLabels.other", "Other");
}
