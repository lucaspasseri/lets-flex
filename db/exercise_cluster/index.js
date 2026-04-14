import pool from "../pool.js";

async function addNewExerciseCluster(
	name,
	movementPatternId,
	equipmentId,
	muscleGroup,
) {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");

		const {
			rows: [{ id: exerciseId }],
		} = await client.query(
			"INSERT INTO exercises (name, movement_pattern_id) VALUES ($1, $2) RETURNING id",
			[name, movementPatternId],
		);

		for (const { muscleId, muscleRoleId } of muscleGroup) {
			await client.query(
				"INSERT INTO exercise_muscles (exercise_id, muscle_id, muscle_role_id) VALUES ($1, $2, $3)",
				[exerciseId, muscleId, muscleRoleId],
			);
		}

		await client.query(
			"INSERT INTO exercise_variants (name, exercise_id, equipment_id) VALUES ($1, $2, $3)",
			[name, exerciseId, equipmentId],
		);

		await client.query("COMMIT");
	} catch (err) {
		console.log({ err });
		await client.query("ROLLBACK");
		throw new Error(`Failed to add new exercise cluster: ${err.message}`);
	} finally {
		client.release();
	}
}

export { addNewExerciseCluster };
