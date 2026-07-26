import toCapitalizedString from "../../../utils/toCapitalizedString.js";

export function toExerciseTemplateSeed(exercise) {
	return {
		id: exercise.id,
		name: exercise.name,

		movementPattern: {
			name: toCapitalizedString(exercise.movement_pattern_name),
			notes: exercise.movement_pattern_notes,
		},

		equipment: {
			name: exercise.equipment_name,
			category: toCapitalizedString(exercise.equipment_category),
		},

		variant: {
			id: exercise.exercise_variant_id,
			name: exercise.exercise_variant_name,
			setupDescription: exercise.exercise_variant_setup_description,
			environment: exercise.exercise_variant_environment,
			notes: exercise.exercise_variant_notes,
		},
	};
}
