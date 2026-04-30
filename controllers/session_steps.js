import * as sessionStepsDb from "../db/session_steps/index.js";
import toNullableNumber from "../utils/toNullableNumber.js";

async function getSessionStepsById(req, res) {
	const { sessionId } = req.params;

	const sessionSteps =
		await sessionStepsDb.getSessionStepsBySessionId(sessionId);

	res.json(sessionSteps);
}

async function addNewSessionStep(req, res) {
	const {
		name,
		sessionId,
		stepTypeId,
		stepOrder,
		exerciseVariantId,
		sets,
		reps,
		loadValue,
		loadUnit,
	} = req.body;

	await sessionStepsDb.postNewSessionStep(
		name,
		sessionId,
		stepTypeId,
		exerciseVariantId,
		stepOrder,
		sets,
		reps,
		loadValue,
		loadUnit,
	);

	const currDayId =
		req.session?.state?.dayId && toNullableNumber(req.session.state.dayId);

	res.redirect(`/programs/day/${currDayId}/sessions/${sessionId}`);
}

export { getSessionStepsById, addNewSessionStep };
