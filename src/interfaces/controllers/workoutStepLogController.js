import asyncHandler from "../../../utils/asyncControllerHandler.js";
import skipWorkoutStepLog from "../../features/workoutSessionStepLogs/skipWorkoutStepLog.js";
import performWorkoutStepLog from "../../features/workoutSessionStepLogs/performWorkoutStepLog.js";
import { renderDashboard } from "./dashboardController.js";

async function skip(req, res) {
	const { workoutStepLogId } = req.validatedParams;
	const { daysDifference, workoutSessionId } = req.validatedBody;

	const workoutStepLog = await skipWorkoutStepLog({
		workoutStepLogId,
		status: "skipped",
		userId: req.user.id,
	});

	const search = new URLSearchParams({
		daysDifference: daysDifference ?? 0,
		workoutSessionId: workoutStepLog.workout_session_id ?? workoutSessionId,
	});

	res.redirect(`/?${search}`);
}

async function perform(req, res) {
	const { workoutStepLogId } = req.validatedParams;
	const { daysDifference, logFormRows } = req.validatedBody;

	const workoutStepLog = await performWorkoutStepLog({
		workoutStepLogId,
		status: "performed",
		logFormRows,
		userId: req.user.id,
	});

	const search = new URLSearchParams({
		daysDifference: daysDifference ?? 0,
		workoutSessionId: workoutStepLog.workout_session_id,
	});

	res.redirect(`/?${search}`);
}

async function showActionErrors(req, res, { errors, submittedValues }) {
	res.status(422);
	await renderDashboard(req, res, {
		daysDifference: submittedValues?.daysDifference,
		workoutSessionId: submittedValues?.workoutSessionId,
		actionFormState: { errors, values: submittedValues },
	});
}

async function showPerformErrors(req, res, { errors, submittedValues }) {
	res.status(422);
	await renderDashboard(req, res, {
		daysDifference: submittedValues?.daysDifference,
		workoutSessionId: submittedValues?.workoutSessionId,
		workoutLogFormState: { errors, values: submittedValues },
	});
}

export const workoutStepLogController = {
	skip: asyncHandler(skip),
	perform: asyncHandler(perform),
	showActionErrors,
	showPerformErrors,
};
