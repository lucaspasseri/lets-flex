import pool from "../db/pool.js";
import getWorkoutSessionByProgramId from "../services/getWorkoutSessionByProgramId.js";

const loadWorkoutSessionArrByProgramId = async (req, res, next) => {
	const { programId } = res.locals.sessionState;

	const workoutSessionArr = programId
		? await getWorkoutSessionByProgramId(pool, { programId })
		: [];

	res.locals.data = {
		...res.locals.data,
		workoutSessionArr,
	};

	next();
};

export { loadWorkoutSessionArrByProgramId };
