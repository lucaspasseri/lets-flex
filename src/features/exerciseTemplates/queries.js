export function findAllQuery() {
	return `
		SELECT
			exercises.id,
			exercises.name,
			movement_patterns.name AS movement_pattern_name,
			movement_patterns.notes AS movement_pattern_notes,
			equipments.name AS equipment_name,
			exercise_variants.name AS exercise_variant_name,
			exercise_variants.setup_description AS exercise_variant_setup_description,
			exercise_variants.environment AS exercise_variant_environment,
			exercise_variants.notes AS exercise_variant_notes
		FROM exercises
		JOIN exercise_variants
		ON exercises.id = exercise_variants.exercise_id
		JOIN movement_patterns
		ON exercises.movement_pattern_id = movement_patterns.id
		JOIN equipments
		ON exercise_variants.equipment_id = equipments.id
	`;
}
