import * as programsDb from "../db/programs/index.js";
import * as goalsDb from "../db/goals/index.js";

async function addNewProgram(req, res) {
	const { name, userId, goalId, startDate, numberOfCycles, cycleSize } =
		req.body;

	console.log({ name, userId, goalId, numberOfCycles, cycleSize });

	await programsDb.postNewProgram(
		name,
		userId,
		goalId,
		startDate,
		numberOfCycles,
		cycleSize,
	);

	res.redirect("/");
}

async function renderProgramsPage(_req, res) {
	console.log({ curr: res.locals.currentUser });

	const currUserProgram =
		res.locals.currentUser &&
		(await programsDb.getProgramsByUserId(res.locals.currentUser.id))[0];

	console.log({ currUserProgram });

	const goalArr = await goalsDb.getAllGoals();
	console.log({ l: res.locals });

	res.render("programs", {
		title: "Let's Flex!",
		goalArr,
		currUserProgram,
	});
}

export { addNewProgram, renderProgramsPage };
