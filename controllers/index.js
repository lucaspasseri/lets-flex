import * as usersDb from "../db/users/index.js";
import * as programsDb from "../db/programs/index.js";
import * as goalsDb from "../db/goals/index.js";
import * as cyclesDb from "../db/cycles/index.js";
import range from "../utils/range.js";

async function getIndex(_req, res) {
	const userArr = await usersDb.getAllUsers();
	const goalArr = await goalsDb.getAllGoals();
	const programArrWithoutIds = await programsDb.getAllProgramsWithoutIds();
	const cycleArr = await cyclesDb.getAllCycles();
	const cycleOrderArr = range(1, cycleArr.length + 2);

	// console.log({
	// 	userArr,
	// 	goalArr,
	// 	programArrWithoutIds,
	// 	cycleArr,
	// 	cycleOrderArr,
	// });

	res.render("index", {
		data: {
			title: "Let's Flex!",
			userArr,
			programArr: programArrWithoutIds,
			goalArr,
			cycleArr,
			cycleOrderArr,
		},
	});
}

export { getIndex };
