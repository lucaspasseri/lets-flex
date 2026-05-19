import startWorkoutSessionService from "../services/startWorkoutSessionService.js";
import toNullableNumber from "../utils/toNullableNumber.js";

async function startWorkoutSession(req, res) {
	const { sessionId } = req.body;

	const workoutSession = await startWorkoutSessionService({
		sessionId: toNullableNumber(sessionId),
	});

	res.redirect(`/?workoutSessionId=${workoutSession.id}`);
}

export { startWorkoutSession };
