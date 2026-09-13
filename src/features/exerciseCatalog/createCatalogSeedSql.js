import { catalogManifest, catalogVocabulary } from "./catalogManifest.js";
import { validateCatalogManifest } from "./validateCatalogManifest.js";

const sqlString = (value) => `'${value.replaceAll("'", "''")}'`;

function valuesSql(rows) {
	return rows.map((row) => `(${row.map(sqlString).join(", ")})`).join(",\n");
}

export function createCatalogSeedSql(
	manifest = catalogManifest,
	vocabulary = catalogVocabulary,
) {
	validateCatalogManifest(manifest, vocabulary);

	const bases = manifest.map((exercise) => [
		exercise.catalogKey,
		exercise.name,
		exercise.movementPatternCatalogKey,
	]);
	const variants = manifest.flatMap((exercise) =>
		exercise.variants.map((exerciseVariant) => [
			exercise.catalogKey,
			exerciseVariant.catalogKey,
			exerciseVariant.name,
			exerciseVariant.equipmentCatalogKey ?? "",
			exerciseVariant.setupDescription,
			exerciseVariant.environment,
		]),
	);
	const muscles = manifest.flatMap((exercise) =>
		exercise.muscles.map((muscle) => [
			exercise.catalogKey,
			muscle.catalogKey,
			muscle.role,
		]),
	);

	return `
INSERT INTO exercises (catalog_key, name, movement_pattern_id)
SELECT catalog.catalog_key, catalog.name, movement_patterns.id
FROM (VALUES
${valuesSql(bases)}
) AS catalog(catalog_key, name, movement_pattern_key)
JOIN movement_patterns ON movement_patterns.catalog_key = catalog.movement_pattern_key;

INSERT INTO exercise_variants (
	exercise_id,
	equipment_id,
	catalog_key,
	name,
	setup_description,
	environment,
	notes
)
SELECT
	exercises.id,
	equipments.id,
	catalog.catalog_key,
	catalog.variant_name,
	catalog.setup_description,
	catalog.environment,
	'Foundational global catalog variant.'
FROM (VALUES
${valuesSql(variants)}
) AS catalog(exercise_key, catalog_key, variant_name, equipment_key, setup_description, environment)
JOIN exercises ON exercises.catalog_key = catalog.exercise_key
LEFT JOIN equipments
	ON equipments.catalog_key = NULLIF(catalog.equipment_key, '');

INSERT INTO exercise_muscles (exercise_id, muscle_id, muscle_role_id)
SELECT exercises.id, muscles.id, muscle_roles.id
FROM (VALUES
${valuesSql(muscles)}
) AS catalog(exercise_key, muscle_key, muscle_role_name)
JOIN exercises ON exercises.catalog_key = catalog.exercise_key
JOIN muscles ON muscles.catalog_key = catalog.muscle_key
JOIN muscle_roles ON muscle_roles.name = catalog.muscle_role_name;
`;
}

export const catalogSeedSql = createCatalogSeedSql();
