import pool from "../db/pool.js";
import * as sessionsDb from "../db/sessions/index.js";

const setDayPageSessionContext = async (req, res, next) => {
	const { sessionId } = res.locals.dayPageParams;

	const currentSession = sessionId
		? await sessionsDb.getSessionById(pool, { sessionId })
		: null;

	res.locals.appState = { ...res.locals.appState, currentSession };
	res.locals.sessionState = {
		...res.locals.sessionState,
		sessionId: currentSession?.id ?? null,
	};

	if (currentSession !== null) {
		req.session.state.sessionId = currentSession?.id;
	}

	next();
};

export { setDayPageSessionContext };
