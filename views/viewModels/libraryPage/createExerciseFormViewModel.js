/**
 * @typedef {import("../../../src/features/equipments/equipments.types.js").EquipmentMapper} Equipment
 * @typedef {import("../../../src/features/movementPatterns/movementPatterns.types.js").MovementPatternMapper} MovementPattern
 * @typedef {import("../../../src/features/muscles/muscles.types.js").MuscleMapper} Muscle
 * @typedef {import("../../../src/features/muscleRoles/muscleRoles.types.js").MuscleRoleMapper} MuscleRole
 */

/**
 * @param {{equipments: Equipment[], movementPatterns: MovementPattern[], muscles: Muscle[], muscleRoles: MuscleRole[], state?: Record<string, any>, mode?: "create" | "update"}} input
 */
export default function createExerciseFormViewModel({
	equipments,
	movementPatterns,
	muscles,
	muscleRoles,
	state = {},
	mode = "create",
}) {
	const values = state.values ?? {};
	const errors = state.errors ?? { fieldErrors: {}, formErrors: [] };
	const isUpdate = mode === "update";
	const idPrefix = isUpdate ? "update-exercise" : "create-exercise";
	/** @param {string} name */
	const stringValue = (name) =>
		typeof values[name] === "string" || typeof values[name] === "number"
			? String(values[name])
			: "";
	const muscleGroup = Array.isArray(values.muscleGroup)
		? values.muscleGroup
				.filter((/** @type {any} */ item) => item && typeof item === "object")
				.map((/** @type {any} */ item) => ({
					muscleId: String(item.muscleId ?? ""),
					muscleRoleId: String(item.muscleRoleId ?? ""),
				}))
		: [];
	return {
		modal: {
			id: isUpdate ? "updateExerciseModal" : "createExerciseModal",
			title: isUpdate ? "Update exercise template" : "Create exercise template",
			openOnLoad: Boolean(state.open),
		},
		form: {
			id: `${idPrefix}-template-form`,
			heading: isUpdate ? "Update exercise template" : "Create exercise template",
			description: "Define a reusable exercise template.",
			action: isUpdate
				? `/exerciseTemplates/${state.exerciseId}/variants/${state.variantId}?_method=PATCH`
				: "/exerciseTemplates",
		},
		fields: {
			idPrefix,
			values: {
				name: stringValue("name"),
				movementPatternId: stringValue("movementPatternId"),
				equipmentId: stringValue("equipmentId"),
				muscleGroup,
			},
			errors: errors.fieldErrors ?? {},
			formErrors: errors.formErrors ?? [],
			movementPatternOptions: movementPatterns.map((item) => ({
				label: item.name,
				value: item.id,
			})),
			equipmentOptions: equipments.map((item) => ({
				label: item.name,
				value: item.id,
			})),
			muscleOptions: muscles.map((item) => ({
				label: `${item.commonName} (${item.scientificName})`,
				value: item.id,
			})),
			muscleRoleOptions: muscleRoles.map((item) => ({
				label: item.name,
				value: item.id,
			})),
		},
		actions: {
			cancel: { label: "Cancel" },
			submit: { label: isUpdate ? "Update exercise" : "Create exercise" },
			addMuscle: { label: "Add muscle" },
		},
	};
}
