import * as programsDb from "../db/programs/index.js";
import * as goalsDb from "../db/goals/index.js";
import * as cyclesDb from "../db/cycles/index.js";

async function addNewProgram(req, res) {
	const { name, userId, goalId, startDate } = req.body;

	await programsDb.postNewProgram(name, userId, goalId, startDate);

	res.redirect("/");
}

async function renderProgramsPage(_req, res) {
	console.log({ l: res.locals });
	console.log({ s: _req.session });

	const programArr =
		res.locals.currentUser &&
		(await programsDb.getProgramsByUserId(res.locals.currentUser.id));

	const goalArr = await goalsDb.getAllGoals();
	const currProgramId = res.locals?.currentProgram?.id || null;
	const cycleArr = await cyclesDb.getCyclesByProgramId(currProgramId);

	const currCycleId = _req.session.state?.cycleId || null;

	res.render("programs", {
		title: "Let's Flex!",
		goalArr,
		programArr,
		currProgramId,
		cycleArr,
		currCycleId: Number(currCycleId),
	});
}

export { addNewProgram, renderProgramsPage };
