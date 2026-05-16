const getDayPageParams = async (req, res, next) => {
	const { dayId, sessionId } = req.query;

	res.locals.dayPageParams ??= {};

	res.locals.dayPageParams = {
		dayId,
		sessionId,
	};

	next();
};

export { getDayPageParams };
