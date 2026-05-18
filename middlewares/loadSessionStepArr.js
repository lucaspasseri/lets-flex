import * as sessionStepsDb from "../db/session_steps/index.js";
import pool from "../db/pool.js";

const loadSessionStepArr = async (req, res, next) => {
	const { sessionId } = res.locals.sessionState;

	const sessionStepArr = sessionId
		? await sessionStepsDb.getSessionStepsBySessionId(pool, { sessionId })
		: [];

	res.locals.data = {
		...res.locals.data,
		sessionStepArr,
	};

	next();
};

export { loadSessionStepArr };
