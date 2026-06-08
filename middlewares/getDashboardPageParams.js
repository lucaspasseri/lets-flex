import toNullableNumber from "../utils/toNullableNumber.js";

const getDashboardPageParams = (req, res, next) => {
	res.locals.dashboardPageParams = {
		daysDifference: toNullableNumber(req.query.daysDifference) || 0,
		workoutSessionId: toNullableNumber(req.query.workoutSessionId),
	};

	next();
};

export { getDashboardPageParams };
