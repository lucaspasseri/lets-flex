import asyncHandler from "../../../utils/asyncControllerHandler.js";
import createCycle from "../../features/cycles/createCycle.js";

async function create(req, res) {
	const { programId, name, cycleSize, cycleOrder } = req.body;

	const cycle = await createCycle({
		programId,
		name,
		cycleSize,
		cycleOrder,
	});

	req.session.state = { ...req.session.state, cycleId: cycle?.id };
	await res.redirect("/programs");
}

export const cycleController = {
	create: asyncHandler(create),
};
