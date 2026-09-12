import {
	localizedCatalogJoinSql,
	localizedCatalogLocaleSql,
	localizedCatalogValueSql,
} from "../catalogLocalization/catalogLocalization.js";

export function findAllQuery({ localeParameter = "$2" } = {}) {
	return `
		SELECT
			exercises.id,
			${localizedCatalogValueSql({ alias: "exercise_translation", canonicalExpression: "exercises.name" })} AS name,
			${localizedCatalogLocaleSql({ alias: "exercise_translation" })} AS name_locale,
			exercises.name AS canonical_name,

			movement_patterns.id AS movement_pattern_id,
			${localizedCatalogValueSql({ alias: "movement_pattern_translation", canonicalExpression: "movement_patterns.name" })} AS movement_pattern_name,
			${localizedCatalogLocaleSql({ alias: "movement_pattern_translation" })} AS movement_pattern_name_locale,
			movement_patterns.name AS canonical_movement_pattern_name,
			movement_patterns.notes AS movement_pattern_notes,

			equipments.id AS equipment_id,
			${localizedCatalogValueSql({ alias: "equipment_translation", canonicalExpression: "equipments.name" })} AS equipment_name,
			${localizedCatalogLocaleSql({ alias: "equipment_translation" })} AS equipment_name_locale,
			equipments.name AS canonical_equipment_name,
			equipments.category AS equipment_category,

			exercise_variants.id AS exercise_variant_id,
			${localizedCatalogValueSql({ alias: "exercise_variant_translation", canonicalExpression: "exercise_variants.name" })} AS exercise_variant_name,
			${localizedCatalogLocaleSql({ alias: "exercise_variant_translation" })} AS exercise_variant_name_locale,
			exercise_variants.name AS canonical_exercise_variant_name,
			exercise_variants.setup_description
				AS exercise_variant_setup_description,
			exercise_variants.environment
				AS exercise_variant_environment,
			exercise_variants.notes
				AS exercise_variant_notes,
			exercise_variants.owner_user_id AS exercise_variant_owner_user_id,
			exercise_variants.is_archived AS exercise_variant_is_archived,
			exercises.is_archived AS exercise_is_archived,

			COALESCE(
				(
					SELECT jsonb_agg(
						jsonb_build_object(
							'id', muscles.id,
							'commonName', ${localizedCatalogValueSql({ alias: "muscle_translation", canonicalExpression: "muscles.common_name" })},
							'commonNameLocale', ${localizedCatalogLocaleSql({ alias: "muscle_translation" })},
							'canonicalCommonName', muscles.common_name,
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
					${localizedCatalogJoinSql({
						translationTable: "muscle_translations",
						translationEntityColumn: "muscle_id",
						entityIdExpression: "muscles.id",
						alias: "muscle_translation",
						localeParameter,
					})}
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

		${localizedCatalogJoinSql({
			translationTable: "exercise_translations",
			translationEntityColumn: "exercise_id",
			entityIdExpression: "exercises.id",
			alias: "exercise_translation",
			localeParameter,
		})}
		${localizedCatalogJoinSql({
			translationTable: "exercise_variant_translations",
			translationEntityColumn: "exercise_variant_id",
			entityIdExpression: "exercise_variants.id",
			alias: "exercise_variant_translation",
			localeParameter,
			additionalCondition: "exercise_variants.owner_user_id IS NULL",
		})}
		${localizedCatalogJoinSql({
			translationTable: "movement_pattern_translations",
			translationEntityColumn: "movement_pattern_id",
			entityIdExpression: "movement_patterns.id",
			alias: "movement_pattern_translation",
			localeParameter,
		})}
		${localizedCatalogJoinSql({
			translationTable: "equipment_translations",
			translationEntityColumn: "equipment_id",
			entityIdExpression: "equipments.id",
			alias: "equipment_translation",
			localeParameter,
		})}

		WHERE exercises.is_archived = FALSE
			AND exercise_variants.is_archived = FALSE
			AND (exercise_variants.owner_user_id IS NULL OR exercise_variants.owner_user_id = $1)

		ORDER BY
			name,
			exercise_variant_name
	`;
}

export function findByIdQuery({ localeParameter = "$2" } = {}) {
	return `
		SELECT
			exercises.id,
			${localizedCatalogValueSql({ alias: "exercise_translation", canonicalExpression: "exercises.name" })} AS name,
			${localizedCatalogLocaleSql({ alias: "exercise_translation" })} AS name_locale,
			exercises.name AS canonical_name,

			movement_patterns.id AS movement_pattern_id,
			${localizedCatalogValueSql({ alias: "movement_pattern_translation", canonicalExpression: "movement_patterns.name" })} AS movement_pattern_name,
			${localizedCatalogLocaleSql({ alias: "movement_pattern_translation" })} AS movement_pattern_name_locale,
			movement_patterns.name AS canonical_movement_pattern_name,
			movement_patterns.notes AS movement_pattern_notes,

			equipments.id AS equipment_id,
			${localizedCatalogValueSql({ alias: "equipment_translation", canonicalExpression: "equipments.name" })} AS equipment_name,
			${localizedCatalogLocaleSql({ alias: "equipment_translation" })} AS equipment_name_locale,
			equipments.name AS canonical_equipment_name,
			equipments.category AS equipment_category,

			exercise_variants.id AS exercise_variant_id,
			${localizedCatalogValueSql({ alias: "exercise_variant_translation", canonicalExpression: "exercise_variants.name" })} AS exercise_variant_name,
			${localizedCatalogLocaleSql({ alias: "exercise_variant_translation" })} AS exercise_variant_name_locale,
			exercise_variants.name AS canonical_exercise_variant_name,
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
							'commonName', ${localizedCatalogValueSql({ alias: "muscle_translation", canonicalExpression: "muscles.common_name" })},
							'commonNameLocale', ${localizedCatalogLocaleSql({ alias: "muscle_translation" })},
							'canonicalCommonName', muscles.common_name,
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
					${localizedCatalogJoinSql({
						translationTable: "muscle_translations",
						translationEntityColumn: "muscle_id",
						entityIdExpression: "muscles.id",
						alias: "muscle_translation",
						localeParameter,
					})}
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

		${localizedCatalogJoinSql({
			translationTable: "exercise_translations",
			translationEntityColumn: "exercise_id",
			entityIdExpression: "exercises.id",
			alias: "exercise_translation",
			localeParameter,
		})}
		${localizedCatalogJoinSql({
			translationTable: "exercise_variant_translations",
			translationEntityColumn: "exercise_variant_id",
			entityIdExpression: "exercise_variants.id",
			alias: "exercise_variant_translation",
			localeParameter,
			additionalCondition: "exercise_variants.owner_user_id IS NULL",
		})}
		${localizedCatalogJoinSql({
			translationTable: "movement_pattern_translations",
			translationEntityColumn: "movement_pattern_id",
			entityIdExpression: "movement_patterns.id",
			alias: "movement_pattern_translation",
			localeParameter,
		})}
		${localizedCatalogJoinSql({
			translationTable: "equipment_translations",
			translationEntityColumn: "equipment_id",
			entityIdExpression: "equipments.id",
			alias: "equipment_translation",
			localeParameter,
		})}

		WHERE exercises.id = $1

		ORDER BY
			name,
			exercise_variant_name
	`;
}
