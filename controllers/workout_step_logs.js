import pool from "../db/pool.js";
import * as workoutStepLogsDb from "../db/workout_step_logs/index.js";

async function skipWorkoutStep(req, res) {
	const { daysDifference, workoutSessionId } = res.locals.sessionState;
	const { workoutStepLogId } = req.params;

	await workoutStepLogsDb.updateWorkoutStepLogStatus(pool, {
		workoutStepLogId,
		status: "skipped",
	});

	res.redirect(
		`/?daysDifference=${daysDifference}&workoutSessionId=${workoutSessionId}`,
	);
}

async function performWorkoutStep(req, res) {
	const { daysDifference, workoutSessionId } = res.locals.sessionState;
	const { workoutStepLogId } = req.params;

	await workoutStepLogsDb.updateWorkoutStepLogStatus(pool, {
		workoutStepLogId,
		status: "performed",
	});

	res.redirect(
		`/?daysDifference=${daysDifference}&workoutSessionId=${workoutSessionId}`,
	);
}

export { skipWorkoutStep, performWorkoutStep };
