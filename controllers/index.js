import * as usersDb from "../db/users/index.js";
import * as programsDb from "../db/programs/index.js";
import * as goalsDb from "../db/goals/index.js";

async function getIndex(_req, res) {
	const userArr = await usersDb.getAllUsers();
	const programArr = await programsDb.getAllPrograms();
	const goalArr = await goalsDb.getAllGoals();

	res.render("index", {
		data: { title: "Let's Flex!", userArr, programArr, goalArr },
	});
}

export { getIndex };
