import createWorkoutSession from "../../features/workoutSessions/createWorkoutSession.js";
import asyncHandler from "../../../utils/asyncControllerHandler.js";
import cancelWorkoutSession from "../../features/workoutSessions/cancelWorkoutSession.js";
import startWorkoutSession from "../../features/workoutSessions/startWorkoutSession.js";
import { finishWorkoutSession } from "../../features/workoutSessions/finishWorkoutSession.js";

async function create(req, res) {
	const { sessionId, trainingDayId } = req.body;

	await createWorkoutSession({ sessionId, trainingDayId });

	res.redirect(`/programs/day?dayId=${trainingDayId}`);
}

async function cancel(req, res) {
	const { workoutSessionId } = req.params;
	const { trainingDayId } = req.body;

	await cancelWorkoutSession({ workoutSessionId });

	res.redirect(`/programs/day?dayId=${trainingDayId}`);
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
		`/?daysDifference=${daysDifference}&workoutSessionId=${workoutSession.id}`,
	);
}

export const workoutSessionController = {
	create: asyncHandler(create),
	cancel: asyncHandler(cancel),
	start: asyncHandler(start),
	finish: asyncHandler(finish),
};
