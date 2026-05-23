import * as sessionsDb from "../db/sessions/index.js";
import pool from "../db/pool.js";
import getSessionsByProgramId from "../services/getSessionsByProgramId.js";

const loadSessionArrByProgramId = async (req, res, next) => {
	const { programId } = res.locals.sessionState;

	const sessionArr = programId
		? await getSessionsByProgramId(pool, { programId })
		: [];

	res.locals.data = {
		...res.locals.data,
		sessionArr,
	};

	next();
};

export { loadSessionArrByProgramId };
