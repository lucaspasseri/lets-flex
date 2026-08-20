import { toSessionMapperStepSeed } from "../sessions/mapper.js";

/**
 * @typedef {import("./workoutSessions.types.js").WorkoutSessionRow} WorkoutSessionRow
 * @typedef {import("./workoutSessions.types.js").WorkoutSessionStepRow} WorkoutSessionStepRow
 * @typedef {import("./workoutSessions.types.js").StepLogRow} StepLogRow
 * @typedef {import("./workoutSessions.types.js").WorkoutSession} WorkoutSession
 * @typedef {import("./workoutSessions.types.js").WorkoutSessionStep} WorkoutSessionStep
 * @typedef {import("./workoutSessions.types.js").WorkoutStepLog} WorkoutStepLog
 */

/**
 * @param {WorkoutSessionRow} row
 * @returns {WorkoutSession}
 */
export function toWorkoutSession(row) {
	return {
		id: row.id,
		trainingDayId: row.training_day_id,
		sessionId: row.session_id,
		order: row.workout_session_order,
		status: row.status,
		startedAt: row.started_at ?? null,
		finishedAt: row.finished_at ?? null,
		notes: row.notes ?? null,
		name: row.name,
		sessionNotes: row.session_notes ?? null,
		isArchived: row.is_archived,
		steps: (row.steps ?? []).map(toWorkoutSessionStep),
	};
}

/** @param {WorkoutSessionStepRow} row @returns {WorkoutSessionStep} */
function toWorkoutSessionStep(row) {
	return {
		...toSessionMapperStepSeed(row),
		stepLog: row.step_log ? toWorkoutStepLog(row.step_log) : null,
	};
}

/** @param {StepLogRow} row @returns {WorkoutStepLog} */
function toWorkoutStepLog(row) {
	return {
		id: row.id,
		workoutSessionId: row.workout_session_id,
		sessionStepId: row.session_step_id,
		status: row.status,
		performedAt: row.performed_at ?? null,
		plannedSets: row.planned_sets ?? null,
		plannedReps: row.planned_reps ?? null,
		plannedLoadValue: row.planned_load_value ?? null,
		plannedLoadUnit: row.planned_load_unit ?? null,
		performedSets: row.performed_sets ?? null,
		performedReps: row.performed_reps ?? null,
		performedLoadValue: row.performed_load_value ?? null,
		performedLoadUnit: row.performed_load_unit ?? null,
	};
}
