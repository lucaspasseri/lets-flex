import pool from "../../../db/pool.js";
import { normalizeCatalogLocale } from "../catalogLocalization/catalogLocalization.js";

/** @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient */
/** @typedef {"exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern"} MediaManagementEntityType */

const localizedNameJoins = Object.freeze({
	exercise: `LEFT JOIN LATERAL (
		SELECT name FROM exercise_translations
		WHERE exercise_id = entity.id AND locale IN ($1, 'en')
		ORDER BY CASE WHEN locale = $1 THEN 0 ELSE 1 END LIMIT 1
	) AS translation ON TRUE`,
	exercise_variant: `LEFT JOIN LATERAL (
		SELECT name FROM exercise_variant_translations
		WHERE exercise_variant_id = entity.id AND locale IN ($1, 'en')
		ORDER BY CASE WHEN locale = $1 THEN 0 ELSE 1 END LIMIT 1
	) AS translation ON TRUE`,
	muscle: `LEFT JOIN LATERAL (
		SELECT name FROM muscle_translations
		WHERE muscle_id = entity.id AND locale IN ($1, 'en')
		ORDER BY CASE WHEN locale = $1 THEN 0 ELSE 1 END LIMIT 1
	) AS translation ON TRUE`,
	equipment: `LEFT JOIN LATERAL (
		SELECT name FROM equipment_translations
		WHERE equipment_id = entity.id AND locale IN ($1, 'en')
		ORDER BY CASE WHEN locale = $1 THEN 0 ELSE 1 END LIMIT 1
	) AS translation ON TRUE`,
	movement_pattern: `LEFT JOIN LATERAL (
		SELECT name FROM movement_pattern_translations
		WHERE movement_pattern_id = entity.id AND locale IN ($1, 'en')
		ORDER BY CASE WHEN locale = $1 THEN 0 ELSE 1 END LIMIT 1
	) AS translation ON TRUE`,
});

const optionQueries = Object.freeze({
	exercise: `SELECT 'exercise' AS entity_type, entity.id AS entity_id,
		COALESCE(translation.name, entity.name) AS name
		FROM exercises AS entity
		${localizedNameJoins.exercise}
		WHERE COALESCE(translation.name, entity.name) ILIKE $2
		ORDER BY name, entity.id LIMIT $3`,
	exercise_variant: `SELECT 'exercise_variant' AS entity_type, entity.id AS entity_id,
		COALESCE(translation.name, entity.name) AS name
		FROM exercise_variants AS entity
		${localizedNameJoins.exercise_variant}
		WHERE entity.owner_user_id IS NULL
		AND COALESCE(translation.name, entity.name) ILIKE $2
		ORDER BY name, entity.id LIMIT $3`,
	muscle: `SELECT 'muscle' AS entity_type, entity.id AS entity_id,
		COALESCE(translation.name, entity.common_name) AS name
		FROM muscles AS entity
		${localizedNameJoins.muscle}
		WHERE COALESCE(translation.name, entity.common_name) ILIKE $2
		ORDER BY name, entity.id LIMIT $3`,
	equipment: `SELECT 'equipment' AS entity_type, entity.id AS entity_id,
		COALESCE(translation.name, entity.name) AS name
		FROM equipments AS entity
		${localizedNameJoins.equipment}
		WHERE COALESCE(translation.name, entity.name) ILIKE $2
		ORDER BY name, entity.id LIMIT $3`,
	movement_pattern: `SELECT 'movement_pattern' AS entity_type, entity.id AS entity_id,
		COALESCE(translation.name, entity.name) AS name
		FROM movement_patterns AS entity
		${localizedNameJoins.movement_pattern}
		WHERE COALESCE(translation.name, entity.name) ILIKE $2
		ORDER BY name, entity.id LIMIT $3`,
});

/**
 * @param {{locale?: unknown, entityType?: unknown, search?: unknown, limit?: number}} [options]
 * @param {DatabaseClient} [db]
 */
