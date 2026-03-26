import * as programsDb from "../db/programs/index.js";

async function addNewProgram(req, res) {
	const { name, userId, goalId } = req.body;

	await programsDb.postNewProgram(name, userId, goalId);

	res.redirect("/");
}

export { addNewProgram };
