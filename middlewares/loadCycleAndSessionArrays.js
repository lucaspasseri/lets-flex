import getSessionsByProgramId from "../services/getSessionsByProgramId.js";
import * as cyclesDb from "../db/cycles/index.js";
import pool from "../db/pool.js";

const loadCycleAndSessionArrays = async (req, res, next) => {
	const { programId } = res.locals.sessionState;

	const [cycleArr, sessionArr] = await Promise.all([
		programId
			? await cyclesDb.getCyclesByProgramId(pool, {
					programId,
				})
			: [],
		programId ? getSessionsByProgramId(pool, { programId }) : [],
	]);

	res.locals.data = {
		...res.locals.data,
		cycleArr,
		sessionArr,
	};

	next();
};

export { loadCycleAndSessionArrays };
