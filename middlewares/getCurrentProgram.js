import * as programsDb from "../db/programs/index.js";

const getCurrentProgram = async (req, res, next) => {
	try {
		const programId = req.session?.state && req.session.state?.programId;

		if (!programId) {
			res.locals.currentProgram = null;
			return next();
		}

		const currentProgram = await programsDb.getProgramById(Number(programId));

		res.locals.currentProgram = currentProgram;
		next();
	} catch (err) {
		next(err);
	}
};

export { getCurrentProgram };
