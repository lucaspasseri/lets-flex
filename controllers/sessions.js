import * as sessionsDb from "../db/sessions/index.js";

async function getSessionByCycleId(req, res) {
	const { cycleId } = req.params;
	const sessions = await sessionsDb.getSessionByCycleId(cycleId);

	res.json(sessions);
}

async function addNewSession(req, res) {
	const { name, cycleId, sessionOrder } = req.body;

	await sessionsDb.postNewSession(name, cycleId, sessionOrder);

	res.redirect("/programs");
}

export { getSessionByCycleId, addNewSession };
