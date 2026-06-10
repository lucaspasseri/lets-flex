import { addDays, format } from "date-fns";

const setActiveDay = async (_req, res, next) => {
	const { daysDifference } = res.locals.sessionState;

	console.log({ daysDifference });

	const currDay = new Date();
	const activeDay =
		daysDifference === null ? currDay : addDays(currDay, daysDifference);

	console.log({ currDay });
	console.log({ activeDay });

	res.locals.sessionState.activeDay = activeDay;
	next();
};

export { setActiveDay };
