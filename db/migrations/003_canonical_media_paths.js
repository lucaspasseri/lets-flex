import { canonicalMediaManifest } from "../../src/features/media/mediaManifest.js";

const sqlString = (value) => `'${value.replaceAll("'", "''")}'`;

const entityTables = Object.freeze({
	exercise: "exercises",
	exercise_variant: "exercise_variants",
	muscle: "muscles",
	equipment: "equipments",
	movement_pattern: "movement_patterns",
});

const values = canonicalMediaManifest
	.map(
		(entry) =>
			`(${sqlString(entry.entityType)}, ${sqlString(entry.entityKey)}, ${sqlString(entry.path)}, ${sqlString(entry.storageKey ?? entry.path)})`,
	)
	.join(",\n");

const entityIdLookup = Object.entries(entityTables)
	.map(
		([entityType, table]) =>
			`WHEN ${sqlString(entityType)} THEN (SELECT id FROM ${table} WHERE catalog_key = canonical.entity_key${entityType === "exercise_variant" ? " AND owner_user_id IS NULL" : ""})`,
	)
	.join("\n\t\t");

export const name = "003_canonical_media_paths";
export const sql = `
ALTER TABLE entity_media ADD COLUMN IF NOT EXISTS canonical_path TEXT;
ALTER TABLE entity_media
  ADD CONSTRAINT entity_media_canonical_path_valid
  CHECK (canonical_path IS NULL OR (canonical_path LIKE '/media/%' AND canonical_path NOT LIKE '%..%'));

WITH canonical (entity_type, entity_key, canonical_path, storage_key) AS (
VALUES
${values}
)
UPDATE entity_media AS assignment
SET canonical_path = canonical.canonical_path
FROM canonical, media_assets
WHERE assignment.entity_type = canonical.entity_type
  AND assignment.role = 'primary'
  AND media_assets.id = assignment.media_asset_id
  AND media_assets.storage_key = canonical.storage_key
  AND assignment.entity_id = CASE canonical.entity_type
		${entityIdLookup}
	END
  AND assignment.canonical_path IS NULL;
`;
