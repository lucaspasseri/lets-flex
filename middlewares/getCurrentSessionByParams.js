import * as cyclesDb from "../db/cycles/index.js";
import pool from "../db/pool.js";

const getCurrentSessionByParams = async (req, res, next) => {
	const { sessionId } = req.params;

	req.session.state = { ...req.session.state, sessionId };
	next();
};

export { getCurrentSessionByParams };
