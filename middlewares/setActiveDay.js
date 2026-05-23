import { addDays } from "date-fns";

const setActiveDay = async (_req, res, next) => {
	const { daysDifference } = res.locals.sessionState;

	const currDay = new Date();
	const activeDay =
		daysDifference === null ? currDay : addDays(currDay, daysDifference);

	res.locals.sessionState.activeDay = activeDay;

	next();
};

export { setActiveDay };
