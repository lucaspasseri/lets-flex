import * as sessionsDb from "../db/sessions/index.js";

async function getSessionByTrainingDayId(req, res) {
	const { dayId } = req.params;
	const sessions = await sessionsDb.getSessionByTrainingDayId(dayId);

	res.json(sessions);
}

async function addNewSession(req, res) {
	const { name = "", trainingDayId, sessionOrder } = req.body;

	await sessionsDb.postNewSession(name, trainingDayId, sessionOrder);

	res.redirect("/programs/day/" + trainingDayId);
}

export { getSessionByTrainingDayId, addNewSession };
