import * as cyclesDb from "../db/cycles/index.js";
import pool from "../db/pool.js";
import getSessionByProgramIdAndScheduledDate from "../services/getWorkoutSessionByProgramId.js";

const loadCycleArrByProgramId = async (req, res, next) => {
	const { programId } = res.locals.sessionState;

	const cycleArr = programId
		? await cyclesDb.getCyclesByProgramId(pool, {
				programId,
			})
		: [];

	res.locals.data = {
		...res.locals.data,
		cycleArr,
	};

	next();
};

export { loadCycleArrByProgramId };
