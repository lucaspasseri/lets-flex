const makeCurrentEntity =
	({ pageParamsKey, paramKey, sessionKey, appStateKey, getById }) =>
	async (req, res, next) => {
		try {
			res.locals.appState ??= {};
			res.locals.sessionState ??= {};

			const candidateId =
				res.locals?.[pageParamsKey]?.[paramKey] ??
				res.locals.sessionState?.[sessionKey] ??
				null;

			if (!candidateId) {
				res.locals.sessionState[sessionKey] = null;
				res.locals.appState[appStateKey] = null;
				req.session.state[sessionKey] = null;
				return next();
			}

			const entity = await getById(Number(candidateId));

			res.locals.sessionState[sessionKey] = entity?.id ?? null;
			res.locals.appState[appStateKey] = entity ?? null;
			req.session.state[sessionKey] = entity?.id ?? null;

			next();
		} catch (err) {
			next(err);
		}
	};

export { makeCurrentEntity };
