import startWorkoutSessionService from "../services/startWorkoutSessionService.js";
import toNullableNumber from "../utils/toNullableNumber.js";

async function startWorkoutSession(req, res) {
	const { sessionId } = req.body;
	const { daysDifference } = res.locals.sessionState;

	const workoutSession = await startWorkoutSessionService({
		sessionId: toNullableNumber(sessionId),
	});

	res.redirect(`/?daysDifference=${daysDifference}&sessionId=${sessionId}`);
}

export { startWorkoutSession };
