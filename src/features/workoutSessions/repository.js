import pool from "../../../db/pool.js";
import { normalizeCatalogLocale } from "../catalogLocalization/catalogLocalization.js";
import * as queries from "./queries.js";

/**
 * @typedef {import("../trainingDays/trainingDays.types.js").TrainingDayRow } TrainingDayRow
 * @typedef {import("./workoutSessions.types.js").WorkoutSessionRow } WorkoutSessionRow
 * @typedef {import("pg").Pool | import("pg").PoolClient} DatabaseClient
 */

/**
 * @typedef {object} FindAllByTrainingDayIdInput
 * @property {TrainingDayRow["id"]} trainingDayId
 * @property {string} [locale]
 */

/** @param {{sessionId: number, trainingDayId: number, userId: number, notes: string}} input @param {DatabaseClient} [db] */
export async function createForUser(
	{ sessionId, trainingDayId, userId, notes },
	db = pool,
) {
	const { rows } = await db.query(
		`INSERT INTO workout_sessions
		 (session_id, training_day_id, workout_session_order, session_name, notes)
		 SELECT s.id, td.id,
		        COALESCE((SELECT MAX(ws.workout_session_order) + 1 FROM workout_sessions ws WHERE ws.training_day_id = td.id), 1),
		        s.name, $4
		 FROM sessions s, training_days td
		 JOIN cycles c ON c.id = td.cycle_id
		 JOIN programs p ON p.id = c.program_id
		 WHERE s.id = $1 AND td.id = $2 AND p.user_id = $3
		   AND s.is_archived = FALSE
		   AND (s.owner_user_id IS NULL OR s.owner_user_id = $3)
		 RETURNING *`,
		[sessionId, trainingDayId, userId, notes],
	);
	return rows[0] ?? null;
}

/** @param {{workoutSessionId: number, userId: number}} input @param {DatabaseClient} [db] */
export async function findByIdForUser({ workoutSessionId, userId }, db = pool) {
	const { rows } = await db.query(
		`SELECT ws.*, s.name, s.notes AS session_notes
		 FROM workout_sessions ws
		 JOIN sessions s ON s.id = ws.session_id
		 JOIN training_days td ON td.id = ws.training_day_id
		 JOIN cycles c ON c.id = td.cycle_id
		 JOIN programs p ON p.id = c.program_id
		 WHERE ws.id = $1 AND p.user_id = $2`,
		[workoutSessionId, userId],
	);
	return rows[0] ?? null;
}

/**
 * @param {FindAllByTrainingDayIdInput} input
 * @returns {Promise<WorkoutSessionRow[]>}
 */

export async function findAllByTrainingDayId({ trainingDayId, locale }, db = pool) {
	const { rows } = await db.query(queries.findAll(), [
		trainingDayId,
		normalizeCatalogLocale(locale),
	]);
	return rows;
}

export async function findAllByProgramId({ programId }, db = pool) {
	const { rows } = await db.query(queries.findAllByProgramId(), [programId]);
	return rows;
}

/**
 * Fetches only the lightweight session state needed by dashboard date markers.
 * The ownership predicate remains part of the read instead of relying on a prior lookup.
 *
 * @param {{programId: number, userId: number, startDate: string, endDate: string}} input
 * @param {DatabaseClient} [db]
 */
export async function findMarkersByProgramIdAndDateRangeForUser(
	{ programId, userId, startDate, endDate },
	db = pool,
) {
	const { rows } = await db.query(
		`SELECT ws.id, ws.status, td.scheduled_date
		 FROM programs p
		 JOIN cycles c ON c.program_id = p.id
		 JOIN training_days td ON td.cycle_id = c.id
		 JOIN workout_sessions ws ON ws.training_day_id = td.id
		 WHERE p.id = $1 AND p.user_id = $2
		   AND td.scheduled_date BETWEEN $3::date AND $4::date
		 ORDER BY td.scheduled_date, c.cycle_order, td.day_order, ws.workout_session_order, ws.id`,
		[programId, userId, startDate, endDate],
	);
	return rows;
}

/** @param {{workoutSessionId: number, userId: number}} input @param {DatabaseClient} [db] */
export async function startByIdForUser({ workoutSessionId, userId }, db = pool) {
	const { rows } = await db.query(
		`UPDATE workout_sessions ws
		 SET status = 'in_progress', started_at = NOW(),
		     session_name = COALESCE(ws.session_name, s.name)
		 FROM training_days td, cycles c, programs p, sessions s
		 WHERE ws.id = $1 AND ws.status = 'planned'
		   AND td.id = ws.training_day_id AND c.id = td.cycle_id
		   AND p.id = c.program_id AND p.user_id = $2 AND s.id = ws.session_id
		 RETURNING ws.*`,
		[workoutSessionId, userId],
	);
	return rows[0] ?? null;
}

/** @param {{workoutSessionId: number, userId: number}} input @param {DatabaseClient} [db] */
export async function finishByIdForUser({ workoutSessionId, userId }, db = pool) {
	const { rows } = await db.query(
		`UPDATE workout_sessions ws SET status = 'finished', finished_at = NOW()
		 FROM training_days td, cycles c, programs p
		 WHERE ws.id = $1 AND ws.status = 'in_progress'
		   AND NOT EXISTS (
		     SELECT 1 FROM workout_step_logs wsl
		     WHERE wsl.workout_session_id = ws.id
		       AND wsl.status NOT IN ('performed', 'skipped')
		   )
		   AND td.id = ws.training_day_id
		   AND c.id = td.cycle_id AND p.id = c.program_id AND p.user_id = $2
		 RETURNING ws.*`,
		[workoutSessionId, userId],
	);
	return rows[0] ?? null;
}

/** @param {{workoutSessionId: number, userId: number}} input @param {DatabaseClient} [db] */
export async function cancelByIdForUser({ workoutSessionId, userId }, db = pool) {
	const { rows } = await db.query(
		`UPDATE workout_sessions ws
		 SET status = 'cancelled', session_name = COALESCE(ws.session_name, s.name)
		 FROM training_days td, cycles c, programs p, sessions s
		 WHERE ws.id = $1 AND ws.status = 'planned'
		   AND td.id = ws.training_day_id
		   AND c.id = td.cycle_id AND p.id = c.program_id AND p.user_id = $2
		   AND s.id = ws.session_id
		 RETURNING ws.*`,
		[workoutSessionId, userId],
	);
	return rows[0] ?? null;
}
