import { getTranslationEntityDefinition } from "./translationMaintenanceContract.js";

const translationOverviewUnion = `
	SELECT
		'exercise'::text AS entity_type,
		exercises.id,
		exercises.name AS canonical_name,
		en_translation.name AS english_name,
		pt_translation.name AS portuguese_name
	FROM exercises
	LEFT JOIN exercise_translations AS en_translation
		ON en_translation.exercise_id = exercises.id AND en_translation.locale = 'en'
	LEFT JOIN exercise_translations AS pt_translation
		ON pt_translation.exercise_id = exercises.id AND pt_translation.locale = 'pt-BR'
	WHERE exercises.is_archived = FALSE

	UNION ALL

	SELECT
		'exercise_variant'::text AS entity_type,
		exercise_variants.id,
		exercise_variants.name AS canonical_name,
		en_translation.name AS english_name,
		pt_translation.name AS portuguese_name
	FROM exercise_variants
	JOIN exercises
		ON exercises.id = exercise_variants.exercise_id
	LEFT JOIN exercise_variant_translations AS en_translation
		ON en_translation.exercise_variant_id = exercise_variants.id
		AND en_translation.locale = 'en'
	LEFT JOIN exercise_variant_translations AS pt_translation
		ON pt_translation.exercise_variant_id = exercise_variants.id
		AND pt_translation.locale = 'pt-BR'
	WHERE exercises.is_archived = FALSE
		AND exercise_variants.is_archived = FALSE
		AND exercise_variants.owner_user_id IS NULL

	UNION ALL

	SELECT
		'muscle'::text AS entity_type,
		muscles.id,
		muscles.common_name AS canonical_name,
		en_translation.name AS english_name,
		pt_translation.name AS portuguese_name
	FROM muscles
	LEFT JOIN muscle_translations AS en_translation
		ON en_translation.muscle_id = muscles.id AND en_translation.locale = 'en'
	LEFT JOIN muscle_translations AS pt_translation
		ON pt_translation.muscle_id = muscles.id AND pt_translation.locale = 'pt-BR'

	UNION ALL

	SELECT
		'equipment'::text AS entity_type,
		equipments.id,
		equipments.name AS canonical_name,
		en_translation.name AS english_name,
		pt_translation.name AS portuguese_name
	FROM equipments
	LEFT JOIN equipment_translations AS en_translation
		ON en_translation.equipment_id = equipments.id AND en_translation.locale = 'en'
	LEFT JOIN equipment_translations AS pt_translation
		ON pt_translation.equipment_id = equipments.id AND pt_translation.locale = 'pt-BR'

	UNION ALL

	SELECT
		'movement_pattern'::text AS entity_type,
		movement_patterns.id,
		movement_patterns.name AS canonical_name,
		en_translation.name AS english_name,
		pt_translation.name AS portuguese_name
	FROM movement_patterns
	LEFT JOIN movement_pattern_translations AS en_translation
		ON en_translation.movement_pattern_id = movement_patterns.id
		AND en_translation.locale = 'en'
	LEFT JOIN movement_pattern_translations AS pt_translation
		ON pt_translation.movement_pattern_id = movement_patterns.id
		AND pt_translation.locale = 'pt-BR'
`;

export function findTranslationOverviewQuery() {
	return `
		WITH catalog_records AS (${translationOverviewUnion})
		SELECT entity_type, id, canonical_name, english_name, portuguese_name
		FROM catalog_records
		WHERE ($1::text IS NULL OR entity_type = $1)
			AND (
				$2::text IS NULL
				OR canonical_name ILIKE $2
				OR english_name ILIKE $2
				OR portuguese_name ILIKE $2
			)
		ORDER BY entity_type, canonical_name, id
	`;
}

/**
 * @param {string} entityType
 * @returns {{definition: import("./translationMaintenanceContract.js").TranslationEntityDefinition, parentJoin: string, visibility: string}}
 */
function getEditableEntityQueryParts(entityType) {
	const definition = getTranslationEntityDefinition(entityType);
	if (!definition) {
		throw new Error("Translation maintenance received an unsupported catalog entity.");
	}

	const parentJoin =
		entityType === "exercise_variant"
			? "JOIN exercises AS parent_entity ON parent_entity.id = entity.exercise_id"
			: "";
	const visibility =
		entityType === "exercise"
			? "entity.is_archived = FALSE"
			: entityType === "exercise_variant"
				? "entity.is_archived = FALSE AND entity.owner_user_id IS NULL AND parent_entity.is_archived = FALSE"
				: "TRUE";

	return {
		definition,
		parentJoin,
		visibility,
	};
}

/**
 * @param {string} entityType
 * @returns {string}
 */
export function findTranslationRecordQuery(entityType) {
	const { definition, parentJoin, visibility } =
		getEditableEntityQueryParts(entityType);
	return `
		SELECT
			entity.id,
			entity.${definition.canonicalNameColumn} AS canonical_name,
			en_translation.name AS english_name,
			pt_translation.name AS portuguese_name
		FROM ${definition.sourceTable} AS entity
		${parentJoin}
		LEFT JOIN ${definition.translationTable} AS en_translation
			ON en_translation.${definition.entityIdColumn} = entity.id
			AND en_translation.locale = 'en'
		LEFT JOIN ${definition.translationTable} AS pt_translation
			ON pt_translation.${definition.entityIdColumn} = entity.id
			AND pt_translation.locale = 'pt-BR'
		WHERE entity.id = $1 AND ${visibility}
	`;
}

/**
 * @param {string} entityType
 * @returns {string}
 */
export function upsertTranslationQuery(entityType) {
	const { definition, parentJoin, visibility } =
		getEditableEntityQueryParts(entityType);
	return `
		INSERT INTO ${definition.translationTable}
			(${definition.entityIdColumn}, locale, name)
		SELECT entity.id, $2, $3
		FROM ${definition.sourceTable} AS entity
		${parentJoin}
		WHERE entity.id = $1 AND ${visibility}
		ON CONFLICT (${definition.entityIdColumn}, locale)
		DO UPDATE SET name = EXCLUDED.name
		RETURNING ${definition.entityIdColumn} AS entity_id, locale, name
	`;
}
