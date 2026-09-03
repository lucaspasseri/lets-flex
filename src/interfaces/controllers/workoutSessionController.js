import createWorkoutSession from "../../features/workoutSessions/createWorkoutSession.js";
import asyncHandler from "../../../utils/asyncControllerHandler.js";
import cancelWorkoutSession from "../../features/workoutSessions/cancelWorkoutSession.js";
import startWorkoutSession from "../../features/workoutSessions/startWorkoutSession.js";
import { finishWorkoutSession } from "../../features/workoutSessions/finishWorkoutSession.js";
import WorkoutSessionLifecycleError from "../../features/workoutSessions/WorkoutSessionLifecycleError.js";
import { renderDay } from "./dayController.js";
import { renderDashboard } from "./dashboardController.js";

async function create(req, res) {
	const { sessionId, trainingDayId } = req.validatedBody;

	await createWorkoutSession({ sessionId, trainingDayId, userId: req.user.id });

	res.redirect(`/programs/day?dayId=${trainingDayId}`);
}

async function cancel(req, res, next) {
	try {
		const { workoutSessionId } = req.validatedParams;
		const { trainingDayId } = req.validatedBody;

		await cancelWorkoutSession({ workoutSessionId, userId: req.user.id });

		res.redirect(`/programs/day?dayId=${trainingDayId}`);
	} catch (error) {
		if (await respondToLifecycleConflict(req, res, error)) return;
		next(error);
	}
}

async function showCreateErrors(req, res, { errors, submittedValues }) {
	const values =
		submittedValues && typeof submittedValues === "object" ? submittedValues : {};
	res.status(422);
	await renderDay(req, res, {
		dayId: values.trainingDayId,
		sessionLinkFormState: { values, errors },
	});
}

async function showCancelErrors(_req, res, { errors }) {
	const messages = [...Object.values(errors.fieldErrors), ...errors.formErrors];
	res.status(400).json({ error: messages[0] ?? "Invalid workout session." });
}

async function start(req, res, next) {
	try {
		const { workoutSessionId } = req.validatedParams;
		const { daysDifference } = req.validatedBody;

		const { workoutSession } = await startWorkoutSession({
			workoutSessionId,
			userId: req.user.id,
		});

		res.redirect(
			`/?daysDifference=${daysDifference}&workoutSessionId=${workoutSession.id}`,
		);
	} catch (error) {
		if (await respondToLifecycleConflict(req, res, error)) return;
		next(error);
	}
}
async function finish(req, res, next) {
	try {
		const { workoutSessionId } = req.validatedParams;
		const { daysDifference } = req.validatedBody;

		const workoutSession = await finishWorkoutSession({
			workoutSessionId,
			userId: req.user.id,
		});

		res.redirect(
			`/?daysDifference=${daysDifference}&workoutSessionId=${workoutSession.id}`,
		);
	} catch (error) {
		if (await respondToLifecycleConflict(req, res, error)) return;
		next(error);
	}
}

async function respondToLifecycleConflict(req, res, error) {
	if (!(error instanceof WorkoutSessionLifecycleError)) return false;

	const message =
		error.reason === "active_session"
			? "Another workout session is already active for this training day."
			: error.reason === "unresolved_steps"
				? "Complete or skip every workout step before finishing this session."
				: `This workout session can no longer be ${error.action === "cancel" ? "cancelled" : `${error.action}ed`}.`;
	if (error.action === "cancel") {
		res.status(409).send(message);
		return true;
	}

	res.status(409);
	await renderDashboard(req, res, {
		daysDifference: req.validatedBody?.daysDifference,
		workoutSessionId: req.validatedParams?.workoutSessionId,
		workoutFeedback: {
			tone: "error",
			title: "Workout not updated",
			message,
		},
	});
	return true;
}

async function showActionErrors(req, res, { errors, submittedValues }) {
	res.status(422);
	await renderDashboard(req, res, {
		daysDifference: submittedValues?.daysDifference,
		workoutSessionId: req.validatedParams?.workoutSessionId,
		actionFormState: { errors, values: submittedValues },
	});
}

export const workoutSessionController = {
	create: asyncHandler(create),
	cancel: asyncHandler(cancel),
	start: asyncHandler(start),
	finish: asyncHandler(finish),
	showCreateErrors,
	showCancelErrors,
	showActionErrors,
};
