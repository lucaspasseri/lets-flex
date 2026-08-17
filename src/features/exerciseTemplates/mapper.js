import toCapitalizedString from "../../../utils/toCapitalizedString.js";
import { toMuscleRole } from "../muscleRoles/mapper.js";

/**
 * @typedef {import("./exerciseTemplates.types.js").ExerciseTemplateRow} ExerciseTemplateRow
 * @typedef {import("./exerciseTemplates.types.js").ExerciseTemplateMapper} ExerciseTemplateMapper
 */

/**
 * @param {ExerciseTemplateRow} exercise
 * @returns {ExerciseTemplateMapper}
 */

export function toExerciseTemplateSeed(exercise) {
	const muscles = exercise.muscles.map(muscle => {
		return {
			...muscle,
			role: toMuscleRole(muscle.role),
		};
	});

	return {
		id: exercise.id,
		name: exercise.name,

		movementPattern: {
			id: exercise.movement_pattern_id,
			name: toCapitalizedString(exercise.movement_pattern_name),
			notes: exercise.movement_pattern_notes,
		},

		equipment: {
			id: exercise.equipment_id,
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

		muscles,
	};
}
