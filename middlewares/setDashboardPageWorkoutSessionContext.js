import pool from "../db/pool.js";
import * as workoutSessionsDb from "../db/workout_sessions/index.js";

const setDashboardPageWorkoutSessionContext = async (req, res, next) => {
	let workoutSessionId = res.locals.dashboardPageParams?.workoutSessionId;

	if (workoutSessionId === null) {
		workoutSessionId = res.locals.sessionState?.workoutSessionId ?? null;
	}

	const currentWorkoutSession = workoutSessionId
		? await workoutSessionsDb.getWorkoutSessionById(pool, { workoutSessionId })
		: null;

	if (currentWorkoutSession !== null) {
		req.session.state.workoutSessionId = currentWorkoutSession?.id;
		res.locals.appState.currentWorkoutSession = currentWorkoutSession;
		res.locals.sessionState.workoutSessionId = currentWorkoutSession?.id;
	}

	next();
};

export { setDashboardPageWorkoutSessionContext };
