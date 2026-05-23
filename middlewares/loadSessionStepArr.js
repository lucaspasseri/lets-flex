import * as sessionStepsDb from "../db/session_steps/index.js";
import pool from "../db/pool.js";

const loadSessionStepArr = async (req, res, next) => {
	const { currentSession } = res.locals.appState;

	const sessionStepArr = currentSession?.id
		? await sessionStepsDb.getSessionStepsBySessionId(pool, {
				sessionId: currentSession.id,
			})
		: [];

	console.log({ currentSession });
	console.log({ sessionStepArr });

	res.locals.data = {
		...res.locals.data,
		sessionStepArr,
	};

	next();
};

export { loadSessionStepArr };
