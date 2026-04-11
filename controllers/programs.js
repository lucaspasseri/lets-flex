import * as programsDb from "../db/programs/index.js";
import * as goalsDb from "../db/goals/index.js";
import * as cyclesDb from "../db/cycles/index.js";
import * as sessionsDb from "../db/sessions/index.js";

async function addNewProgram(req, res) {
	const { name, userId, goalId, startDate } = req.body;

	await programsDb.postNewProgram(name, userId, goalId, startDate);

	res.redirect("/");
}

async function renderProgramsPage(req, res) {
	const currProgramId = req.session.state?.programId || null;
	const currCycleId = req.session.state?.cycleId || null;
	const currSessionId = req.session.state?.sessionId || null;

	const goalArr = await goalsDb.getAllGoals();

	const programArr =
		res.locals.currentUser &&
		(await programsDb.getProgramsByUserId(res.locals.currentUser.id));

	const cycleArr = await cyclesDb.getCyclesByProgramId(currProgramId);

	const sessionArr = await sessionsDb.getSessionByCycleId(currCycleId);

	res.render("programs", {
		title: "Let's Flex!",
		goalArr,
		programArr,
		cycleArr,
		sessionArr,
		currProgramId: Number(currProgramId),
		currCycleId: Number(currCycleId),
		currSessionId: Number(currSessionId),
	});
}

export { addNewProgram, renderProgramsPage };
