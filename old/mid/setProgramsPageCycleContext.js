import pool from "../../db/pool.js";
import * as cyclesDb from "../../db/cycles/index.js";

const setProgramsPageCycleContext = async (req, res, next) => {
	let cycleId = res.locals.programsPageParams.cycleId;

	if (cycleId === null) {
		cycleId = res.locals.sessionState?.cycleId;
	}

	const currentCycle = cycleId
		? await cyclesDb.getCycleById(pool, { cycleId })
		: null;

	res.locals.appState = { ...res.locals.appState, currentCycle };
	res.locals.sessionState = {
		...res.locals.sessionState,
		cycleId: currentCycle?.id ?? null,
	};

	if (currentCycle !== null) {
		req.session.state.cycleId = currentCycle.id;
	}

	next();
};

export { setProgramsPageCycleContext };
