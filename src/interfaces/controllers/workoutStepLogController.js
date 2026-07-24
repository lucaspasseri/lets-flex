import asyncHandler from "../../../utils/asyncControllerHandler.js";
import skipWorkoutStepLog from "../../features/workoutSessionStepLogs/skipWorkoutStepLog.js";
import performWorkoutStepLog from "../../features/workoutSessionStepLogs/performWorkoutStepLog.js";

async function skip(req, res) {
	const { workoutStepLogId } = req.params;
	const { daysDifference } = req.body;

	const workoutStepLog = await skipWorkoutStepLog({
		workoutStepLogId,
		status: "skipped",
	});

	const search = new URLSearchParams({
		daysDifference: daysDifference ?? 0,
		workoutSessionId: workoutStepLog.workout_session_id,
	});

	res.redirect(`/?${search}`);
}

async function perform(req, res) {
	const { workoutStepLogId } = req.params;
	const { daysDifference, logFormRows } = req.body;

	const workoutStepLog = await performWorkoutStepLog({
		workoutStepLogId,
		status: "performed",
		logFormRows,
	});

	const search = new URLSearchParams({
		daysDifference: daysDifference ?? 0,
		workoutSessionId: workoutStepLog.workout_session_id,
	});

	res.redirect(`/?${search}`);
}

export const workoutStepLogController = {
	skip: asyncHandler(skip),
	perform: asyncHandler(perform),
};
