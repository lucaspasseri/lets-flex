import startWorkoutSessionService from "../services/startWorkoutSessionService.js";
import toNullableNumber from "../utils/toNullableNumber.js";

async function startWorkoutSession(req, res) {
	console.log({ body: req.body });

	const { sessionId } = req.body;

	console.log({ sessionId });
	const workoutSession = await startWorkoutSessionService({
		sessionId: toNullableNumber(sessionId),
	});

	console.log({ workoutSession });
	console.log("fim");

	res.redirect(`/?workoutSessionId=${workoutSession.id}`);
}

export { startWorkoutSession };
