export function findAllQuery() {
	return `
		SELECT
			exercises.id,
			exercises.name,

			movement_patterns.id AS movement_pattern_id,
			movement_patterns.name AS movement_pattern_name,
			movement_patterns.notes AS movement_pattern_notes,

			equipments.id AS equipment_id,
			equipments.name AS equipment_name,
			equipments.category AS equipment_category,

			exercise_variants.id AS exercise_variant_id,
			exercise_variants.name AS exercise_variant_name,
			exercise_variants.setup_description
				AS exercise_variant_setup_description,
			exercise_variants.environment
				AS exercise_variant_environment,
			exercise_variants.notes
				AS exercise_variant_notes,

			COALESCE(
				(
					SELECT jsonb_agg(
						jsonb_build_object(
							'id', muscles.id,
							'commonName', muscles.common_name,
							'scientificName', muscles.scientific_name,
							'bodyRegion', muscles.body_region,
							'referenceUrl', muscles.reference_url,
							'role', jsonb_build_object(
								'id', muscle_roles.id,
								'name', muscle_roles.name,
								'description', muscle_roles.description
							)
						)
						ORDER BY
							muscle_roles.name,
							muscles.common_name
					)
					FROM exercise_muscles
					JOIN muscles
						ON muscles.id = exercise_muscles.muscle_id
					JOIN muscle_roles
						ON muscle_roles.id = exercise_muscles.muscle_role_id
					WHERE exercise_muscles.exercise_id = exercises.id
				),
				'[]'::jsonb
			) AS muscles

		FROM exercises

		JOIN exercise_variants
			ON exercise_variants.exercise_id = exercises.id

		JOIN movement_patterns
			ON movement_patterns.id = exercises.movement_pattern_id

		LEFT JOIN equipments
			ON equipments.id = exercise_variants.equipment_id

		ORDER BY
			exercises.name,
			exercise_variants.name
	`;
}

// export function findAllQuery() {
// 	return `
// 		SELECT
// 			exercises.id,
// 			exercises.name,
// 			movement_patterns.name AS movement_pattern_name,
// 			movement_patterns.notes AS movement_pattern_notes,
// 			equipments.name AS equipment_name,
// 			equipments.category AS equipment_category,
// 			exercise_variants.id AS exercise_variant_id,
// 			exercise_variants.name AS exercise_variant_name,
// 			exercise_variants.setup_description AS exercise_variant_setup_description,
// 			exercise_variants.environment AS exercise_variant_environment,
// 			exercise_variants.notes AS exercise_variant_notes
// 		FROM exercises
// 		JOIN exercise_variants
// 		ON exercises.id = exercise_variants.exercise_id
// 		JOIN movement_patterns
// 		ON exercises.movement_pattern_id = movement_patterns.id
// 		JOIN equipments
// 		ON exercise_variants.equipment_id = equipments.id
// 	`;
// }
