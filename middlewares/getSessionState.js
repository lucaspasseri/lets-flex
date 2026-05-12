const getSessionState = (req, res, next) => {
	if (!req.session.state) {
		req.session.state = {};
	}

	res.locals.sessionState = req.session.state;

	next();
};

export { getSessionState };
