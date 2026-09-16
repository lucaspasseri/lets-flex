import pool from "../../../db/pool.js";

/** @typedef {import("pg").Pool | Pick<import("pg").PoolClient, "query">} DatabaseClient */

/** @type {Readonly<Record<string, {table: string, where?: string}>>} */
const entityDefinitions = Object.freeze({
	exercise: { table: "exercises" },
	exercise_variant: {
		table: "exercise_variants",
		where: "entity.owner_user_id IS NULL",
	},
	muscle: { table: "muscles" },
	equipment: { table: "equipments" },
	movement_pattern: { table: "movement_patterns" },
});

/** @type {ReadonlyArray<"en" | "pt-BR">} */
export const MEDIA_LOCALES = Object.freeze(["en", "pt-BR"]);

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
 * Reuse a durable object-backed asset during reset recovery. The object key is the stable identity;
 * PostgreSQL IDs are intentionally allowed to change after schema recreation.
 *
 * @param {{storageKey: string, mimeType: string, width: number, height: number, source: string}} input
 * @param {DatabaseClient} [db]
 */
export async function upsertCanonicalMediaAsset(
	{ storageKey, mimeType, width, height, source },
	db = pool,
) {
	const { rows } = await db.query(
		`INSERT INTO media_assets
			(storage_key, mime_type, width, height, source)
		 VALUES ($1, $2, $3, $4, $5)
		 ON CONFLICT (storage_key)
		 DO UPDATE SET mime_type = EXCLUDED.mime_type,
		               width = EXCLUDED.width,
		               height = EXCLUDED.height,
		               source = EXCLUDED.source
		 RETURNING *`,
		[storageKey.trim(), mimeType.trim(), width, height, source.trim()],
	);
	return rows[0] ?? null;
}

/**
 * @param {{mediaAssetId: number, locale: "en" | "pt-BR", altText: string}} input
 * @param {DatabaseClient} [db]
 */
export async function upsertMediaAssetAltText(
	{ mediaAssetId, locale, altText },
	db = pool,
) {
	const { rows } = await db.query(
		`INSERT INTO media_asset_alt_texts (media_asset_id, locale, alt_text)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (media_asset_id, locale)
		 DO UPDATE SET alt_text = EXCLUDED.alt_text
		 RETURNING *`,
		[mediaAssetId, locale, altText.trim()],
	);
	return rows[0] ?? null;
}

/**
 * Replace the localized labels for one reusable asset. Empty values are omitted.
 * The caller owns the surrounding transaction when this is combined with other writes.
 *
 * @param {{mediaAssetId: number, altTexts: Partial<Record<"en" | "pt-BR", string | null | undefined>>}} input
 * @param {DatabaseClient} [db]
 */
export async function replaceMediaAssetAltTexts({ mediaAssetId, altTexts }, db = pool) {
	await db.query(`DELETE FROM media_asset_alt_texts WHERE media_asset_id = $1`, [
		mediaAssetId,
	]);
	for (const locale of MEDIA_LOCALES) {
		const value = altTexts[locale];
		if (typeof value !== "string" || value.trim() === "") continue;
		await upsertMediaAssetAltText({ mediaAssetId, locale, altText: value }, db);
	}
}

/**
 * @param {number} mediaAssetId
 * @param {DatabaseClient} [db]
 */
export async function findMediaAssetById(mediaAssetId, db = pool) {
	const { rows } = await db.query(
		`SELECT
			media_assets.*,
			COALESCE(
				jsonb_object_agg(
					media_asset_alt_texts.locale,
					media_asset_alt_texts.alt_text
				) FILTER (WHERE media_asset_alt_texts.locale IS NOT NULL),
				'{}'::jsonb
			) AS alt_texts
		 FROM media_assets
		 LEFT JOIN media_asset_alt_texts
			ON media_asset_alt_texts.media_asset_id = media_assets.id
		 WHERE media_assets.id = $1
		 GROUP BY media_assets.id`,
		[mediaAssetId],
	);
	return rows[0] ?? null;
}

/**
 * @param {{limit?: number}} [options]
 * @param {DatabaseClient} [db]
 */
export async function findMediaAssets({ limit = 50 } = {}, db = pool) {
	const boundedLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, 100) : 50;
	const { rows } = await db.query(
		`SELECT
			media_assets.*,
			COALESCE(
				jsonb_object_agg(
					media_asset_alt_texts.locale,
					media_asset_alt_texts.alt_text
				) FILTER (WHERE media_asset_alt_texts.locale IS NOT NULL),
				'{}'::jsonb
			) AS alt_texts
		 FROM media_assets
		 LEFT JOIN media_asset_alt_texts
			ON media_asset_alt_texts.media_asset_id = media_assets.id
		 GROUP BY media_assets.id
		 ORDER BY media_assets.created_at DESC, media_assets.id DESC
		 LIMIT $1`,
		[boundedLimit],
	);
	return rows;
}

/**
 * @param {{entityType: "exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern", entityId: number}} input
 * @param {DatabaseClient} [db]
 */
export async function mediaEntityExists({ entityType, entityId }, db = pool) {
	assertAssignableMediaEntityType(entityType);
	const { table: entityTable, where = "TRUE" } = entityDefinitions[entityType];
	const { rowCount } = await db.query(
		`SELECT 1 FROM ${entityTable} AS entity WHERE ${where} AND entity.id = $1`,
		[entityId],
	);
	return rowCount === 1;
}

/**
 * Resolve a supported global entity to the stable key required by durable canonical media.
 * Private exercise variants and catalog rows without a key are intentionally not canonicalizable.
 *
 * @param {{entityType: "exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern", entityId: number}} input
 * @param {DatabaseClient} [db]
 */
