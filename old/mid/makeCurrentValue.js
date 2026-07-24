const makeCurrentValue =
	({
		pageParamsKey,
		paramKey,
		sessionKey,
		appStateKey = null,
		transform = value => value,
	}) =>
	(req, res, next) => {
		try {
			res.locals.sessionState ??= {};
			res.locals.appState ??= {};

			const rawValue =
				res.locals?.[pageParamsKey]?.[paramKey] ??
				res.locals.sessionState?.[sessionKey] ??
				null;

			const value = rawValue === null ? null : transform(rawValue);

			req.session.state[sessionKey] = value;
			res.locals.sessionState[sessionKey] = value;

			if (appStateKey) {
				res.locals.appState[appStateKey] = value;
			}

			next();
		} catch (err) {
			next(err);
		}
	};

export { makeCurrentValue };
