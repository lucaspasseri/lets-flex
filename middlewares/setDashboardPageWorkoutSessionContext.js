import pool from "../db/pool.js";
import * as workoutSessionsDb from "../db/workout_sessions/index.js";

const setDashboardPageWorkoutSessionContext = async (req, res, next) => {
	const { workoutSessionId } = res.locals.dashboardPageParams;
	const { workoutSessionArrByTrainingDay } = res.locals.data;

	const currentWorkoutSession = workoutSessionId
		? await workoutSessionsDb.getWorkoutSessionById(pool, { workoutSessionId })
		: null;

	if (workoutSessionId === null) {
		const currentWorkoutSession = workoutSessionArrByTrainingDay?.[0] ?? null;

		res.locals.appState.currentWorkoutSession = currentWorkoutSession;
		res.locals.sessionState.workoutSessionId =
			currentWorkoutSession?.id ?? null;
		next();
		return;
	}

	res.locals.appState.currentWorkoutSession = currentWorkoutSession;
	res.locals.sessionState.workoutSessionId = currentWorkoutSession?.id ?? null;
	next();
};

export { setDashboardPageWorkoutSessionContext };
