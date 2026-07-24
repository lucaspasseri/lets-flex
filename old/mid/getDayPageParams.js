const getDayPageParams = async (req, res, next) => {
	res.locals.dayPageParams = {
		dayId: req.query?.dayId ? Number(req.query.dayId) : null,
		sessionId: req.query?.sessionId ? Number(req.query.sessionId) : null,
	};

	next();
};

export { getDayPageParams };
