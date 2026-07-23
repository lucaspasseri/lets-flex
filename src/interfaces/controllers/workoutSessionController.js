import createWorkoutSession from "../../features/workoutSessions/createWorkoutSession.js";
import asyncHandler from "../../../utils/asyncControllerHandler.js";
import cancelWorkoutSession from "../../features/workoutSessions/cancelWorkoutSession.js";

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

export const workoutSessionController = {
	create: asyncHandler(create),
	cancel: asyncHandler(cancel),
};
