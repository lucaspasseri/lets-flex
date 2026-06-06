import pool from "../db/pool.js";
import * as workoutSessionsDb from "../db/workout_sessions/index.js";

const loadWorkoutSessionArrByTrainingDayId = async (req, res, next) => {
	const { trainingDayId } = res.locals.sessionState;

	console.log({ trainingDayId });

	const workoutSessionArrByTrainingDay = trainingDayId
		? await workoutSessionsDb.getWorkoutSessionByTrainingDayId(pool, {
				trainingDayId,
			})
		: [];

	console.log({ workoutSessionArrByTrainingDay });

	res.locals.data = {
		...res.locals.data,
		workoutSessionArrByTrainingDay,
	};

	next();
};

export { loadWorkoutSessionArrByTrainingDayId };
