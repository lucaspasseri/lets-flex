import toNullableNumber from "../utils/toNullableNumber.js";
import * as workoutSessionsDb from "../db/workout_sessions/index.js";
import insertWorkoutSessionWithOrder from "../services/InsertWorkoutSessionWithOrder.js";
import pool from "../db/pool.js";

async function createWorkoutSession(req, res) {
	const { sessionId, trainingDayId } = req.body;

	console.log({ sessionId, trainingDayId });

	const workoutSession =
		sessionId &&
		trainingDayId &&
		(await insertWorkoutSessionWithOrder({
			sessionId,
			trainingDayId,
		}));

	console.log(2);

	// res.redirect(
	// 	`/?daysDifference=${daysDifference}&workoutSessionId=${workoutSession?.id}`,
	// );

	res.redirect("/programs/day");
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

export { createWorkoutSession, finishWorkoutSession };
