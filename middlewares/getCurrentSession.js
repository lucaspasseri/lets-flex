import * as cyclesDb from "../db/cycles/index.js";
import pool from "../db/pool.js";

const getCurrentSession = async (req, res, next) => {
	const { sessionId } = req.params;
	req.session.state = { ...req.session.state, sessionId };

	console.log({ sessionId });
	next();
};

export { getCurrentSession };

// try {
// 	const programId = req.session?.state && req.session.state?.programId;

// 	if (!programId) {
// 		res.locals.currentProgram = null;
// 		return next();
// 	}

// 	const currentProgram = await programsDb.getProgramById(pool, {
// 		programId: Number(programId),
// 	});

// 	res.locals.currentProgram = currentProgram;
// 	next();
// } catch (err) {
// 	next(err);
// }
