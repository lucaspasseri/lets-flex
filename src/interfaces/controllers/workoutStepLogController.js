import asyncHandler from "../../../utils/asyncControllerHandler.js";
import skipWorkoutStepLog from "../../features/workoutSessionStepLogs/skipWorkoutStepLog.js";
import performWorkoutStepLog from "../../features/workoutSessionStepLogs/performWorkoutStepLog.js";
import WorkoutStepLogLifecycleError from "../../features/workoutSessionStepLogs/WorkoutStepLogLifecycleError.js";
import { renderDashboard } from "./dashboardController.js";

async function skip(req, res, next) {
	try {
		const { workoutStepLogId } = req.validatedParams;
		const { daysDifference, workoutSessionId } = req.validatedBody;

		const workoutStepLog = await skipWorkoutStepLog({
			workoutStepLogId,
			userId: req.user.id,
		});

		const search = new URLSearchParams({
			daysDifference: daysDifference ?? 0,
			workoutSessionId: workoutStepLog.workout_session_id ?? workoutSessionId,
		});

		res.redirect(`/?${search}`);
	} catch (error) {
		if (await respondToStepConflict(req, res, error)) return;
		next(error);
	}
}

async function perform(req, res, next) {
	try {
		const { workoutStepLogId } = req.validatedParams;
		const { daysDifference, logFormRows } = req.validatedBody;

		const workoutStepLog = await performWorkoutStepLog({
			workoutStepLogId,
			logFormRows,
			userId: req.user.id,
		});

		const search = new URLSearchParams({
			daysDifference: daysDifference ?? 0,
			workoutSessionId: workoutStepLog.workout_session_id,
		});

		res.redirect(`/?${search}`);
	} catch (error) {
		if (await respondToStepConflict(req, res, error)) return;
		next(error);
	}
}

async function respondToStepConflict(req, res, error) {
	if (!(error instanceof WorkoutStepLogLifecycleError)) return false;

	const message = `This workout step can no longer be ${error.action === "skip" ? "skipped" : "performed"}.`;
	res.status(409);
	await renderDashboard(req, res, {
		daysDifference: req.validatedBody?.daysDifference,
		workoutSessionId: req.validatedBody?.workoutSessionId,
		workoutFeedback: {
			tone: "error",
			title: "Step not saved",
			message,
		},
	});
	return true;
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
