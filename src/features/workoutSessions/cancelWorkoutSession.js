import * as workoutSessionsRepository from "./repository.js";
import ResourceNotFoundError from "../shared/ResourceNotFoundError.js";

async function cancelWorkoutSession({ workoutSessionId, userId }) {
	const workout = await workoutSessionsRepository.cancelByIdForUser({
		workoutSessionId,
		userId,
	});
	if (!workout) throw new ResourceNotFoundError();
}

export default cancelWorkoutSession;
