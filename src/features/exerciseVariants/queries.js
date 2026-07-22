export function findAllQuery() {
	return `
		SELECT
			exercise_variants.*,
			equipments.name AS equipment_name,
			exercises.name AS exercise_name,
			movement_patterns.name AS movement_pattern_name
		FROM exercise_variants
		LEFT JOIN equipments
			ON exercise_variants.equipment_id = equipments.id
		LEFT JOIN exercises
			ON exercise_variants.exercise_id = exercises.id
		LEFT JOIN movement_patterns
			ON exercises.movement_pattern_id = movement_patterns.id;
	`;
}
