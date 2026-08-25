import pool from "../../../db/pool.js";
import * as queries from "./queries.js";

/** @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient */

/** @param {any} input @param {DatabaseClient} [db] */
export async function createBySessionSteps({ workoutSessionId, sessionId }, db = pool) {
	const { rows } = await db.query(queries.createAll(), [workoutSessionId, sessionId]);

	return rows;
}

/** @param {any} input @param {DatabaseClient} [db] */
export async function updateById({ workoutStepLogId, status }, db = pool) {
	const { rows } = await db.query(
		"UPDATE workout_step_logs SET status = $1, completed_at = NOW() WHERE id = $2 RETURNING *",
		[status, workoutStepLogId],
	);

	return rows[0];
}
