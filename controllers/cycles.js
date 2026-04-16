import * as cyclesDb from "../db/cycles/index.js";
import setActiveCycleAfterCreation from "../services/setActiveCycleAfterCreation.js";

async function addNewCycle(req, res) {
	await setActiveCycleAfterCreation(req);

	res.redirect("/programs");
}

async function getCyclesByProgramId(req, res) {
	const { programId } = req.params;

	const cycles = await cyclesDb.getCyclesByProgramId(programId);

	res.json(cycles);
}

export { addNewCycle, getCyclesByProgramId };
