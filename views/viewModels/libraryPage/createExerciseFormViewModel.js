/**
 * @typedef {import("../../../src/features/equipments/equipments.types.js").EquipmentMapper} Equipment
 * @typedef {import("../../../src/features/movementPatterns/movementPatterns.types.js").MovementPatternMapper} MovementPattern
 * @typedef {import("../../../src/features/muscles/muscles.types.js").MuscleMapper} Muscle
 * @typedef {import("../../../src/features/muscleRoles/muscleRoles.types.js").MuscleRoleMapper} MuscleRole
 */

/**
 * @param {{equipments: Equipment[], movementPatterns: MovementPattern[], muscles: Muscle[], muscleRoles: MuscleRole[]}} input
 */
export default function createExerciseFormViewModel({
	equipments,
	movementPatterns,
	muscles,
	muscleRoles,
}) {
	return {
		modal: {
			id: "createExerciseModal",
			title: "Create exercise template",
		},
		form: {
			id: "create-exercise-template-form",
			heading: "Create exercise template",
			description: "Define a reusable exercise template.",
			action: "/exerciseTemplates",
		},
		fields: {
			movementPatternOptions: movementPatterns.map(item => ({
				label: item.name,
				value: item.id,
			})),
			equipmentOptions: equipments.map(item => ({
				label: item.name,
				value: item.id,
			})),
			muscleOptions: muscles.map(item => ({
				label: `${item.commonName} (${item.scientificName})`,
				value: item.id,
			})),
			muscleRoleOptions: muscleRoles.map(item => ({
				label: item.name,
				value: item.id,
			})),
		},
		actions: {
			cancel: { label: "Cancel" },
			submit: { label: "Create exercise" },
			addMuscle: { label: "Add muscle" },
		},
	};
}
