import toNullableNumber from "../../utils/toNullableNumber.js";
import { addDays, isSameDay } from "date-fns";

const setActiveSessionMisc = async (_req, res, next) => {
	const { daysDifference, sessionId } = res.locals.sessionState;
	const { sessionArr } = res.locals.data;

	const currDay = new Date();
	const activeDay =
		daysDifference === null ? currDay : addDays(currDay, daysDifference);

	const activeDaySessionArr = sessionArr.filter(session =>
		isSameDay(session.scheduled_date, activeDay),
	);

	res.locals.data.activeDaySessionArr = activeDaySessionArr;
	res.locals.sessionState.activeDay = activeDay;
	if (sessionId === undefined) {
		res.locals.sessionState.sessionId = activeDaySessionArr[0]?.session_id;
	}

	next();
};

export { setActiveSessionMisc };
