import * as cyclesDb from "../db/cycles/index.js";
import pool from "../db/pool.js";
import addCycleWithDays from "../services/addCycleWithDays.js";

async function addNewCycle(req, res) {
	try {
		const cycleId = await addCycleWithDays(req.body);

		req.session.state = { ...req.session.state, cycleId };
	} catch (err) {
		console.log(err);
	}

	await res.redirect("/programs");
}

async function getCyclesByProgramId(req, res) {
	const { programId } = req.params;

	const cycles = await cyclesDb.getCyclesByProgramId(pool, { programId });

	res.json(cycles);
}

export { addNewCycle, getCyclesByProgramId };
