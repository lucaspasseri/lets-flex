import * as cyclesDb from "../db/cycles/index.js";

async function addNewCycle(req, res) {
	const { name, programId, cycleOrder } = req.body;

	await cyclesDb.postNewCycle(name, programId, cycleOrder);

	res.redirect("/");
}

async function getCyclesByProgramId(req, res) {
	console.log(1);
	const { programId } = req.params;
	console.log({ programId });

	const cycles = await cyclesDb.getCyclesByProgramId(programId);
	console.log({ cycles });

	res.json(cycles);
}

export { addNewCycle, getCyclesByProgramId };
