const getSessionState = (req, res, next) => {
	req.session.state ??= {};
	res.locals.sessionState = req.session.state;

	next();
};

export { getSessionState };
