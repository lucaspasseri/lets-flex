import * as sessionStepsDb from "../db/session_steps/index.js";

async function getSessionStepsById(req, res) {
	const { sessionId } = req.params;

	const sessionSteps =
		await sessionStepsDb.getSessionStepsBySessionId(sessionId);

	res.json(sessionSteps);
}

async function addNewSessionStep(req, res) {
	const { name, sessionId, stepTypeId, stepOrder } = req.body;

	await sessionStepsDb.postNewSessionStep(
		sessionId,
		stepTypeId,
		stepOrder,
		name,
	);

	res.redirect("/");
}

export { getSessionStepsById, addNewSessionStep };
