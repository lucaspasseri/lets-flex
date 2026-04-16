import * as cyclesDb from "../db/cycles/index.js";

async function setActiveCycleAfterCreation(req) {
	const { programId, name, cycleSize, cycleOrder } = req.body;

	try {
		const cycleId = await cyclesDb.postNewCycle(
			programId,
			name,
			cycleSize,
			cycleOrder,
		);

		req.session.state = { ...req.session.state, cycleId };
	} catch (e) {
		console.log(e);
	}
}

export default setActiveCycleAfterCreation;