export async function findMediaManagementEntityOptions(
	{ locale, entityType, search = "", limit = 100 } = {},
	db = pool,
) {
	const normalizedLocale = normalizeCatalogLocale(locale);
	const normalizedSearch = typeof search === "string" ? search.trim() : "";
	const boundedLimit =
		Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 100;
	const rows = [];
	const queries =
		typeof entityType === "string" && Object.hasOwn(optionQueries, entityType)
			? [optionQueries[entityType]]
			: Object.values(optionQueries);
	for (const query of queries) {
		const result = await db.query(query, [
			normalizedLocale,
			`%${normalizedSearch}%`,
			boundedLimit,
		]);
		rows.push(...result.rows);
	}
	return rows.sort((left, right) =>
		String(left.name).localeCompare(String(right.name), normalizedLocale),
	);
}

/**
 * @param {{entityType: MediaManagementEntityType, entityId: number, locale?: unknown}} input
 * @param {DatabaseClient} [db]
 */
export async function findMediaManagementEntity(
	{ entityType, entityId, locale },
	db = pool,
) {
	const normalizedLocale = normalizeCatalogLocale(locale);
	const query = {
		exercise: `SELECT 'exercise' AS entity_type, entity.id AS entity_id,
			COALESCE(translation.name, entity.name) AS name,
			entity.name AS canonical_name, NULL::integer AS parent_exercise_id,
			entity.movement_pattern_id, movement.name AS movement_pattern,
			NULL::text AS environment
			FROM exercises AS entity
			LEFT JOIN movement_patterns AS movement ON movement.id = entity.movement_pattern_id
			${localizedNameJoins.exercise}
			WHERE entity.id = $2`,
		exercise_variant: `SELECT 'exercise_variant' AS entity_type, entity.id AS entity_id,
			COALESCE(translation.name, entity.name) AS name,
			entity.name AS canonical_name, entity.exercise_id AS parent_exercise_id,
			parent.name AS parent_name,
			parent.movement_pattern_id, movement.name AS movement_pattern,
			entity.environment, entity.setup_description, equipment.name AS equipment_name
			FROM exercise_variants AS entity
			JOIN exercises AS parent ON parent.id = entity.exercise_id
			LEFT JOIN movement_patterns AS movement ON movement.id = parent.movement_pattern_id
			LEFT JOIN equipments AS equipment ON equipment.id = entity.equipment_id
			${localizedNameJoins.exercise_variant}
			WHERE entity.owner_user_id IS NULL AND entity.id = $2`,
		muscle: `SELECT 'muscle' AS entity_type, entity.id AS entity_id,
			COALESCE(translation.name, entity.common_name) AS name,
			entity.common_name AS canonical_name, NULL::integer AS parent_exercise_id,
			NULL::integer AS movement_pattern_id, NULL::text AS movement_pattern,
			NULL::text AS environment
			FROM muscles AS entity
			${localizedNameJoins.muscle}
			WHERE entity.id = $2`,
		equipment: `SELECT 'equipment' AS entity_type, entity.id AS entity_id,
			COALESCE(translation.name, entity.name) AS name,
			entity.name AS canonical_name, NULL::integer AS parent_exercise_id,
			NULL::integer AS movement_pattern_id, NULL::text AS movement_pattern,
			NULL::text AS environment
			FROM equipments AS entity
			${localizedNameJoins.equipment}
			WHERE entity.id = $2`,
		movement_pattern: `SELECT 'movement_pattern' AS entity_type, entity.id AS entity_id,
			COALESCE(translation.name, entity.name) AS name,
			entity.name AS canonical_name, NULL::integer AS parent_exercise_id,
			NULL::integer AS movement_pattern_id, NULL::text AS movement_pattern,
			NULL::text AS environment
			FROM movement_patterns AS entity
			${localizedNameJoins.movement_pattern}
			WHERE entity.id = $2`,
	}[entityType];
	if (!query) throw new Error("Media management received an unsupported entity type.");
	const { rows } = await db.query(query, [normalizedLocale, entityId]);
	return rows[0] ?? null;
}
