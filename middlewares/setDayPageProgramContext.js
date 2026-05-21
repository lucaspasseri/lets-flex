import * as programsDb from "../db/programs/index.js";
import pool from "../db/pool.js";

const setDayPageProgramContext = async (req, res, next) => {
	const { programId } = res.locals.sessionState;

	const currentProgram = programId
		? await programsDb.getProgramById(pool, { programId })
		: null;

	res.locals.appState = { ...res.locals.appState, currentProgram };
	res.locals.sessionState = {
		...res.locals.sessionState,
		programId: currentProgram?.id ?? null,
	};

	next();
};

export { setDayPageProgramContext };
