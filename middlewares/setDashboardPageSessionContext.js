import pool from "../db/pool.js";
import * as sessionsDb from "../db/sessions/index.js";

const setDashboardPageSessionContext = async (req, res, next) => {
	let sessionId = res.locals.dashboardPageParams?.sessionId;

	if (sessionId === null) {
		sessionId = res.locals.sessionState?.sessionId;
	}

	const currentSession = sessionId
		? await sessionsDb.getSessionById(pool, { sessionId })
		: null;

	if (currentSession !== null) {
		req.session.state.sessionId = currentSession?.id;
		res.locals.appState.currentSession = currentSession;
		res.locals.sessionState.sessionId = currentSession?.id;
	}

	next();
};

export { setDashboardPageSessionContext };
