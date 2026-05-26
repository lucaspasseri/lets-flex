import startWorkoutSessionService from "../services/startWorkoutSessionService.js";
import toNullableNumber from "../utils/toNullableNumber.js";
import * as workoutSessionsDb from "../db/workout_sessions/index.js";
import pool from "../db/pool.js";

async function startWorkoutSession(req, res) {
	const { sessionId } = req.body;
	const { daysDifference } = res.locals.sessionState;

	const workoutSession =
		sessionId &&
		(await startWorkoutSessionService({
			sessionId: toNullableNumber(sessionId),
		}));

	res.redirect(
		`/?daysDifference=${daysDifference}&workoutSessionId=${workoutSession.id}`,
	);
}

async function finishWorkoutSession(req, res) {
	const { daysDifference, sessionId, workoutSessionId } =
		res.locals.sessionState;

	const workoutSession =
		workoutSessionId &&
		(await workoutSessionsDb.finishWorkoutSession(pool, {
			workoutSessionId,
		}));

	res.redirect(
		`/?daysDifference=${daysDifference}&sessionId=${sessionId}&workoutSessionId=${workoutSession.id}`,
	);
}

export { startWorkoutSession, finishWorkoutSession };
