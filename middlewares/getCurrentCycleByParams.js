import * as cyclesDb from "../db/cycles/index.js";
import pool from "../db/pool.js";

const getCurrentCycleByParams = async (req, res, next) => {
	const client = await pool.connect();
	try {
		let cycleId = null;
		cycleId = req.params?.cycleId || null;

		if (!cycleId) {
			cycleId = (req.session?.state && req.session.state?.cycleId) || null;
		}

		if (!cycleId) {
			res.locals.currentCycle = null;
			return next();
		}

		const cycleExist = await cyclesDb.verifyCycleExistence(Number(cycleId));

		if (!cycleExist) {
			res.locals.currentCycle = null;
			return next();
		}

		const currentCycle = await cyclesDb.getCycleById(client, {
			cycleId: Number(cycleId),
		});
		req.session.state = { ...req.session.state, cycleId };
		res.locals.currentCycle = currentCycle;
		next();
	} catch (err) {
		next(err);
	} finally {
		client.release();
	}
};

export { getCurrentCycleByParams };
