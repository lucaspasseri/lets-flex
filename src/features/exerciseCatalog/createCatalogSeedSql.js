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

	const bases = manifest.map((exercise) => [exercise.name, exercise.movementPattern]);
	const variants = manifest.flatMap((exercise) =>
		exercise.variants.map((exerciseVariant) => [
			exercise.name,
			exerciseVariant.name,
			exerciseVariant.equipment ?? "",
			exerciseVariant.setupDescription,
			exerciseVariant.environment,
		]),
	);
	const muscles = manifest.flatMap((exercise) =>
		exercise.muscles.map((muscle) => [exercise.name, muscle.name, muscle.role]),
	);

	return `
INSERT INTO exercises (name, movement_pattern_id)
SELECT catalog.name, movement_patterns.id
FROM (VALUES
${valuesSql(bases)}
) AS catalog(name, movement_pattern_name)
JOIN movement_patterns ON movement_patterns.name = catalog.movement_pattern_name;

INSERT INTO exercise_variants (
	exercise_id,
	equipment_id,
	name,
	setup_description,
	environment,
	notes
)
SELECT
	exercises.id,
	equipments.id,
	catalog.variant_name,
	catalog.setup_description,
	catalog.environment,
	'Foundational global catalog variant.'
FROM (VALUES
${valuesSql(variants)}
) AS catalog(exercise_name, variant_name, equipment_name, setup_description, environment)
JOIN exercises ON exercises.name = catalog.exercise_name
LEFT JOIN equipments
	ON equipments.name = NULLIF(catalog.equipment_name, '');

INSERT INTO exercise_muscles (exercise_id, muscle_id, muscle_role_id)
SELECT exercises.id, muscles.id, muscle_roles.id
FROM (VALUES
${valuesSql(muscles)}
) AS catalog(exercise_name, muscle_name, muscle_role_name)
JOIN exercises ON exercises.name = catalog.exercise_name
JOIN muscles ON muscles.common_name = catalog.muscle_name
JOIN muscle_roles ON muscle_roles.name = catalog.muscle_role_name;
`;
}

export const catalogSeedSql = createCatalogSeedSql();
