import pool from "../../../db/pool.js";

/** @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient */

const entityDefinitions = Object.freeze({
	exercise: { table: "exercises" },
	exercise_variant: { table: "exercise_variants" },
	muscle: { table: "muscles" },
	equipment: { table: "equipments" },
	movement_pattern: { table: "movement_patterns" },
});

/**
 * @param {unknown} entityType
 * @returns {asserts entityType is "exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern"}
 */
export function assertAssignableMediaEntityType(entityType) {
	if (typeof entityType !== "string" || !Object.hasOwn(entityDefinitions, entityType)) {
		throw new Error("Media assignments received an unsupported entity type.");
	}
}

/**
 * @param {{storageKey: string, mimeType: string, width: number, height: number, source: string, altText?: string | null}} input
 * @param {DatabaseClient} [db]
 */
export async function createMediaAsset(
	{ storageKey, mimeType, width, height, source, altText = null },
	db = pool,
) {
	const { rows } = await db.query(
		`INSERT INTO media_assets
			(storage_key, mime_type, width, height, source, alt_text)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 RETURNING *`,
		[
			storageKey.trim(),
			mimeType.trim(),
			width,
			height,
			source.trim(),
			altText?.trim() || null,
		],
	);
	return rows[0] ?? null;
}

/**
 * Assign or replace the primary asset for one existing supported entity.
 *
 * @param {{mediaAssetId: number, entityType: "exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern", entityId: number, sortOrder?: number}} input
 * @param {DatabaseClient} [db]
 */
export async function assignPrimaryMedia(
	{ mediaAssetId, entityType, entityId, sortOrder = 0 },
	db = pool,
) {
	assertAssignableMediaEntityType(entityType);
	const entityTable = entityDefinitions[entityType].table;
	const { rows } = await db.query(
		`INSERT INTO entity_media
			(media_asset_id, entity_type, entity_id, role, sort_order)
		 SELECT $1, $2, $3, 'primary', $4
		 WHERE EXISTS (
			SELECT 1 FROM ${entityTable} AS entity WHERE entity.id = $3
		 )
		 ON CONFLICT (entity_type, entity_id, role)
		 DO UPDATE SET media_asset_id = EXCLUDED.media_asset_id,
		               sort_order = EXCLUDED.sort_order
			 RETURNING *`,
		[mediaAssetId, entityType, entityId, sortOrder],
	);
	return rows[0] ?? null;
}

/**
 * @param {{entityType: "exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern", entityId: number}} input
 * @param {DatabaseClient} [db]
 */
export async function removePrimaryMedia({ entityType, entityId }, db = pool) {
	assertAssignableMediaEntityType(entityType);
	await db.query(
		`DELETE FROM entity_media WHERE entity_type = $1 AND entity_id = $2 AND role = 'primary'`,
		[entityType, entityId],
	);
}

/**
 * @param {Array<{entityType: "exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern", entityId: number}>} candidates
 * @param {DatabaseClient} [db]
 */
export async function findPrimaryMediaAssignments(candidates, db = pool) {
	const uniqueCandidates = [
		...new Map(
			candidates.map((candidate) => {
				assertAssignableMediaEntityType(candidate.entityType);
				return [candidate.entityType + ":" + candidate.entityId, candidate];
			}),
		).values(),
	];
	if (uniqueCandidates.length === 0) return [];

	const { rows } = await db.query(
		`SELECT
			entity_media.entity_type,
			entity_media.entity_id,
			entity_media.role,
			entity_media.sort_order,
			media_assets.id AS media_asset_id,
			media_assets.storage_key,
			media_assets.mime_type,
			media_assets.width,
			media_assets.height,
			media_assets.source,
			media_assets.alt_text
		 FROM entity_media
		 JOIN media_assets
			ON media_assets.id = entity_media.media_asset_id
		 WHERE entity_media.entity_type = ANY($1::varchar[])
		   AND entity_media.entity_id = ANY($2::int[])
		   AND entity_media.role = 'primary'
		 ORDER BY entity_media.sort_order, entity_media.id`,
		[
			uniqueCandidates.map((candidate) => candidate.entityType),
			uniqueCandidates.map((candidate) => candidate.entityId),
		],
	);
	return rows;
}
