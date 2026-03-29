import * as usersDb from "../db/users/index.js";
import * as programsDb from "../db/programs/index.js";
import * as goalsDb from "../db/goals/index.js";
import * as cyclesDb from "../db/cycles/index.js";
import * as sessionsDb from "../db/sessions/index.js";

async function getIndex(_req, res) {
	const userArr = await usersDb.getAllUsers();
	const goalArr = await goalsDb.getAllGoals();
	const programArrWithoutIds = await programsDb.getAllProgramsWithoutIds();
	const cycleArr = await cyclesDb.getAllCyclesWithoutIds();
	const sessionArr = await sessionsDb.getAllSessionsWithOutIds();

	res.render("index", {
		data: {
			title: "Let's Flex!",
			userArr,
			programArr: programArrWithoutIds,
			goalArr,
			cycleArr,
			sessionArr,
		},
	});
}

export { getIndex };
