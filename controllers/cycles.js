import * as cyclesDb from "../db/cycles/index.js";

async function addNewCycle(req, res) {
	const { name, programId, cycleOrder } = req.body;

	await cyclesDb.postNewCycle(name, programId, cycleOrder);

	res.redirect("/");
}

export { addNewCycle };
