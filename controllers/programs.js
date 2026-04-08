import * as programsDb from "../db/programs/index.js";
import * as goalsDb from "../db/goals/index.js";

async function addNewProgram(req, res) {
	const { name, userId, goalId, startDate, numberOfCycles, cycleSize } =
		req.body;

	await programsDb.postNewProgram(name, userId, goalId, startDate);

	res.redirect("/");
}

async function renderProgramsPage(_req, res) {
	const currUserProgram =
		res.locals.currentUser &&
		(await programsDb.getProgramsByUserId(res.locals.currentUser.id));

	const goalArr = await goalsDb.getAllGoals();

	res.render("programs", {
		title: "Let's Flex!",
		goalArr,
		currUserProgram,
	});
}

export { addNewProgram, renderProgramsPage };
