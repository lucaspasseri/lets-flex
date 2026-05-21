import pool from "../db/pool.js";
import * as programsDb from "../db/programs/index.js";

const setProgramsPageProgramContext = async (req, res, next) => {
	let programId = res.locals.programsPageParams.programId;

	if (programId === null) {
		programId = res.locals.sessionState?.programId;
	}

	const currentProgram = programId
		? await programsDb.getProgramById(pool, { programId })
		: null;

	res.locals.appState = { ...res.locals.appState, currentProgram };
	res.locals.sessionState = {
		...res.locals.sessionState,
		programId: currentProgram?.id ?? null,
	};

	if (currentProgram !== null) {
		req.session.state.programId = currentProgram.id;
	}

	next();
};

export { setProgramsPageProgramContext };
