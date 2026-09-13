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
			catalog_key: exercise.catalogKey,
			name: exercise.name,
			movement_pattern_key: exercise.movementPatternCatalogKey,
			muscle_key: exercise.muscles[0].catalogKey,
		}))
		.sort((left, right) => left.name.localeCompare(right.name));
	const expectedVariants = catalogManifest
		.flatMap((exercise) =>
			exercise.variants.map((variant) => ({
				exercise_key: exercise.catalogKey,
				catalog_key: variant.catalogKey,
				exercise_name: exercise.name,
				name: variant.name,
				equipment_key: variant.equipmentCatalogKey,
				setup_description: variant.setupDescription,
				environment: variant.environment,
			})),
		)
		.sort((left, right) => left.name.localeCompare(right.name));
	const baseNames = expectedBases.map((base) => base.name);
	const variantNames = expectedVariants.map((variant) => variant.name);

	const actualBases = (
		await db.query(
			`SELECT exercise.catalog_key, exercise.name,
			        pattern.catalog_key AS movement_pattern_key,
			        muscle.catalog_key AS muscle_key
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
			`SELECT exercise.catalog_key AS exercise_key, variant.catalog_key,
			        exercise.name AS exercise_name, variant.name,
			        equipment.catalog_key AS equipment_key,
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

/** @param {Client} db */
async function catalogRelationshipSnapshot(db) {
	const { rows } = await db.query(`
		SELECT kind, catalog_key, related_catalog_key, locale, name
		FROM (
			SELECT 'exercise' AS kind, exercise.catalog_key,
				pattern.catalog_key AS related_catalog_key, NULL::text AS locale, exercise.name
			FROM exercises AS exercise
			JOIN movement_patterns AS pattern ON pattern.id = exercise.movement_pattern_id
			WHERE exercise.catalog_key IS NOT NULL

			UNION ALL

			SELECT 'exercise_variant', variant.catalog_key, exercise.catalog_key, NULL::text,
				variant.name
			FROM exercise_variants AS variant
			JOIN exercises AS exercise ON exercise.id = variant.exercise_id
			WHERE variant.catalog_key IS NOT NULL

			UNION ALL

			SELECT 'exercise_pt', exercise.catalog_key, NULL::text, translation.locale,
				translation.name
			FROM exercise_translations AS translation
			JOIN exercises AS exercise ON exercise.id = translation.exercise_id
			WHERE translation.locale = 'pt-BR'

			UNION ALL

			SELECT 'starter_variant', variant.catalog_key, NULL::text, NULL::text, step.name
			FROM session_steps AS step
			JOIN sessions AS session ON session.id = step.session_id
			JOIN exercise_variants AS variant ON variant.id = step.exercise_variant_id
			WHERE session.name = 'Sample Full Body Session'
		) AS snapshot
		ORDER BY kind, catalog_key, related_catalog_key NULLS FIRST, locale NULLS FIRST, name
	`);
	return rows;
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

		assert.deepEqual(counts, { bases: 78, variants: 129, prime_movers: 78 });
		const catalogKeyCounts = (
			await db.query(`
				SELECT
					(SELECT COUNT(*)::int FROM exercises WHERE catalog_key IS NOT NULL) AS exercises,
					(SELECT COUNT(DISTINCT catalog_key)::int FROM exercises) AS distinct_exercises,
					(SELECT COUNT(*)::int FROM exercise_variants WHERE catalog_key IS NOT NULL) AS variants,
					(SELECT COUNT(DISTINCT catalog_key)::int FROM exercise_variants) AS distinct_variants,
					(SELECT COUNT(*)::int FROM muscles WHERE catalog_key IS NOT NULL) AS muscles,
					(SELECT COUNT(DISTINCT catalog_key)::int FROM muscles) AS distinct_muscles,
					(SELECT COUNT(*)::int FROM equipments WHERE catalog_key IS NOT NULL) AS equipment,
					(SELECT COUNT(DISTINCT catalog_key)::int FROM equipments) AS distinct_equipment,
					(SELECT COUNT(*)::int FROM movement_patterns WHERE catalog_key IS NOT NULL) AS movement_patterns,
					(SELECT COUNT(DISTINCT catalog_key)::int FROM movement_patterns) AS distinct_movement_patterns
			`)
		).rows[0];
		assert.deepEqual(catalogKeyCounts, {
			exercises: 78,
			distinct_exercises: 78,
			variants: 129,
			distinct_variants: 129,
			muscles: 24,
			distinct_muscles: 24,
			equipment: 28,
			distinct_equipment: 28,
			movement_patterns: 8,
			distinct_movement_patterns: 8,
		});
		const translationCounts = (
			await db.query(`
				SELECT
					(SELECT COUNT(*)::int FROM exercise_translations WHERE locale = 'en') AS exercises,
					(SELECT COUNT(*)::int FROM exercise_variant_translations WHERE locale = 'en') AS variants,
					(SELECT COUNT(*)::int FROM muscle_translations WHERE locale = 'en') AS muscles,
					(SELECT COUNT(*)::int FROM equipment_translations WHERE locale = 'en') AS equipment,
					(SELECT COUNT(*)::int FROM movement_pattern_translations WHERE locale = 'en') AS movement_patterns,
					(SELECT COUNT(*)::int FROM exercise_translations WHERE locale = 'pt-BR') AS pt_exercises,
					(SELECT COUNT(*)::int FROM exercise_variant_translations WHERE locale = 'pt-BR') AS pt_variants,
					(SELECT COUNT(*)::int FROM muscle_translations WHERE locale = 'pt-BR') AS pt_muscles,
					(SELECT COUNT(*)::int FROM equipment_translations WHERE locale = 'pt-BR') AS pt_equipment,
					(SELECT COUNT(*)::int FROM movement_pattern_translations WHERE locale = 'pt-BR') AS pt_movement_patterns
			`)
		).rows[0];
		assert.deepEqual(translationCounts, {
			exercises: 78,
			variants: 129,
			muscles: 24,
			equipment: 28,
			movement_patterns: 8,
			pt_exercises: 78,
			pt_variants: 129,
			pt_muscles: 24,
			pt_equipment: 28,
			pt_movement_patterns: 8,
		});
		const mediaTables = (
			await db.query(
				`SELECT table_name
				 FROM information_schema.tables
				 WHERE table_schema = current_schema()
				   AND table_name = ANY($1::text[])
				 ORDER BY table_name`,
				[["entity_media", "media_assets"]],
			)
		).rows;
		assert.deepEqual(mediaTables, [
			{ table_name: "entity_media" },
			{ table_name: "media_assets" },
		]);
		const mediaCounts = (
			await db.query(`
				SELECT
					(SELECT COUNT(*)::int FROM media_assets) AS assets,
					(SELECT COUNT(*)::int FROM entity_media) AS assignments
			`)
		).rows[0];
		assert.deepEqual(mediaCounts, { assets: 0, assignments: 0 });
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

	test("repeated clean setups preserve catalog-key relationships", async () => {
		const firstSnapshot = await catalogRelationshipSnapshot(db);

		await db.query(schemaSql);
		await db.query(seedSql);

		assert.deepEqual(await catalogRelationshipSnapshot(db), firstSnapshot);
	});

	test("fresh database contains the ordered global starter workout", async () => {
		const sessions = (
			await db.query(
				"SELECT id, owner_user_id, is_archived, notes FROM sessions WHERE name = 'Sample Full Body Session'",
			)
		).rows;
		assert.equal(sessions.length, 1);
		assert.equal(sessions[0].owner_user_id, null);
		assert.equal(sessions[0].is_archived, false);

		const steps = (
			await db.query(
				`SELECT step.name, variant.catalog_key, variant.name AS variant_name, step.sets, step.reps,
				        step.step_order, type.name AS step_type
				 FROM session_steps AS step
				 JOIN sessions AS session ON session.id = step.session_id
				 JOIN exercise_variants AS variant ON variant.id = step.exercise_variant_id
				 JOIN step_types AS type ON type.id = step.step_type_id
				 WHERE session.name = 'Sample Full Body Session'
				 ORDER BY step.step_order`,
			)
		).rows;

		assert.deepEqual(steps, [
			{
				name: "Box squats",
				catalog_key: "bodyweight-box-squat",
				variant_name: "Bodyweight Box Squat",
				sets: 3,
				reps: 10,
				step_order: 1,
				step_type: "exercise",
			},
			{
				name: "Push ups",
				catalog_key: "bodyweight-push-up",
				variant_name: "Bodyweight Push Up",
				sets: 3,
				reps: 10,
				step_order: 2,
				step_type: "exercise",
			},
			{
				name: "One-arm rows",
				catalog_key: "one-arm-dumbbell-row",
				variant_name: "One-Arm Dumbbell Row",
				sets: 3,
				reps: 10,
				step_order: 3,
				step_type: "exercise",
			},
			{
				name: "Glute bridges",
				catalog_key: "bodyweight-glute-bridge",
				variant_name: "Bodyweight Glute Bridge",
				sets: 3,
				reps: 12,
				step_order: 4,
				step_type: "exercise",
			},
		]);
	});

	test("fresh database contains the PostgreSQL session-store infrastructure", async () => {
		const tables = (
			await db.query(
				`SELECT table_name
				 FROM information_schema.tables
				 WHERE table_schema = current_schema()
				   AND table_name = ANY($1::text[])
				 ORDER BY table_name`,
				[["session", "sessions"]],
			)
		).rows;
		assert.deepEqual(tables, [{ table_name: "session" }, { table_name: "sessions" }]);

		const columns = (
			await db.query(
				`SELECT column_name, data_type, is_nullable
				 FROM information_schema.columns
				 WHERE table_schema = current_schema() AND table_name = 'session'
				 ORDER BY ordinal_position`,
			)
		).rows;
		assert.deepEqual(columns, [
			{ column_name: "sid", data_type: "character varying", is_nullable: "NO" },
			{ column_name: "sess", data_type: "json", is_nullable: "NO" },
			{
				column_name: "expire",
				data_type: "timestamp without time zone",
				is_nullable: "NO",
			},
		]);

		const primaryKey = (
			await db.query(
				`SELECT constraint_name
				 FROM information_schema.table_constraints
				 WHERE table_schema = current_schema()
				   AND table_name = 'session'
				   AND constraint_type = 'PRIMARY KEY'`,
			)
		).rows;
		assert.deepEqual(primaryKey, [{ constraint_name: "session_pkey" }]);

		const indexes = (
			await db.query(
				`SELECT indexname
				 FROM pg_indexes
				 WHERE schemaname = current_schema() AND tablename = 'session'
				 ORDER BY indexname`,
			)
		).rows;
		assert.deepEqual(indexes, [
			{ indexname: "IDX_session_expire" },
			{ indexname: "session_pkey" },
		]);
	});
});
