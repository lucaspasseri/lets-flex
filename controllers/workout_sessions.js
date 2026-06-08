import toNullableNumber from "../utils/toNullableNumber.js";
import * as workoutSessionsDb from "../db/workout_sessions/index.js";
import insertWorkoutSessionWithOrder from "../services/InsertWorkoutSessionWithOrder.js";
import pool from "../db/pool.js";
import { startWorkoutSessionService } from "../services/startWorkoutSessionService.js";

async function createWorkoutSession(req, res) {
	const { sessionId, trainingDayId } = req.body;

	const workoutSession =
		sessionId &&
		trainingDayId &&
		(await insertWorkoutSessionWithOrder({
			sessionId,
			trainingDayId,
		}));

	res.redirect("/programs/day");
}

async function startWorkoutSession(req, res) {
	const { workoutSessionId } = req.params;
	const { daysDifference } = req.session.state;

	const { workoutSession } = workoutSessionId
		? await startWorkoutSessionService(pool, { workoutSessionId })
		: null;

	res.redirect(
		`/?daysDifference=${daysDifference}&workoutSessionId=${workoutSession?.id}`,
	);
}

async function finishWorkoutSession(req, res) {
	const { workoutSessionId } = req.params;
	const { daysDifference } = req.session.state;

	const workoutSession = workoutSessionId
		? await workoutSessionsDb.finishWorkoutSession(pool, {
				workoutSessionId,
			})
		: null;

	res.redirect(
		`/?daysDifference=${daysDifference}&workoutSessionId=${workoutSession.id}`,
	);
}

export { createWorkoutSession, startWorkoutSession, finishWorkoutSession };
