import pool from "../db/pool.js";
import * as workoutSessionsDb from "../db/workout_sessions/index.js";

const setDashboardPageWorkoutSessionContext = async (req, res, next) => {
	const { workoutSessionId } = res.locals.dashboardPageParams;
	const { workoutSessionArrByTrainingDay } = res.locals.data;

	console.log({ workoutSessionId, workoutSessionArrByTrainingDay });

	if (workoutSessionId === null) {
		const currentWorkoutSession = workoutSessionArrByTrainingDay?.[0] ?? null;

		res.locals.appState.currentWorkoutSession = currentWorkoutSession;
		res.locals.sessionState.workoutSessionId =
			currentWorkoutSession?.id ?? null;
		next();
		return;
	}

	const currentWorkoutSession = await workoutSessionsDb.getWorkoutSessionById(
		pool,
		{ workoutSessionId },
	);

	res.locals.appState.currentWorkoutSession = currentWorkoutSession;
	res.locals.sessionState.workoutSessionId = currentWorkoutSession?.id ?? null;
	next();
};

export { setDashboardPageWorkoutSessionContext };
