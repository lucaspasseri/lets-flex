import * as workoutSessionsRepository from "./repository.js";

export async function finishWorkoutSession({ workoutSessionId }) {
	const workoutSession = await workoutSessionsRepository.finishById({
		workoutSessionId,
	});

	return workoutSession;
}
