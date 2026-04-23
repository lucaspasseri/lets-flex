import * as cyclesDb from "../db/cycles/index.js";
import pool from "../db/pool.js";

const getCurrentDayByParams = async (req, res, next) => {
	const { dayId } = req.params;

	console.log({ dayId });
	req.session.state = { ...req.session.state, dayId };
	next();
};

export { getCurrentDayByParams };
