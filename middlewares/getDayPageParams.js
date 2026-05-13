const getDayPageParams = async (req, res, next) => {
	const { dayId } = req.params;
	const { sessionId } = req.query;

	res.locals.dayPageParams ??= {};

	res.locals.dayPageParams = {
		dayId,
		sessionId,
	};

	next();
};

export { getDayPageParams };
