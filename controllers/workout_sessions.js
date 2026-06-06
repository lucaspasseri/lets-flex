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

	console.log({ workoutSessionId });

	const w =
		workoutSessionId && startWorkoutSessionService(pool, { workoutSessionId });

	console.log({ w });

	res.redirect("/");

	// const { daysDifference, sessionId, workoutSessionId } =
	// 	res.locals.sessionState;
	// const workoutSession =
	// 	workoutSessionId &&
	// 	(await workoutSessionsDb.finishWorkoutSession(pool, {
	// 		workoutSessionId,
	// 	}));
	// res.redirect(
	// 	`/?daysDifference=${daysDifference}&sessionId=${sessionId}&workoutSessionId=${workoutSession.id}`,
	// );
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

export { createWorkoutSession, startWorkoutSession, finishWorkoutSession };