export async function findMediaEntityCatalogRecord(
	{ entityType, entityId },
	db = pool,
) {
	assertAssignableMediaEntityType(entityType);
	const { table: entityTable, where = "TRUE" } = entityDefinitions[entityType];
	const { rows } = await db.query(
		`SELECT entity.id, entity.catalog_key
		 FROM ${entityTable} AS entity
		 WHERE ${where} AND entity.id = $1`,
		[entityId],
	);
	return rows[0] ?? null;
}

/**
 * Resolve a seeded global catalog entity by stable key for reset recovery.
 *
 * @param {{entityType: "exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern", entityKey: string}} input
 * @param {DatabaseClient} [db]
 */
export async function findMediaEntityCatalogRecordByKey(
	{ entityType, entityKey },
	db = pool,
) {
	assertAssignableMediaEntityType(entityType);
	const { table: entityTable, where = "TRUE" } = entityDefinitions[entityType];
	const { rows } = await db.query(
		`SELECT entity.id, entity.catalog_key
		 FROM ${entityTable} AS entity
		 WHERE ${where} AND entity.catalog_key = $1`,
		[entityKey],
	);
	return rows[0] ?? null;
}

/**
 * Read the complete canonical state for one stable catalog key for audit/reconciliation output.
 * A missing assignment is represented by null media columns instead of being hidden by an inner
 * join.
 *
 * @param {{entityType: "exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern", entityKey: string}} input
 * @param {DatabaseClient} [db]
 */
export async function findCanonicalMediaStateByKey(
	{ entityType, entityKey },
	db = pool,
) {
	assertAssignableMediaEntityType(entityType);
	const { table: entityTable, where = "TRUE" } = entityDefinitions[entityType];
	const { rows } = await db.query(
		`SELECT
			entity.id,
			entity.catalog_key,
			entity_media.media_asset_id,
			entity_media.canonical_path,
			media_assets.storage_key,
			media_assets.mime_type,
			media_assets.width,
			media_assets.height,
			media_assets.source,
			media_assets.alt_text,
			alt_en.alt_text AS alt_text_en,
			alt_pt.alt_text AS alt_text_pt_br
		 FROM ${entityTable} AS entity
		 LEFT JOIN entity_media
			ON entity_media.entity_type = $2
			AND entity_media.entity_id = entity.id
			AND entity_media.role = 'primary'
		 LEFT JOIN media_assets
			ON media_assets.id = entity_media.media_asset_id
		 LEFT JOIN media_asset_alt_texts AS alt_en
			ON alt_en.media_asset_id = media_assets.id AND alt_en.locale = 'en'
		 LEFT JOIN media_asset_alt_texts AS alt_pt
			ON alt_pt.media_asset_id = media_assets.id AND alt_pt.locale = 'pt-BR'
		 WHERE ${where} AND entity.catalog_key = $1`,
		[entityKey, entityType],
	);
	return rows[0] ?? null;
}

/**
 * Assign or replace the primary asset for one existing supported entity.
 *
 * @param {{mediaAssetId: number, entityType: "exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern", entityId: number, sortOrder?: number, canonicalPath?: string | null}} input
 * @param {DatabaseClient} [db]
 */
export async function assignPrimaryMedia(
	{ mediaAssetId, entityType, entityId, sortOrder = 0, canonicalPath = null },
	db = pool,
) {
	assertAssignableMediaEntityType(entityType);
	const { table: entityTable, where = "TRUE" } = entityDefinitions[entityType];
	const { rows } = await db.query(
		`INSERT INTO entity_media
			(media_asset_id, entity_type, entity_id, role, sort_order, canonical_path)
		 SELECT $1, $2, $3, 'primary', $4, $5
		 WHERE EXISTS (
			 SELECT 1 FROM ${entityTable} AS entity WHERE entity.id = $3
			   AND ${where}
		 )
		 ON CONFLICT (entity_type, entity_id, role)
		DO UPDATE SET media_asset_id = EXCLUDED.media_asset_id,
		               sort_order = EXCLUDED.sort_order,
		               canonical_path = EXCLUDED.canonical_path
			 RETURNING *`,
		[mediaAssetId, entityType, entityId, sortOrder, canonicalPath],
	);
	return rows[0] ?? null;
}

/**
 * Return the runtime canonical compatibility path for an entity assignment. The path belongs to
 * the assignment, not to the mutable media asset or to a source-controlled manifest file.
 *
 * @param {{entityType: "exercise" | "exercise_variant" | "muscle" | "equipment" | "movement_pattern", entityId: number}} input
 * @param {DatabaseClient} [db]
 */
export async function findPrimaryMediaAssignment({ entityType, entityId }, db = pool) {
	assertAssignableMediaEntityType(entityType);
	const { rows } = await db.query(
		`SELECT media_asset_id, canonical_path
		 FROM entity_media
		 WHERE entity_type = $1 AND entity_id = $2 AND role = 'primary'`,
		[entityType, entityId],
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
			entity_media.canonical_path,
			media_assets.id AS media_asset_id,
			media_assets.storage_key,
			media_assets.mime_type,
			media_assets.width,
			media_assets.height,
			media_assets.source,
			media_assets.alt_text,
			alt_en.alt_text AS alt_text_en,
			alt_pt.alt_text AS alt_text_pt_br
		 FROM entity_media
		 JOIN media_assets
			ON media_assets.id = entity_media.media_asset_id
		 LEFT JOIN media_asset_alt_texts AS alt_en
			ON alt_en.media_asset_id = media_assets.id AND alt_en.locale = 'en'
		 LEFT JOIN media_asset_alt_texts AS alt_pt
			ON alt_pt.media_asset_id = media_assets.id AND alt_pt.locale = 'pt-BR'
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
