const getDashboardPageParams = async (req, res, next) => {
	const { daysDifference, sessionId } = req.query;

	res.locals.dashboardPageParams ??= {};

	res.locals.dashboardPageParams = {
		daysDifference,
		sessionId,
	};

	next();
};

export { getDashboardPageParams };
