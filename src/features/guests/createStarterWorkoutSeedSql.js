import { catalogManifest } from "../exerciseCatalog/catalogManifest.js";
import { starterWorkoutManifest } from "./starterWorkoutManifest.js";

const sqlString = (value) => `'${value.replaceAll("'", "''")}'`;

function validateStarterWorkout(manifest, catalog) {
	if (manifest.steps.length < 4 || manifest.steps.length > 5) {
		throw new Error("Starter workout must contain four or five exercise steps");
	}

	const globalVariantNames = new Set(
		catalog.flatMap((exercise) =>
			exercise.variants.map((exerciseVariant) => exerciseVariant.name),
		),
	);
	const selectedVariantNames = new Set();

	for (const step of manifest.steps) {
		if (!globalVariantNames.has(step.variantName)) {
			throw new Error(`Unknown starter workout variant: ${step.variantName}`);
		}
		if (selectedVariantNames.has(step.variantName)) {
			throw new Error(`Duplicate starter workout variant: ${step.variantName}`);
		}
		if (!Number.isInteger(step.sets) || step.sets < 1) {
			throw new Error(`Invalid starter workout sets: ${step.name}`);
		}
		if (!Number.isInteger(step.reps) || step.reps < 1) {
			throw new Error(`Invalid starter workout reps: ${step.name}`);
		}
		selectedVariantNames.add(step.variantName);
	}
}

export function createStarterWorkoutSeedSql(
	manifest = starterWorkoutManifest,
	catalog = catalogManifest,
) {
	validateStarterWorkout(manifest, catalog);

	const stepRows = manifest.steps
		.map(
			(step, index) =>
				`(${sqlString(step.variantName)}, ${sqlString(step.name)}, ${step.sets}, ${step.reps}, ${index + 1})`,
		)
		.join(",\n");

	return `
INSERT INTO sessions (name, notes)
VALUES (${sqlString(manifest.sessionName)}, ${sqlString(manifest.sessionNotes)});

INSERT INTO session_steps (
	session_id, step_type_id, exercise_variant_id, name, sets, reps, step_order
)
SELECT
	session.id,
	step_type.id,
	variant.id,
	starter.name,
	starter.sets,
	starter.reps,
	starter.step_order
FROM (VALUES
${stepRows}
) AS starter(variant_name, name, sets, reps, step_order)
JOIN sessions AS session
	ON session.name = ${sqlString(manifest.sessionName)}
	AND session.owner_user_id IS NULL
	AND session.is_archived = FALSE
JOIN step_types AS step_type ON step_type.name = 'exercise'
JOIN exercise_variants AS variant
	ON variant.name = starter.variant_name
	AND variant.owner_user_id IS NULL
	AND variant.is_archived = FALSE;
`;
}

export const starterWorkoutSeedSql = createStarterWorkoutSeedSql();
