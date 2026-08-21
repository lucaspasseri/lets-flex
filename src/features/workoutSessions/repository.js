import pool from "../../../db/pool.js";
import * as queries from "./queries.js";

/**
 * @typedef {import("../trainingDays/trainingDays.types.js").TrainingDayRow } TrainingDayRow
 * @typedef {import("./workoutSessions.types.js").WorkoutSessionRow } WorkoutSessionRow
 */

/**
 * @typedef {object} FindAllByTrainingDayIdInput
 * @property {TrainingDayRow["id"]} trainingDayId
 */

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

export async function findById({ workoutSessionId }, db = pool) {
	const { rows } = await db.query(
		`
		SELECT workoutSessions.*, sessionsTemplate.name, sessionsTemplate.notes AS session_notes
		FROM workout_sessions AS workoutSessions
		JOIN sessions AS sessionsTemplate
		ON workoutSessions.session_id = sessionsTemplate.id
		WHERE workoutSessions.id = $1
		`,
		[workoutSessionId],
	);

	console.log({ ws: rows?.[0] });

	return rows[0] ?? null;
}

/**
 * @param {FindAllByTrainingDayIdInput} input
 * @returns {Promise<WorkoutSessionRow[]>}
 */

export async function findAllByTrainingDayId({ trainingDayId }, db = pool) {
	const { rows } = await db.query(queries.findAll(), [trainingDayId]);
	return rows;
}

export async function findAllByProgramId({ programId }, db = pool) {
	const { rows } = await db.query(queries.findAllByProgramId(), [programId]);
	return rows;
}

export async function startById({ workoutSessionId }, db = pool) {
	const { rows } = await db.query(
		`
		UPDATE workout_sessions
		SET
			status = 'in_progress',
			started_at = NOW()
		WHERE id = $1
			AND status = 'planned'
		RETURNING *
		`,
		[workoutSessionId],
	);

	return rows[0] ?? null;
}

export async function finishById({ workoutSessionId }, db = pool) {
	const { rows } = await db.query(
		`
		UPDATE workout_sessions
		SET
			status = 'finished',
			finished_at = NOW()
		WHERE id = $1
		RETURNING *
		`,
		[workoutSessionId],
	);

	return rows[0] ?? null;
}
