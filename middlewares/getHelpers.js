import range from "../utils/range.js";
import { addDays, isSameMonth, format } from "date-fns";

const getHelpers = async (_req, res, next) => {
	res.locals.range = range;
	res.locals.addDays = addDays;
	res.locals.isSameMonth = isSameMonth;
	res.locals.formatDate = format;
	next();
};

export { getHelpers };
