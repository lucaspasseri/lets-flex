import * as programsDb from "../db/programs/index.js";
import * as goalsDb from "../db/goals/index.js";

async function addNewProgram(req, res) {
	const { name, userId, goalId, startDate } = req.body;

	await programsDb.postNewProgram(name, userId, goalId, startDate);

	res.redirect("/");
}

async function renderProgramsPage(_req, res) {
	const currUserProgramArr =
		res.locals.currentUser &&
		(await programsDb.getProgramsByUserId(res.locals.currentUser.id));

	const goalArr = await goalsDb.getAllGoals();
	const currProgramId = res.locals?.currentProgram?.id || null;

	res.render("programs", {
		title: "Let's Flex!",
		goalArr,
		currUserProgramArr,
		currProgramId,
	});
}

export { addNewProgram, renderProgramsPage };
