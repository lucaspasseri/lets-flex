import * as programsDb from "../db/programs/index.js";
import pool from "../db/pool.js";

const getCurrentProgramByParams = async (req, res, next) => {
	const client = await pool.connect();

	try {
		let programId = null;
		programId = (req.params?.programId && Number(req.params.programId)) || null;

		if (!programId) {
			programId =
				(req.session?.state?.programId &&
					Number(req.session.state.programId)) ||
				null;
		}

		if (!programId) {
			res.locals.currentProgram = null;
			return next();
		}

		const programExist = await programsDb.verifyProgramExistence(
			Number(programId),
		);

		if (!programExist) {
			res.locals.currentProgram = null;
			return next();
		}

		const currentProgram = await programsDb.getProgramById(client, {
			programId: Number(programId),
		});
		req.session.state = { ...req.session.state, programId };
		res.locals.currentProgram = currentProgram;
		next();
	} catch (err) {
		next(err);
	} finally {
		client.release();
	}
};

export { getCurrentProgramByParams };
