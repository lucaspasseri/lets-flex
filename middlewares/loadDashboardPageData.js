import getSessionsByProgramId from "../services/getSessionsByProgramId.js";
import * as cyclesDb from "../db/cycles/index.js";
import pool from "../db/pool.js";

const loadDashboardPageData = async (req, res, next) => {
	const { programId, daysDifference, sessionId } = res.locals.sessionState;
	const { currentProgram } = res.locals.appState;

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

export { loadDashboardPageData };
