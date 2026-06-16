import pool from "../db/pool.js";
import * as workoutSessionsDb from "../db/workout_sessions/index.js";
import { toSessionViewModel } from "../views/viewModels/toSessionViewModel.js";

const loadWorkoutSessionArrByTrainingDayId = async (req, res, next) => {
	const { trainingDayId } = res.locals.sessionState;

	const workoutSessionArrByTrainingDay = trainingDayId
		? await workoutSessionsDb.getWorkoutSessionWithStepsInfoByTrainingDayId(
				pool,
				{
					trainingDayId,
				},
			)
		: [];

	const shapedWorkoutSessionArr = workoutSessionArrByTrainingDay.map(ws =>
		toSessionViewModel(ws, { type: "workout" }),
	);

	res.locals.data = {
		...res.locals.data,
		workoutSessionArrByTrainingDay: shapedWorkoutSessionArr,
	};

	next();
};

export { loadWorkoutSessionArrByTrainingDayId };
