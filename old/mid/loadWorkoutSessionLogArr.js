import * as workoutStepLogsDb from "../../db/workout_step_logs/index.js";
import pool from "../../db/pool.js";

const loadWorkoutSessionLogArr = async (req, res, next) => {
	const { workoutSessionId } = res.locals.sessionState;

	const workoutStepLogArr = workoutSessionId
		? await workoutStepLogsDb.getWorkoutStepLogsByWorkoutSessionId(pool, {
				workoutSessionId,
			})
		: [];

	res.locals.data.workoutStepLogArr = workoutStepLogArr;
	res.locals.appState.workoutSessionPerformedPercentage =
		calculateWorkoutStepPerformedPercentage(workoutStepLogArr);

	next();
};

export { loadWorkoutSessionLogArr };

const calculateWorkoutStepPerformedPercentage = workoutStepLogArr => {
	const totalSteps = workoutStepLogArr.length;
	const performedSteps = workoutStepLogArr.filter(
		log => log.status === "performed",
	).length;

	return totalSteps > 0 ? (performedSteps / totalSteps) * 100 : 0;
};
