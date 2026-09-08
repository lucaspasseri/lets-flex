import assert from "node:assert/strict";
import test, { after, before, beforeEach, describe } from "node:test";

import { Client } from "pg";

import { schemaSql } from "./schema.js";
import { seedSql } from "./seed.js";
import { catalogManifest } from "../src/features/exerciseCatalog/catalogManifest.js";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const databaseIsSafe = (() => {
	if (!testDatabaseUrl) return false;
	try {
		return /(?:^|[_-])test(?:$|[_-])/.test(new URL(testDatabaseUrl).pathname.slice(1));
	} catch {
		return false;
	}
})();
const integration = databaseIsSafe ? describe : describe.skip;

/** @param {Client} db */
async function assertManagedCatalogMatchesManifest(db) {
	const expectedBases = catalogManifest
		.map((exercise) => ({
			name: exercise.name,
			movement_pattern: exercise.movementPattern,
			muscle: exercise.muscles[0].name,
		}))
		.sort((left, right) => left.name.localeCompare(right.name));
	const expectedVariants = catalogManifest
		.flatMap((exercise) =>
			exercise.variants.map((variant) => ({
				exercise_name: exercise.name,
				name: variant.name,
				equipment: variant.equipment,
				setup_description: variant.setupDescription,
				environment: variant.environment,
			})),
		)
		.sort((left, right) => left.name.localeCompare(right.name));
	const baseNames = expectedBases.map((base) => base.name);
	const variantNames = expectedVariants.map((variant) => variant.name);

	const actualBases = (
		await db.query(
			`SELECT exercise.name, pattern.name AS movement_pattern, muscle.common_name AS muscle
			 FROM exercises exercise
			 JOIN movement_patterns pattern ON pattern.id = exercise.movement_pattern_id
			 JOIN exercise_muscles relationship ON relationship.exercise_id = exercise.id
			 JOIN muscles muscle ON muscle.id = relationship.muscle_id
			 JOIN muscle_roles role ON role.id = relationship.muscle_role_id
			 WHERE exercise.name = ANY($1::text[]) AND role.name = 'prime_mover'
			 ORDER BY exercise.name`,
			[baseNames],
		)
	).rows;
	const actualVariants = (
		await db.query(
			`SELECT exercise.name AS exercise_name, variant.name, equipment.name AS equipment,
			        variant.setup_description, variant.environment
			 FROM exercise_variants variant
			 JOIN exercises exercise ON exercise.id = variant.exercise_id
			 LEFT JOIN equipments equipment ON equipment.id = variant.equipment_id
			 WHERE variant.owner_user_id IS NULL AND variant.name = ANY($1::text[])
			 ORDER BY variant.name`,
			[variantNames],
		)
	).rows;

	assert.deepEqual(actualBases, expectedBases);
	assert.deepEqual(actualVariants, expectedVariants);
}

integration("canonical database setup", { concurrency: false }, () => {
	/** @type {Client} */
	let db;

	before(async () => {
		db = new Client({ connectionString: testDatabaseUrl });
		await db.connect();
	});

	beforeEach(async () => {
		await db.query(schemaSql);
		await db.query(seedSql);
	});

	after(async () => {
		await db.end();
	});

	test("fresh database contains the complete managed catalog", async () => {
		const counts = (
			await db.query(`
				SELECT
					(SELECT COUNT(*)::int FROM exercises WHERE is_archived = FALSE) AS bases,
					(SELECT COUNT(*)::int FROM exercise_variants WHERE owner_user_id IS NULL AND is_archived = FALSE) AS variants,
					(SELECT COUNT(*)::int FROM exercise_muscles relationship
					 JOIN muscle_roles role ON role.id = relationship.muscle_role_id
					 WHERE role.name = 'prime_mover') AS prime_movers
		`)
		).rows[0];

		assert.deepEqual(counts, { bases: 18, variants: 36, prime_movers: 18 });
		assert.equal(
			(
				await db.query(
					"SELECT equipment_id FROM exercise_variants WHERE name = 'Bodyweight Push Up'",
				)
			).rows[0].equipment_id,
			null,
		);
		await assertManagedCatalogMatchesManifest(db);
	});
});
