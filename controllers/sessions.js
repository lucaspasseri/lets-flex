import * as sessionsDb from "../db/sessions/index.js";
import pool from "../db/pool.js";
import { addSessionAndItsSteps } from "../services/addSectionAndItsSteps.js";

async function getSessionByTrainingDayId(req, res) {
	const { dayId } = req.params;
	const sessions = await sessionsDb.getSessionByTrainingDayId(dayId);

	res.json(sessions);
}

async function addNewSession(req, res) {
	const { name, notes, stepRow: stepRowArr } = req.body;

	await addSessionAndItsSteps(name, notes, stepRowArr);

	res.redirect("/library");
}

async function archiveSession(req, res) {
	const { sessionId } = req.params;

	await sessionsDb.archiveSessionTemplateById(pool, { sessionId });

	res.redirect("/library");
}

export { getSessionByTrainingDayId, addNewSession, archiveSession };
