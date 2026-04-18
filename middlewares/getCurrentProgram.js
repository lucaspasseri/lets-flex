import * as programsDb from "../db/programs/index.js";
import pool from "../db/pool.js";

const getCurrentProgram = async (req, res, next) => {
	try {
		const programId = req.session?.state && req.session.state?.programId;

		if (!programId) {
			res.locals.currentProgram = null;
			return next();
		}

		const currentProgram = await programsDb.getProgramById(pool, {
			programId: Number(programId),
		});

		res.locals.currentProgram = currentProgram;
		next();
	} catch (err) {
		next(err);
	}
};

export { getCurrentProgram };
