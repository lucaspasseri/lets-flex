import createWorkoutSession from "../../features/workoutSessions/createWorkoutSession.js";
import asyncHandler from "../../../utils/asyncControllerHandler.js";
import cancelWorkoutSession from "../../features/workoutSessions/cancelWorkoutSession.js";
import startWorkoutSession from "../../features/workoutSessions/startWorkoutSession.js";
import { finishWorkoutSession } from "../../features/workoutSessions/finishWorkoutSession.js";
import { renderDay } from "./dayController.js";
import { workoutSessionParamsSchema } from "../validation/daySchemas.js";

async function create(req, res) {
	const { sessionId, trainingDayId } = req.validatedBody;

	await createWorkoutSession({ sessionId, trainingDayId });

	res.redirect(`/programs/day?dayId=${trainingDayId}`);
}

async function cancel(req, res) {
	const params = workoutSessionParamsSchema.safeParse(req.params);
	if (!params.success) {
		res.status(400).send("Invalid workout session ID");
		return;
	}
	const { workoutSessionId } = params.data;
	const { trainingDayId } = req.validatedBody;

	await cancelWorkoutSession({ workoutSessionId });

	res.redirect(`/programs/day?dayId=${trainingDayId}`);
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

async function start(req, res) {
	const { workoutSessionId } = req.params;
	const daysDifference =
		req.body.daysDifference ?? res.locals.sessionState.daysDifference;

	const { workoutSession } = await startWorkoutSession({ workoutSessionId });

	res.redirect(
		`/?daysDifference=${daysDifference}&workoutSessionId=${workoutSession?.id}`,
	);
}
async function finish(req, res) {
	const { workoutSessionId } = req.params;
	const daysDifference =
		req.body.daysDifference ?? res.locals.sessionState.daysDifference;

	const workoutSession = await finishWorkoutSession({ workoutSessionId });

	res.redirect(
		`/?daysDifference=${daysDifference}&workoutSessionId=${workoutSession?.id}`,
	);
}

export const workoutSessionController = {
	create: asyncHandler(create),
	cancel: asyncHandler(cancel),
	start: asyncHandler(start),
	finish: asyncHandler(finish),
	showCreateErrors,
	showCancelErrors,
};
