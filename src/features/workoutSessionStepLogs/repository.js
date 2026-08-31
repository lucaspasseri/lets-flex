import pool from "../../../db/pool.js";
import * as queries from "./queries.js";

/** @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient */

/** @param {any} input @param {DatabaseClient} [db] */
export async function createBySessionSteps({ workoutSessionId, sessionId }, db = pool) {
	const { rows } = await db.query(queries.createAll(), [workoutSessionId, sessionId]);

	return rows;
}

/** @param {{workoutStepLogId: number, status: string, userId: number}} input @param {DatabaseClient} [db] */
export async function updateByIdForUser(
	{ workoutStepLogId, status, userId },
	db = pool,
) {
	const { rows } = await db.query(
		`UPDATE workout_step_logs wsl
		 SET status = $2, completed_at = NOW()
		 FROM workout_sessions ws, training_days td, cycles c, programs p
		 WHERE wsl.id = $1 AND ws.id = wsl.workout_session_id
		   AND td.id = ws.training_day_id AND c.id = td.cycle_id
		   AND p.id = c.program_id AND p.user_id = $3
		 RETURNING wsl.*`,
		[workoutStepLogId, status, userId],
	);
	return rows[0] ?? null;
}
