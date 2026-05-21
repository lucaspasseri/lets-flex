import * as workoutSessionsDb from "../db/workout_sessions/index.js";
import * as workoutStepLogsDb from "../db/workout_step_logs/index.js";
import pool from "../db/pool.js";

const setActiveWorkoutSession = async (req, res, next) => {
	const { sessionId } = res.locals.sessionState;
	const workoutSessionInProgress = sessionId
		? await workoutSessionsDb.getWorkoutSessionInProgressBySessionId(pool, {
				sessionId,
			})
		: null;

	if (workoutSessionInProgress !== null) {
		req.session.state.workoutSessionId = workoutSessionInProgress?.id;
		res.locals.appState.currentWorkoutSession = workoutSessionInProgress;
		res.locals.sessionState.workoutSessionId = workoutSessionInProgress?.id;
	}

	next();
};

export { setActiveWorkoutSession };
