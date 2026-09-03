import pool from "../../../db/pool.js";
import * as queries from "./queries.js";

/** @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient */

/** @param {any} input @param {DatabaseClient} [db] */
export async function createBySessionSteps({ workoutSessionId, sessionId }, db = pool) {
	const { rows } = await db.query(queries.createAll(), [workoutSessionId, sessionId]);

	return rows;
}

/** @param {{workoutStepLogId: number, userId: number}} input @param {DatabaseClient} [db] */
export async function findByIdForUser({ workoutStepLogId, userId }, db = pool) {
	const { rows } = await db.query(
		`SELECT wsl.*, ws.status AS workout_session_status
		 FROM workout_step_logs wsl
		 JOIN workout_sessions ws ON ws.id = wsl.workout_session_id
		 JOIN training_days td ON td.id = ws.training_day_id
		 JOIN cycles c ON c.id = td.cycle_id
		 JOIN programs p ON p.id = c.program_id
		 WHERE wsl.id = $1 AND p.user_id = $2`,
		[workoutStepLogId, userId],
	);
	return rows[0] ?? null;
}

/** @param {{workoutStepLogId: number, status: "performed" | "skipped", userId: number}} input @param {DatabaseClient} [db] */
export async function updateByIdForUser(
	{ workoutStepLogId, status, userId },
	db = pool,
) {
	const { rows } = await db.query(
		`UPDATE workout_step_logs wsl
		 SET status = $2, completed_at = NOW()
		 FROM workout_sessions ws, training_days td, cycles c, programs p
		 WHERE wsl.id = $1 AND wsl.status = 'planned'
		   AND ws.id = wsl.workout_session_id AND ws.status = 'in_progress'
		   AND NOT EXISTS (
		     SELECT 1 FROM workout_set_logs existing_set
		     WHERE existing_set.workout_step_log_id = wsl.id
		   )
		   AND td.id = ws.training_day_id AND c.id = td.cycle_id
		   AND p.id = c.program_id AND p.user_id = $3
		 RETURNING wsl.*`,
		[workoutStepLogId, status, userId],
	);
	return rows[0] ?? null;
}
