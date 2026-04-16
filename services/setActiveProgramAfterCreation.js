import * as programsDb from "../db/programs/index.js";

async function setActiveProgramAfterCreation(req) {
	const { name, userId, goalId, startDate } = req.body;

	try {
		const programId = await programsDb.postNewProgram(
			name,
			userId,
			goalId,
			startDate,
		);

		req.session.state = { ...req.session.state, programId };
	} catch (err) {
		console.log(err);
	}
}

export default setActiveProgramAfterCreation;
