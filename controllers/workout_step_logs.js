import pool from "../db/pool.js";
import * as workoutStepLogsDb from "../db/workout_step_logs/index.js";

async function skipWorkoutStep(req, res) {
	const { workoutSessionId } = res.locals.sessionState;
	const { workoutStepLogId } = req.params;
	const daysDifference =
		req.body.daysDifference ?? res.locals.sessionState.daysDifference;

	const workoutStepLog = await workoutStepLogsDb.updateWorkoutStepLogStatus(
		pool,
		{
			workoutStepLogId,
			status: "skipped",
		},
	);

	res.redirect(
		`/?daysDifference=${daysDifference ?? 0}&workoutSessionId=${workoutStepLog.workout_session_id}`,
	);
}

async function performWorkoutStep(req, res, next) {
	try {
		const { workoutStepLogId } = req.params;
		const daysDifference =
			req.body.daysDifference ?? res.locals.sessionState.daysDifference;

		const workoutStepLog = await workoutStepLogsDb.updateWorkoutStepLogStatus(
			pool,
			{
				workoutStepLogId,
				status: "performed",
			},
		);

		res.redirect(
			`/?daysDifference=${daysDifference ?? 0}&workoutSessionId=${workoutStepLog.workout_session_id}`,
		);
	} catch (error) {
		next(error);
	}
}

export { skipWorkoutStep, performWorkoutStep };
