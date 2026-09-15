import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { canonicalMediaManifest } from "../src/features/media/mediaManifest.js";

const entityDefinitions = Object.freeze({
	exercise: { table: "exercises" },
	exercise_variant: { table: "exercise_variants" },
	muscle: { table: "muscles" },
	equipment: { table: "equipments" },
	movement_pattern: { table: "movement_patterns" },
});

const catalogKeyPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const canonicalMimeTypes = new Set([
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/svg+xml",
]);
const publicDirectory = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../public",
);

const sqlString = (value) => `'${value.replaceAll("'", "''")}'`;

/**
 * @param {ReadonlyArray<import("../src/features/media/media.types.js").CanonicalMediaManifestEntry>} manifest
 * @returns {ReadonlyArray<import("../src/features/media/media.types.js").CanonicalMediaManifestEntry>}
 */
export function validateCanonicalMediaManifest(manifest) {
	if (!Array.isArray(manifest) || manifest.length === 0) {
		throw new Error("Canonical media manifest must contain at least one entry.");
	}

	const paths = new Map();
	const assignments = new Map();
	for (const entry of manifest) {
		const label =
			typeof entry?.entityType === "string" && typeof entry?.entityKey === "string"
				? `${entry.entityType} "${entry.entityKey}"`
				: "unknown entry";
		const definition = entityDefinitions[entry?.entityType];
		if (!definition) {
			throw new Error(
				`Failed to seed media: ${label}; reason: unsupported entity type`,
			);
		}
		if (!catalogKeyPattern.test(entry.entityKey)) {
			throw new Error(
				`Failed to seed media: ${label}; reason: stable entity key must be lowercase ASCII kebab-case`,
			);
		}
		if (entry.role !== "primary") {
			throw new Error(`Failed to seed media: ${label}; reason: role must be primary`);
		}
		if (
			typeof entry.path !== "string" ||
			!entry.path.startsWith("/media/") ||
			entry.path.includes("..")
		) {
			throw new Error(
				`Failed to seed media: ${label}; reason: storage path must be a local /media path`,
			);
		}
		if (paths.has(entry.path)) {
			throw new Error(
				`Failed to seed media: ${label}; reason: storage path duplicates ${paths.get(entry.path)}`,
			);
		}
		paths.set(entry.path, label);
		const assignmentKey = `${entry.entityType}:${entry.entityKey}:${entry.role}`;
		if (assignments.has(assignmentKey)) {
			throw new Error(
				`Failed to seed media: ${label}; reason: duplicate ${entry.role} assignment conflicts with ${assignments.get(assignmentKey)}`,
			);
		}
		assignments.set(assignmentKey, label);
		if (
			!canonicalMimeTypes.has(entry.mimeType) ||
			!Number.isInteger(entry.width) ||
			!Number.isInteger(entry.height) ||
			entry.width <= 0 ||
			entry.height <= 0 ||
			typeof entry.source !== "string" ||
			entry.source.trim() === "" ||
			typeof entry.alt !== "string" ||
			entry.alt.trim() === ""
		) {
			throw new Error(
				`Failed to seed media: ${label}; reason: required media metadata is invalid`,
			);
		}
		if (
			typeof entry.altTexts?.en !== "string" ||
			entry.altTexts.en.trim() === "" ||
			typeof entry.altTexts?.["pt-BR"] !== "string" ||
			entry.altTexts["pt-BR"].trim() === ""
		) {
			throw new Error(
				`Failed to seed media: ${label}; reason: English and Brazilian Portuguese alt text are required`,
			);
		}
		const absolutePath = path.resolve(publicDirectory, entry.path.slice(1));
		if (
			!absolutePath.startsWith(publicDirectory + path.sep) ||
			!existsSync(absolutePath)
		) {
			throw new Error(
				`Failed to seed media: ${label}; file: ${entry.path}; reason: file does not exist`,
			);
		}
	}

	return manifest;
}

/**
 * Create deterministic media registration and assignment SQL from the canonical manifest.
 * Stable catalog keys are resolved to fresh numeric IDs at insert time.
 *
 * @param {ReadonlyArray<import("../src/features/media/media.types.js").CanonicalMediaManifestEntry>} manifest
 */
