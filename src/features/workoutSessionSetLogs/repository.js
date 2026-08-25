import pool from "../../../db/pool.js";

/** @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient */

/** @param {any} input @param {DatabaseClient} [db] */
export async function create(
	{ workoutStepLogId, setOrder, reps, loadValue, loadUnit },
	db = pool,
) {
	const { rows } = await db.query(
		"INSERT INTO workout_set_logs (workout_step_log_id, set_order, reps, load_value, load_unit) VALUES ($1,$2,$3,$4,$5) RETURNING *",
		[workoutStepLogId, setOrder, reps, loadValue, loadUnit],
	);

	return rows[0];
}
