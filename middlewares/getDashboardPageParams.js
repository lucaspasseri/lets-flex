const getDashboardPageParams = async (req, res, next) => {
	const { daysDifference = 0, sessionId } = req.query;

	res.locals.dashboardPageParams ??= {};

	res.locals.dashboardPageParams = {
		daysDifference,
		sessionId,
	};

	next();
};

export { getDashboardPageParams };
