import * as workoutStepLogsDb from "../db/workout_step_logs/index.js";
import pool from "../db/pool.js";

const loadWorkoutSessionLogArr = async (req, res, next) => {
	const { workoutSessionId } = res.locals.sessionState;

	const workoutStepLogArr = workoutSessionId
		? await workoutStepLogsDb.getWorkoutStepLogsByWorkoutSessionId(pool, {
				workoutSessionId,
			})
		: [];

	res.locals.data.workoutStepLogArr = workoutStepLogArr;

	next();
};

export { loadWorkoutSessionLogArr };