export function createMediaSeedSql(manifest = canonicalMediaManifest) {
	const entries = validateCanonicalMediaManifest(manifest);
	const values = entries
		.map(
			(entry) =>
				`(${sqlString(entry.storageKey ?? entry.path)}, ${sqlString(entry.mimeType)}, ${entry.width}, ${entry.height}, ${sqlString(entry.source)}, ${sqlString(entry.alt)}, ${sqlString(entry.entityType)}, ${sqlString(entry.entityKey)}, ${sqlString(entityDefinitions[entry.entityType].table)}, ${sqlString(entry.role)}, ${sqlString(entry.path)}, ${sqlString(entry.altTexts.en)}, ${sqlString(entry.altTexts["pt-BR"])})`,
		)
		.join(",\n");
	const referenceValues = entries
		.map(
			(entry) =>
				`(${sqlString(entry.entityType)}, ${sqlString(entry.entityKey)}, ${sqlString(entityDefinitions[entry.entityType].table)})`,
		)
		.join(",\n");

	return `
DO $$
DECLARE missing_references TEXT;
BEGIN
	SELECT string_agg(
		reference.entity_type || ':' || reference.catalog_key,
		', ' ORDER BY reference.entity_type, reference.catalog_key
	)
	INTO missing_references
	FROM (VALUES
${referenceValues}
	) AS reference(entity_type, catalog_key, entity_table)
	WHERE CASE reference.entity_table
		WHEN 'exercises' THEN (SELECT id FROM exercises WHERE catalog_key = reference.catalog_key)
		WHEN 'exercise_variants' THEN (SELECT id FROM exercise_variants WHERE owner_user_id IS NULL AND catalog_key = reference.catalog_key)
		WHEN 'muscles' THEN (SELECT id FROM muscles WHERE catalog_key = reference.catalog_key)
		WHEN 'equipments' THEN (SELECT id FROM equipments WHERE catalog_key = reference.catalog_key)
		WHEN 'movement_patterns' THEN (SELECT id FROM movement_patterns WHERE catalog_key = reference.catalog_key)
	END IS NULL;

	IF missing_references IS NOT NULL THEN
		RAISE EXCEPTION 'Media seed references missing catalog keys: %', missing_references;
	END IF;
END $$;

WITH curated_media (storage_key, mime_type, width, height, source, alt_text, entity_type, catalog_key, entity_table, role, canonical_path, alt_text_en, alt_text_pt_br) AS (
VALUES
${values}
), inserted_assets AS (
	INSERT INTO media_assets (storage_key, mime_type, width, height, source, alt_text)
	SELECT storage_key, mime_type, width, height, source, alt_text
	FROM curated_media
	RETURNING id, storage_key
), inserted_assignments AS (
	INSERT INTO entity_media (media_asset_id, entity_type, entity_id, role, canonical_path)
	SELECT inserted_assets.id, curated_media.entity_type,
		CASE curated_media.entity_table
			WHEN 'exercises' THEN (SELECT id FROM exercises WHERE catalog_key = curated_media.catalog_key)
			WHEN 'exercise_variants' THEN (SELECT id FROM exercise_variants WHERE owner_user_id IS NULL AND catalog_key = curated_media.catalog_key)
			WHEN 'muscles' THEN (SELECT id FROM muscles WHERE catalog_key = curated_media.catalog_key)
			WHEN 'equipments' THEN (SELECT id FROM equipments WHERE catalog_key = curated_media.catalog_key)
			WHEN 'movement_patterns' THEN (SELECT id FROM movement_patterns WHERE catalog_key = curated_media.catalog_key)
		END,
		curated_media.role,
		curated_media.canonical_path
	FROM curated_media
	JOIN inserted_assets ON inserted_assets.storage_key = curated_media.storage_key
	RETURNING media_asset_id
)
INSERT INTO media_asset_alt_texts (media_asset_id, locale, alt_text)
SELECT inserted_assignments.media_asset_id, localized.locale, localized.alt_text
FROM inserted_assignments
JOIN inserted_assets ON inserted_assets.id = inserted_assignments.media_asset_id
JOIN curated_media ON curated_media.storage_key = inserted_assets.storage_key
CROSS JOIN LATERAL (VALUES
	('en', curated_media.alt_text_en),
	('pt-BR', curated_media.alt_text_pt_br)
) AS localized(locale, alt_text);
`;
}

export const mediaSeedSql = createMediaSeedSql();
