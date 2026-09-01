import * as workoutSessionsRepository from "./repository.js";
import ResourceNotFoundError from "../shared/ResourceNotFoundError.js";

export async function finishWorkoutSession({ workoutSessionId, userId }) {
	const workoutSession = await workoutSessionsRepository.finishByIdForUser({
		workoutSessionId,
		userId,
	});
	if (!workoutSession) throw new ResourceNotFoundError();

	return workoutSession;
}
