import pool from "../../db/pool.js";
import * as sessionsDb from "../../db/sessions/index.js";

const setDashboardPageSessionContext = async (req, res, next) => {
	const { sessionId } = res.locals.dashboardPageParams;
	const { trainingDayId } = res.locals.sessionState;

	const sessionArrByTrainingDay = await sessionsDb.getSessionByTrainingDayId(
		pool,
		{ trainingDayId },
	);

	const paramSession = sessionId
		? await sessionsDb.getSessionById(pool, { sessionId })
		: null;

	let currentSession = null;

	const paramSessionIsIncluded =
		paramSession === null
			? false
			: sessionArrByTrainingDay.filter(
					session => session.id === paramSession.id,
				).length > 0;

	if (paramSessionIsIncluded) {
		currentSession = paramSession;
	} else if (sessionArrByTrainingDay.length > 0) {
		currentSession = sessionArrByTrainingDay[0];
	}

	res.locals.sessionState.sessionId = currentSession?.id ?? null;
	req.session.state.sessionId = currentSession?.id ?? null;

	res.locals.appState = {
		...res.locals.appState,
		currentSession,
		sessionArrByTrainingDay,
	};

	next();
};

export { setDashboardPageSessionContext };
