import * as workoutSessionsDb from "../db/workout_sessions/index.js";
import * as workoutStepLogsDb from "../db/workout_step_logs/index.js";
import pool from "../db/pool.js";

const setActiveWorkoutSession = async (req, res, next) => {
	const { sessionId } = res.locals.sessionState;

	const workoutSessionArr = sessionId
		? await workoutSessionsDb.getWorkoutSessionBySessionId(pool, { sessionId })
		: [];

	const workoutSessionInProgress =
		workoutSessionArr.find(session => session.status === "in_progress") ?? null;

	const workoutSessionFinished =
		workoutSessionArr.find(session => session.status === "finished") ?? null;

	console.log({ workoutSessionInProgress });
	console.log({ workoutSessionFinished });

	const currentWorkoutSession =
		workoutSessionInProgress ?? workoutSessionFinished ?? null;

	console.log({ currentWorkoutSession });

	if (currentWorkoutSession !== null) {
		req.session.state.workoutSessionId = currentWorkoutSession?.id ?? null;
		res.locals.appState.currentWorkoutSession = currentWorkoutSession ?? null;
		res.locals.sessionState.workoutSessionId =
			currentWorkoutSession?.id ?? null;
	}

	next();
};

export { setActiveWorkoutSession };
