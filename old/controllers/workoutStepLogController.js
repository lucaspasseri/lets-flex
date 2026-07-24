import * as workoutSessionStepService from "../services/workoutStepLogService.js";

async function skip(req, res, next) {
	const { workoutStepLogId } = req.params;
	const { daysDifference } = req.body;

	try {
		const { workoutStepLog } = await workoutSessionStepService.skipWorkoutStep({
			workoutStepLogId,
			status: "skipped",
		});

		const search = new URLSearchParams({
			daysDifference: daysDifference ?? 0,
			workoutSessionId: workoutStepLog.workout_session_id,
		});

		res.redirect(`/?${search}`);
	} catch (err) {
		next(err);
	}
}

async function perform(req, res, next) {
	const { workoutStepLogId } = req.params;
	const { daysDifference, logFormRows } = req.body;

	try {
		const { workoutStepLog } =
			await workoutSessionStepService.performWorkoutStep({
				workoutStepLogId,
				status: "performed",
				logFormRows,
			});

		const search = new URLSearchParams({
			daysDifference: daysDifference ?? 0,
			workoutSessionId: workoutStepLog.workout_session_id,
		});

		res.redirect(`/?${search}`);
	} catch (err) {
		next(err);
	}
}

export const workoutStepLogController = {
	skip,
	perform,
};
