import * as workoutSessionsDb from "../db/workout_sessions/index.js";
import pool from "../db/pool.js";

const setActiveWorkoutSession = async (_req, res, next) => {
	const { sessionId } = res.locals.sessionState;
	const workoutSessionInProgressArr =
		await workoutSessionsDb.getWorkoutSessionInProgressBySessionId(pool, {
			sessionId,
		});

	console.log({ workoutSessionInProgressArr });

	res.locals.data.workoutSessionInProgressArr = workoutSessionInProgressArr;

	res.locals.sessionState.activeWorkoutSessionIdArr =
		workoutSessionInProgressArr.map(ws => ws.id);

	next();
};

export { setActiveWorkoutSession };
