import * as cyclesDb from "../db/cycles/index.js";

async function addNewCycle(req, res) {
	const { name, programId, cycleOrder } = req.body;

	await cyclesDb.postNewCycle(name, programId, cycleOrder);

	res.redirect("/");
}

async function getCyclesByProgramId(req, res) {
	const { programId } = req.params;

	const cycles = await cyclesDb.getCyclesByProgramId(programId);

	res.json(cycles);
}

export { addNewCycle, getCyclesByProgramId };
