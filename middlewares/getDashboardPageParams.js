const getDashboardPageParams = async (req, res, next) => {
	const { daysDifference, sessionId, workoutSessionId } = req.query;

	res.locals.dashboardPageParams ??= {};

	res.locals.dashboardPageParams = {
		daysDifference,
		sessionId,
		workoutSessionId,
	};

	next();
};

export { getDashboardPageParams };
