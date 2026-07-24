import pool from "../../db/pool.js";
import * as sessionsDb from "../../db/sessions/index.js";
import { toSessionViewModel } from "../../views/viewModels/toSessionViewModel.js";

async function setActiveSession(req, res, next) {
	const { sessionArr } = res.locals.data;
	const { sessionId } = res.locals.libraryPageParams;

	if (sessionId === null) {
		res.locals.appState.currentSession = sessionArr?.[0] ?? null;
		res.locals.sessionState.sessionId = sessionArr?.[0]
			? sessionArr[0]?.id
			: null;

		next();
		return;
	}

	const currentSession = sessionId
		? await sessionsDb.getSessionWithExerciseInfoById(pool, { sessionId })
		: null;

	res.locals.appState.currentSession = toSessionViewModel(currentSession, {
		type: "template",
	});
	res.locals.sessionState.sessionId = currentSession?.id ?? null;

	next();
}

export { setActiveSession };
