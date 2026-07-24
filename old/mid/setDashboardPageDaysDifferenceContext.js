import pool from "../../db/pool.js";
import * as sessionsDb from "../../db/sessions/index.js";

const setDashboardPageDaysDifferenceContext = async (req, res, next) => {
	let daysDifference = res.locals.dashboardPageParams?.daysDifference ?? null;

	res.locals.sessionState = {
		...res.locals.sessionState,
		daysDifference,
	};

	if (daysDifference !== null) {
		req.session.state.daysDifference = daysDifference;
		res.locals.sessionState.daysDifference = daysDifference;
	}

	next();
};

export { setDashboardPageDaysDifferenceContext };
