import pool from "../../db/pool.js";
import getSessionStepsByWorkoutSessionId from "../../services/getSessionStepsByWorkoutSessionId.js";

const loadSessionStepArr = async (req, res, next) => {
	const { workoutSessionId } = res.locals.sessionState;

	const sessionStepArr = workoutSessionId
		? await getSessionStepsByWorkoutSessionId(pool, { workoutSessionId })
		: [];

	res.locals.data = {
		...res.locals.data,
		sessionStepArr,
	};

	next();
};

export { loadSessionStepArr };
