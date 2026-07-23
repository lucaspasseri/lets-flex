import * as workoutSessionsRepository from "./repository.js";

async function cancelWorkoutSession({ workoutSessionId }) {
	await workoutSessionsRepository.cancelById({ workoutSessionId });
}

export default cancelWorkoutSession;
