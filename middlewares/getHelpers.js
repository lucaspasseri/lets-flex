import range from "../utils/range.js";
import {
	addDays,
	isSameDay,
	format,
	parseISO,
	differenceInCalendarDays,
} from "date-fns";

const getHelpers = async (_req, res, next) => {
	res.locals.helpers = {
		range,
		addDays,
		isSameDay,
		formatDate: format,
		parseDateString: parseISO,
		differenceInCalendarDays,
	};

	next();
};

export { getHelpers };
