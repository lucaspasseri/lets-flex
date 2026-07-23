import pool from "../../../db/pool.js";
import * as queries from "./queries.js";

export async function findAllByTrainingDayId({ trainingDayId }, db = pool) {
	const { rows } = await db.query(queries.findAllQuery(), [trainingDayId]);
	return rows;
}

export async function create(
	{ sessionId, trainingDayId, workoutSessionOrder, notes },
	db = pool,
) {
	const { rows } = await db.query(
		"INSERT INTO workout_sessions (session_id, training_day_id, workout_session_order, notes) VALUES ($1, $2, $3, $4) RETURNING *",
		[sessionId, trainingDayId, workoutSessionOrder, notes],
	);

	return rows[0] ?? null;
}

export async function cancelById({ workoutSessionId }, db = pool) {
	const { rows } = await db.query(
		`
		UPDATE workout_sessions
		SET
			status = 'cancelled'
		WHERE id = $1
		RETURNING *
		`,
		[workoutSessionId],
	);

	return rows[0];
}
