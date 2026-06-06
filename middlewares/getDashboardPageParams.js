const getDashboardPageParams = async (req, res, next) => {
	res.locals.dashboardPageParams = {
		daysDifference: req.query?.daysDifference
			? Number(req.query.daysDifference)
			: null,
		workoutSessionId: req.query?.workoutSessionId
			? Number(req.query.workoutSessionId)
			: null,
	};

	next();
};

export { getDashboardPageParams };
