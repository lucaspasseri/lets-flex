import * as cyclesDb from "../../db/cycles/index.js";
import pool from "../../db/pool.js";

const setDayPageCycleContext = async (req, res, next) => {
	const { cycleId } = res.locals.sessionState;

	const currentCycle = cycleId
		? await cyclesDb.getCycleById(pool, { cycleId })
		: null;

	res.locals.appState = { ...res.locals.appState, currentCycle };
	res.locals.sessionState = {
		...res.locals.sessionState,
		cycleId: currentCycle?.id ?? null,
	};

	next();
};

export { setDayPageCycleContext };
