import range from "../utils/range.js";
import {
	addDays,
	subDays,
	isSameDay,
	isSameMonth,
	format,
	getDaysInMonth,
	parseISO,
	differenceInCalendarDays,
} from "date-fns";

const getHelpers = async (_req, res, next) => {
	res.locals.range = range;
	res.locals.addDays = addDays;
	res.locals.subDays = subDays;
	res.locals.isSameDay = isSameDay;
	res.locals.isSameMonth = isSameMonth;
	res.locals.formatDate = format;
	res.locals.getDaysInMonth = getDaysInMonth;
	res.locals.parseDateString = parseISO;
	res.locals.differenceInCalendarDays = differenceInCalendarDays;

	next();
};

export { getHelpers };
