import pool from "../../../db/pool.js";

export async function create(
	{ exerciseId, muscleId, muscleRoleId },
	db = pool,
) {
	await db.query(
		"INSERT INTO exercise_muscles (exercise_id, muscle_id, muscle_role_id) VALUES ($1, $2, $3)",
		[exerciseId, muscleId, muscleRoleId],
	);
}

/** @param {{exerciseId: number}} input @param {any} db */
export async function deleteByExerciseId({ exerciseId }, db = pool) {
	await db.query("DELETE FROM exercise_muscles WHERE exercise_id = $1", [
		exerciseId,
	]);
}
