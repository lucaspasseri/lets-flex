import range from "../utils/range.js";
import {
	addDays,
	subDays,
	isSameMonth,
	format,
	getDaysInMonth,
} from "date-fns";

const getHelpers = async (_req, res, next) => {
	res.locals.range = range;
	res.locals.addDays = addDays;
	res.locals.subDays = subDays;
	res.locals.isSameMonth = isSameMonth;
	res.locals.formatDate = format;
	res.locals.getDaysInMonth = getDaysInMonth;

	next();
};

export { getHelpers };
