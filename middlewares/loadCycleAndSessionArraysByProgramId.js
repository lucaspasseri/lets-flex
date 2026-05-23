import * as cyclesDb from "../db/cycles/index.js";
import pool from "../db/pool.js";
import getSessionByProgramIdAndScheduledDate from "../services/getSessionsByProgramId copy.js";

const loadCycleAndSessionArraysByProgramId = async (req, res, next) => {
	const { programId, activeDay } = res.locals.sessionState;

	const [cycleArr, sessionArr] = await Promise.all([
		programId
			? await cyclesDb.getCyclesByProgramId(pool, {
					programId,
				})
			: [],
		programId
			? getSessionByProgramIdAndScheduledDate(pool, { programId, activeDay })
			: [],
	]);

	res.locals.data = {
		...res.locals.data,
		cycleArr,
		sessionArr,
	};

	next();
};

export { loadCycleAndSessionArraysByProgramId };
